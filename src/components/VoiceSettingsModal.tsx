import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Play,
  Square,
  Check,
  X,
  Radio,
  Cpu,
  Mic,
  Activity,
  Globe,
  Languages,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Gauge,
  Ear,
  SlidersHorizontal,
  Wifi,
  Waves,
  AudioLines,
  Headphones,
  Signal,
  Filter,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import { voiceManager, VOICE_PRESETS, MIC_PROFILES } from "../utils/voiceManager";
import { VoiceSettings, NoiseEliminationConfig, VoiceInterceptionConfig, AudioChannelTelemetry } from "../types";
import { SoundFX } from "../utils/soundEffects";
import { auth, syncVoiceSettingsToFirestore } from "../lib/firebase";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"mic" | "noise" | "interception" | "voice" | "telemetry">("mic");
  const [settings, setSettings] = useState<VoiceSettings>(() => voiceManager.getSettings());
  const [noiseConfig, setNoiseConfig] = useState<NoiseEliminationConfig>(() => voiceManager.getNoiseConfig());
  const [interceptionConfig, setInterceptionConfig] = useState<VoiceInterceptionConfig>(() => voiceManager.getInterceptionConfig());
  const [telemetry, setTelemetry] = useState<AudioChannelTelemetry>(() => voiceManager.getAudioChannelTelemetry());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState<number | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [testPhrase, setTestPhrase] = useState("Voice calibration confirmed, sir. Audio frequency, noise gate filtering, and voice interception are operational.");

  useEffect(() => {
    if (isOpen) {
      const current = voiceManager.getSettings();
      setSettings(current);
      setNoiseConfig(voiceManager.getNoiseConfig());
      setInterceptionConfig(voiceManager.getInterceptionConfig());
      setAvailableVoices(voiceManager.getAvailableVoices());
      setTelemetry(voiceManager.getAudioChannelTelemetry());
      if (current.language === "hi-IN") {
        setTestPhrase("नमस्ते सर, जार्विस आपके आदेश के लिए पूरी तरह तैयार है। बैकग्राउंड नॉइज़ फ़िल्टरिंग और वॉइस इंटरसेप्शन एक्टिव है।");
      } else if (current.language === "auto") {
        setTestPhrase("JARVIS dual-language system online, sir. Noise gate active, listening only to your commands.");
      } else {
        setTestPhrase("Voice calibration confirmed, sir. Audio frequency, noise gate filtering, and voice interception are operational.");
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = voiceManager.subscribe(() => {
      setSettings(voiceManager.getSettings());
      setNoiseConfig(voiceManager.getNoiseConfig());
      setInterceptionConfig(voiceManager.getInterceptionConfig());
      setAvailableVoices(voiceManager.getAvailableVoices());
    });

    const interval = setInterval(() => {
      if (isOpen) {
        setTelemetry(voiceManager.getAudioChannelTelemetry());
      }
    }, 100);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLanguageChange = (lang: "auto" | "hi-IN" | "en-US" | "en-GB") => {
    SoundFX.playComputeChime();
    let phrase = testPhrase;
    if (lang === "hi-IN") {
      phrase = "नमस्ते सर, जार्विस आपके आदेश के लिए पूरी तरह तैयार है।";
    } else if (lang === "auto") {
      phrase = "JARVIS dual-language system online, sir. English aur Hindi dono mein commands active hain.";
    } else {
      phrase = "Voice calibration confirmed, sir. Audio frequency and pacing are operating at optimal parameters.";
    }
    setTestPhrase(phrase);

    const next: VoiceSettings = { ...settings, language: lang };
    setSettings(next);
    voiceManager.setSettings(next);
    if (auth.currentUser) {
      syncVoiceSettingsToFirestore(auth.currentUser.uid, next).catch(console.error);
    }
  };

  const handlePitchChange = (pitchVal: number) => {
    const next = { ...settings, pitch: pitchVal, presetName: "Custom" };
    setSettings(next);
    voiceManager.setSettings(next);
    if (auth.currentUser) {
      syncVoiceSettingsToFirestore(auth.currentUser.uid, next).catch(console.error);
    }
  };

  const handleRateChange = (rateVal: number) => {
    const next = { ...settings, rate: rateVal, presetName: "Custom" };
    setSettings(next);
    voiceManager.setSettings(next);
    if (auth.currentUser) {
      syncVoiceSettingsToFirestore(auth.currentUser.uid, next).catch(console.error);
    }
  };

  const handleVoiceChange = (voiceURI: string) => {
    const next = { ...settings, voiceURI };
    setSettings(next);
    voiceManager.setSettings(next);
    if (auth.currentUser) {
      syncVoiceSettingsToFirestore(auth.currentUser.uid, next).catch(console.error);
    }
  };

  const handlePresetSelect = (presetName: string) => {
    SoundFX.playComputeChime();
    voiceManager.applyPreset(presetName);
    const updated = voiceManager.getSettings();
    setSettings(updated);
    if (updated.language === "hi-IN") {
      setTestPhrase("नमस्ते सर, जार्विस आपके आदेश के लिए पूरी तरह तैयार है।");
    } else if (updated.language === "auto") {
      setTestPhrase("JARVIS dual-language system online, sir. English aur Hindi dono mein commands active hain.");
    }
    if (auth.currentUser) {
      syncVoiceSettingsToFirestore(auth.currentUser.uid, updated).catch(console.error);
    }
  };

  const handleMicProfileSelect = (profileId: any) => {
    SoundFX.playFrequencyLock();
    voiceManager.setMicProfile(profileId);
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  // Noise Elimination Handlers
  const handleToggleNoiseElimination = () => {
    SoundFX.playTargetClick();
    const nextVal = !noiseConfig.enabled;
    voiceManager.setNoiseConfig({ enabled: nextVal });
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  const handleNoiseThresholdChange = (val: number) => {
    voiceManager.setNoiseConfig({ gateThreshold: val });
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  const handleSuppressionLevelChange = (level: "low" | "medium" | "aggressive" | "ultra_tactical") => {
    SoundFX.playComputeChime();
    voiceManager.setNoiseConfig({ suppressionLevel: level });
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  const handleToggleVoiceIsolation = () => {
    SoundFX.playTargetClick();
    const nextVal = !noiseConfig.voiceIsolation;
    voiceManager.setNoiseConfig({ voiceIsolation: nextVal });
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  const handleToggleEchoCancellation = () => {
    SoundFX.playTargetClick();
    const nextVal = !noiseConfig.echoCancellation;
    voiceManager.setNoiseConfig({ echoCancellation: nextVal });
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  const handleToggleFeedbackShield = () => {
    SoundFX.playTargetClick();
    const nextVal = !noiseConfig.feedbackShield;
    voiceManager.setNoiseConfig({ feedbackShield: nextVal });
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  const handleCalibrateNoise = async () => {
    setIsCalibrating(true);
    setCalibrationSuccess(null);
    try {
      const newGate = await voiceManager.calibrateNoiseFloor();
      setCalibrationSuccess(newGate);
      setTimeout(() => setCalibrationSuccess(null), 4000);
    } catch (e) {
      console.warn("Noise calibration error", e);
    } finally {
      setIsCalibrating(false);
    }
  };

  // Voice Interception Handlers
  const handleToggleVoiceInterception = () => {
    SoundFX.playTargetClick();
    const nextVal = !interceptionConfig.enabled;
    voiceManager.setInterceptionConfig({ enabled: nextVal });
    setInterceptionConfig(voiceManager.getInterceptionConfig());
  };

  const handleInterceptionSensitivity = (sens: "normal" | "high" | "instant") => {
    SoundFX.playComputeChime();
    voiceManager.setInterceptionConfig({ sensitivity: sens });
    setInterceptionConfig(voiceManager.getInterceptionConfig());
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const current = interceptionConfig.keywordTriggers || ["jarvis", "stop", "wait", "hold on", "listen"];
    if (!current.includes(newKeyword.toLowerCase().trim())) {
      const updated = [...current, newKeyword.toLowerCase().trim()];
      voiceManager.setInterceptionConfig({ keywordTriggers: updated });
      setInterceptionConfig(voiceManager.getInterceptionConfig());
      SoundFX.playTargetClick();
    }
    setNewKeyword("");
  };

  const handleRemoveKeyword = (word: string) => {
    const current = interceptionConfig.keywordTriggers || ["jarvis", "stop", "wait", "hold on", "listen"];
    const updated = current.filter((k) => k !== word);
    voiceManager.setInterceptionConfig({ keywordTriggers: updated });
    setInterceptionConfig(voiceManager.getInterceptionConfig());
    SoundFX.playTargetClick();
  };

  const handleResetDefaults = () => {
    SoundFX.playComputeChime();
    const defaults: VoiceSettings = {
      pitch: 0.95,
      rate: 1.05,
      voiceURI: "",
      presetName: "Classic JARVIS",
      language: "auto",
      noiseElimination: {
        enabled: true,
        gateThreshold: 18,
        suppressionLevel: "aggressive",
        voiceIsolation: true,
        highPassFilter: true,
        vocalBoost: true,
        micProfile: "laptop_array",
        echoCancellation: true,
        feedbackShield: true,
      },
      voiceInterception: {
        enabled: true,
        sensitivity: "high",
        keywordTriggers: ["jarvis", "stop", "wait", "hold on", "listen", "cancel", "no", "shut up", "pause", "hey"],
        autoResumeListening: true,
      },
    };
    setSettings(defaults);
    setTestPhrase("Voice calibration confirmed, sir. Audio frequency and pacing are operating at optimal parameters.");
    voiceManager.setSettings(defaults);
    setNoiseConfig(voiceManager.getNoiseConfig());
    setInterceptionConfig(voiceManager.getInterceptionConfig());
    if (auth.currentUser) {
      syncVoiceSettingsToFirestore(auth.currentUser.uid, defaults).catch(console.error);
    }
  };

  const handleTestVoice = () => {
    if (isTesting) {
      voiceManager.stopSpeaking();
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    SoundFX.playWakePing();
    voiceManager.testVoice(testPhrase, () => {
      setIsTesting(false);
    });
  };

  const getPitchLabel = (pitch: number) => {
    if (pitch < 0.8) return "Deep Baritone (Low Resonance)";
    if (pitch <= 0.95) return "Commanding JARVIS (Optimal)";
    if (pitch <= 1.1) return "Natural Balanced Pitch";
    return "High Frequency (Crisp)";
  };

  const getRateLabel = (rate: number) => {
    if (rate < 0.85) return "Measured & Deliberate";
    if (rate <= 1.1) return "Balanced Pace (Optimal)";
    if (rate <= 1.35) return "Rapid Tactical Briefing";
    return "Hyper Velocity";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <div
          className="absolute inset-0"
          onClick={() => {
            if (isTesting) voiceManager.stopSpeaking();
            onClose();
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-[#090A0E] border border-sky-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(14,165,233,0.18)] flex flex-col gap-5 z-10 max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <AudioLines className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2 font-mono">
                  JARVIS COMMS & ACOUSTIC CONTROL MATRIX
                </h2>
                <p className="text-xs text-slate-400">
                  Microphone isolation, spectral noise elimination, barge-in interception & neural synthesis
                </p>
              </div>
            </div>

            <button
              id="close-voice-settings-btn"
              onClick={() => {
                if (isTesting) voiceManager.stopSpeaking();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-[#050608] border border-white/10 rounded-2xl">
            {[
              { id: "mic", label: "Mic Profiles", icon: Mic },
              { id: "noise", label: "Noise Filter", icon: Shield },
              { id: "interception", label: "Barge-In", icon: Zap },
              { id: "voice", label: "Neural Voice", icon: Sparkles },
              { id: "telemetry", label: "Telemetry", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => {
                    SoundFX.playTargetClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: MIC PROFILES & HARDWARE CONTROLS */}
          {activeTab === "mic" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <div className="bg-[#101116] border border-sky-500/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        MICROPHONE HARDWARE PROFILES
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Tailored DSP equalization and dynamic response curves matched to your audio input device
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MIC_PROFILES.map((profile) => {
                    const isSelected = (noiseConfig.micProfile || "laptop_array") === profile.id;
                    return (
                      <button
                        key={profile.id}
                        id={`mic-profile-${profile.id}`}
                        onClick={() => handleMicProfileSelect(profile.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? "bg-sky-500/15 border-sky-500/60 text-sky-200 shadow-[0_0_20px_rgba(14,165,233,0.2)]"
                            : "bg-[#050608] border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white text-xs">{profile.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{profile.description}</p>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 pt-1 border-t border-white/5">
                          <span>HP: {profile.hpFreq}Hz</span>
                          <span>•</span>
                          <span>LP: {profile.lpFreq}Hz</span>
                          <span>•</span>
                          <span>Boost: +{profile.formantBoost}dB</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hardware Shields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#101116] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-white">HARDWARE ECHO CANCELLATION</div>
                      <div className="text-[10px] text-slate-400">Eliminates speaker acoustic feedback loop</div>
                    </div>
                  </div>
                  <button
                    id="toggle-echo-cancellation-btn"
                    onClick={handleToggleEchoCancellation}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      noiseConfig.echoCancellation !== false
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-slate-500 border-white/10"
                    }`}
                  >
                    {noiseConfig.echoCancellation !== false ? "ACTIVE" : "OFF"}
                  </button>
                </div>

                <div className="bg-[#101116] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                      <Waves className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-white">ACOUSTIC FEEDBACK SHIELD</div>
                      <div className="text-[10px] text-slate-400">Adaptive mic attenuation during loud audio</div>
                    </div>
                  </div>
                  <button
                    id="toggle-feedback-shield-btn"
                    onClick={handleToggleFeedbackShield}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                      noiseConfig.feedbackShield !== false
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                        : "bg-white/5 text-slate-500 border-white/10"
                    }`}
                  >
                    {noiseConfig.feedbackShield !== false ? "ACTIVE" : "OFF"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: NOISE ELIMINATION & SPECTRAL GATE */}
          {activeTab === "noise" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <div className="bg-[#101116] border border-sky-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${noiseConfig.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500"}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          BACKGROUND NOISE ELIMINATION & VOICE ISOLATION
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${noiseConfig.enabled ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-slate-800 border-white/10 text-slate-400"}`}>
                          {noiseConfig.enabled ? "DSP ACTIVE" : "BYPASSED"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Multi-stage DSP filtering: High-Pass rumble cutoff, low-pass fan attenuation, and formant peaking
                      </p>
                    </div>
                  </div>

                  <button
                    id="toggle-noise-elimination-btn"
                    type="button"
                    onClick={handleToggleNoiseElimination}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      noiseConfig.enabled
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                    }`}
                  >
                    {noiseConfig.enabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>

                {/* Live Audio Meter & Noise Gate Visualization */}
                <div className="bg-[#050608] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-slate-300">LIVE VOICE LEVEL:</span>
                      <span className="font-bold text-sky-400">{noiseConfig.currentVoiceLevel}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">NOISE GATE THRESHOLD:</span>
                      <span className="font-bold text-amber-400">{noiseConfig.gateThreshold}%</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        noiseConfig.gateActive
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                          : "bg-slate-800 text-slate-400 border-white/10"
                      }`}>
                        {noiseConfig.gateActive ? "GATE: OPEN (VOICE DETECTED)" : "GATE: CLOSED (ATTENUATING NOISE)"}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic VU Meter Bar */}
                  <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                      style={{ left: `${noiseConfig.gateThreshold}%` }}
                    />
                    <div
                      className={`h-full transition-all duration-75 ${
                        noiseConfig.currentVoiceLevel >= noiseConfig.gateThreshold
                          ? "bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-300"
                          : "bg-slate-700"
                      }`}
                      style={{ width: `${Math.min(100, noiseConfig.currentVoiceLevel)}%` }}
                    />
                  </div>

                  {/* Threshold Slider & Calibrate Button */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <div className="flex-1 w-full flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Low Gate (5% - Quiet Room)</span>
                        <span>High Gate (60% - Loud Ambient)</span>
                      </div>
                      <input
                        id="noise-gate-threshold-slider"
                        type="range"
                        min="5"
                        max="65"
                        step="1"
                        value={noiseConfig.gateThreshold}
                        onChange={(e) => handleNoiseThresholdChange(parseInt(e.target.value))}
                        disabled={!noiseConfig.enabled}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-40"
                      />
                    </div>

                    <button
                      id="auto-calibrate-noise-floor-btn"
                      type="button"
                      onClick={handleCalibrateNoise}
                      disabled={isCalibrating || !noiseConfig.enabled}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0 shadow-sm"
                    >
                      <Gauge className={`w-3.5 h-3.5 ${isCalibrating ? "animate-spin text-sky-400" : "text-sky-400"}`} />
                      <span>{isCalibrating ? "SAMPLING ROOM NOISE FLOOR..." : "AUTO-CALIBRATE ROOM NOISE"}</span>
                    </button>
                  </div>

                  {calibrationSuccess !== null && (
                    <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2 font-mono">
                      <Check className="w-3.5 h-3.5" />
                      <span>Room noise floor calibrated! Noise gate optimized to {calibrationSuccess}%. Background chatter will now be silenced.</span>
                    </div>
                  )}
                </div>

                {/* Suppression Level & Voice Isolation Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3 h-3 text-sky-400" />
                      <span>SUPPRESSION PROFILE</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                      {[
                        { id: "low", label: "Studio", desc: "Minimal Cut" },
                        { id: "aggressive", label: "Aggressive", desc: "Room Chatter" },
                        { id: "ultra_tactical", label: "Ultra", desc: "Loud Ambience" },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleSuppressionLevelChange(lvl.id as any)}
                          className={`p-2 rounded-xl border transition-all text-center flex flex-col items-center justify-center ${
                            noiseConfig.suppressionLevel === lvl.id
                              ? "bg-sky-500/20 border-sky-500/60 text-sky-200 font-bold shadow-sm"
                              : "bg-[#050608] border-white/5 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span>{lvl.label}</span>
                          <span className="text-[8px] text-slate-500">{lvl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 justify-between">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Ear className="w-3 h-3 text-emerald-400" />
                      <span>VOICE ISOLATION FILTER</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleToggleVoiceIsolation}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                        noiseConfig.voiceIsolation
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-[#050608] border-white/5 text-slate-400"
                      }`}
                    >
                      <span className="text-[11px]">Reject Background TV / Murmurs</span>
                      <span className="font-bold">{noiseConfig.voiceIsolation ? "ACTIVE" : "OFF"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: VOICE INTERCEPTION & BARGE-IN */}
          {activeTab === "interception" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <div className="bg-[#101116] border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${interceptionConfig.enabled ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800 text-slate-500"}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          VOICE INTERCEPTION & BARGE-IN
                        </span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${interceptionConfig.enabled ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-slate-800 border-white/10 text-slate-400"}`}>
                          {interceptionConfig.enabled ? "BARGE-IN ARMED" : "DISABLED"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Interrupt J.A.R.V.I.S. mid-speech without touching any buttons. Audio synthesis cuts off in under 60ms so he immediately receives your new instructions.
                      </p>
                    </div>
                  </div>

                  <button
                    id="toggle-voice-interception-btn"
                    type="button"
                    onClick={handleToggleVoiceInterception}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                      interceptionConfig.enabled
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                        : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                    }`}
                  >
                    {interceptionConfig.enabled ? "ARMED" : "OFF"}
                  </button>
                </div>

                {/* Sensitivity Controls */}
                <div className="bg-[#050608] border border-white/5 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-slate-300 font-semibold">INTERCEPTION LATENCY & SENSITIVITY</span>
                    <span className="text-[10px] text-slate-500">
                      {interceptionConfig.sensitivity === "instant"
                        ? "Instantaneous cut on any vocal onset (60ms)"
                        : interceptionConfig.sensitivity === "high"
                        ? "High responsiveness to spoken interruptions (100ms)"
                        : "Standard threshold requiring clear command voice (180ms)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#101116] p-1 rounded-xl border border-white/10 text-xs font-mono">
                    {(["normal", "high", "instant"] as const).map((sens) => (
                      <button
                        key={sens}
                        type="button"
                        onClick={() => handleInterceptionSensitivity(sens)}
                        className={`px-3 py-1 rounded-lg uppercase transition-all ${
                          interceptionConfig.sensitivity === sens
                            ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {sens}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keyword Triggers Manager */}
                <div className="flex flex-col gap-2 bg-[#050608] border border-white/5 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white font-semibold flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      INSTANT BARGE-IN KEYWORD TRIGGERS
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Total Interceptions: {interceptionConfig.totalInterceptions}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 py-1">
                    {(interceptionConfig.keywordTriggers || ["jarvis", "stop", "wait", "hold on", "listen", "cancel", "no", "shut up", "pause", "hey"]).map((word) => (
                      <span
                        key={word}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#14151C] border border-white/10 text-xs font-mono text-amber-200"
                      >
                        <span>"{word}"</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(word)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Add trigger phrase (e.g., 'attention', 'restart')..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddKeyword();
                      }}
                      className="flex-1 bg-[#101116] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold hover:bg-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADD</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: NEURAL VOICE & DIALECT */}
          {activeTab === "voice" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              {/* Language Selection */}
              <div className="bg-[#101116] border border-sky-500/20 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="language-select-dropdown" className="text-xs font-mono text-white flex items-center gap-2 font-semibold">
                    <Languages className="w-4 h-4 text-sky-400" />
                    <span>PREFERRED LANGUAGE & DIALECT</span>
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    {settings.language === "hi-IN"
                      ? "🇮🇳 Hindi (हिंदी)"
                      : settings.language === "en-GB"
                      ? "🇬🇧 British English"
                      : settings.language === "en-US"
                      ? "🇺🇸 US English"
                      : "🌐 Auto Bilingual"}
                  </span>
                </div>

                <select
                  id="language-select-dropdown"
                  value={settings.language || "auto"}
                  onChange={(e) => handleLanguageChange(e.target.value as any)}
                  className="w-full bg-[#050608] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500/60 font-sans cursor-pointer transition-all"
                >
                  <option value="auto">🌐 Auto-Detect Bilingual (English + Hindi / Hinglish)</option>
                  <option value="hi-IN">🇮🇳 Hindi (हिंदी - Bharat / India)</option>
                  <option value="en-US">🇺🇸 English (US / Global Accent)</option>
                  <option value="en-GB">🇬🇧 English (UK - Classic British JARVIS)</option>
                </select>
              </div>

              {/* Presets Grid */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> NEURAL PRESETS
                  </span>
                  <span className="text-[11px] text-slate-500">Quick-tune voice profile</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VOICE_PRESETS.map((preset) => {
                    const isSelected = settings.presetName === preset.name;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handlePresetSelect(preset.name)}
                        className={`text-left p-3 rounded-2xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "bg-sky-500/15 border-sky-500/60 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                            : "bg-[#101116] border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white truncate">{preset.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight mb-2 line-clamp-2">
                          {preset.description}
                        </span>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                          <span>P: {preset.pitch}x</span>
                          <span>•</span>
                          <span>S: {preset.rate}x</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-[#101116] border border-white/5 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-sky-400" />
                      VOICE PITCH
                    </span>
                    <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {settings.pitch.toFixed(2)}x
                    </span>
                  </div>

                  <input
                    id="voice-pitch-slider"
                    type="range"
                    min="0.5"
                    max="1.6"
                    step="0.05"
                    value={settings.pitch}
                    onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.5x (Deep)</span>
                    <span className="text-slate-400 font-sans text-[11px] truncate max-w-[130px]">
                      {getPitchLabel(settings.pitch)}
                    </span>
                    <span>1.6x (High)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-sky-400" />
                      SPEAKING SPEED
                    </span>
                    <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {settings.rate.toFixed(2)}x
                    </span>
                  </div>

                  <input
                    id="voice-rate-slider"
                    type="range"
                    min="0.6"
                    max="1.8"
                    step="0.05"
                    value={settings.rate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>0.6x (Slow)</span>
                    <span className="text-slate-400 font-sans text-[11px] truncate max-w-[130px]">
                      {getRateLabel(settings.rate)}
                    </span>
                    <span>1.8x (Fast)</span>
                  </div>
                </div>
              </div>

              {/* Synthesizer Selector */}
              {availableVoices.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label htmlFor="voice-select-dropdown" className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-sky-400" /> SYNTHESIS VOICE ENGINE
                  </label>
                  <select
                    id="voice-select-dropdown"
                    value={settings.voiceURI || ""}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500/50 font-sans cursor-pointer"
                  >
                    <option value="">
                      {settings.language === "hi-IN"
                        ? "Auto Neural Hindi Voice (Lekha / Google हिन्दी / Swara)"
                        : "Default Neural Voice (Auto-detect British JARVIS cadence)"}
                    </option>
                    {availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}) {v.default ? " — Default" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: TELEMETRY & LIVE CHANNEL METRICS */}
          {activeTab === "telemetry" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
              <div className="bg-[#101116] border border-sky-500/20 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" /> LIVE ACOUSTIC CHANNEL TELEMETRY
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    REAL-TIME STREAM
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#050608] border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">RMS ENERGY</span>
                    <span className="text-lg font-mono font-bold text-sky-400">{telemetry.rmsLevel}%</span>
                    <span className="text-[9px] text-slate-500">Live vocal power</span>
                  </div>

                  <div className="bg-[#050608] border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">PEAK DB</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">{telemetry.peakDb} dB</span>
                    <span className="text-[9px] text-slate-500">{telemetry.isClipping ? "Clipping Alert!" : "Headroom OK"}</span>
                  </div>

                  <div className="bg-[#050608] border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">SNR MARGIN</span>
                    <span className="text-lg font-mono font-bold text-amber-400">+{telemetry.snrDb} dB</span>
                    <span className="text-[9px] text-slate-500">Above noise floor</span>
                  </div>

                  <div className="bg-[#050608] border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-400">DOMINANT FREQ</span>
                    <span className="text-lg font-mono font-bold text-purple-400">{telemetry.dominantHz} Hz</span>
                    <span className="text-[9px] text-slate-500">Vocal formant center</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-[#050608] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-slate-400">Sample Rate:</span>
                    <span className="text-white font-bold">{telemetry.sampleRate} Hz</span>
                  </div>
                  <div className="bg-[#050608] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-slate-400">Input Latency:</span>
                    <span className="text-emerald-400 font-bold">{telemetry.inputLatencyMs} ms</span>
                  </div>
                  <div className="bg-[#050608] border border-white/5 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-slate-400">Spectral Gate:</span>
                    <span className={`font-bold ${telemetry.gateOpen ? "text-emerald-400" : "text-slate-500"}`}>
                      {telemetry.gateOpen ? "OPEN (UNMUTED)" : "CLOSED (ATTENUATING)"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Test Phrase Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>TEST PHRASE SAMPLE</span>
              <span className="text-[10px] text-slate-500">Audio Preview</span>
            </label>
            <input
              type="text"
              value={testPhrase}
              onChange={(e) => setTestPhrase(e.target.value)}
              className="w-full bg-[#050608] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 font-sans"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <button
              id="reset-voice-settings-btn"
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-all border border-white/10 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET DEFAULTS</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                id="test-voice-synthesis-btn"
                type="button"
                onClick={handleTestVoice}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                  isTesting
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
                    : "bg-sky-500/20 border-sky-500/50 text-sky-300 hover:bg-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                }`}
              >
                {isTesting ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>STOP PREVIEW</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>TEST VOICE SYNTHESIS</span>
                  </>
                )}
              </button>

              <button
                id="save-voice-settings-btn"
                type="button"
                onClick={() => {
                  SoundFX.playStepComplete();
                  if (isTesting) voiceManager.stopSpeaking();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-mono transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>SAVE & CLOSE</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

