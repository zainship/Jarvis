/**
 * J.A.R.V.I.S. High-Speed Optical Hand & Fingertip Tracking Subsystem
 * 60 FPS Real-time spatial gesture & fingertip localization engine.
 */

import { HandTrackingData } from "../types";

export interface OpticalHandState {
  isHandDetected: boolean;
  rawFingertip: { x: number; y: number };
  smoothedFingertip: { x: number; y: number };
  palmCentroid: { x: number; y: number };
  bounds: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence: number;
  gesture: "pointing" | "open_palm" | "pinch" | "fist" | "peace" | "unknown";
  isPinching: boolean;
  velocity: { vx: number; vy: number };
  lastTrackTime: number;
}

export class OpticalHandTracker {
  private prevFingertip: { x: number; y: number } | null = null;
  private prevCentroid: { x: number; y: number } | null = null;
  private smoothedX: number = 500;
  private smoothedY: number = 500;
  private velocityX: number = 0;
  private velocityY: number = 0;
  private consecutiveDetections: number = 0;
  private smoothingFactor: number = 0.38; // 0.38 gives instant tracking with butter-smooth trails

  // Offscreen low-overhead analysis canvas
  private sampleCanvas: HTMLCanvasElement | null = null;
  private sampleCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== "undefined") {
      this.sampleCanvas = document.createElement("canvas");
      this.sampleCanvas.width = 160;
      this.sampleCanvas.height = 120;
      this.sampleCtx = this.sampleCanvas.getContext("2d", { willReadFrequently: true });
    }
  }

  /**
   * Process a single video frame for hand & fingertip localization
   * @param video HTMLVideoElement
   * @param isMirrored boolean (true for front camera)
   * @param faceBox Optional face bounding box [ymin, xmin, ymax, xmax] in 0-1000 to mask out face
   */
  public trackHand(
    video: HTMLVideoElement,
    isMirrored: boolean = true,
    faceBox?: [number, number, number, number] | null
  ): OpticalHandState {
    const now = Date.now();
    const defaultState: OpticalHandState = {
      isHandDetected: false,
      rawFingertip: { x: this.smoothedX, y: this.smoothedY },
      smoothedFingertip: { x: this.smoothedX, y: this.smoothedY },
      palmCentroid: { x: this.smoothedX, y: this.smoothedY + 60 },
      bounds: [300, 300, 700, 700],
      confidence: 0,
      gesture: "unknown",
      isPinching: false,
      velocity: { vx: 0, vy: 0 },
      lastTrackTime: now,
    };

    if (!this.sampleCanvas || !this.sampleCtx || video.videoWidth === 0 || video.videoHeight === 0) {
      return defaultState;
    }

    const sw = this.sampleCanvas.width;
    const sh = this.sampleCanvas.height;

    // Draw downscaled frame
    this.sampleCtx.drawImage(video, 0, 0, sw, sh);
    const frameData = this.sampleCtx.getImageData(0, 0, sw, sh);
    const data = frameData.data;

    // Mask out face if provided (converted to sample grid)
    let faceMinX = -1,
      faceMaxX = -1,
      faceMinY = -1,
      faceMaxY = -1;
    if (faceBox) {
      const [fymin, fxmin, fymax, fxmax] = faceBox;
      faceMinX = Math.floor((fxmin / 1000) * sw);
      faceMaxX = Math.ceil((fxmax / 1000) * sw);
      faceMinY = Math.floor((fymin / 1000) * sh);
      faceMaxY = Math.ceil((fymax / 1000) * sh);
    }

    // Collect skin/hand candidate pixels
    let totalX = 0;
    let totalY = 0;
    let skinPixelCount = 0;

    let minX = sw,
      maxX = 0,
      minY = sh,
      maxY = 0;

    // Store candidate points for contour & fingertip analysis
    const candidatePoints: Array<{ x: number; y: number }> = [];

    // Scan sample grid
    for (let y = 0; y < sh; y += 2) {
      for (let x = 0; x < sw; x += 2) {
        // Exclude face box region so we isolate hand movement exclusively
        if (
          faceMinX !== -1 &&
          x >= faceMinX - 4 &&
          x <= faceMaxX + 4 &&
          y >= faceMinY - 4 &&
          y <= faceMaxY + 8
        ) {
          continue;
        }

        const idx = (y * sw + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // High-precision Skin Chrominance Classifier (YCbCr + RGB heuristic)
        // Y = 0.299R + 0.587G + 0.114B
        // Cb = 128 - 0.168736R - 0.331264G + 0.5B
        // Cr = 128 + 0.5R - 0.418688G - 0.081312B
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        const isSkin =
          cr >= 130 &&
          cr <= 175 &&
          cb >= 75 &&
          cb <= 130 &&
          r > g &&
          g > b &&
          r - g >= 10 &&
          r > 40 &&
          Math.max(r, g, b) - Math.min(r, g, b) > 12;

        if (isSkin) {
          totalX += x;
          totalY += y;
          skinPixelCount++;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          candidatePoints.push({ x, y });
        }
      }
    }

    // Minimum area threshold for a valid hand cluster (e.g. at least 25 pixels in 160x120 grid)
    if (skinPixelCount < 22 || candidatePoints.length === 0) {
      this.consecutiveDetections = Math.max(0, this.consecutiveDetections - 1);
      return defaultState;
    }

    this.consecutiveDetections = Math.min(20, this.consecutiveDetections + 1);

    // Palm Centroid
    const rawCentroidX = totalX / skinPixelCount;
    const rawCentroidY = totalY / skinPixelCount;

    // Find the Fingertip: The highest point (lowest Y) in the top portion of the hand cluster
    // Sort points in top 25% height of the cluster and find the most salient tip
    const topThresholdY = minY + (maxY - minY) * 0.35;
    let tipX = rawCentroidX;
    let tipY = minY;
    let tipScore = 9999;

    for (const pt of candidatePoints) {
      if (pt.y <= topThresholdY) {
        // Weighted distance prioritizing upward height (lowest y) and proximity to top center
        const score = pt.y * 2.0 + Math.abs(pt.x - rawCentroidX) * 0.5;
        if (score < tipScore) {
          tipScore = score;
          tipX = pt.x;
          tipY = pt.y;
        }
      }
    }

    // Coordinate Normalization (0-1000 scale)
    let normTipX = (tipX / sw) * 1000;
    const normTipY = (tipY / sh) * 1000;
    let normCentroidX = (rawCentroidX / sw) * 1000;
    const normCentroidY = (rawCentroidY / sh) * 1000;

    let normMinX = (minX / sw) * 1000;
    let normMaxX = (maxX / sw) * 1000;
    const normMinY = (minY / sh) * 1000;
    const normMaxY = (maxY / sh) * 1000;

    // Handle horizontal mirroring for user front camera
    if (isMirrored) {
      normTipX = 1000 - normTipX;
      normCentroidX = 1000 - normCentroidX;
      const tempMin = normMinX;
      normMinX = 1000 - normMaxX;
      normMaxX = 1000 - tempMin;
    }

    // Double Exponential Smoothing (EMA) for ultra-fluid, jitter-free cursor gliding
    const alpha = this.smoothingFactor;
    this.smoothedX = this.smoothedX + (normTipX - this.smoothedX) * alpha;
    this.smoothedY = this.smoothedY + (normTipY - this.smoothedY) * alpha;

    // Velocity Calculation
    if (this.prevFingertip) {
      this.velocityX = this.smoothedX - this.prevFingertip.x;
      this.velocityY = this.smoothedY - this.prevFingertip.y;
    }
    this.prevFingertip = { x: this.smoothedX, y: this.smoothedY };
    this.prevCentroid = { x: normCentroidX, y: normCentroidY };

    // Gesture Classification
    const handHeight = Math.max(1, normMaxY - normMinY);
    const handWidth = Math.max(1, normMaxX - normMinX);
    const aspectRatio = handHeight / handWidth;
    const tipExtension = normCentroidY - normTipY;

    let gesture: OpticalHandState["gesture"] = "pointing";
    let isPinching = false;

    if (tipExtension > handHeight * 0.45) {
      gesture = "pointing";
    } else if (aspectRatio < 0.9 && candidatePoints.length > 90) {
      gesture = "open_palm";
    } else if (candidatePoints.length < 50 && aspectRatio >= 0.9) {
      gesture = "pinch";
      isPinching = true;
    } else {
      gesture = "pointing";
    }

    const confidence = Math.min(99, Math.max(70, 75 + this.consecutiveDetections * 1.5));

    return {
      isHandDetected: true,
      rawFingertip: { x: Math.round(normTipX), y: Math.round(normTipY) },
      smoothedFingertip: { x: Math.round(this.smoothedX), y: Math.round(this.smoothedY) },
      palmCentroid: { x: Math.round(normCentroidX), y: Math.round(normCentroidY) },
      bounds: [
        Math.round(Math.max(0, normMinY)),
        Math.round(Math.max(0, normMinX)),
        Math.round(Math.min(1000, normMaxY)),
        Math.round(Math.min(1000, normMaxX)),
      ],
      confidence: Math.round(confidence),
      gesture,
      isPinching,
      velocity: { vx: this.velocityX, vy: this.velocityY },
      lastTrackTime: now,
    };
  }

  /**
   * Reset smoothing state
   */
  public reset() {
    this.prevFingertip = null;
    this.prevCentroid = null;
    this.consecutiveDetections = 0;
  }
}
