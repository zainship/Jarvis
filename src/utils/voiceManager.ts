/**
 * Voice Recognition, Wake Word Detection & Speech Synthesis Engine for JARVIS
 * 
 * Manages two-way audio:
 * - Mic automatically turns OFF when user command is received or while JARVIS is responding/speaking
 * - Mic automatically turns back ON as soon as JARVIS completes speaking
 * - Fully customizable pitch, speed/rate, voice selection, and presets
 */
import { SoundFX } from "./soundEffects";
import { VoiceSettings } from "../types";

type SpeechCallback = (text: string, isFinal: boolean) => void;
type StateCallback = (isListening: boolean, isSpeaking: boolean) => void;
type FrequencyCallback = (frequencyData: Uint8Array) => void;

export const VOICE_PRESETS: Array<{
  name: string;
  description: string;
  pitch: number;
  rate: number;
  language?: "en-US" | "hi-IN" | "auto";
}> = [
  { name: "Classic JARVIS", description: "Authoritative British neural cadence", pitch: 0.95, rate: 1.05, language: "en-US" },
  { name: "JARVIS Hindi (हिंदी)", description: "Polite, dignified Hindi & bilingual synthesis", pitch: 0.95, rate: 1.00, language: "hi-IN" },
  { name: "JARVIS Hinglish", description: "Bilingual English & Hindi responsive cadence", pitch: 0.95, rate: 1.05, language: "auto" },
  { name: "Tactical Commander", description: "Rapid, high-tempo mission cadence", pitch: 1.05, rate: 1.25, language: "en-US" },
  { name: "Deep Baritone", description: "Low resonant architectural synthesis", pitch: 0.75, rate: 0.95, language: "en-US" },
  { name: "High-Frequency AI", description: "Crisp, hyper-articulate synthesis", pitch: 1.20, rate: 1.20, language: "en-US" },
  { name: "Regal British", description: "Measured, stately dignified pace", pitch: 0.90, rate: 1.00, language: "en-US" },
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

  // Audio Context & Analyser for reactive HUD visualizer
  private micStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private resumeTimeoutId: any = null;

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

  constructor() {
    this.loadPersistedSettings();
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
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
      }
    } catch (e) {
      console.warn("Could not load persisted voice settings", e);
    }
  }

  private persistSettings() {
    try {
      localStorage.setItem("jarvis_voice_settings", JSON.stringify(this.voiceSettings));
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

  public getSettings(): VoiceSettings {
    return { ...this.voiceSettings };
  }

  public setSettings(newSettings: Partial<VoiceSettings>) {
    this.voiceSettings = {
      ...this.voiceSettings,
      ...newSettings,
    };
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

  private notifyListeners() {
    this.changeListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {}
    });
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser environment.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.voiceSettings.language === "hi-IN" ? "hi-IN" : "en-US";

      this.recognition.onstart = () => {
        this.isListening = true;
        this.notifyState();
      };

      this.recognition.onresult = (event: any) => {
        // If JARVIS is currently speaking or processing, ignore any microphone input
        if (this.isSpeaking || this.isPausedForSpeech) {
          return;
        }

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
        if (event.error !== "no-speech") {
          console.warn("Speech recognition notice:", event.error);
        }
      };

      this.recognition.onend = () => {
        // Do not auto-restart if we are paused for JARVIS speaking/answering
        if (this.isSpeaking || this.isPausedForSpeech) {
          this.isListening = false;
          this.notifyState();
          return;
        }

        if (this.continuousMode && this.isListening) {
          // Restart gracefully if continuous mode is active
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            this.notifyState();
          }
        } else {
          this.isListening = false;
          this.notifyState();
        }
      };
    } catch (e) {
      console.error("Failed to initialize Speech Recognition:", e);
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
  public async startListening() {
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = null;
    }

    this.isPausedForSpeech = false;
    this.continuousMode = true;
    this.wasListeningBeforeSpeaking = true;

    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    if (!this.recognition) return false;

    try {
      // Setup microphone analyzer for reactive visualizer
      await this.initMicAnalyser();

      try {
        this.recognition.start();
      } catch (startErr) {
        // Might already be running
      }

      this.isListening = true;
      this.notifyState();
      return true;
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      return false;
    }
  }

  /**
   * Stops the microphone and disables listening
   */
  public stopListening() {
    if (this.resumeTimeoutId) {
      clearTimeout(this.resumeTimeoutId);
      this.resumeTimeoutId = null;
    }

    this.continuousMode = false;
    this.wasListeningBeforeSpeaking = false;
    this.isPausedForSpeech = false;
    this.isListening = false;

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

    this.isPausedForSpeech = true;
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.notifyState();
  }

  public toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      this.startListening();
      return true;
    }
  }

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
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = this.audioCtx.createMediaStreamSource(this.micStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);
      }

      this.startVisualizerLoop();
    } catch (e) {
      console.warn("Microphone stream access not granted for visualizer:", e);
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
  }

  private startVisualizerLoop() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const tick = () => {
      if (this.analyser && (this.isListening || this.isSpeaking)) {
        this.analyser.getByteFrequencyData(dataArray);
        if (this.frequencyCallback) {
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
      // Resume listening
      if (this.wasListeningBeforeSpeaking) {
        this.startListening();
      }
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Clean markdown syntax or URLs for smooth spoken audio
    const cleanSpokenText = text
      .replace(/https?:\/\/[^\s]+/g, "link")
      .replace(/[*_#`~[\]]/g, "")
      .replace(/\n+/g, ". ")
      .slice(0, 1200);

    const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
    utterance.rate = Math.max(0.5, Math.min(2.0, this.voiceSettings.rate));
    utterance.pitch = Math.max(0.5, Math.min(1.6, this.voiceSettings.pitch));
    utterance.volume = Math.max(0.0, Math.min(1.0, this.voiceSettings.volume ?? 1.0));

    // Detect if spoken text is Hindi or user selected Hindi language
    const isHindiText = /[\u0900-\u097F]/.test(cleanSpokenText) || this.voiceSettings.language === "hi-IN";
    if (isHindiText) {
      utterance.lang = "hi-IN";
    }

    // Select chosen voice or fallback to sophisticated British / natural English voice or Hindi voice
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

    this.isSpeaking = true;
    this.notifyState();

    const handleSpeechCompletion = () => {
      this.isSpeaking = false;
      this.isPausedForSpeech = false;
      this.notifyState();

      if (onEnd) onEnd();

      // 2. Once JARVIS completes the talk, automatically turn the mic ON!
      if (this.wasListeningBeforeSpeaking || this.continuousMode) {
        // 250ms buffer ensures speaker audio has finished and won't trigger the microphone
        this.resumeTimeoutId = setTimeout(() => {
          this.startListening();
          SoundFX.playWakePing();
        }, 250);
      }
    };

    utterance.onend = () => {
      handleSpeechCompletion();
    };

    utterance.onerror = () => {
      handleSpeechCompletion();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isPausedForSpeech = false;
    this.notifyState();

    // Turn mic back on if continuous listening was active
    if (this.wasListeningBeforeSpeaking || this.continuousMode) {
      this.resumeTimeoutId = setTimeout(() => {
        this.startListening();
      }, 200);
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
