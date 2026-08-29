/**
 * J.A.R.V.I.S. Autonomous Room Sentry & Intrusion Detection Subsystem
 * Monitors room via the Optic Camera when the user is away from their computer.
 * Detects unauthorized human motion/presence, initiates audio beeping alarms,
 * logs intrusion snapshots, and announces verbal intruder warnings.
 */

import { RoomSentryState, SentryIntrusionEvent } from "../types";
import { opticVisionManager } from "./opticVisionManager";
import { SoundFX } from "./soundEffects";

type SentryListener = (state: RoomSentryState) => void;

class RoomSentryManager {
  private static instance: RoomSentryManager;
  private listeners: Set<SentryListener> = new Set();
  private scanInterval: NodeJS.Timeout | null = null;
  private beepInterval: NodeJS.Timeout | null = null;
  private prevFrameData: Uint8ClampedArray | null = null;
  private motionCanvas: HTMLCanvasElement | null = null;
  private motionCtx: CanvasRenderingContext2D | null = null;
  private isScanningAI = false;

  private state: RoomSentryState = {
    enabled: false,
    armed: false,
    status: "disarmed",
    sensitivity: "high",
    beepingAlarmEnabled: true,
    spokenWarningEnabled: true,
    autoSnapshots: true,
    lastIntrusionTime: null,
    totalIntrusionsCount: 0,
    motionScore: 0,
    history: [],
  };

  private constructor() {
    if (typeof window !== "undefined") {
      this.motionCanvas = document.createElement("canvas");
      this.motionCanvas.width = 160;
      this.motionCanvas.height = 120;
      this.motionCtx = this.motionCanvas.getContext("2d", { willReadFrequently: true });
    }
  }

  public static getInstance(): RoomSentryManager {
    if (!RoomSentryManager.instance) {
      RoomSentryManager.instance = new RoomSentryManager();
    }
    return RoomSentryManager.instance;
  }

  public subscribe(listener: SentryListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public getState(): RoomSentryState {
    return { ...this.state };
  }

  /**
   * Arm the Sentry Room Monitoring System
   */
  public async armSentry(delaySeconds = 3): Promise<boolean> {
    SoundFX.playTargetClick();
    this.state.enabled = true;
    this.state.status = "arming";
    this.notify();

    // Ensure camera is active
    const cameraActive = await opticVisionManager.startOpticVision();
    if (!cameraActive) {
      this.state.status = "disarmed";
      this.state.enabled = false;
      this.notify();
      return false;
    }

    // Wait arming countdown
    setTimeout(() => {
      this.state.armed = true;
      this.state.status = "patrolling";
      this.notify();
      SoundFX.playStepComplete();
      this.startPatrolLoop();
    }, delaySeconds * 1000);

    return true;
  }

  /**
   * Disarm the Sentry Room Monitor and silence any alarm
   */
  public disarmSentry(): void {
    this.stopBeepingAlarm();
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.prevFrameData = null;
    this.state.enabled = false;
    this.state.armed = false;
    this.state.status = "disarmed";
    this.state.motionScore = 0;
    this.notify();
    SoundFX.playWakePing();
  }

  /**
   * Silence the active beeping alarm while keeping sentry armed
   */
  public silenceAlarm(): void {
    this.stopBeepingAlarm();
    if (this.state.armed) {
      this.state.status = "patrolling";
    }
    this.notify();
  }

  /**
   * Update settings
   */
  public updateSettings(partial: Partial<RoomSentryState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Clear incident history
   */
  public clearHistory(): void {
    this.state.history = [];
    this.state.totalIntrusionsCount = 0;
    this.state.lastIntrusionTime = null;
    this.notify();
  }

  /**
   * Starts periodic optical motion differencing & AI vision inspection
   */
  private startPatrolLoop(): void {
    if (this.scanInterval) clearInterval(this.scanInterval);

    // Run rapid frame differencing every 500ms
    this.scanInterval = setInterval(() => {
      if (!this.state.armed || this.state.status === "disarmed") return;
      this.performOpticalMotionCheck();
    }, 600);
  }

  /**
   * Fast client-side pixel differencing to detect movement in room
   */
  private performOpticalMotionCheck(): void {
    const video = opticVisionManager.getVideoElement();
    if (!video || !this.motionCanvas || !this.motionCtx || video.readyState < 2) return;

    try {
      const w = this.motionCanvas.width;
      const h = this.motionCanvas.height;
      this.motionCtx.drawImage(video, 0, 0, w, h);
      const currentData = this.motionCtx.getImageData(0, 0, w, h).data;

      if (!this.prevFrameData) {
        this.prevFrameData = new Uint8ClampedArray(currentData);
        return;
      }

      let diffCount = 0;
      const threshold = this.state.sensitivity === "tactical_ultra" ? 18 : this.state.sensitivity === "high" ? 25 : 38;
      const totalPixels = w * h;

      for (let i = 0; i < currentData.length; i += 4) {
        const rDiff = Math.abs(currentData[i] - this.prevFrameData[i]);
        const gDiff = Math.abs(currentData[i + 1] - this.prevFrameData[i + 1]);
        const bDiff = Math.abs(currentData[i + 2] - this.prevFrameData[i + 2]);
        const avgDiff = (rDiff + gDiff + bDiff) / 3;

        if (avgDiff > threshold) {
          diffCount++;
        }
      }

      // Update previous frame
      this.prevFrameData.set(currentData);

      const motionPercent = Math.min(100, Math.round((diffCount / totalPixels) * 100 * 4));
      this.state.motionScore = motionPercent;
      this.notify();

      // Trigger threshold for intrusion
      const triggerThreshold = this.state.sensitivity === "tactical_ultra" ? 6 : this.state.sensitivity === "high" ? 12 : 22;

      if (motionPercent >= triggerThreshold && !this.isScanningAI && this.state.status !== "intrusion_detected") {
        this.triggerIntrusionProtocol("Significant optical motion detected in room perimeter.");
      }
    } catch (e) {
      console.warn("Motion differencing notice:", e);
    }
  }

  /**
   * Intrusion verification & alarm trigger
   */
  public async triggerIntrusionProtocol(reason: string): Promise<void> {
    if (this.isScanningAI) return;
    this.isScanningAI = true;

    // Transition state to alert
    this.state.status = "intrusion_detected";
    this.state.lastIntrusionTime = new Date().toLocaleTimeString();
    this.state.totalIntrusionsCount++;

    const snapshot = opticVisionManager.captureLiveFrame();

    // Start Beeping Alarm Sound Immediately
    if (this.state.beepingAlarmEnabled) {
      this.startBeepingAlarm();
    }

    // Call deep multimodal vision analyze in sentry mode
    try {
      if (snapshot) {
        const analysis = await opticVisionManager.analyzeCurrentFrame("look_at_me", "SENTRY ALERT: Human presence or movement spotted in room. Identify intruder details.");

        const isSubjectHuman = analysis?.detectedAttributes?.subjectDetected ?? true;
        const details = analysis?.spokenObservation || "Intruder detected in room perimeter sector. Perimeter alarm active.";

        const threatLevel = ((analysis?.detectedAttributes?.threatLevel as any) === "CRITICAL" ? "CRITICAL" : "ELEVATED") as "CRITICAL" | "ELEVATED";

        const event: SentryIntrusionEvent = {
          id: `sentry_evt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          confidence: analysis?.detectedAttributes?.biometricScanConfidence || 94,
          detectedCount: isSubjectHuman ? 1 : 0,
          threatLevel: threatLevel,
          details: details,
          capturedSnapshot: snapshot || undefined,
          alarmActive: true,
        };

        this.state.history.unshift(event);
        if (this.state.history.length > 20) this.state.history.pop();
        this.notify();
      }
    } catch (err) {
      console.error("Sentry verification notice:", err);
    } finally {
      this.isScanningAI = false;
    }
  }

  /**
   * Continuous Tactical Beeping Alarm Loop
   */
  private startBeepingAlarm(): void {
    if (this.beepInterval) return;

    // Play first immediate burst
    SoundFX.playIntruderBeep();

    // Loop sharp tactical alarm beeps every 450ms
    this.beepInterval = setInterval(() => {
      if (this.state.status !== "intrusion_detected" || !this.state.beepingAlarmEnabled) {
        this.stopBeepingAlarm();
        return;
      }
      SoundFX.playIntruderBeep();
    }, 450);
  }

  private stopBeepingAlarm(): void {
    if (this.beepInterval) {
      clearInterval(this.beepInterval);
      this.beepInterval = null;
    }
  }
}

export const roomSentryManager = RoomSentryManager.getInstance();
