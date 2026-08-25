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
} from "lucide-react";
import { voiceManager, VOICE_PRESETS } from "../utils/voiceManager";
import { VoiceSettings } from "../types";
import { SoundFX } from "../utils/soundEffects";
import { auth, syncVoiceSettingsToFirestore } from "../lib/firebase";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<VoiceSettings>(() => voiceManager.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhrase, setTestPhrase] = useState("Voice calibration confirmed, sir. Audio frequency and pacing are operating at optimal parameters.");

  useEffect(() => {
    if (isOpen) {
      setSettings(voiceManager.getSettings());
      setAvailableVoices(voiceManager.getAvailableVoices());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = voiceManager.subscribe(() => {
      setSettings(voiceManager.getSettings());
      setAvailableVoices(voiceManager.getAvailableVoices());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

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
    if (auth.currentUser) {
      syncVoiceSettingsToFirestore(auth.currentUser.uid, updated).catch(console.error);
    }
  };

  const handleResetDefaults = () => {
    SoundFX.playComputeChime();
    const defaults: VoiceSettings = {
      pitch: 0.95,
      rate: 1.05,
      voiceURI: "",
      presetName: "Classic JARVIS",
    };
    setSettings(defaults);
    voiceManager.setSettings(defaults);
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

  // Helper text for pitch
  const getPitchLabel = (pitch: number) => {
    if (pitch < 0.8) return "Deep Baritone (Low Resonance)";
    if (pitch <= 0.95) return "Commanding JARVIS (Optimal)";
    if (pitch <= 1.1) return "Natural Balanced Pitch";
    return "High Frequency (Crisp)";
  };

  // Helper text for rate
  const getRateLabel = (rate: number) => {
    if (rate < 0.85) return "Measured & Deliberate";
    if (rate <= 1.1) return "Balanced Pace (Optimal)";
    if (rate <= 1.35) return "Rapid Tactical Briefing";
    return "Hyper Velocity";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop dismiss */}
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
          className="relative w-full max-w-2xl bg-[#0A0A0C] border border-sky-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(14,165,233,0.15)] flex flex-col gap-6 z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2 font-mono">
                  VOICE SYNTHESIS CALIBRATION
                </h2>
                <p className="text-xs text-slate-400">
                  Configure speech synthesis pitch, velocity, and neural voice models
                </p>
              </div>
            </div>

            <button
              id="close-voice-settings-btn"
              onClick={() => {
                if (isTesting) voiceManager.stopSpeaking();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Presets Selection */}
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
                    className={`text-left p-3 rounded-2xl border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? "bg-sky-500/15 border-sky-500/60 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                        : "bg-[#101014] border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
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

          {/* Sliders: Pitch & Speed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-[#101014] border border-white/5 rounded-2xl p-4 sm:p-5">
            {/* Pitch Controller */}
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

            {/* Velocity / Rate Controller */}
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

          {/* Voice Synthesizer Selector */}
          {availableVoices.length > 0 && (
            <div className="flex flex-col gap-2">
              <label htmlFor="voice-select-dropdown" className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400" /> SYNTHESIS VOICE ENGINE
              </label>
              <select
                id="voice-select-dropdown"
                value={settings.voiceURI || ""}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full bg-[#101014] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500/50 font-sans cursor-pointer"
              >
                <option value="">Default Neural Voice (Auto-detect British JARVIS cadence)</option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}) {v.default ? " — Default" : ""}
                  </option>
                ))}
              </select>
            </div>
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
              className="w-full bg-[#101014] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 font-sans"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
            <button
              id="reset-voice-settings-btn"
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-mono transition-all border border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET DEFAULTS</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                id="test-voice-synthesis-btn"
                type="button"
                onClick={handleTestVoice}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all border ${
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
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-mono transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] flex items-center gap-1.5"
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
