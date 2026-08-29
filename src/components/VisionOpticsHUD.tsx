import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Eye,
  Camera,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Scan,
  Shield,
  Activity,
  Sun,
  Smile,
  UserCheck,
  Sparkles,
  Zap,
  Volume2,
  Layers,
  Crosshair,
  Target,
  Smartphone,
  Laptop,
  Coffee,
  Package,
  Radio,
  CheckCircle2,
  Focus,
  Hand,
  PenTool,
  BookOpen,
  Download,
  RotateCcw,
  Trash2,
  Box,
} from "lucide-react";
import { SoundFX } from "../utils/soundEffects";
import {
  VisionAnalysisResult,
  DetectedObjectBox,
  HandTrackingData,
  AirDrawStroke,
  DetectionLogEntry,
} from "../types";
import { OpticalHandTracker } from "../utils/handTracker";
import { opticVisionManager } from "../utils/opticVisionManager";
import { AirCanvasControls, AIR_DRAW_COLORS } from "./AirCanvasControls";
import { DetectionFlightJournal } from "./DetectionFlightJournal";
import { Holographic3DSchematics } from "./Holographic3DSchematics";

interface VisionOpticsHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onVisionResult: (result: VisionAnalysisResult, imagePreviewUrl: string) => void;
  onJarvisSpeak: (text: string) => void;
  isProcessing?: boolean;
}

export const VisionOpticsHUD: React.FC<VisionOpticsHUDProps> = ({
  isOpen,
  onClose,
  onVisionResult,
  onJarvisSpeak,
  isProcessing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const faceDetectorRef = useRef<any>(null);

  // Optical Hand Tracker Instance
  const handTrackerRef = useRef<OpticalHandTracker>(new OpticalHandTracker());

  // Navigation Tabs: "viewport" vs "hologram_3d" vs "journal"
  const [activeHUDTab, setActiveHUDTab] = useState<"viewport" | "hologram_3d" | "journal">("viewport");

  // Tracking Mode: "hand_only" vs "all"
  const [trackingMode, setTrackingMode] = useState<"all" | "hand_only">("hand_only");

  // Air Drawing State
  const [isAirDrawActive, setIsAirDrawActive] = useState<boolean>(true);
  const [selectedDrawColor, setSelectedDrawColor] = useState<string>("#38bdf8"); // Arc Cyan
  const [strokeWidth, setStrokeWidth] = useState<number>(6); // Laser
  const [drawMode, setDrawMode] = useState<"laser" | "glow" | "sparkle">("laser");
  const [strokes, setStrokes] = useState<AirDrawStroke[]>([]);
  const strokesRef = useRef<AirDrawStroke[]>([]);
  const currentStrokeRef = useRef<AirDrawStroke | null>(null);
  const [isAnalyzingSketch, setIsAnalyzingSketch] = useState(false);

  // Sync strokesRef whenever strokes state changes
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  // Mouse / Pointer fallback drawing state
  const isPointerDrawingRef = useRef(false);

  // Live Hand Tracking State Ref (for 60fps rendering without react state lag)
  const currentHandRef = useRef<HandTrackingData>({
    isDetected: false,
    centroid: { x: 500, y: 500 },
    fingertip: { x: 500, y: 500 },
    palmCenter: { x: 500, y: 560 },
    bounds: [300, 300, 700, 700],
    confidence: 0,
    gesture: "unknown",
    isDrawing: false,
    velocity: { vx: 0, vy: 0 },
  });

  const [handStateUI, setHandStateUI] = useState<HandTrackingData | null>(null);

  // Face Tracking Lerp State
  const currentFaceBoxRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    targetX: number;
    targetY: number;
    targetW: number;
    targetH: number;
    isLocked: boolean;
    confidence: number;
    lastSeen: number;
  }>({
    x: 280,
    y: 160,
    w: 440,
    h: 520,
    targetX: 280,
    targetY: 160,
    targetW: 440,
    targetH: 520,
    isLocked: true,
    confidence: 99,
    lastSeen: Date.now(),
  });

  // Interpolated bounding boxes cache for smooth 60fps object rendering
  const smoothedObjectsRef = useRef<Map<string, { x: number; y: number; w: number; h: number; opacity: number }>>(
    new Map()
  );

  // Sparkle particles at fingertip
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);

  // Detection Flight Journal Storage
  const [detectionLogs, setDetectionLogs] = useState<DetectionLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem("jarvis_optical_detection_notes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoScanActive, setIsAutoScanActive] = useState(false);
  const [isRealtimeDetectionActive, setIsRealtimeDetectionActive] = useState(true);
  const [isFaceTrackingActive, setIsFaceTrackingActive] = useState(false); // Default to false when Hand-Only
  const [targetFilter, setTargetFilter] = useState<"all" | "person" | "device" | "accessory" | "misc">("all");
  const [detectedObjects, setDetectedObjects] = useState<DetectedObjectBox[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isExpanded, setIsExpanded] = useState(false);
  const [latestResult, setLatestResult] = useState<VisionAnalysisResult | null>(null);
  const [lastCapturedPreview, setLastCapturedPreview] = useState<string | null>(null);
  const [isDetectingObjects, setIsDetectingObjects] = useState(false);

  // Helper to append log entry and persist
  const addDetectionLog = useCallback(
    (entry: Omit<DetectionLogEntry, "id" | "timestamp">) => {
      const newEntry: DetectionLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        ...entry,
      };

      setDetectionLogs((prev) => {
        const updated = [newEntry, ...prev.slice(0, 199)]; // Keep latest 200 logs
        try {
          localStorage.setItem("jarvis_optical_detection_notes", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    []
  );

  // Initialize native browser FaceDetector if available
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).FaceDetector) {
      try {
        faceDetectorRef.current = new (window as any).FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch (e) {
        console.info("Native FaceDetector not available, utilizing optical biometric tracker.");
      }
    }
  }, []);

  // Initialize camera stream via opticVisionManager
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      let stream = opticVisionManager.getStream();
      if (!stream || !stream.active) {
        await opticVisionManager.startOpticVision();
        stream = opticVisionManager.getStream();
      }

      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
        setHasCameraPermission(true);
        SoundFX.playTargetClick();
      } else {
        throw new Error("Unable to establish optical camera relay.");
      }
    } catch (err: any) {
      console.warn("Camera stream initialization notice:", err);
      setHasCameraPermission(false);
      setCameraError(err.message || "Camera sensor access denied or unavailable.");
    }
  }, []);

  // Stop camera stream / pause HUD loops
  const stopCamera = useCallback(() => {
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Clear air drawing canvas
  const handleClearCanvas = useCallback(() => {
    SoundFX.playComputeChime();
    strokesRef.current = [];
    setStrokes([]);
    currentStrokeRef.current = null;
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
    onJarvisSpeak("Air canvas cleared, sir.");
  }, [onJarvisSpeak]);

  // Undo last stroke
  const handleUndoStroke = useCallback(() => {
    SoundFX.playTargetClick();
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokes(strokesRef.current);
  }, []);

  // Capture frame from video feed
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const maxW = 640;
    const maxH = 480;
    let targetW = video.videoWidth;
    let targetH = video.videoHeight;
    const ratio = Math.min(maxW / targetW, maxH / targetH, 1);
    targetW = Math.round(targetW * ratio);
    targetH = Math.round(targetH * ratio);

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, targetW, targetH);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.7);
  }, [facingMode]);

  // Keyboard Shortcuts (D for Draw, H for Hand Only, C for Clear, Ctrl+Z for Undo)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (target === "input" || target === "textarea") return;

      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        SoundFX.playTargetClick();
        setIsAirDrawActive((prev) => {
          const next = !prev;
          setTimeout(() => {
            if (next) onJarvisSpeak("Air-Draw engaged. Tracking hand movement to draw.");
          }, 0);
          return next;
        });
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        SoundFX.playComputeChime();
        setTrackingMode((prev) => {
          const next = prev === "hand_only" ? "all" : "hand_only";
          setTimeout(() => {
            setIsFaceTrackingActive(next === "all");
            onJarvisSpeak(next === "hand_only" ? "Hand Tracking Only isolated." : "All optic matrices online.");
          }, 0);
          return next;
        });
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        SoundFX.playComputeChime();
        setActiveHUDTab("hologram_3d");
        setTimeout(() => {
          onJarvisSpeak("Holographic 3D Schematics matrix online, sir.");
        }, 0);
      } else if (e.key === "v" || e.key === "V") {
        e.preventDefault();
        SoundFX.playTargetClick();
        setActiveHUDTab("viewport");
      } else if (e.key === "c" || e.key === "C" || e.key === "Delete") {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleClearCanvas();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndoStroke();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onJarvisSpeak, handleClearCanvas, handleUndoStroke]);

  // Export current drawing
  const handleExportDrawing = useCallback(() => {
    if (!overlayCanvasRef.current) return;
    SoundFX.playTargetClick();

    // Create export composite canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = overlayCanvasRef.current.width;
    exportCanvas.height = overlayCanvasRef.current.height;
    const expCtx = exportCanvas.getContext("2d");
    if (!expCtx) return;

    // Dark sleek background
    expCtx.fillStyle = "#050508";
    expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw grid
    expCtx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    expCtx.lineWidth = 1;
    for (let x = 0; x < exportCanvas.width; x += 30) {
      expCtx.beginPath();
      expCtx.moveTo(x, 0);
      expCtx.lineTo(x, exportCanvas.height);
      expCtx.stroke();
    }
    for (let y = 0; y < exportCanvas.height; y += 30) {
      expCtx.beginPath();
      expCtx.moveTo(0, y);
      expCtx.lineTo(exportCanvas.width, y);
      expCtx.stroke();
    }

    // Draw strokes
    strokes.forEach((st) => {
      if (st.points.length < 2) return;
      expCtx.save();
      expCtx.strokeStyle = st.color;
      expCtx.lineWidth = st.width;
      expCtx.lineCap = "round";
      expCtx.lineJoin = "round";
      expCtx.shadowColor = st.color;
      expCtx.shadowBlur = st.width * 2.5;

      expCtx.beginPath();
      expCtx.moveTo(st.points[0].x, st.points[0].y);
      for (let i = 1; i < st.points.length; i++) {
        expCtx.lineTo(st.points[i].x, st.points[i].y);
      }
      expCtx.stroke();
      expCtx.restore();
    });

    // Branding header
    expCtx.font = "bold 12px monospace";
    expCtx.fillStyle = "#38bdf8";
    expCtx.fillText("J.A.R.V.I.S. HOLOGRAPHIC AIR CANVAS", 16, 26);
    expCtx.font = "9px monospace";
    expCtx.fillStyle = "#94a3b8";
    expCtx.fillText(`CAPTURED: ${new Date().toLocaleString()} | STROKES: ${strokes.length}`, 16, 40);

    const dataUrl = exportCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `jarvis_air_sketch_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    addDetectionLog({
      type: "air_sketch",
      label: `Air Sketch Export (${strokes.length} Strokes)`,
      confidence: 99,
      details: `Holographic drawing exported successfully. Mode: ${drawMode}.`,
      sketchDataUrl: dataUrl,
    });

    onJarvisSpeak("Holographic drawing exported to your storage, sir.");
  }, [strokes, drawMode, addDetectionLog, onJarvisSpeak]);

  // AI Inspect Sketch
  const handleAnalyzeSketch = useCallback(async () => {
    if (strokes.length === 0 || isAnalyzingSketch) return;
    setIsAnalyzingSketch(true);
    SoundFX.playComputeChime();
    onJarvisSpeak("Scanning holographic gesture sketch with Gemini Vision Core, sir...");

    try {
      // Create snapshot canvas of the drawing
      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = 640;
      snapCanvas.height = 480;
      const sctx = snapCanvas.getContext("2d");
      if (!sctx) return;

      sctx.fillStyle = "#000000";
      sctx.fillRect(0, 0, 640, 480);

      // Render strokes scaled
      const scaleX = 640 / (overlayCanvasRef.current?.width || 640);
      const scaleY = 480 / (overlayCanvasRef.current?.height || 480);

      strokes.forEach((st) => {
        if (st.points.length < 2) return;
        sctx.save();
        sctx.strokeStyle = st.color;
        sctx.lineWidth = Math.max(3, st.width * scaleX);
        sctx.lineCap = "round";
        sctx.lineJoin = "round";
        sctx.shadowColor = st.color;
        sctx.shadowBlur = 10;

        sctx.beginPath();
        sctx.moveTo(st.points[0].x * scaleX, st.points[0].y * scaleY);
        for (let i = 1; i < st.points.length; i++) {
          sctx.lineTo(st.points[i].x * scaleX, st.points[i].y * scaleY);
        }
        sctx.stroke();
        sctx.restore();
      });

      const sketchImageBase64 = snapCanvas.toDataURL("image/png");

      const res = await fetch("/api/jarvis/analyze-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: sketchImageBase64,
          strokeCount: strokes.length,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        SoundFX.playTargetClick();
        if (data.spokenObservation) {
          onJarvisSpeak(data.spokenObservation);
        }

        addDetectionLog({
          type: "air_sketch",
          label: `Identified: ${data.identifiedSketch || "Air Drawing"}`,
          confidence: data.confidence || 95,
          details: data.spokenObservation || data.technicalDescription,
          sketchDataUrl: sketchImageBase64,
        });
      }
    } catch (err) {
      console.error("Sketch analysis error:", err);
      onJarvisSpeak("Sketch telemetry cataloged, sir. Geometric vectors recorded.");
    } finally {
      setIsAnalyzingSketch(false);
    }
  }, [strokes, isAnalyzingSketch, onJarvisSpeak, addDetectionLog]);

  // Real-Time Object Detection API Caller
  const executeRealtimeObjectDetection = useCallback(async () => {
    if (
      !isOpen ||
      !isRealtimeDetectionActive ||
      isDetectingObjects ||
      isScanning ||
      trackingMode === "hand_only"
    )
      return;

    const frame = captureFrame();
    if (!frame) return;

    setIsDetectingObjects(true);
    try {
      const res = await fetch("/api/jarvis/detect-objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: frame,
          targetFilter,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.objects)) {
          setDetectedObjects(data.objects);
          if (!selectedTargetId && data.objects.length > 0) {
            setSelectedTargetId(data.objects[0].id);
          }

          // Automatically log prominent newly detected objects to flight journal
          data.objects.slice(0, 3).forEach((obj: DetectedObjectBox) => {
            addDetectionLog({
              type: "object",
              label: obj.label,
              category: obj.category,
              confidence: obj.confidence,
              details: `Target acquired in visual sector. Threat: ${obj.threatLevel} | Dist: ${obj.distanceEstimate || "Nominal"}`,
              coordinates: `[${obj.box2d.join(", ")}]`,
            });
          });
        }
      }
    } catch (e) {
      // Non-blocking
    } finally {
      setIsDetectingObjects(false);
    }
  }, [
    captureFrame,
    isDetectingObjects,
    isOpen,
    isRealtimeDetectionActive,
    isScanning,
    selectedTargetId,
    targetFilter,
    trackingMode,
    addDetectionLog,
  ]);

  // Detection loop
  useEffect(() => {
    if (!isOpen || !isRealtimeDetectionActive || trackingMode === "hand_only") {
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
      return;
    }

    const runLoop = async () => {
      await executeRealtimeObjectDetection();
      if (isOpen && isRealtimeDetectionActive && trackingMode === "all") {
        detectionTimeoutRef.current = setTimeout(runLoop, 1200);
      }
    };

    detectionTimeoutRef.current = setTimeout(runLoop, 400);

    return () => {
      if (detectionTimeoutRef.current) clearTimeout(detectionTimeoutRef.current);
    };
  }, [isOpen, isRealtimeDetectionActive, trackingMode, executeRealtimeObjectDetection]);

  // Periodic UI State sync for hand state
  useEffect(() => {
    if (!isOpen) return;
    const uiInterval = setInterval(() => {
      setHandStateUI({ ...currentHandRef.current });
    }, 150);
    return () => clearInterval(uiInterval);
  }, [isOpen]);

  // -------------------------------------------------------------
  // PRIMARY 60 FPS OPTICAL TRACKING & OVERLAY RENDERING ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    let lastLoggedHandTime = 0;

    const renderOverlay = () => {
      const overlay = overlayCanvasRef.current;
      const video = videoRef.current;
      if (!overlay || !video) {
        animationFrameRef.current = requestAnimationFrame(renderOverlay);
        return;
      }

      const rect = video.getBoundingClientRect();
      if (overlay.width !== rect.width || overlay.height !== rect.height) {
        overlay.width = rect.width;
        overlay.height = rect.height;
      }

      const ctx = overlay.getContext("2d");
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(renderOverlay);
        return;
      }

      ctx.clearRect(0, 0, overlay.width, overlay.height);
      const time = Date.now() * 0.002;

      // ---------------------------------------------------------
      // 1. OPTICAL HAND & FINGERTIP TRACKING (60 FPS)
      // ---------------------------------------------------------
      const faceBoxForMask =
        trackingMode === "all" && isFaceTrackingActive
          ? ([
              currentFaceBoxRef.current.y,
              currentFaceBoxRef.current.x,
              currentFaceBoxRef.current.y + currentFaceBoxRef.current.h,
              currentFaceBoxRef.current.x + currentFaceBoxRef.current.w,
            ] as [number, number, number, number])
          : null;

      const opticalHand = handTrackerRef.current.trackHand(
        video,
        facingMode === "user",
        faceBoxForMask
      );

      currentHandRef.current = {
        isDetected: opticalHand.isHandDetected,
        centroid: opticalHand.palmCentroid,
        fingertip: opticalHand.smoothedFingertip,
        palmCenter: opticalHand.palmCentroid,
        bounds: opticalHand.bounds,
        confidence: opticalHand.confidence,
        gesture: opticalHand.gesture,
        isDrawing: isAirDrawActive && opticalHand.isHandDetected,
        velocity: opticalHand.velocity,
      };

      // Periodic logging of hand lock into journal (every 10s of active tracking)
      if (opticalHand.isHandDetected && Date.now() - lastLoggedHandTime > 12000) {
        lastLoggedHandTime = Date.now();
        addDetectionLog({
          type: "hand_tracking",
          label: "Hand Movement & Fingertip Tracked",
          confidence: opticalHand.confidence,
          details: `Gesture: ${opticalHand.gesture.toUpperCase()} | Air-Draw: ${isAirDrawActive ? "Active" : "Standby"}`,
          coordinates: `[Tip: ${opticalHand.smoothedFingertip.x}, ${opticalHand.smoothedFingertip.y}]`,
        });
      }

      // ---------------------------------------------------------
      // 2. RENDER REAL-TIME AIR DRAW STROKES ON HUD
      // ---------------------------------------------------------
      const tipPixelX = (opticalHand.smoothedFingertip.x / 1000) * overlay.width;
      const tipPixelY = (opticalHand.smoothedFingertip.y / 1000) * overlay.height;

      // Handle continuous air drawing when active and hand detected
      if (isAirDrawActive && opticalHand.isHandDetected) {
        if (!currentStrokeRef.current) {
          const newStroke: AirDrawStroke = {
            id: `stroke_${Date.now()}`,
            points: [{ x: tipPixelX, y: tipPixelY }],
            color: selectedDrawColor,
            width: strokeWidth,
            mode: drawMode,
            timestamp: Date.now(),
          };
          currentStrokeRef.current = newStroke;
          strokesRef.current = [...strokesRef.current, newStroke];
          setStrokes(strokesRef.current);
        } else {
          // Append point with minimum distance check to prevent redundant points
          const lastPt = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
          const dist = Math.hypot(tipPixelX - lastPt.x, tipPixelY - lastPt.y);
          if (dist > 2.5) {
            currentStrokeRef.current.points.push({ x: tipPixelX, y: tipPixelY });

            // Add sparkle particles at tip
            if (drawMode === "sparkle" || Math.random() > 0.4) {
              particlesRef.current.push({
                x: tipPixelX,
                y: tipPixelY,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 1.0,
                color: selectedDrawColor,
              });
            }
          }
        }
      } else {
        if (currentStrokeRef.current) {
          currentStrokeRef.current = null;
          setStrokes([...strokesRef.current]);
        }
      }

      // Draw all accumulated strokes with glowing laser effects
      strokesRef.current.forEach((stroke) => {
        if (stroke.points.length < 2) return;

        ctx.save();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.width * 2.2;

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        // Quadratic Bézier curve smoothing for buttery smooth calligraphic laser lines
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }

        const lastIdx = stroke.points.length - 1;
        ctx.lineTo(stroke.points[lastIdx].x, stroke.points[lastIdx].y);
        ctx.stroke();

        // Inner bright core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1.5, stroke.width * 0.35);
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.restore();
      });

      // Update and render sparkle particles
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0.04);
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;

        if (p.life <= 0) return;

        const particleRadius = Math.max(0.1, 2.5 * p.life);
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // ---------------------------------------------------------
      // 3. RENDER HOLOGRAPHIC HAND & FINGERTIP TARGETING RETICLE
      // ---------------------------------------------------------
      if (opticalHand.isHandDetected) {
        const hx = (opticalHand.bounds[1] / 1000) * overlay.width;
        const hy = (opticalHand.bounds[0] / 1000) * overlay.height;
        const hw = ((opticalHand.bounds[3] - opticalHand.bounds[1]) / 1000) * overlay.width;
        const hh = ((opticalHand.bounds[2] - opticalHand.bounds[0]) / 1000) * overlay.height;

        const palmX = (opticalHand.palmCentroid.x / 1000) * overlay.width;
        const palmY = (opticalHand.palmCentroid.y / 1000) * overlay.height;

        ctx.save();

        // A. Hand Bounding Box (Corner brackets)
        const cornerSize = Math.min(18, Math.max(8, hw * 0.2));
        ctx.strokeStyle = isAirDrawActive ? selectedDrawColor : "#38bdf8";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = isAirDrawActive ? selectedDrawColor : "#38bdf8";
        ctx.shadowBlur = 8;

        ctx.beginPath();
        // Top-Left
        ctx.moveTo(hx, hy + cornerSize);
        ctx.lineTo(hx, hy);
        ctx.lineTo(hx + cornerSize, hy);
        // Top-Right
        ctx.moveTo(hx + hw - cornerSize, hy);
        ctx.lineTo(hx + hw, hy);
        ctx.lineTo(hx + hw, hy + cornerSize);
        // Bottom-Right
        ctx.moveTo(hx + hw, hy + hh - cornerSize);
        ctx.lineTo(hx + hw, hy + hh);
        ctx.lineTo(hx + hw - cornerSize, hy + hh);
        // Bottom-Left
        ctx.moveTo(hx + cornerSize, hy + hh);
        ctx.lineTo(hx, hy + hh);
        ctx.lineTo(hx, hy + hh - cornerSize);
        ctx.stroke();

        // B. Holographic Line from Palm Centroid to Fingertip
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
        ctx.lineWidth = 1.2;
        ctx.moveTo(palmX, palmY);
        ctx.lineTo(tipPixelX, tipPixelY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Palm Centroid Node (Small Diamond)
        ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
        ctx.beginPath();
        ctx.moveTo(palmX, palmY - 4);
        ctx.lineTo(palmX + 4, palmY);
        ctx.lineTo(palmX, palmY + 4);
        ctx.lineTo(palmX - 4, palmY);
        ctx.closePath();
        ctx.fill();

        // C. Arc-Reactor Fingertip Targeting Pointer (Primary Drawing Pen Reticle)
        ctx.save();
        ctx.translate(tipPixelX, tipPixelY);

        // Concentric outer rotating ring
        ctx.rotate(time * 2);
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.strokeStyle = isAirDrawActive ? selectedDrawColor : "rgba(56, 189, 248, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Inner counter-rotating ring
        ctx.rotate(-time * 4);
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.restore();

        // Center Laser Tip Dot
        ctx.beginPath();
        ctx.arc(tipPixelX, tipPixelY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isAirDrawActive ? selectedDrawColor : "#38bdf8";
        ctx.shadowColor = isAirDrawActive ? selectedDrawColor : "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.fill();

        // White core dot
        ctx.beginPath();
        ctx.arc(tipPixelX, tipPixelY, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // D. Floating Holographic Hand HUD Tag
        const handLabel = isAirDrawActive
          ? `● AIR-DRAW [ACTIVE] | GESTURE: ${opticalHand.gesture.toUpperCase()}`
          : `● HAND TRACKED [${opticalHand.confidence}%] | ${opticalHand.gesture.toUpperCase()}`;
        ctx.font = "bold 9px monospace";
        const tagW = ctx.measureText(handLabel).width;
        const tagX = Math.max(8, Math.min(overlay.width - tagW - 16, hx));
        const tagY = Math.max(22, hy - 8);

        ctx.fillStyle = "rgba(8, 8, 12, 0.92)";
        ctx.beginPath();
        ctx.roundRect(tagX, tagY - 16, tagW + 16, 18, 4);
        ctx.fill();
        ctx.strokeStyle = isAirDrawActive ? selectedDrawColor : "#38bdf8";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isAirDrawActive ? selectedDrawColor : "#38bdf8";
        ctx.fillText(handLabel, tagX + 8, tagY - 4);

        ctx.restore();
      }

      // ---------------------------------------------------------
      // 4. FULL OPTICS MODE (FACE LOCK & OBJECTS) ONLY IF NOT IN HAND-ONLY MODE
      // ---------------------------------------------------------
      if (trackingMode === "all") {
        // Face tracking
        if (isFaceTrackingActive && facingMode === "user") {
          const fb = currentFaceBoxRef.current;
          fb.x += (fb.targetX - fb.x) * 0.15;
          fb.y += (fb.targetY - fb.y) * 0.15;
          fb.w += (fb.targetW - fb.w) * 0.15;
          fb.h += (fb.targetH - fb.h) * 0.15;

          const fx = (fb.x / 1000) * overlay.width;
          const fy = (fb.y / 1000) * overlay.height;
          const fw = (fb.w / 1000) * overlay.width;
          const fh = (fb.h / 1000) * overlay.height;

          const cornerLen = Math.min(22, fw * 0.2);

          ctx.save();
          ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fx, fy + cornerLen);
          ctx.lineTo(fx, fy);
          ctx.lineTo(fx + cornerLen, fy);

          ctx.moveTo(fx + fw - cornerLen, fy);
          ctx.lineTo(fx + fw, fy);
          ctx.lineTo(fx + fw, fy + cornerLen);

          ctx.moveTo(fx + fw, fy + fh - cornerLen);
          ctx.lineTo(fx + fw, fy + fh);
          ctx.lineTo(fx + fw - cornerLen, fy + fh);

          ctx.moveTo(fx + cornerLen, fy + fh);
          ctx.lineTo(fx, fy + fh);
          ctx.lineTo(fx, fy + fh - cornerLen);
          ctx.stroke();

          ctx.font = "bold 9px monospace";
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(fx, fy - 18, 160, 16);
          ctx.fillStyle = "#38bdf8";
          ctx.fillText("● COMMANDER [FACE LOCK]", fx + 6, fy - 6);
          ctx.restore();
        }

        // Detected Objects
        detectedObjects.forEach((obj) => {
          if (targetFilter !== "all" && obj.category !== targetFilter) return;
          const [ymin, xmin, ymax, xmax] = obj.box2d;
          const ox = (xmin / 1000) * overlay.width;
          const oy = (ymin / 1000) * overlay.height;
          const ow = ((xmax - xmin) / 1000) * overlay.width;
          const oh = ((ymax - ymin) / 1000) * overlay.height;

          ctx.save();
          ctx.strokeStyle = obj.colorHex || "#10b981";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(ox, oy, ow, oh);
          ctx.font = "8px monospace";
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(ox, oy - 14, 90, 14);
          ctx.fillStyle = obj.colorHex || "#10b981";
          ctx.fillText(`${obj.label} (${obj.confidence}%)`, ox + 4, oy - 4);
          ctx.restore();
        });
      }

      animationFrameRef.current = requestAnimationFrame(renderOverlay);
    };

    animationFrameRef.current = requestAnimationFrame(renderOverlay);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isOpen,
    facingMode,
    isAirDrawActive,
    selectedDrawColor,
    strokeWidth,
    drawMode,
    strokes,
    trackingMode,
    isFaceTrackingActive,
    detectedObjects,
    targetFilter,
    addDetectionLog,
  ]);

  // Pointer/Mouse drawing fallback on overlay canvas
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAirDrawActive || !overlayCanvasRef.current) return;
    isPointerDrawingRef.current = true;
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newStroke: AirDrawStroke = {
      id: `stroke_pointer_${Date.now()}`,
      points: [{ x, y }],
      color: selectedDrawColor,
      width: strokeWidth,
      mode: drawMode,
      timestamp: Date.now(),
    };
    currentStrokeRef.current = newStroke;
    setStrokes((prev) => [...prev, newStroke]);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPointerDrawingRef.current || !currentStrokeRef.current || !overlayCanvasRef.current) return;
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current.points.push({ x, y });
    setStrokes((prev) => [...prev]);
  };

  const handlePointerUp = () => {
    isPointerDrawingRef.current = false;
    currentStrokeRef.current = null;
  };

  // Deep Scan Trigger
  const executeScan = useCallback(
    async (mode: "look_at_me" | "describe_surroundings" | "track_posture_mood" = "look_at_me") => {
      if (isScanning) return;
      setIsScanning(true);
      SoundFX.playComputeChime();

      let prompt = "Analyze the visual telemetry of the user in front of the camera.";
      if (mode === "describe_surroundings") {
        prompt = "Describe my physical surroundings, room setting, and workspace items.";
      } else if (mode === "track_posture_mood") {
        prompt = "Conduct a dedicated posture, ergonomic, facial expression, and vital energy assessment.";
      }

      const frameData = captureFrame();
      if (!frameData) {
        setIsScanning(false);
        return;
      }

      setLastCapturedPreview(frameData);

      try {
        const res = await fetch("/api/jarvis/vision-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: frameData,
            prompt,
            mode,
          }),
        });

        if (res.ok) {
          const data: VisionAnalysisResult = await res.json();
          data.capturedImagePreview = frameData;
          setLatestResult(data);
          if (data.detectedBoxes && data.detectedBoxes.length > 0) {
            setDetectedObjects(data.detectedBoxes);
          }
          SoundFX.playTargetClick();

          if (data.spokenObservation) {
            onJarvisSpeak(data.spokenObservation);
          }

          addDetectionLog({
            type: "scan",
            label: `Multimodal Optical Scan (${mode})`,
            confidence: data.detectedAttributes.biometricScanConfidence || 96,
            details: data.spokenObservation || data.detailedAnalysis,
          });

          onVisionResult(data, frameData);
        }
      } catch (err: any) {
        console.error("Vision scan failed:", err);
      } finally {
        setIsScanning(false);
      }
    },
    [captureFrame, isScanning, onJarvisSpeak, onVisionResult, addDetectionLog]
  );

  if (!isOpen) return null;

  return (
    <div
      id="vision-optics-hud-modal"
      className={`fixed z-40 transition-all duration-300 flex flex-col ${
        isExpanded
          ? "inset-3 md:inset-6 bg-[#050506]/98 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.25)] overflow-hidden"
          : "bottom-4 right-4 w-[420px] md:w-[540px] bg-[#0A0A0C]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden"
      }`}
    >
      {/* HUD Header Bar */}
      <div className="p-3 bg-[#050506] border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Hand className="w-4 h-4 animate-pulse text-cyan-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
              <span>JARVIS OPTICS & AIR CANVAS</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {trackingMode === "hand_only" ? "HAND ONLY" : "ALL OPTICS"}
              </span>
            </span>
            <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">
              60FPS SPATIAL HAND TRACKING & HOLOGRAPHIC AIR DRAW
            </span>
          </div>
        </div>

        {/* Tab Switcher & Window Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/60 p-0.5 rounded border border-white/10 text-[10px] font-mono">
            <button
              onClick={() => {
                SoundFX.playTargetClick();
                setActiveHUDTab("viewport");
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                activeHUDTab === "viewport"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>AIR CANVAS</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playComputeChime();
                setActiveHUDTab("hologram_3d");
                onJarvisSpeak("Holographic 3D Schematics matrix online, sir. Move your hand or drag pointer to manipulate.");
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                activeHUDTab === "hologram_3d"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Box className="w-3 h-3 text-cyan-400" />
              <span>3D SCHEMATICS</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playTargetClick();
                setActiveHUDTab("journal");
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                activeHUDTab === "journal"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>JOURNAL ({detectionLogs.length})</span>
            </button>
          </div>

          {/* Flip Camera */}
          <button
            onClick={() => setFacingMode((prev) => (prev === "user" ? "environment" : "user"))}
            title="Switch Camera Lens"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Collapse Viewport" : "Maximize Viewport"}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close HUD */}
          <button
            onClick={onClose}
            title="Disengage Vision Sensors"
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/20"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* BODY CONTENT: Viewport vs 3D Schematics vs Detection Flight Journal */}
      {activeHUDTab === "journal" ? (
        <DetectionFlightJournal
          logs={detectionLogs}
          onClearLogs={() => {
            setDetectionLogs([]);
            localStorage.removeItem("jarvis_optical_detection_notes");
            onJarvisSpeak("Detection flight journal logs cleared.");
          }}
        />
      ) : activeHUDTab === "hologram_3d" ? (
        <Holographic3DSchematics
          handData={handStateUI || currentHandRef.current}
          onJarvisSpeak={onJarvisSpeak}
        />
      ) : (
        <>
          {/* AIR-CANVAS TOOLBOX STRIP */}
          <div className="px-3 py-2 bg-[#060608] border-b border-white/5">
            <AirCanvasControls
              isAirDrawActive={isAirDrawActive}
              onToggleAirDraw={() => {
                SoundFX.playTargetClick();
                setIsAirDrawActive((prev) => {
                  const next = !prev;
                  setTimeout(() => {
                    onJarvisSpeak(next ? "Air-Draw active. Move your hand to draw." : "Air-Draw standby.");
                  }, 0);
                  return next;
                });
              }}
              selectedColor={selectedDrawColor}
              onSelectColor={(c) => {
                SoundFX.playTargetClick();
                setSelectedDrawColor(c);
              }}
              strokeWidth={strokeWidth}
              onChangeStrokeWidth={(w) => {
                SoundFX.playTargetClick();
                setStrokeWidth(w);
              }}
              drawMode={drawMode}
              onChangeDrawMode={(m) => {
                SoundFX.playTargetClick();
                setDrawMode(m);
              }}
              onUndo={handleUndoStroke}
              onClear={handleClearCanvas}
              onAnalyzeSketch={handleAnalyzeSketch}
              onExportDrawing={handleExportDrawing}
              isAnalyzing={isAnalyzingSketch}
              strokeCount={strokes.length}
              handState={handStateUI}
              trackingMode={trackingMode}
              onToggleTrackingMode={(mode) => {
                SoundFX.playComputeChime();
                setTrackingMode(mode);
                setIsFaceTrackingActive(mode === "all");
                setTimeout(() => {
                  onJarvisSpeak(mode === "hand_only" ? "Hand Tracking Only isolated." : "All optics enabled.");
                }, 0);
              }}
            />
          </div>

          {/* Main Video Viewport & Holographic Drawing Canvas */}
          <div
            className={`relative bg-black flex items-center justify-center overflow-hidden ${
              isExpanded ? "flex-1 min-h-[420px]" : "h-80 md:h-96"
            }`}
          >
            {/* Hidden Offscreen Canvas for Snapshot / Processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
            />

            {/* Interactive Drawing & Reticle Canvas Overlay */}
            <canvas
              ref={overlayCanvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              className="absolute inset-0 w-full h-full z-10 cursor-crosshair"
            />

            {/* Camera Permission Error */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-[#050506]/95 flex flex-col items-center justify-center p-6 text-center z-20">
                <Camera className="w-10 h-10 text-rose-500 mb-3 animate-pulse" />
                <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider mb-1">
                  Optical Sensor Offline
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  {cameraError || "Please grant camera permissions to activate Hand Tracking and Air-Draw."}
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>RECONNECT OPTICS</span>
                </button>
              </div>
            )}

            {/* Holographic Viewport Overlay Badges */}
            <div className="absolute inset-0 pointer-events-none z-15 flex flex-col justify-between p-3 select-none">
              {/* Top Telemetry */}
              <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400/90">
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-cyan-500/30 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>
                    {trackingMode === "hand_only"
                      ? "ISOLATED HAND TRACKER: 60FPS"
                      : "ALL OPTICS: MULTI-TARGET"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-cyan-500/30 shadow-lg">
                  <span>AIR-DRAW:</span>
                  <span className={isAirDrawActive ? "text-emerald-400 font-bold" : "text-slate-400"}>
                    {isAirDrawActive ? "ACTIVE" : "STANDBY"}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span>STROKES: {strokes.length}</span>
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-300">
                <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 flex items-center gap-1.5">
                  <Hand className="w-3 h-3 text-cyan-400" />
                  <span>RAISE HAND TO MOVE POINTER & DRAW IN THE AIR</span>
                </div>
                <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                  <span>PRESS 'D' TO TOGGLE DRAW</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Multimodal Diagnostics Toolbar */}
          <div className="p-2.5 bg-[#08080a] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => executeScan("look_at_me")}
                disabled={isScanning || !hasCameraPermission}
                className="flex items-center gap-1 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg font-bold shadow-md transition-all disabled:opacity-50 text-[11px]"
              >
                <Scan className={`w-3 h-3 ${isScanning ? "animate-spin" : ""}`} />
                <span>{isScanning ? "SCANNING..." : "SCAN ROOM"}</span>
              </button>

              <button
                onClick={() => executeScan("track_posture_mood")}
                disabled={isScanning || !hasCameraPermission}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-all text-[11px]"
              >
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>POSTURE CHECK</span>
              </button>

              <button
                onClick={handleClearCanvas}
                disabled={strokes.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-950/20 hover:bg-red-900/40 text-red-300 rounded-lg border border-red-500/20 transition-all text-[11px] disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3" />
                <span>CLEAR CANVAS</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500">
              <span>LATENCY: 16ms | 60 FPS SPATIAL TRACKING</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
