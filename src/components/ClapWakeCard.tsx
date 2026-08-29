/**
 * J.A.R.V.I.S. Acoustic Clap Wake Control & Telemetry Module
 * Enables wake-on-clap using real-time audio transient analysis.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  Radio,
  Zap,
  Activity,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import { ClapWakeConfig, ClapDetectionEvent } from "../types";
import { clapDetector } from "../utils/clapDetector";
import { SoundFX } from "../utils/soundEffects";

interface ClapWakeCardProps {
  onClapTriggered?: () => void;
}

export const ClapWakeCard: React.FC<ClapWakeCardProps> = ({ onClapTriggered }) => {
  const [config, setConfig] = useState<ClapWakeConfig>(clapDetector.getConfig());
  const [history, setHistory] = useState<ClapDetectionEvent[]>(clapDetector.getHistory());
  const [isClapTriggerFlash, setIsClapTriggerFlash] = useState(false);

  useEffect(() => {
    // Subscribe to state changes and live acoustic meters
    const unsubState = clapDetector.subscribe((cfg) => {
      setConfig(cfg);
    });

    // Subscribe to clap trigger events
    const unsubClap = clapDetector.onClap((evt) => {
      setIsClapTriggerFlash(true);
      setHistory(clapDetector.getHistory());
      setTimeout(() => setIsClapTriggerFlash(false), 1200);
      if (onClapTriggered) onClapTriggered();
    });

    // Auto-start listener
    clapDetector.start();

    return () => {
      unsubState();
      unsubClap();
    };
  }, [onClapTriggered]);

  const handleToggle = () => {
    const nextEnabled = !config.enabled;
    clapDetector.updateConfig({ enabled: nextEnabled });
    if (nextEnabled) {
      clapDetector.start();
      SoundFX.playWakePing();
    } else {
      clapDetector.stop();
    }
  };

  const handleSimulateClap = () => {
    SoundFX.playTargetClick();
    clapDetector.triggerClapWake(config.mode, 0.92, 5.4);
  };

  const cycleSensitivity = () => {
    const levels: Array<"low" | "medium" | "high" | "tactical"> = ["low", "medium", "high", "tactical"];
    const currentIdx = levels.indexOf(config.sensitivity);
    const nextIdx = (currentIdx + 1) % levels.length;
    clapDetector.updateConfig({ sensitivity: levels[nextIdx] });
    SoundFX.playTargetClick();
  };

  const toggleMode = () => {
    const nextMode = config.mode === "single_clap" ? "double_clap" : "single_clap";
    clapDetector.updateConfig({ mode: nextMode });
    SoundFX.playTargetClick();
  };

  return (
    <div
      id="jarvis-clap-wake-module"
      className={`rounded-2xl border transition-all duration-300 relative overflow-hidden shadow-xl p-4 sm:p-5 ${
        isClapTriggerFlash
          ? "bg-amber-950/40 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.35)]"
          : config.enabled
          ? "bg-[#080B10] border-sky-500/30"
          : "bg-[#0A0A0C] border-white/10"
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              isClapTriggerFlash
                ? "bg-amber-500/30 border-amber-400 text-amber-300 scale-110"
                : config.enabled
                ? "bg-sky-500/20 border-sky-400/50 text-sky-400"
                : "bg-white/5 border-white/10 text-slate-500"
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                Acoustic Clap-to-Wake
              </h3>
              <span
                className={`font-mono text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                  isClapTriggerFlash
                    ? "bg-amber-500 text-black border-amber-400 animate-pulse"
                    : config.enabled
                    ? "bg-sky-500/20 text-sky-300 border-sky-400/50"
                    : "bg-white/5 text-slate-500 border-white/10"
                }`}
              >
                {isClapTriggerFlash ? "CLAP TRIGGERED" : config.enabled ? "ACTIVE SENSOR" : "STANDBY"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Clap your hands to instantly wake J.A.R.V.I.S., trigger chime, and start listening.
            </p>
          </div>
        </div>

        {/* Master Switch & Simulate Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateClap}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Simulate hand clap to test J.A.R.V.I.S. wake reaction"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Clap Wake</span>
          </button>

          <button
            onClick={handleToggle}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              config.enabled
                ? "bg-sky-500 hover:bg-sky-400 text-black shadow-lg shadow-sky-500/20"
                : "bg-white/10 hover:bg-white/20 text-slate-300"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{config.enabled ? "Enabled" : "Disabled"}</span>
          </button>
        </div>
      </div>

      {/* Live Acoustic Meter & Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-center">
        {/* Left 7 Columns: Live Transient Waveform Meter */}
        <div className="md:col-span-7 flex flex-col gap-2.5 bg-black/50 p-3.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between font-mono text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              ACOUSTIC TRANSIENT PEAK METER
            </span>
            <span className="text-slate-400 text-[11px]">
              PEAK: <strong className="text-sky-400 font-bold">{config.currentPeakLevel}%</strong> | FLOOR: {config.ambientNoiseFloor}%
            </span>
          </div>

          {/* Real-Time Audio Peak Bar */}
          <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                config.currentPeakLevel > 50
                  ? "bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                  : "bg-gradient-to-r from-sky-500 to-sky-400"
              }`}
              style={{ width: `${Math.max(2, config.currentPeakLevel)}%` }}
            />
            {/* Threshold indicator marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
              style={{
                left: `${
                  config.sensitivity === "tactical"
                    ? 25
                    : config.sensitivity === "high"
                    ? 35
                    : config.sensitivity === "medium"
                    ? 50
                    : 65
                }%`,
              }}
              title="Trigger Threshold"
            />
          </div>

          {/* Quick Config Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={cycleSensitivity}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sliders className="w-3 h-3 text-sky-400" />
                <span>Sens: <strong className="text-sky-300">{config.sensitivity.toUpperCase()}</strong></span>
              </button>

              <button
                onClick={toggleMode}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Mode: <strong className="text-amber-300">{config.mode === "single_clap" ? "1 Clap" : "2 Claps"}</strong></span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  clapDetector.updateConfig({
                    soundChimeEnabled: !config.soundChimeEnabled,
                  })
                }
                className={`px-2 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                  config.soundChimeEnabled
                    ? "bg-sky-500/20 border-sky-400/40 text-sky-300"
                    : "bg-white/5 border-white/10 text-slate-500"
                }`}
                title="Toggle Sci-Fi Stark Chime on clap"
              >
                {config.soundChimeEnabled ? <Volume2 className="w-3 h-3 text-sky-400" /> : <VolumeX className="w-3 h-3 text-slate-500" />}
                <span className="text-[10px]">Chime</span>
              </button>

              <button
                onClick={() =>
                  clapDetector.updateConfig({
                    spokenGreetingEnabled: !config.spokenGreetingEnabled,
                  })
                }
                className={`px-2 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                  config.spokenGreetingEnabled
                    ? "bg-sky-500/20 border-sky-400/40 text-sky-300"
                    : "bg-white/5 border-white/10 text-slate-500"
                }`}
                title="Toggle Spoken Greeting (e.g. 'At your service, sir')"
              >
                <CheckCircle className="w-3 h-3 text-sky-400" />
                <span className="text-[10px]">Voice Reply</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Wake History & Stats */}
        <div className="md:col-span-5 flex flex-col gap-2 bg-[#060608] p-3 rounded-xl border border-white/5 h-full">
          <div className="flex items-center justify-between pb-1 border-b border-white/10 font-mono text-xs">
            <span className="text-slate-300 font-bold uppercase tracking-wider">
              Clap Triggers ({config.totalClapsDetected})
            </span>
            <span className="text-[10px] text-slate-500">
              {config.lastClapTime ? `Last: ${config.lastClapTime}` : "No triggers yet"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <div className="py-4 text-center text-slate-500 font-mono text-[11px]">
                Clap your hands near your mic to test wake detection.
              </div>
            ) : (
              history.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  className="px-2 py-1.5 rounded-lg bg-black/60 border border-sky-500/20 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-slate-200 text-[11px]">
                      {evt.type === "double_clap" ? "Double Clap" : "Hand Clap"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>Vol: {evt.peakVolume}%</span>
                    <span className="text-sky-400">{evt.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
