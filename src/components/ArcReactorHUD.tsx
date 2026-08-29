import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Volume2,
  Globe,
  Cpu,
  Activity,
  Eye,
  EyeOff,
  Maximize2,
  Scan,
  Shield,
  Sun,
  UserCheck,
  Sparkles,
  Camera,
} from "lucide-react";
import { JarvisState } from "../types";
import { opticVisionManager, OpticVisionState } from "../utils/opticVisionManager";
import { themeManager, JarvisTheme } from "../utils/themeManager";
import { SoundFX } from "../utils/soundEffects";

interface ArcReactorProps {
  state: JarvisState;
  frequencies?: Uint8Array;
  onToggleVoice: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  statusMessage: string;
  onOpenVisionHUD?: () => void;
  onDirectScan?: () => void;
}

export const ArcReactorHUD: React.FC<ArcReactorProps> = ({
  state,
  onToggleVoice,
  isListening,
  isSpeaking,
  statusMessage,
  onOpenVisionHUD,
  onDirectScan,
}) => {
  const [visionState, setVisionState] = useState<OpticVisionState>(opticVisionManager.getState());
  const [reactorDisplayMode, setReactorDisplayMode] = useState<"arc_core" | "optic_lens">("arc_core");
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Subscribe to themeManager
  useEffect(() => {
    const unsubTheme = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });
    return () => unsubTheme();
  }, []);

  // Subscribe to opticVisionManager
  useEffect(() => {
    const unsub = opticVisionManager.subscribe((vState) => {
      setVisionState(vState);
      if (vState.isActive && reactorDisplayMode === "arc_core" && !vState.isInitializing) {
        // Auto-switch to optic lens when camera gets activated
        setReactorDisplayMode("optic_lens");
      } else if (!vState.isActive && reactorDisplayMode === "optic_lens") {
        setReactorDisplayMode("arc_core");
      }
    });
    return () => unsub();
  }, [reactorDisplayMode]);

  // Attach media stream to local video element when in optic_lens mode
  useEffect(() => {
    if (localVideoRef.current && visionState.isActive) {
      const stream = opticVisionManager.getStream();
      if (stream && localVideoRef.current.srcObject !== stream) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [visionState.isActive, reactorDisplayMode]);

  const handleToggleOpticEye = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    SoundFX.playComputeChime();
    const active = await opticVisionManager.toggleOpticVision();
    if (active) {
      setReactorDisplayMode("optic_lens");
    } else {
      setReactorDisplayMode("arc_core");
    }
  };

  const handleTriggerScan = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    SoundFX.playComputeChime();
    if (onDirectScan) {
      onDirectScan();
    } else {
      await opticVisionManager.analyzeCurrentFrame("look_at_me");
    }
  };

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
          glow: currentTheme.glowColor || "#0ea5e9",
          primary: currentTheme.primaryColor || "#38bdf8",
          secondary: currentTheme.secondaryColor || "#0284c7",
          ring: currentTheme.primaryColor || "#0ea5e9",
          text: "text-slate-300",
          bg: "bg-white/5",
          border: "border-white/20",
          label: isListening ? "Listening" : "Ready / Standby",
          code: isListening ? "STANDBY-LISTEN" : "SYSTEM-IDLE",
        };
    }
  }, [state, isListening, currentTheme]);

  return (
    <div
      id="jarvis-arc-reactor-container"
      className="flex flex-col items-center justify-center p-3 sm:p-5 relative select-none w-full max-w-full"
    >
      {/* Ambient background glow matching state */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${statusConfig.glow}15 0%, transparent 70%)`,
        }}
      />

      {/* TOP HUD STATUS & OPTIC VISION CONTROL BAR */}
      <div className="w-full flex items-center justify-between max-w-sm mb-3 z-20 font-mono text-[10px]">
        {/* Core State Pill */}
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

        {/* Optic Vision Quick Toggle Button */}
        <div className="flex items-center gap-1.5">
          <button
            id="arc-optic-eye-toggle-btn"
            onClick={handleToggleOpticEye}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shadow-md ${
              visionState.isActive
                ? "bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                : "bg-[#050506]/90 border-white/10 text-slate-400 hover:text-white hover:border-white/25"
            }`}
            title={visionState.isActive ? "Disengage Optic Camera" : "Engage Optic Vision (JARVIS Eye)"}
          >
            {visionState.isActive ? (
              <>
                <Eye className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span className="font-bold uppercase tracking-wider text-[10px]">Optic Eye ON</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium uppercase tracking-wider text-[10px]">Enable Vision</span>
              </>
            )}
          </button>

          {visionState.isActive && onOpenVisionHUD && (
            <button
              onClick={onOpenVisionHUD}
              className="p-1.5 rounded-full bg-[#050506]/90 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-all"
              title="Expand Full Holographic Air Canvas HUD"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------
          MAIN CONCENTRIC ARC REACTOR CORE / OPTIC LENS VIEWPORT
          ----------------------------------------------------------- */}
      <div className="relative flex items-center justify-center my-2">
        {/* Main Interactive Reactor Core Frame */}
        <div
          id="arc-reactor-core"
          onClick={onToggleVoice}
          className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-sky-500/20 flex items-center justify-center relative cursor-pointer group transition-transform active:scale-95 shadow-[0_0_50px_rgba(14,165,233,0.15)] hover:border-sky-500/40 overflow-hidden"
          title={isListening ? "Click to pause voice listener" : "Click to activate voice sensor"}
        >
          {/* Ring 1: Outer Orbit Glow Ring */}
          <div
            className="absolute inset-0 rounded-full border border-dashed transition-all duration-500 pointer-events-none z-10"
            style={{ borderColor: `${statusConfig.primary}40` }}
          />

          {/* Ring 2: Rotating Magnetic Toroid */}
          <motion.div
            animate={{ rotate: isSpeaking || isListening ? 360 : 0 }}
            transition={{
              duration: isSpeaking ? 12 : isListening ? 20 : 35,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-sky-500/30 flex items-center justify-center relative transition-transform duration-150 pointer-events-none z-10"
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

          {/* Inner Chamber: Switches between Pure Arc Reactor Core and Live Optic Camera Lens */}
          <div className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-[#0A0A0C] shadow-[inset_0_0_50px_rgba(14,165,233,0.2)] border border-white/10 flex items-center justify-center backdrop-blur-sm overflow-hidden">
            {visionState.isActive && reactorDisplayMode === "optic_lens" ? (
              /* ================= OPTIC CAMERA LENS VIEW ================= */
              <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black">
                {/* Live Webcam Stream Video Element */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1] opacity-85 group-hover:opacity-95 transition-opacity"
                />

                {/* Tactical HUD Reticle & Crosshair Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Outer Targeting Brackets */}
                  <div className="w-36 h-36 border border-sky-400/30 rounded-full flex items-center justify-center animate-spin-slow">
                    <div className="absolute -top-1 w-4 h-0.5 bg-sky-400" />
                    <div className="absolute -bottom-1 w-4 h-0.5 bg-sky-400" />
                    <div className="absolute -left-1 h-4 w-0.5 bg-sky-400" />
                    <div className="absolute -right-1 h-4 w-0.5 bg-sky-400" />
                  </div>

                  {/* Center Crosshair Lock */}
                  <div className="w-16 h-16 border border-dashed border-sky-300/50 rounded-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-sky-400/80 rounded-full animate-ping" />
                  </div>

                  {/* Scanning Laser Sweep Bar */}
                  <motion.div
                    animate={{ y: [-70, 70, -70] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                    className="absolute w-40 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_8px_#38bdf8]"
                  />

                  {/* Real-time Biometric Readout Tag in Lens */}
                  <div className="absolute bottom-2 inset-x-0 flex justify-center">
                    <span className="font-mono text-[9px] bg-black/80 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/40 backdrop-blur-sm shadow-md">
                      [OPTIC LOCK • {visionState.biometrics.postureStatus.split(" ")[0].toUpperCase()}]
                    </span>
                  </div>
                </div>

                {/* Audio Pulse Overlay during speech */}
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none"
                  />
                )}
              </div>
            ) : (
              /* ================= PURE CONCENTRIC ARC CORE ================= */
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
            )}
          </div>
        </div>
      </div>

      {/* BIOMETRIC TELEMETRY HUD STRIP (When Optic Vision Active) */}
      <AnimatePresence>
        {visionState.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="w-full max-w-sm flex items-center justify-between px-3 py-1.5 my-1.5 rounded-lg bg-[#09090b]/80 border border-sky-500/20 font-mono text-[10px] text-slate-300"
          >
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Posture: <strong className="text-white">{visionState.biometrics.postureStatus}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{visionState.biometrics.ambientLux} LM</span>
            </div>
            <button
              onClick={handleTriggerScan}
              disabled={visionState.isAnalyzing}
              className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold border border-sky-400/30 flex items-center gap-1 transition-all"
            >
              <Scan className="w-3 h-3" />
              {visionState.isAnalyzing ? "Scanning..." : "Scan Me"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spoken Sample Quote in Refined Serif Italic */}
      <div className="mt-2 text-center max-w-md px-2">
        <p className="text-xs sm:text-sm font-serif italic text-white/90 leading-relaxed mb-1.5">
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

