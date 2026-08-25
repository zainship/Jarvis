import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  Mic,
  MicOff,
  Volume2,
  Globe,
  Cpu,
  Activity,
} from "lucide-react";
import { JarvisState } from "../types";

interface ArcReactorProps {
  state: JarvisState;
  frequencies?: Uint8Array;
  onToggleVoice: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  statusMessage: string;
}

export const ArcReactorHUD: React.FC<ArcReactorProps> = ({
  state,
  onToggleVoice,
  isListening,
  isSpeaking,
  statusMessage,
}) => {
  // Status color styling aligned with Sophisticated Dark specifications
  const statusConfig = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          glow: "#0ea5e9",
          primary: "#38bdf8",
          secondary: "#0284c7",
          ring: "#0ea5e9",
          text: "text-sky-400",
          bg: "bg-sky-500/10",
          border: "border-sky-500/40",
          label: "Listening",
          code: "VOX-MIC-ONLINE",
        };
      case "thinking":
        return {
          glow: "#f59e0b",
          primary: "#fbbf24",
          secondary: "#d97706",
          ring: "#f59e0b",
          text: "text-amber-400",
          bg: "bg-amber-500/10",
          border: "border-amber-500/40",
          label: "Neural Computing",
          code: "NEURAL-SYNAPSE-ACTIVE",
        };
      case "speaking":
        return {
          glow: "#10b981",
          primary: "#34d399",
          secondary: "#059669",
          ring: "#10b981",
          text: "text-emerald-400",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/40",
          label: "Voice Synthesizing",
          code: "SYNTH-OUTPUT-ACTIVE",
        };
      case "browsing":
        return {
          glow: "#06b6d4",
          primary: "#22d3ee",
          secondary: "#0891b2",
          ring: "#06b6d4",
          text: "text-cyan-400",
          bg: "bg-cyan-500/10",
          border: "border-cyan-500/40",
          label: "Web Emulation Active",
          code: "AUTONOMOUS-NET-PROX",
        };
      case "error":
        return {
          glow: "#f43f5e",
          primary: "#fb7185",
          secondary: "#e11d48",
          ring: "#f43f5e",
          text: "text-rose-400",
          bg: "bg-rose-500/10",
          border: "border-rose-500/40",
          label: "Calibrating",
          code: "CORE-RECALIBRATING",
        };
      default:
        return {
          glow: "#0ea5e9",
          primary: "#38bdf8",
          secondary: "#0284c7",
          ring: "#0ea5e9",
          text: "text-sky-400",
          bg: "bg-sky-500/10",
          border: "border-sky-500/30",
          label: isListening ? "Listening" : "Ready / Standby",
          code: isListening ? "STANDBY-LISTEN" : "SYSTEM-IDLE",
        };
    }
  }, [state, isListening]);

  return (
    <div
      id="jarvis-arc-reactor-container"
      className="flex flex-col items-center justify-center p-4 sm:p-6 relative select-none w-full max-w-full"
    >
      {/* Ambient background glow matching state */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${statusConfig.glow}15 0%, transparent 70%)`,
        }}
      />

      {/* TOP HUD STATUS BADGE */}
      <div className="w-full flex items-center justify-center mb-4 z-20 font-mono text-[10px]">
        <div className="flex items-center gap-2 bg-[#050506]/90 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
          <span
            className="w-2 h-2 rounded-full animate-ping"
            style={{ backgroundColor: statusConfig.primary }}
          />
          <span className="font-bold text-white tracking-widest uppercase">
            {statusConfig.label}
          </span>
          <span className="text-slate-500 hidden sm:inline">[{statusConfig.code}]</span>
        </div>
      </div>

      {/* -----------------------------------------------------------
          MAIN CONCENTRIC ARC REACTOR CORE (Clean Iconic Design)
          ----------------------------------------------------------- */}
      <div className="relative flex items-center justify-center my-4">
        {/* Main Interactive Reactor Core Frame */}
        <div
          id="arc-reactor-core"
          onClick={onToggleVoice}
          className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-sky-500/20 flex items-center justify-center relative cursor-pointer group transition-transform active:scale-95 shadow-[0_0_50px_rgba(14,165,233,0.1)] hover:border-sky-500/40"
          title={isListening ? "Click to pause voice listener" : "Click to activate voice sensor"}
        >
          {/* Ring 1: Outer Orbit Glow Ring */}
          <div
            className="absolute inset-0 rounded-full border border-dashed transition-all duration-500"
            style={{ borderColor: `${statusConfig.primary}30` }}
          />

          {/* Ring 2: Rotating Magnetic Toroid */}
          <motion.div
            animate={{ rotate: isSpeaking || isListening ? 360 : 0 }}
            transition={{
              duration: isSpeaking ? 12 : isListening ? 20 : 35,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-sky-500/30 flex items-center justify-center relative transition-transform duration-150"
          >
            {/* 8 Magnetic Tick Cross-Accents */}
            <div className="absolute top-0 w-1 h-2.5 bg-sky-400/80 shadow-[0_0_8px_#38bdf8]" />
            <div className="absolute bottom-0 w-1 h-2.5 bg-sky-400/80 shadow-[0_0_8px_#38bdf8]" />
            <div className="absolute left-0 h-1 w-2.5 bg-sky-400/80 shadow-[0_0_8px_#38bdf8]" />
            <div className="absolute right-0 h-1 w-2.5 bg-sky-400/80 shadow-[0_0_8px_#38bdf8]" />
            <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_4px_#ffffff]" />
            <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_4px_#ffffff]" />
            <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_4px_#ffffff]" />
            <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_4px_#ffffff]" />
          </motion.div>

          {/* Inner Chamber with Deep Inset Shadow & Dark Glass */}
          <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#0A0A0C] shadow-[inset_0_0_50px_rgba(14,165,233,0.2)] border border-white/10 flex items-center justify-center backdrop-blur-sm">
            {/* Concentric Glow Disc */}
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: `${statusConfig.glow}15`,
                borderColor: `${statusConfig.primary}40`,
                boxShadow: `0 0 30px ${statusConfig.glow}35`,
              }}
            >
              {/* Central Pulsating Plasma Node */}
              <motion.div
                animate={{
                  scale: isSpeaking
                    ? [1, 1.25, 1]
                    : isListening
                    ? [1, 1.15, 1]
                    : [1, 1.05, 1],
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{
                  duration: isSpeaking ? 0.6 : isListening ? 1.2 : 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg cursor-pointer"
                style={{
                  backgroundColor: statusConfig.primary,
                  boxShadow: `0 0 35px ${statusConfig.glow}`,
                }}
              >
                {isListening ? (
                  <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-[0_0_8px_#ffffff] animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-[0_0_8px_#ffffff]" />
                ) : state === "browsing" ? (
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-spin" />
                ) : state === "thinking" ? (
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-pulse" />
                ) : (
                  <Cpu className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Spoken Sample Quote in Refined Serif Italic */}
      <div className="mt-4 text-center max-w-md px-2">
        <p className="text-sm sm:text-base font-serif italic text-white/90 leading-relaxed mb-2">
          "{statusMessage || "Jarvis, find the best flight options for Tokyo in October and cross-reference with my calendar availability."}"
        </p>

        <div className="flex justify-center space-x-2">
          <div
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: statusConfig.primary }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: statusConfig.glow }}
          />
          <div
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: statusConfig.primary }}
          />
        </div>
      </div>
    </div>
  );
};
