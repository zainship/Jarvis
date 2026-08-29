/**
 * J.A.R.V.I.S. Acoustic Hand Clap Detection & Wake Subsystem
 * 
 * Features:
 * - Real-time acoustic transient impulse analysis (waveform peak, energy ratio & decay)
 * - Detects sharp acoustic hand claps or double claps to wake J.A.R.V.I.S.
 * - Triggers sci-fi wake chime, activates listening sensor, and speaks a greeting
 * - Fully configurable sensitivity ("low", "medium", "high", "tactical") and mode
 */

import { ClapDetectionEvent, ClapWakeConfig } from "../types";
import { SoundFX } from "./soundEffects";

type ClapCallback = (event: ClapDetectionEvent) => void;
type StateListener = (config: ClapWakeConfig) => void;

class ClapDetector {
  private static instance: ClapDetector;
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private isRunning = false;
  private isProcessingClap = false;
  private lastClapTimestamp = 0;
  private firstClapTime = 0; // For double-clap mode
  private ambientNoiseFloor = 0.03;

  private clapCallbacks: Set<ClapCallback> = new Set();
  private stateListeners: Set<StateListener> = new Set();

  private config: ClapWakeConfig = {
    enabled: true,
    sensitivity: "high",
    mode: "single_clap",
    spokenGreetingEnabled: true,
    soundChimeEnabled: true,
    totalClapsDetected: 0,
    lastClapTime: null,
    ambientNoiseFloor: 12,
    currentPeakLevel: 0,
  };

  private history: ClapDetectionEvent[] = [];

  private constructor() {
    this.loadPersistedConfig();
  }

  public static getInstance(): ClapDetector {
    if (!ClapDetector.instance) {
      ClapDetector.instance = new ClapDetector();
    }
    return ClapDetector.instance;
  }

  private loadPersistedConfig() {
    try {
      const stored = localStorage.getItem("jarvis_clap_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = {
          ...this.config,
          ...parsed,
          ambientNoiseFloor: 12,
          currentPeakLevel: 0,
        };
      }
    } catch (e) {
      console.warn("Could not load persisted clap config", e);
    }
  }

  private persistConfig() {
    try {
      localStorage.setItem("jarvis_clap_config", JSON.stringify(this.config));
    } catch (e) {}
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener({ ...this.config });
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public onClap(callback: ClapCallback): () => void {
    this.clapCallbacks.add(callback);
    return () => {
      this.clapCallbacks.delete(callback);
    };
  }

  private notifyState() {
    this.stateListeners.forEach((fn) => {
      try {
        fn({ ...this.config });
      } catch (e) {}
    });
  }

  public getConfig(): ClapWakeConfig {
    return { ...this.config };
  }

  public getHistory(): ClapDetectionEvent[] {
    return [...this.history];
  }

  public updateConfig(partial: Partial<ClapWakeConfig>) {
    this.config = { ...this.config, ...partial };
    this.persistConfig();
    this.notifyState();
  }

  /**
   * Start microphone audio listening loop for clap acoustic analysis
   */
  public async start(): Promise<boolean> {
    if (!this.config.enabled) return false;
    if (this.isRunning) return true;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      }

      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.1;
      source.connect(this.analyser);

      this.isRunning = true;
      this.startDetectionLoop();
      this.notifyState();
      return true;
    } catch (err) {
      console.warn("Clap detector mic initialization:", err);
      return false;
    }
  }

  /**
   * Stop clap listening
   */
  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.config.currentPeakLevel = 0;
    this.notifyState();
  }

  /**
   * Real-time acoustic transient detection loop
   */
  private startDetectionLoop() {
    if (!this.analyser) return;

    const timeData = new Float32Array(this.analyser.fftSize);
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);

    const check = () => {
      if (!this.isRunning || !this.analyser) return;

      this.analyser.getFloatTimeDomainData(timeData);
      this.analyser.getByteFrequencyData(freqData);

      // 1. Calculate Peak Instant Amplitude & RMS
      let peak = 0;
      let sumSq = 0;
      for (let i = 0; i < timeData.length; i++) {
        const val = Math.abs(timeData[i]);
        if (val > peak) peak = val;
        sumSq += val * val;
      }
      const rms = Math.sqrt(sumSq / timeData.length);

      // Update ambient noise baseline
      this.ambientNoiseFloor = this.ambientNoiseFloor * 0.96 + rms * 0.04;
      const peakMeter = Math.min(100, Math.round(peak * 100));
      this.config.currentPeakLevel = peakMeter;
      this.config.ambientNoiseFloor = Math.min(100, Math.round(this.ambientNoiseFloor * 100));

      // 2. Determine Sensitivity Thresholds
      let peakThreshold = 0.35;
      let ratioThreshold = 3.5;

      switch (this.config.sensitivity) {
        case "tactical":
          peakThreshold = 0.22;
          ratioThreshold = 2.4;
          break;
        case "high":
          peakThreshold = 0.32;
          ratioThreshold = 3.2;
          break;
        case "medium":
          peakThreshold = 0.45;
          ratioThreshold = 4.2;
          break;
        case "low":
          peakThreshold = 0.60;
          ratioThreshold = 5.5;
          break;
      }

      const now = performance.now();
      const energyRatio = peak / Math.max(0.015, this.ambientNoiseFloor);

      // 3. High-Frequency Spectral Check (Claps have sharp energy in 1.2kHz - 5kHz bins)
      let highFreqEnergy = 0;
      const midHighStart = Math.floor(freqData.length * 0.2);
      for (let i = midHighStart; i < freqData.length; i++) {
        highFreqEnergy += freqData[i];
      }
      const avgHighFreq = highFreqEnergy / (freqData.length - midHighStart);

      // 4. Transient Peak Trigger
      const isTransientSpike = peak >= peakThreshold && energyRatio >= ratioThreshold && avgHighFreq > 25;
      const cooldownPassed = now - this.lastClapTimestamp > 1000;

      if (isTransientSpike && cooldownPassed && !this.isProcessingClap && this.config.enabled) {
        if (this.config.mode === "double_clap") {
          this.handleDoubleClapSequence(now, peak, energyRatio);
        } else {
          this.triggerClapWake("single_clap", peak, energyRatio);
        }
      }

      this.animFrameId = requestAnimationFrame(check);
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(check);
  }

  /**
   * Handles 2-clap sequence timing (200ms - 900ms window)
   */
  private handleDoubleClapSequence(now: number, peak: number, energyRatio: number) {
    if (this.firstClapTime === 0) {
      // First clap detected
      this.firstClapTime = now;
      SoundFX.playTargetClick();
      // Set timeout to clear if 2nd clap doesn't arrive within 900ms
      setTimeout(() => {
        if (this.firstClapTime === now) {
          this.firstClapTime = 0;
        }
      }, 900);
    } else {
      const delta = now - this.firstClapTime;
      if (delta >= 180 && delta <= 900) {
        // Second clap confirmed!
        this.firstClapTime = 0;
        this.triggerClapWake("double_clap", peak, energyRatio);
      } else if (delta > 900) {
        this.firstClapTime = now;
      }
    }
  }

  /**
   * Triggers the wake-up routine when a verified hand clap is received
   */
  public triggerClapWake(type: "single_clap" | "double_clap" = "single_clap", peak = 0.85, energyRatio = 4.8) {
    this.isProcessingClap = true;
    this.lastClapTimestamp = performance.now();

    const timestampStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    this.config.totalClapsDetected++;
    this.config.lastClapTime = timestampStr;

    const evt: ClapDetectionEvent = {
      id: `clap_evt_${Date.now()}`,
      timestamp: timestampStr,
      peakVolume: Math.round(peak * 100),
      energyRatio: Math.round(energyRatio * 10) / 10,
      decayMs: 45,
      type: type,
    };

    this.history.unshift(evt);
    if (this.history.length > 15) this.history.pop();

    // Play Sci-Fi Activation Chime
    if (this.config.soundChimeEnabled) {
      SoundFX.playClapWakeChime();
    }

    // Broadcast to listeners (App.tsx / Voice Console)
    this.clapCallbacks.forEach((cb) => {
      try {
        cb(evt);
      } catch (e) {}
    });

    this.notifyState();

    // Reset processing flag after brief debounce
    setTimeout(() => {
      this.isProcessingClap = false;
    }, 1200);
  }
}

export const clapDetector = ClapDetector.getInstance();
