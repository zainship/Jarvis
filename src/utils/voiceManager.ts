/**
 * Voice Recognition, Wake Word Detection & Speech Synthesis Engine for JARVIS
 * 
 * Features:
 * - Autonomous Two-Way Audio Loop (Auto mic turn-off during speech, auto turn-on on completion)
 * - Background Noise Elimination & DSP Spectral Gate Tool (High-Pass, Low-Pass, Formant Boost, Noise Gate)
 * - Voice Interception Engine (Instant barge-in / speech cut when user starts speaking)
 * - Room Noise Floor Auto-Calibration
 * - Customizable pitch, speed/rate, voice selection, language presets
 */
import { SoundFX } from "./soundEffects";
import { VoiceSettings, NoiseEliminationConfig, VoiceInterceptionConfig } from "../types";

type SpeechCallback = (text: string, isFinal: boolean) => void;
type StateCallback = (isListening: boolean, isSpeaking: boolean) => void;
type FrequencyCallback = (frequencyData: Uint8Array) => void;
type InterceptionCallback = (event: { timestamp: string; phrase?: string; reason: string }) => void;

export const VOICE_PRESETS: Array<{
  name: string;
  description: string;
  pitch: number;
  rate: number;
  language?: "en-US" | "hi-IN" | "en-GB" | "auto";
}> = [
  { name: "Classic JARVIS", description: "Authoritative British neural cadence", pitch: 0.95, rate: 1.05, language: "en-US" },
  { name: "JARVIS Hindi (हिंदी)", description: "Polite, dignified Hindi & bilingual synthesis", pitch: 0.95, rate: 1.00, language: "hi-IN" },
  { name: "JARVIS Hinglish", description: "Bilingual English & Hindi responsive cadence", pitch: 0.95, rate: 1.05, language: "auto" },
  { name: "Tactical Commander", description: "Rapid, high-tempo mission cadence", pitch: 1.05, rate: 1.25, language: "en-US" },
  { name: "Deep Baritone", description: "Low resonant architectural synthesis", pitch: 0.75, rate: 0.95, language: "en-US" },
  { name: "High-Frequency AI", description: "Crisp, hyper-articulate synthesis", pitch: 1.20, rate: 1.20, language: "en-US" },
  { name: "Regal British", description: "Measured, stately dignified pace", pitch: 0.90, rate: 1.00, language: "en-GB" },
];

export const MIC_PROFILES: Array<{
  id: "studio_condenser" | "headset_boom" | "laptop_array" | "conference_omni" | "ultra_directional";
  name: string;
  description: string;
  hpFreq: number;
  lpFreq: number;
  formantBoost: number;
  gateBias: number;
}> = [
  { id: "laptop_array", name: "Laptop Built-in Array", description: "Optimized for room chatter & fan noise filtering", hpFreq: 120, lpFreq: 6800, formantBoost: 4.0, gateBias: 4 },
  { id: "headset_boom", name: "Headset / Boom Mic", description: "Close-mic proximity clarity with breath pop filter", hpFreq: 95, lpFreq: 7500, formantBoost: 3.5, gateBias: 0 },
  { id: "studio_condenser", name: "Studio Condenser (USB/XLR)", description: "Full-range broadcast fidelity with wide dynamic response", hpFreq: 75, lpFreq: 12000, formantBoost: 2.5, gateBias: -4 },
  { id: "conference_omni", name: "Conference / Room Omni", description: "Wide-area pickup with gentle de-reverb shaping", hpFreq: 110, lpFreq: 6500, formantBoost: 4.5, gateBias: 6 },
  { id: "ultra_directional", name: "Ultra-Directional Tactical", description: "Steep speech-band isolation for noisy locations", hpFreq: 140, lpFreq: 5500, formantBoost: 5.5, gateBias: 10 },
];

class VoiceManager {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private isPausedForSpeech = false;
  private continuousMode = true;
  private wasListeningBeforeSpeaking = true;
  private speechCallback: SpeechCallback | null = null;
  private stateCallback: StateCallback | null = null;
  private frequencyCallback: FrequencyCallback | null = null;
  private interceptionListener: InterceptionCallback | null = null;

  // Watchdogs, timers and GC protection
  private watchdogIntervalId: any = null;
  private restartTimeoutId: any = null;
  private resumeTimeoutId: any = null;
  private speechWatchdogTimer: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private speechStartTime = 0;
  private isStartingRecognition = false;

  // Audio Context, DSP Filter Nodes & Analyser for reactive HUD visualizer
  private micStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private formantBoostFilter: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private gateGainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  // Background Noise Elimination DSP Configuration
  private noiseConfig: NoiseEliminationConfig = {
    enabled: true,
    gateThreshold: 18,
    suppressionLevel: "aggressive",
    voiceIsolation: true,
    highPassFilter: true,
    vocalBoost: true,
    ambientNoiseFloor: 8,
    currentVoiceLevel: 0,
    gateActive: false,
    micProfile: "laptop_array",
    echoCancellation: true,
    feedbackShield: true,
  };

  // Live Audio Telemetry for Comms Deck
  private telemetry: {
    rmsLevel: number;
    peakDb: number;
    snrDb: number;
    isClipping: boolean;
    gateOpen: boolean;
    dominantHz: number;
    sampleRate: number;
    channelCount: number;
    inputLatencyMs: number;
  } = {
    rmsLevel: 0,
    peakDb: -60,
    snrDb: 24,
    isClipping: false,
    gateOpen: false,
    dominantHz: 0,
    sampleRate: 48000,
    channelCount: 1,
    inputLatencyMs: 12,
  };

  // Voice Interception / Barge-In Configuration
  private interceptionConfig: VoiceInterceptionConfig = {
    enabled: true,
    sensitivity: "high",
    bargeInActive: false,
    lastInterceptionTime: null,
    totalInterceptions: 0,
    keywordTriggers: ["jarvis", "stop", "wait", "hold on", "listen", "cancel", "no", "shut up", "pause", "hey"],
    autoResumeListening: true,
  };

  // Noise calibration state
  private isCalibratingNoise = false;
  private calibrationSamples: number[] = [];
  private consecutiveInterceptionFrames = 0;

  // Customizable Voice Parameters
  private voiceSettings: VoiceSettings = {
    pitch: 0.95,
    rate: 1.05,
    volume: 1.0,
    voiceURI: "",
    presetName: "Classic JARVIS",
    language: "auto",
  };
  private availableVoices: SpeechSynthesisVoice[] = [];
  private changeListeners: Array<() => void> = [];
  private isSpeechRecognitionSupported: boolean = true;
  private permissionDenied: boolean = false;

  constructor() {
    this.loadPersistedSettings();
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
    this.startAutonomousWatchdog();
  }

  public getIsPermissionDenied(): boolean {
    return this.permissionDenied;
  }

  public getIsSpeechRecognitionSupported(): boolean {
    return this.isSpeechRecognitionSupported;
  }

  public async requestMicrophoneAccess(): Promise<boolean> {
    try {
      this.permissionDenied = false;
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediate test stream if separate from DSP
        if (!this.micStream) {
          this.micStream = stream;
        }
      }
      this.initSpeechRecognition();
      await this.startListening(true);
      return true;
    } catch (e) {
      console.warn("User or browser rejected microphone permission:", e);
      this.permissionDenied = true;
      this.notifyListeners();
      return false;
    }
  }

  private loadPersistedSettings() {
    try {
      const stored = localStorage.getItem("jarvis_voice_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        this.voiceSettings = {
          pitch: typeof parsed.pitch === "number" ? Math.max(0.5, Math.min(1.6, parsed.pitch)) : 0.95,
          rate: typeof parsed.rate === "number" ? Math.max(0.6, Math.min(1.8, parsed.rate)) : 1.05,
          volume: typeof parsed.volume === "number" ? Math.max(0.0, Math.min(1.0, parsed.volume)) : 1.0,
          voiceURI: parsed.voiceURI || "",
          presetName: parsed.presetName || "Classic JARVIS",
          language: parsed.language || "auto",
        };

        if (parsed.noiseElimination) {
          this.noiseConfig = {
            ...this.noiseConfig,
            enabled: parsed.noiseElimination.enabled !== false,
            gateThreshold: typeof parsed.noiseElimination.gateThreshold === "number" ? parsed.noiseElimination.gateThreshold : 18,
            suppressionLevel: parsed.noiseElimination.suppressionLevel || "aggressive",
            voiceIsolation: parsed.noiseElimination.voiceIsolation !== false,
            highPassFilter: parsed.noiseElimination.highPassFilter !== false,
            vocalBoost: parsed.noiseElimination.vocalBoost !== false,
          };
        }

        if (parsed.voiceInterception) {
          this.interceptionConfig = {
            ...this.interceptionConfig,
            enabled: parsed.voiceInterception.enabled !== false,
            sensitivity: parsed.voiceInterception.sensitivity || "high",
          };
        }
      }
    } catch (e) {
      console.warn("Could not load persisted voice settings", e);
    }
  }

  private persistSettings() {
    try {
      const fullSettings = {
        ...this.voiceSettings,
        noiseElimination: {
          enabled: this.noiseConfig.enabled,
          gateThreshold: this.noiseConfig.gateThreshold,
          suppressionLevel: this.noiseConfig.suppressionLevel,
          voiceIsolation: this.noiseConfig.voiceIsolation,
          highPassFilter: this.noiseConfig.highPassFilter,
          vocalBoost: this.noiseConfig.vocalBoost,
        },
        voiceInterception: {
          enabled: this.interceptionConfig.enabled,
          sensitivity: this.interceptionConfig.sensitivity,
        },
      };
      localStorage.setItem("jarvis_voice_settings", JSON.stringify(fullSettings));
    } catch (e) {
      console.warn("Could not persist voice settings", e);
    }
  }

  public setVolume(vol: number) {
    this.voiceSettings.volume = Math.max(0, Math.min(1, vol));
    this.persistSettings();
    this.notifyListeners();
  }

  public getVolume(): number {
    return this.voiceSettings.volume !== undefined ? this.voiceSettings.volume : 1.0;
  }

  private initSpeechSynthesis() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      this.availableVoices = voices;
      this.notifyListeners();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== "undefined" && "speechSynthesis" in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  public getAudioChannelTelemetry() {
    return { ...this.telemetry };
  }

  public getMicProfiles() {
    return MIC_PROFILES;
  }

  public setMicProfile(profileId: "studio_condenser" | "headset_boom" | "laptop_array" | "conference_omni" | "ultra_directional") {
    this.noiseConfig.micProfile = profileId;
    const matched = MIC_PROFILES.find((p) => p.id === profileId);
    if (matched) {
      this.noiseConfig.gateThreshold = Math.max(10, Math.min(80, this.noiseConfig.gateThreshold + matched.gateBias));
    }
    this.applyDspFilters();
    this.persistSettings();
    this.notifyListeners();
  }

  public getSettings(): VoiceSettings {
    return {
      ...this.voiceSettings,
      noiseElimination: {
        enabled: this.noiseConfig.enabled,
        gateThreshold: this.noiseConfig.gateThreshold,
        suppressionLevel: this.noiseConfig.suppressionLevel,
        voiceIsolation: this.noiseConfig.voiceIsolation,
        highPassFilter: this.noiseConfig.highPassFilter,
        vocalBoost: this.noiseConfig.vocalBoost,
        micProfile: this.noiseConfig.micProfile,
        echoCancellation: this.noiseConfig.echoCancellation,
        feedbackShield: this.noiseConfig.feedbackShield,
      },
      voiceInterception: {
        enabled: this.interceptionConfig.enabled,
        sensitivity: this.interceptionConfig.sensitivity,
        keywordTriggers: this.interceptionConfig.keywordTriggers,
      },
    };
  }

  public getNoiseConfig(): NoiseEliminationConfig {
    return { ...this.noiseConfig };
  }

  public getInterceptionConfig(): VoiceInterceptionConfig {
    return { ...this.interceptionConfig };
  }

  public setNoiseConfig(updates: Partial<NoiseEliminationConfig>) {
    this.noiseConfig = {
      ...this.noiseConfig,
      ...updates,
    };
    this.applyDspFilters();
    this.persistSettings();
    this.notifyListeners();
  }

  public setInterceptionConfig(updates: Partial<VoiceInterceptionConfig>) {
    this.interceptionConfig = {
      ...this.interceptionConfig,
      ...updates,
    };
    this.persistSettings();
    this.notifyListeners();
  }

  public setSettings(newSettings: Partial<VoiceSettings>) {
    this.voiceSettings = {
      ...this.voiceSettings,
      ...newSettings,
    };
    if (newSettings.noiseElimination) {
      this.noiseConfig = {
        ...this.noiseConfig,
        ...newSettings.noiseElimination,
      };
      this.applyDspFilters();
    }
    if (newSettings.voiceInterception) {
      this.interceptionConfig = {
        ...this.interceptionConfig,
        ...newSettings.voiceInterception,
      };
    }
    if (this.recognition && newSettings.language) {
      this.recognition.lang = newSettings.language === "hi-IN" ? "hi-IN" : "en-US";
    }
    this.persistSettings();
    this.notifyListeners();
  }

  public applyPreset(presetName: string) {
    const found = VOICE_PRESETS.find((p) => p.name === presetName);
    if (found) {
      this.voiceSettings = {
        ...this.voiceSettings,
        pitch: found.pitch,
        rate: found.rate,
        presetName: found.name,
        language: found.language || this.voiceSettings.language,
      };
      if (this.recognition && found.language) {
        this.recognition.lang = found.language === "hi-IN" ? "hi-IN" : "en-US";
      }
      this.persistSettings();
      this.notifyListeners();
    }
  }

  public subscribe(listener: () => void) {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  public onInterception(listener: InterceptionCallback) {
    this.interceptionListener = listener;
  }

  private notifyListeners() {
    this.changeListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
  }

  /**
   * Room Noise Floor Auto-Calibration
   * Measures ambient room noise over 1.5 seconds and adjusts noise gate threshold automatically
   */
  public async calibrateNoiseFloor(): Promise<number> {
    this.isCalibratingNoise = true;
    this.calibrationSamples = [];
    SoundFX.playComputeChime();

    await this.initMicAnalyser();

    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (Date.now() - startTime >= 1500) {
          clearInterval(interval);
          this.isCalibratingNoise = false;

          let avgFloor = 8;
          if (this.calibrationSamples.length > 0) {
            // Sort samples and take 85th percentile of ambient silence
            this.calibrationSamples.sort((a, b) => a - b);
            const p85Idx = Math.floor(this.calibrationSamples.length * 0.85);
            avgFloor = Math.max(4, Math.min(80, this.calibrationSamples[p85Idx] || 8));
          }

          const recommendedGate = Math.min(85, Math.max(12, avgFloor + 8));
          this.noiseConfig.ambientNoiseFloor = avgFloor;
          this.noiseConfig.gateThreshold = recommendedGate;

          SoundFX.playNoiseGateCalibrated();
          this.persistSettings();
          this.notifyListeners();
          resolve(recommendedGate);
        }
      }, 50);
    });
  }

  /**
   * Voice Interception / Barge-In Trigger:
   * Instantly stops J.A.R.V.I.S. speech, plays interception chime, and immediately reactivates mic
   */
  public interceptSpeech(reason: string = "User voice barge-in detected") {
    if (!this.isSpeaking) return;

    console.log(`[JARVIS INTERCEPTION] Barge-in executed: ${reason}`);

    // 1. Immediately cancel speech synthesis
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    // 2. Play acoustic interception chime
    SoundFX.playInterceptionChime();

    // 3. Update interception metrics
    this.interceptionConfig.bargeInActive = true;
    this.interceptionConfig.lastInterceptionTime = new Date().toLocaleTimeString();
    this.interceptionConfig.totalInterceptions += 1;

    // 4. Release speaking lock
    if (this.speechWatchdogTimer) {
      clearTimeout(this.speechWatchdogTimer);
      this.speechWatchdogTimer = null;
    }
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPausedForSpeech = false;

    // 5. Fire notification to UI
    this.notifyState();
    this.notifyListeners();
    if (this.interceptionListener) {
      this.interceptionListener({
        timestamp: new Date().toLocaleTimeString(),
        reason,
      });
    }

    // 6. Seamlessly arm listening engine immediately
    if (this.resumeTimeoutId) clearTimeout(this.resumeTimeoutId);
    this.startListening();

    setTimeout(() => {
      this.interceptionConfig.bargeInActive = false;
      this.notifyListeners();
    }, 2000);
  }

  private initSpeechRecognition() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser environment.");
      this.isSpeechRecognitionSupported = false;
      this.notifyListeners();
      return;
    }

    this.isSpeechRecognitionSupported = true;

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
        this.recognition = null;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = this.voiceSettings.language === "hi-IN" ? "hi-IN" : "en-US";

      this.recognition.onstart = () => {
        this.isListening = true;
        this.isStartingRecognition = false;
        this.permissionDenied = false;
        this.notifyState();
        this.notifyListeners();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const candidateText = (finalTranscript || interimTranscript).toLowerCase().trim();

        // -------------------------------------------------------------
        // VOICE INTERCEPTION KEYWORD / BARGE-IN DETECTION
        // -------------------------------------------------------------
        if (this.isSpeaking && this.interceptionConfig.enabled) {
          const isInterruptionKeyword =
            candidateText.includes("jarvis") ||
            candidateText.includes("stop") ||
            candidateText.includes("wait") ||
            candidateText.includes("hold on") ||
            candidateText.includes("listen") ||
            candidateText.includes("cancel") ||
            candidateText.includes("no") ||
            candidateText.includes("hey") ||
            candidateText.includes("shut up") ||
            candidateText.includes("pause") ||
            candidateText.length > 2;

          if (isInterruptionKeyword) {
            this.interceptSpeech(`Vocal barge-in on phrase: "${candidateText}"`);
            if (finalTranscript.trim() && this.speechCallback) {
              this.speechCallback(finalTranscript.trim(), true);
            }
            return;
          }
        }

        // If JARVIS is currently speaking or paused and interception didn't fire, ignore
        if (this.isSpeaking || this.isPausedForSpeech) {
          return;
        }

        // Forward finalized or interim transcripts reliably
        if (finalTranscript.trim()) {
          if (this.speechCallback) {
            this.speechCallback(finalTranscript.trim(), true);
          }
        } else if (interimTranscript.trim()) {
          if (this.speechCallback) {
            this.speechCallback(interimTranscript.trim(), false);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        const err = event.error;
        this.isStartingRecognition = false;

        if (err === "not-allowed" || err === "service-not-allowed") {
          console.warn("Speech recognition access denied by browser/user permissions:", err);
          this.permissionDenied = true;
          this.isListening = false;
          this.notifyState();
          this.notifyListeners();
        } else if (err === "audio-capture") {
          console.warn("Microphone hardware error or unavailable:", err);
          this.isListening = false;
          this.notifyState();
          this.notifyListeners();
        } else {
          // "no-speech", "network", "aborted" are normal transient occurrences during silence
          if (err !== "no-speech" && err !== "aborted") {
            console.debug("Transient speech recognition notice:", err);
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.isStartingRecognition = false;

        // Do not auto-restart if we are paused for JARVIS speaking/answering
        if (this.isSpeaking || this.isPausedForSpeech) {
          this.notifyState();
          return;
        }

        if (this.continuousMode && !this.permissionDenied) {
          // Autonomous graceful restart with debounce
          if (this.restartTimeoutId) clearTimeout(this.restartTimeoutId);
          this.restartTimeoutId = setTimeout(() => {
            if (this.continuousMode && !this.isSpeaking && !this.isPausedForSpeech && !this.permissionDenied) {
              this.safeStartRecognition();
            }
          }, 120);
        } else {
          this.notifyState();
          this.notifyListeners();
        }
      };
    } catch (e) {
      console.error("Failed to initialize Speech Recognition:", e);
    }
  }

  /**
   * Safe recognition starter with retry capabilities to prevent InvalidStateError crashes
   */
  private safeStartRecognition() {
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    if (!this.recognition) return;
    if (this.isSpeaking || this.isPausedForSpeech || !this.continuousMode) return;

    try {
      this.isStartingRecognition = true;
      this.recognition.start();
      this.isListening = true;
      this.notifyState();
    } catch (err: any) {
      this.isStartingRecognition = false;
      if (err?.name === "InvalidStateError" || String(err).includes("already started")) {
        this.isListening = true;
        this.notifyState();
      } else {
        // Re-init recognition instance on failure and retry
        this.initSpeechRecognition();
        if (this.continuousMode && !this.isSpeaking && !this.isPausedForSpeech && !this.permissionDenied) {
          setTimeout(() => {
            if (this.continuousMode && !this.isSpeaking && !this.isPausedForSpeech && !this.isListening) {
              try {
                this.recognition?.start();
                this.isListening = true;
                this.notifyState();
              } catch (e) {}
            }
          }, 300);
        }
      }
    }
  }

  /**
   * Autonomous liveness watchdog
   */
  private startAutonomousWatchdog() {
    if (typeof window === "undefined") return;
    if (this.watchdogIntervalId) clearInterval(this.watchdogIntervalId);

    this.watchdogIntervalId = setInterval(() => {
      // 1. Stuck Speech Synthesis Recovery
      if (this.isSpeaking) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          if (window.speechSynthesis.paused) {
            try {
              window.speechSynthesis.resume();
            } catch (e) {}
          }
          if (!window.speechSynthesis.speaking && Date.now() - this.speechStartTime > 3000) {
            console.debug("Watchdog recovered stuck speech synthesis state.");
            this.forceEndSpeechAndResumeMic();
          }
        }
        return;
      }

      // 2. Autonomous Continuous Listening Auto-Re-Arm
      if (this.continuousMode && !this.isPausedForSpeech && !this.isSpeaking && !this.isListening && !this.isStartingRecognition) {
        this.safeStartRecognition();
      }
    }, 1200);
  }

  private forceEndSpeechAndResumeMic() {
    if (this.speechWatchdogTimer) {
      clearTimeout(this.speechWatchdogTimer);
      this.speechWatchdogTimer = null;
    }
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.isPausedForSpeech = false;
    this.notifyState();

    if (this.wasListeningBeforeSpeaking || this.continuousMode) {
      if (this.resumeTimeoutId) clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = setTimeout(() => {
        this.startListening();
      }, 150);
    }
  }

  public setCallbacks(
    onSpeech: SpeechCallback,
    onState: StateCallback,
    onFrequency?: FrequencyCallback
  ) {
    this.speechCallback = onSpeech;
    this.stateCallback = onState;
    if (onFrequency) this.frequencyCallback = onFrequency;
  }

  /**
   * Turns the microphone ON and starts listening for speech
   */
  public async startListening(playChime: boolean = false) {
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = null;
    }

    this.isPausedForSpeech = false;
    this.continuousMode = true;
    this.wasListeningBeforeSpeaking = true;

    if (playChime) {
      SoundFX.playMicArmed();
    }

    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    if (!this.recognition) return false;

    try {
      await this.initMicAnalyser();
      this.safeStartRecognition();
      return true;
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      return false;
    }
  }

  /**
   * User interaction unlocker: unlocks AudioContext & SpeechSynthesis on first user click/touch/key
   */
  public async unlockAudioAndListen() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      try {
        await this.audioCtx.resume();
      } catch (e) {}
    }
    if (!this.isListening && this.continuousMode && !this.isSpeaking) {
      this.startListening();
    }
  }

  /**
   * Stops the microphone and disables listening
   */
  public stopListening(playChime: boolean = false) {
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = null;
    }
    if (this.restartTimeoutId) {
      clearTimeout(this.restartTimeoutId);
      this.restartTimeoutId = null;
    }

    if (playChime) {
      SoundFX.playMicMuted();
    }

    this.continuousMode = false;
    this.wasListeningBeforeSpeaking = false;
    this.isPausedForSpeech = false;
    this.isListening = false;
    this.isStartingRecognition = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.stopMicAnalyser();
    this.notifyState();
  }

  /**
   * Pauses the microphone immediately while JARVIS is thinking or answering
   */
  public pauseListeningForThinking() {
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = null;
    }
    if (this.restartTimeoutId) {
      clearTimeout(this.restartTimeoutId);
      this.restartTimeoutId = null;
    }

    this.isPausedForSpeech = true;
    this.isListening = false;
    this.isStartingRecognition = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.notifyState();
  }

  public toggleListening(): boolean {
    if (this.isListening || this.continuousMode) {
      this.stopListening(true);
      return false;
    } else {
      this.startListening(true);
      return true;
    }
  }

  public getContinuousMode(): boolean {
    return this.continuousMode;
  }

  /**
   * Initializes microphone stream with strict hardware noise suppression constraints
   * and builds the Web Audio DSP noise elimination filtering graph
   */
  private async initMicAnalyser() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      if (!this.micStream) {
        // High-fidelity microphone constraints with browser-level echo cancellation and noise suppression
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });

        // Build DSP Chain
        this.sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);

        // 1. High-Pass Filter (Strip AC hum, desk thumps, low rumble < 90 Hz)
        this.highPassFilter = this.audioCtx.createBiquadFilter();
        this.highPassFilter.type = "highpass";
        this.highPassFilter.frequency.setValueAtTime(90, this.audioCtx.currentTime);
        this.highPassFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

        // 2. Low-Pass Filter (Strip high hiss & fan whine > 7200 Hz)
        this.lowPassFilter = this.audioCtx.createBiquadFilter();
        this.lowPassFilter.type = "lowpass";
        this.lowPassFilter.frequency.setValueAtTime(7200, this.audioCtx.currentTime);
        this.lowPassFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

        // 3. Formant Vocal Peaking Filter (Boost human speech intelligibility 1.8 kHz - 3.2 kHz)
        this.formantBoostFilter = this.audioCtx.createBiquadFilter();
        this.formantBoostFilter.type = "peaking";
        this.formantBoostFilter.frequency.setValueAtTime(2200, this.audioCtx.currentTime);
        this.formantBoostFilter.Q.setValueAtTime(1.1, this.audioCtx.currentTime);
        this.formantBoostFilter.gain.setValueAtTime(3.5, this.audioCtx.currentTime);

        // 4. Dynamics Compressor (Level peaks and compress background floor)
        this.compressorNode = this.audioCtx.createDynamicsCompressor();
        this.compressorNode.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
        this.compressorNode.knee.setValueAtTime(12, this.audioCtx.currentTime);
        this.compressorNode.ratio.setValueAtTime(4, this.audioCtx.currentTime);
        this.compressorNode.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressorNode.release.setValueAtTime(0.15, this.audioCtx.currentTime);

        // 5. Noise Gate Attenuator Gain
        this.gateGainNode = this.audioCtx.createGain();
        this.gateGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

        // 6. Analyser
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.65;

        // Connect graph
        this.sourceNode.connect(this.highPassFilter);
        this.highPassFilter.connect(this.lowPassFilter);
        this.lowPassFilter.connect(this.formantBoostFilter);
        this.formantBoostFilter.connect(this.compressorNode);
        this.compressorNode.connect(this.gateGainNode);
        this.gateGainNode.connect(this.analyser);

        this.applyDspFilters();
      }

      this.startVisualizerLoop();
    } catch (e) {
      console.warn("Microphone stream access not granted for visualizer:", e);
    }
  }

  private applyDspFilters() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const currentProfile = MIC_PROFILES.find((p) => p.id === this.noiseConfig.micProfile) || MIC_PROFILES[0];

    if (this.highPassFilter) {
      const hpFreq = this.noiseConfig.highPassFilter && this.noiseConfig.enabled
        ? (this.noiseConfig.suppressionLevel === "ultra_tactical" ? currentProfile.hpFreq * 1.25 : currentProfile.hpFreq)
        : 10;
      this.highPassFilter.frequency.setTargetAtTime(hpFreq, now, 0.05);
    }

    if (this.lowPassFilter) {
      const lpFreq = this.noiseConfig.enabled
        ? (this.noiseConfig.suppressionLevel === "ultra_tactical" ? currentProfile.lpFreq * 0.85 : currentProfile.lpFreq)
        : 20000;
      this.lowPassFilter.frequency.setTargetAtTime(lpFreq, now, 0.05);
    }

    if (this.formantBoostFilter) {
      const gainVal = this.noiseConfig.vocalBoost && this.noiseConfig.enabled ? currentProfile.formantBoost : 0.0;
      this.formantBoostFilter.gain.setTargetAtTime(gainVal, now, 0.05);
    }
  }

  private stopMicAnalyser() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.sourceNode = null;
    this.highPassFilter = null;
    this.lowPassFilter = null;
    this.formantBoostFilter = null;
    this.compressorNode = null;
    this.gateGainNode = null;
    this.analyser = null;
  }

  private startVisualizerLoop() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const timeDomainArray = new Uint8Array(this.analyser.fftSize);

    const tick = () => {
      if (this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        this.analyser.getByteTimeDomainData(timeDomainArray);

        // 1. Calculate live RMS vocal energy (0-100) and peak/clipping
        let sumSquares = 0;
        let peakSample = 0;
        for (let i = 0; i < timeDomainArray.length; i++) {
          const norm = (timeDomainArray[i] - 128) / 128;
          sumSquares += norm * norm;
          const absVal = Math.abs(norm);
          if (absVal > peakSample) peakSample = absVal;
        }
        const rms = Math.sqrt(sumSquares / timeDomainArray.length);
        const liveLevel = Math.min(100, Math.round(rms * 220));
        this.noiseConfig.currentVoiceLevel = liveLevel;

        // Dominant frequency calculation
        let maxVal = 0;
        let maxIdx = 0;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            maxIdx = i;
          }
        }
        const nyquist = (this.audioCtx?.sampleRate || 48000) / 2;
        const domHz = maxVal > 15 ? Math.round((maxIdx / dataArray.length) * nyquist) : 0;

        // Update telemetry
        const peakDb = peakSample > 0.0001 ? Math.round(20 * Math.log10(peakSample)) : -60;
        const snrDb = Math.max(0, Math.round(liveLevel - (this.noiseConfig.ambientNoiseFloor || 8)));
        this.telemetry = {
          rmsLevel: liveLevel,
          peakDb,
          snrDb,
          isClipping: peakSample >= 0.98,
          gateOpen: this.noiseConfig.gateActive,
          dominantHz: domHz,
          sampleRate: this.audioCtx?.sampleRate || 48000,
          channelCount: 1,
          inputLatencyMs: Math.round((this.audioCtx?.baseLatency || 0.01) * 1000 + 4),
        };

        // 2. Calibration sampling
        if (this.isCalibratingNoise) {
          this.calibrationSamples.push(liveLevel);
        }

        // 3. Dynamic Spectral Noise Gate Evaluation
        const gateThreshold = this.noiseConfig.enabled ? this.noiseConfig.gateThreshold : 0;
        const isAboveGate = liveLevel >= gateThreshold;
        this.noiseConfig.gateActive = isAboveGate;

        if (this.gateGainNode && this.audioCtx && this.noiseConfig.enabled) {
          const targetGain = isAboveGate ? 1.0 : (this.noiseConfig.voiceIsolation ? 0.08 : 0.4);
          this.gateGainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.03);
        }

        // 4. Live Voice Interception / Barge-In Detection during Speech
        if (this.isSpeaking && this.interceptionConfig.enabled) {
          const sensitivityMargin =
            this.interceptionConfig.sensitivity === "instant"
              ? 5
              : this.interceptionConfig.sensitivity === "high"
              ? 10
              : 18;

          const requiredInterceptionLevel = Math.max(16, gateThreshold + sensitivityMargin);

          if (liveLevel >= requiredInterceptionLevel) {
            this.consecutiveInterceptionFrames++;
            const requiredFrames = this.interceptionConfig.sensitivity === "instant" ? 3 : 6;
            if (this.consecutiveInterceptionFrames >= requiredFrames) {
              this.consecutiveInterceptionFrames = 0;
              this.interceptSpeech(`Vocal energy barge-in (${liveLevel}% > ${requiredInterceptionLevel}%)`);
            }
          } else {
            this.consecutiveInterceptionFrames = Math.max(0, this.consecutiveInterceptionFrames - 1);
          }
        } else {
          this.consecutiveInterceptionFrames = 0;
        }

        // 5. Forward frequency spectrum to HUD visualizer
        if (this.frequencyCallback && (this.isListening || this.isSpeaking)) {
          this.frequencyCallback(dataArray);
        }
      }
      this.animFrameId = requestAnimationFrame(tick);
    };

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.animFrameId = requestAnimationFrame(tick);
  }

  /**
   * Autonomous voice synthesis:
   * 1. Turns mic OFF before speaking
   * 2. Speaks the synthesized response
   * 3. Once talk completes, automatically turns the mic back ON
   */
  public speak(text: string, onEnd?: () => void) {
    // 1. Immediately turn microphone OFF while answering / speaking
    this.pauseListeningForThinking();

    if (!("speechSynthesis" in window)) {
      this.isSpeaking = false;
      this.notifyState();
      if (onEnd) onEnd();
      if (this.wasListeningBeforeSpeaking) {
        this.startListening();
      }
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const cleanSpokenText = text
      .replace(/https?:\/\/[^\s]+/g, "link")
      .replace(/[*_#`~[\]]/g, "")
      .replace(/\n+/g, ". ")
      .slice(0, 1200);

    const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
    utterance.rate = Math.max(0.5, Math.min(2.0, this.voiceSettings.rate));
    utterance.pitch = Math.max(0.5, Math.min(1.6, this.voiceSettings.pitch));
    utterance.volume = Math.max(0.0, Math.min(1.0, this.voiceSettings.volume ?? 1.0));

    const isHindiText = /[\u0900-\u097F]/.test(cleanSpokenText) || this.voiceSettings.language === "hi-IN";
    if (isHindiText) {
      utterance.lang = "hi-IN";
    }

    const voices = this.getAvailableVoices();
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (this.voiceSettings.voiceURI) {
      selectedVoice = voices.find(
        (v) => v.voiceURI === this.voiceSettings.voiceURI || v.name === this.voiceSettings.voiceURI
      ) || null;
    }

    if (!selectedVoice) {
      if (isHindiText) {
        selectedVoice =
          voices.find(
            (v) =>
              v.lang.startsWith("hi") ||
              v.lang.includes("hi-IN") ||
              v.name.toLowerCase().includes("hindi") ||
              v.name.toLowerCase().includes("हिन्दी") ||
              v.name.includes("Lekha") ||
              v.name.includes("Hemant") ||
              v.name.includes("Kalpana") ||
              v.name.includes("Swara") ||
              v.name.includes("Madhav") ||
              v.name.includes("Neerja")
          ) ||
          voices.find((v) => v.lang.startsWith("en-IN")) ||
          null;
      }

      if (!selectedVoice) {
        selectedVoice =
          voices.find(
            (v) =>
              (v.lang.includes("en-GB") && v.name.includes("Daniel")) ||
              v.name.includes("Google UK English Male") ||
              v.name.includes("George") ||
              (v.lang.includes("en") && v.name.includes("Natural")) ||
              (v.lang.includes("en-GB") && !v.name.includes("Female"))
          ) ||
          voices.find((v) => v.lang.startsWith("en-GB")) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          null;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    this.currentUtterance = utterance;
    this.speechStartTime = Date.now();
    this.isSpeaking = true;
    this.notifyState();

    let completionFired = false;
    const handleSpeechCompletion = () => {
      if (completionFired) return;
      completionFired = true;

      if (this.speechWatchdogTimer) {
        clearTimeout(this.speechWatchdogTimer);
        this.speechWatchdogTimer = null;
      }
      this.currentUtterance = null;
      this.isSpeaking = false;
      this.isPausedForSpeech = false;
      this.notifyState();

      if (onEnd) {
        try {
          onEnd();
        } catch (e) {}
      }

      if (this.wasListeningBeforeSpeaking || this.continuousMode) {
        if (this.resumeTimeoutId) clearTimeout(this.resumeTimeoutId);
        this.resumeTimeoutId = setTimeout(() => {
          this.startListening();
          SoundFX.playWakePing();
        }, 200);
      }
    };

    utterance.onend = () => {
      handleSpeechCompletion();
    };

    utterance.onerror = () => {
      handleSpeechCompletion();
    };

    const estimatedDurationMs = Math.max(2500, Math.min(30000, (cleanSpokenText.length * 85) / Math.max(0.6, this.voiceSettings.rate) + 2000));
    if (this.speechWatchdogTimer) clearTimeout(this.speechWatchdogTimer);
    this.speechWatchdogTimer = setTimeout(() => {
      if (this.isSpeaking && !completionFired) {
        console.debug("Speech synthesis watchdog triggered safety completion.");
        handleSpeechCompletion();
      }
    }, estimatedDurationMs);

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("speechSynthesis.speak failed:", e);
      handleSpeechCompletion();
    }
  }

  public stopSpeaking() {
    if (this.speechWatchdogTimer) {
      clearTimeout(this.speechWatchdogTimer);
      this.speechWatchdogTimer = null;
    }
    this.currentUtterance = null;
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.isPausedForSpeech = false;
    this.notifyState();

    if (this.wasListeningBeforeSpeaking || this.continuousMode) {
      if (this.resumeTimeoutId) clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = setTimeout(() => {
        this.startListening();
      }, 150);
    }
  }

  private notifyState() {
    if (this.stateCallback) {
      this.stateCallback(this.isListening, this.isSpeaking);
    }
  }

  public testVoice(sampleText?: string, onEnd?: () => void) {
    const textToSpeak =
      sampleText ||
      `Voice parameters calibrated, sir. Pitch is set to ${Math.round(
        this.voiceSettings.pitch * 100
      )} percent, and playback speed is ${Math.round(
        this.voiceSettings.rate * 100
      )} percent. All neural systems are fully operational.`;
    this.speak(textToSpeak, onEnd);
  }

  public getIsListening() {
    return this.isListening;
  }

  public getIsSpeaking() {
    return this.isSpeaking;
  }
}

export const voiceManager = new VoiceManager();
