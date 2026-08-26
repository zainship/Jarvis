import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  Radio,
  Layers,
  Cpu,
  Compass,
  ArrowUpRight,
  Youtube,
  Play,
  RotateCcw,
  CheckCircle2,
  Shield,
  VolumeX,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { ChatMessage, JarvisState } from "../types";
import { SoundFX } from "../utils/soundEffects";

interface VoiceVisualizationConsoleProps {
  messages: ChatMessage[];
  frequencies: Uint8Array;
  state: JarvisState;
  isListening: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  isProcessing: boolean;
  onToggleVoice: () => void;
  onSpeakMessage: (text: string) => void;
  onTriggerBrowserWorkflow: (prompt: string) => void;
  onOpenVoiceSettings?: () => void;
  onOpenRealTab?: (url: string, name?: string) => void;
  onPlayYouTube?: (query: string) => void;
  onSendMessage?: (text: string, isVoice?: boolean) => void;
}

type VisualizerMode = "holographic_matrix" | "frequency_bars" | "neural_waveform" | "spatial_constellation";

interface AudioPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  origX: number;
  origY: number;
  size: number;
  color: string;
}

export const VoiceVisualizationConsole: React.FC<VoiceVisualizationConsoleProps> = ({
  messages,
  frequencies,
  state,
  isListening,
  isSpeaking,
  interimTranscript,
  isProcessing,
  onToggleVoice,
  onSpeakMessage,
  onTriggerBrowserWorkflow,
  onOpenVoiceSettings,
  onOpenRealTab,
  onPlayYouTube,
  onSendMessage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [activeVisMode, setActiveVisMode] = useState<VisualizerMode>("holographic_matrix");
  const [sensitivity, setSensitivity] = useState<number>(1.2);
  const [showTranscriptStream, setShowTranscriptStream] = useState<boolean>(true);

  // Smooth smoothed audio metrics for silky 60 FPS transitions
  const smoothedVolumeRef = useRef<number>(0);
  const smoothedBassRef = useRef<number>(0);
  const smoothedMidsRef = useRef<number>(0);
  const smoothedTrebleRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Constellation / Neural nodes
  const nodesRef = useRef<AudioPoint[]>([]);

  // Get the most recent conversation transcript item for prominent HUD display
  const latestMessage = useMemo(() => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [messages]);

  const latestJarvisMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "jarvis") return messages[i];
    }
    return null;
  }, [messages]);

  // Voice presets for 1-click voice prompt dispatching without keyboard typing
  const VOICE_PROMPT_PRESETS = [
    { label: "Interstellar in 4K", prompt: "Jarvis, play Hans Zimmer Interstellar in 4K" },
    { label: "AC/DC Back in Black", prompt: "Jarvis, play Back In Black by AC/DC" },
    { label: "Lofi Live Radio", prompt: "Jarvis, play lofi hip hop live radio" },
    { label: "Ludovico Einaudi Acoustic", prompt: "Jarvis, play Ludovico Einaudi acoustic" },
    { label: "System Telemetry Report", prompt: "Jarvis, check system telemetry status" },
    { label: "Set Volume 75%", prompt: "Jarvis, set volume to 75%" },
    { label: "Look at Me (Optic Vision)", prompt: "Jarvis, look at me and check my status" },
    { label: "Morning Briefing", prompt: "Jarvis, give me my morning productivity briefing" },
    { label: "Search AI Breakthroughs", prompt: "Jarvis, search Google for latest AI breakthroughs" },
  ];

  // Frequency Stats Calculation
  const audioStats = useMemo(() => {
    if (!frequencies || frequencies.length === 0) {
      return { volumePct: 0, bassPct: 0, midsPct: 0, treblePct: 0, peakHz: "0 Hz" };
    }

    const len = frequencies.length;
    const bassEnd = Math.floor(len * 0.2);
    const midsEnd = Math.floor(len * 0.6);

    let sumTotal = 0;
    let sumBass = 0;
    let sumMids = 0;
    let sumTreble = 0;
    let maxVal = 0;
    let maxIdx = 0;

    for (let i = 0; i < len; i++) {
      const v = frequencies[i];
      sumTotal += v;
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
      if (i < bassEnd) sumBass += v;
      else if (i < midsEnd) sumMids += v;
      else sumTreble += v;
    }

    const avgTotal = sumTotal / len;
    const avgBass = bassEnd > 0 ? sumBass / bassEnd : 0;
    const avgMids = midsEnd > bassEnd ? sumMids / (midsEnd - bassEnd) : 0;
    const avgTreble = len > midsEnd ? sumTreble / (len - midsEnd) : 0;

    const volumePct = Math.min(100, Math.round((avgTotal / 200) * 100));
    const bassPct = Math.min(100, Math.round((avgBass / 220) * 100));
    const midsPct = Math.min(100, Math.round((avgMids / 220) * 100));
    const treblePct = Math.min(100, Math.round((avgTreble / 200) * 100));

    // Approximate dominant frequency bin
    const approxHz = Math.round((maxIdx / len) * 8000);
    const peakHz = approxHz > 0 && volumePct > 5 ? `${approxHz} Hz` : "Standby";

    return { volumePct, bassPct, midsPct, treblePct, peakHz };
  }, [frequencies]);

  // Color mapping based on live state
  const statusColor = useMemo(() => {
    switch (state) {
      case "listening":
        return { primary: "#38bdf8", glow: "#0ea5e9", name: "VOICE INPUT CAPTURE", text: "text-sky-400" };
      case "speaking":
        return { primary: "#34d399", glow: "#10b981", name: "VOCAL HARMONIC SYNTH", text: "text-emerald-400" };
      case "thinking":
        return { primary: "#fbbf24", glow: "#f59e0b", name: "NEURAL COGNITION", text: "text-amber-400" };
      case "browsing":
        return { primary: "#22d3ee", glow: "#06b6d4", name: "AUTONOMOUS BROWSER", text: "text-cyan-400" };
      case "error":
        return { primary: "#fb7185", glow: "#f43f5e", name: "SENSOR RECALIBRATION", text: "text-rose-400" };
      default:
        return {
          primary: isListening ? "#38bdf8" : "#94a3b8",
          glow: isListening ? "#0ea5e9" : "#475569",
          name: isListening ? "LISTENING ACTIVE" : "VOICE READY / STANDBY",
          text: isListening ? "text-sky-400" : "text-slate-400",
        };
    }
  }, [state, isListening]);

  // Initialize constellation nodes
  useEffect(() => {
    const nodes: AudioPoint[] = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      const origX = 0.1 + (i / count) * 0.8;
      const origY = 0.3 + ((i * 17) % 40) / 100;
      nodes.push({
        x: origX,
        y: origY,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02,
        origX,
        origY,
        size: 2 + Math.random() * 3,
        color: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#34d399" : "#ffffff",
      });
    }
    nodesRef.current = nodes;
  }, []);

  // 60 FPS Real-time High-Density Audio Visualizer Engine
  useEffect(() => {
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Sync canvas size
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const targetW = Math.round(rect.width * dpr);
        const targetH = Math.round(rect.height * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Volume & Frequency Calculations
      const rawVol = (audioStats.volumePct / 100) * sensitivity;
      const isLiveActive = isListening || isSpeaking || state === "thinking";

      const synthVol = isSpeaking
        ? 0.55 + 0.35 * Math.sin(time * 0.009) * Math.cos(time * 0.004)
        : state === "thinking"
        ? 0.35 + 0.2 * Math.sin(time * 0.006)
        : isListening
        ? 0.18 + 0.12 * Math.sin(time * 0.003)
        : 0.06 + 0.03 * Math.sin(time * 0.002);

      const effectiveVol = Math.max(rawVol, isLiveActive ? synthVol : 0.04);

      smoothedVolumeRef.current += (effectiveVol - smoothedVolumeRef.current) * 0.2;
      smoothedBassRef.current += ((audioStats.bassPct / 100) * sensitivity - smoothedBassRef.current) * 0.2;
      smoothedMidsRef.current += ((audioStats.midsPct / 100) * sensitivity - smoothedMidsRef.current) * 0.2;
      smoothedTrebleRef.current += ((audioStats.treblePct / 100) * sensitivity - smoothedTrebleRef.current) * 0.2;

      const smoothVol = smoothedVolumeRef.current;
      const smoothBass = Math.max(smoothedBassRef.current, smoothVol * 0.85);
      const smoothMids = Math.max(smoothedMidsRef.current, smoothVol * 0.9);
      const smoothTreble = Math.max(smoothedTrebleRef.current, smoothVol * 0.75);

      phaseRef.current += (2.2 + smoothVol * 7.5) * dt;
      const phase = phaseRef.current;

      const primary = statusColor.primary;
      const glow = statusColor.glow;

      // -------------------------------------------------------------
      // DRAW HOLOGRAPHIC BACKGROUND GRID & HUD METRIC RINGS
      // -------------------------------------------------------------
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;

      // Subtle horizontal scope lines
      for (let y = h * 0.15; y < h * 0.85; y += h * 0.18) {
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(w * 0.05, y);
        ctx.lineTo(w * 0.95, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // -------------------------------------------------------------
      // MODE 1: HOLOGRAPHIC DUAL MULTI-BAND SPECTRUM MATRIX (Default)
      // -------------------------------------------------------------
      if (activeVisMode === "holographic_matrix" || activeVisMode === "frequency_bars") {
        const numBars = 48;
        const barGap = w * 0.005;
        const barWidth = Math.max(2, (w * 0.88 - (numBars - 1) * barGap) / numBars);
        const startX = w * 0.06;
        const baseY = h * 0.55;
        const maxBarH = h * 0.38;

        ctx.save();
        for (let i = 0; i < numBars; i++) {
          const normI = i / (numBars - 1);
          const binIdx = Math.floor(normI * (frequencies.length - 1));
          const freq = frequencies[binIdx] || 0;

          // Symmetric frequency envelope
          const envelope = Math.sin(normI * Math.PI);
          const freqIntensity = isLiveActive
            ? Math.max((freq / 255) * sensitivity, smoothVol * 0.5)
            : 0.06 + 0.04 * Math.sin(normI * 12 + phase);

          const barH = Math.max(4, freqIntensity * maxBarH * (0.5 + envelope * 0.5));
          const x = startX + i * (barWidth + barGap);

          // Top upper mirrored bar
          const grad = ctx.createLinearGradient(0, baseY - barH, 0, baseY);
          if (normI < 0.3) {
            grad.addColorStop(0, "#38bdf8");
            grad.addColorStop(1, "rgba(56, 189, 248, 0.1)");
          } else if (normI < 0.7) {
            grad.addColorStop(0, "#34d399");
            grad.addColorStop(1, "rgba(52, 211, 153, 0.1)");
          } else {
            grad.addColorStop(0, "#fbbf24");
            grad.addColorStop(1, "rgba(251, 191, 36, 0.1)");
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, baseY - barH, barWidth, barH, [2, 2, 0, 0]);
          ctx.fill();

          // Bottom lower mirrored reflection (subtle)
          const gradReflect = ctx.createLinearGradient(0, baseY, 0, baseY + barH * 0.45);
          gradReflect.addColorStop(0, `${primary}44`);
          gradReflect.addColorStop(1, "transparent");
          ctx.fillStyle = gradReflect;
          ctx.beginPath();
          ctx.roundRect(x, baseY, barWidth, barH * 0.45, [0, 0, 2, 2]);
          ctx.fill();

          // Glowing Cap Pixel on Peaks
          if (barH > 15) {
            ctx.fillStyle = "#ffffff";
            ctx.shadowColor = primary;
            ctx.shadowBlur = 6;
            ctx.fillRect(x, baseY - barH - 2, barWidth, 2);
          }
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // MODE 2: NEURAL CONTINUOUS SINE WAVEFORM
      // -------------------------------------------------------------
      if (activeVisMode === "holographic_matrix" || activeVisMode === "neural_waveform") {
        const waveBaseY = h * 0.55;
        const waveAmp = (18 + smoothVol * 55);

        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 12;

        // Primary Carrier Fluid Waveform
        ctx.beginPath();
        for (let x = w * 0.05; x <= w * 0.95; x += 5) {
          const normX = (x - w * 0.05) / (w * 0.9);
          const envelope = Math.sin(normX * Math.PI);
          const freqSample = frequencies[Math.floor(normX * (frequencies.length - 1))] || 0;
          const freqBoost = (freqSample / 255) * 18 * sensitivity;

          const y =
            waveBaseY +
            Math.sin(normX * 10 + phase * 2.0) * waveAmp * envelope +
            Math.cos(normX * 18 - phase * 2.8) * (waveAmp * 0.45) * envelope +
            freqBoost * envelope;

          if (x === w * 0.05) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = primary;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Secondary High-Frequency Overtone Wave
        ctx.beginPath();
        for (let x = w * 0.05; x <= w * 0.95; x += 5) {
          const normX = (x - w * 0.05) / (w * 0.9);
          const envelope = Math.sin(normX * Math.PI);
          const y =
            waveBaseY -
            Math.sin(normX * 14 - phase * 3.2) * (waveAmp * 0.6) * envelope -
            Math.cos(normX * 8 + phase * 1.5) * (waveAmp * 0.3) * envelope;

          if (x === w * 0.05) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = "#ffffff";
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // MODE 3: SPATIAL ACOUSTIC CONSTELLATION NODES
      // -------------------------------------------------------------
      if (activeVisMode === "spatial_constellation") {
        ctx.save();
        const nodes = nodesRef.current;

        // Update positions based on bass & treble energy
        nodes.forEach((node, idx) => {
          node.x = node.origX * w + Math.sin(phase + idx) * (15 * smoothBass);
          node.y = node.origY * h + Math.cos(phase * 1.2 + idx) * (20 * smoothMids);

          // Draw node circle
          ctx.beginPath();
          const r = Math.max(1, node.size * (0.8 + smoothVol * 0.6));
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 8;
          ctx.fill();

          // Connect nearby nodes with audio-responsive beams
          for (let j = idx + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = node.x - (n2.origX * w + Math.sin(phase + j) * (15 * smoothBass));
            const dy = node.y - (n2.origY * h + Math.cos(phase * 1.2 + j) * (20 * smoothMids));
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < w * 0.16) {
              const alpha = (1 - dist / (w * 0.16)) * (0.3 + smoothVol * 0.6);
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(n2.origX * w + Math.sin(phase + j) * (15 * smoothBass), n2.origY * h + Math.cos(phase * 1.2 + j) * (20 * smoothMids));
              ctx.strokeStyle = primary;
              ctx.globalAlpha = alpha;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });
        ctx.restore();
      }

      // -------------------------------------------------------------
      // REAL-TIME AUDIO FREQUENCY READOUT TEXT OVERLAY (HUD Lower Bar)
      // -------------------------------------------------------------
      ctx.save();
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.fillText(`AUDIO FLUX: ${Math.round(smoothVol * 100)}%`, w * 0.06, h * 0.92);
      ctx.fillText(`DOMINANT: ${audioStats.peakHz}`, w * 0.36, h * 0.92);
      ctx.fillText(`SAMPLE RATE: 48.0 kHz`, w * 0.68, h * 0.92);
      ctx.restore();

      // Loop
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    frequencies,
    audioStats,
    state,
    isListening,
    isSpeaking,
    activeVisMode,
    sensitivity,
    statusColor,
  ]);

  // Handle Quick Voice Preset Click
  const handleTriggerPreset = (prompt: string) => {
    SoundFX.playTargetClick();
    if (onSendMessage) {
      onSendMessage(prompt, true);
    } else if (onTriggerBrowserWorkflow) {
      onTriggerBrowserWorkflow(prompt);
    }
  };

  const handleLaunchTab = (url: string, name?: string) => {
    if (onOpenRealTab) {
      onOpenRealTab(url, name);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      id="jarvis-voice-visualizer-console"
      ref={containerRef}
      className="w-full flex flex-col gap-4 select-none"
    >
      {/* -----------------------------------------------------------
          TOP VOICE VISUALIZATION STAGE CARD
          ----------------------------------------------------------- */}
      <div className="bg-[#0A0A0C] border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
        {/* Stage Header Ribbon */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: statusColor.primary }}
            />
            <span className="font-mono font-bold text-xs uppercase tracking-wider text-slate-200">
              {statusColor.name}
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
              [SONIC-SPECTROGRAM-MK85]
            </span>
          </div>

          {/* Visualizer Mode Selector */}
          <div className="flex items-center bg-[#050506] p-0.5 rounded-xl border border-white/10 text-[10px] font-mono">
            {[
              { id: "holographic_matrix", label: "MATRIX", title: "Full Multi-Band Holographic Matrix" },
              { id: "frequency_bars", label: "BARS", title: "Dual Mirrored Equalizer Bars" },
              { id: "neural_waveform", label: "WAVE", title: "Fluid Sine Waveform" },
              { id: "spatial_constellation", label: "NODES", title: "Spatial Acoustic Constellation" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  SoundFX.playTargetClick();
                  setActiveVisMode(m.id as VisualizerMode);
                }}
                title={m.title}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeVisMode === m.id
                    ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic 60 FPS Canvas Visualizer Stage */}
        <div className="relative w-full h-56 sm:h-64 bg-[#050507] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Floating Live Interim Spoken Transcript Overlay */}
          {interimTranscript && (
            <div className="absolute top-3 left-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-sky-500/40 shadow-lg flex items-center gap-2 text-sky-300 text-xs font-mono animate-pulse">
              <Mic className="w-4 h-4 text-sky-400 shrink-0 animate-bounce" />
              <span className="text-[10px] text-sky-400 uppercase tracking-widest font-bold shrink-0">
                LISTENING:
              </span>
              <span className="font-serif italic text-sm text-white truncate">"{interimTranscript}"</span>
            </div>
          )}

          {/* Neural Processing Computing Indicator */}
          {isProcessing && (
            <div className="absolute bottom-3 left-4 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>JARVIS Neural Core computing answer & searching web...</span>
            </div>
          )}
        </div>

        {/* Live Audio Telemetry Band Matrix Ribbon */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 font-mono text-[11px]">
          <div className="bg-[#050507] px-3 py-1.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span className="text-slate-500">BASS</span>
            <span className="font-bold text-sky-400">{audioStats.bassPct}%</span>
          </div>
          <div className="bg-[#050507] px-3 py-1.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span className="text-slate-500">MIDS</span>
            <span className="font-bold text-emerald-400">{audioStats.midsPct}%</span>
          </div>
          <div className="bg-[#050507] px-3 py-1.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span className="text-slate-500">TREBLE</span>
            <span className="font-bold text-amber-400">{audioStats.treblePct}%</span>
          </div>
          <div className="bg-[#050507] px-3 py-1.5 rounded-xl border border-white/5 flex items-center justify-between">
            <span className="text-slate-500">ENERGY</span>
            <span className="font-bold text-white">{audioStats.volumePct}%</span>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------
          LATEST JARVIS VOICE SYNTHESIS & SYSTEM DISPATCH BANNER
          ----------------------------------------------------------- */}
      {latestJarvisMessage && (
        <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col gap-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Volume2 className="w-3 h-3" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                J.A.R.V.I.S. VOICE SYNTHESIS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  SoundFX.playTargetClick();
                  onSpeakMessage(latestJarvisMessage.text);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>Replay Voice</span>
              </button>

              {onOpenVoiceSettings && (
                <button
                  onClick={onOpenVoiceSettings}
                  title="Voice Tuning Settings"
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className="font-serif italic text-sm sm:text-base text-white/90 leading-relaxed pl-8">
            "{latestJarvisMessage.text}"
          </p>

          {/* Interactive Browser Action Card if triggered */}
          {latestJarvisMessage.realBrowserAction && (
            <div className="mt-2 pl-8 space-y-1.5">
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <Compass className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
                  <span className="text-xs font-mono text-slate-300 truncate">
                    {latestJarvisMessage.realBrowserAction.targetUrl}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleLaunchTab(
                      latestJarvisMessage.realBrowserAction!.targetUrl!,
                      latestJarvisMessage.realBrowserAction!.query
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-mono shrink-0 shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Tab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {latestJarvisMessage.realBrowserAction.hostCommandWindows && (
                <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <Terminal className="w-3 h-3 text-sky-400 shrink-0" />
                    <span className="text-slate-300 truncate">{latestJarvisMessage.realBrowserAction.hostCommandWindows}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(latestJarvisMessage.realBrowserAction!.hostCommandWindows!);
                      SoundFX.playComputeChime();
                    }}
                    className="text-sky-400 hover:text-sky-300 shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Copy Windows CLI"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy CLI</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Interactive YouTube Stream Launcher if triggered */}
          {latestJarvisMessage.youtubeMedia && (
            <div className="mt-2 pl-8">
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-xs font-mono text-slate-300 font-bold truncate">
                    {latestJarvisMessage.youtubeMedia.title || "YouTube Stream"}
                  </span>
                </div>
                {onPlayYouTube && (
                  <button
                    onClick={() => onPlayYouTube(latestJarvisMessage.youtubeMedia!.title || "lofi")}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs font-mono shrink-0 shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Play Video</span>
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------
          HANDS-FREE VOICE COMMAND PRESET CHIPS
          ----------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-sky-400" /> Voice Presets:
        </span>
        {VOICE_PROMPT_PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleTriggerPreset(p.prompt)}
            className="px-3 py-1.5 rounded-full text-xs font-mono bg-[#0A0A0C] border border-white/5 text-slate-400 hover:text-sky-300 hover:border-sky-500/30 hover:bg-white/5 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* -----------------------------------------------------------
          CIRCULAR VOICE ACTIVATION & MICROPHONE MASTER CONTROL
          ----------------------------------------------------------- */}
      <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            id="toggle-master-voice-btn"
            type="button"
            onClick={onToggleVoice}
            title={isListening ? "Mute Voice Recognition" : "Activate Voice Recognition"}
            className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isListening
                ? "bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.4)] animate-pulse"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
            }`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-mono font-bold text-slate-200">
              {isListening ? "VOICE RECOGNITION ACTIVE" : "MICROPHONE STANDBY"}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {isListening
                ? "Speak naturally or say 'Jarvis' to command systems"
                : "Click microphone or press SPACEBAR to activate"}
            </span>
          </div>
        </div>

        {/* Audio Sensitivity Slider */}
        <div className="flex items-center gap-2 bg-[#050506] px-3 py-1.5 rounded-xl border border-white/5 text-[10px] font-mono">
          <span className="text-slate-500">GAIN:</span>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <span className="text-sky-300 font-bold">{sensitivity.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
};
