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
  ShieldAlert,
  ShieldCheck,
  VolumeX,
  Terminal,
  Copy,
  Check,
  Eye,
  EyeOff,
  Camera,
  Maximize2,
  Scan,
  UserCheck,
  Sun,
  Palette,
  Shuffle,
  Gauge,
  Ear,
  SlidersHorizontal,
  Send,
} from "lucide-react";
import { ChatMessage, JarvisState, NoiseEliminationConfig, VoiceInterceptionConfig } from "../types";
import { SoundFX } from "../utils/soundEffects";
import { voiceManager } from "../utils/voiceManager";
import { opticVisionManager, OpticVisionState } from "../utils/opticVisionManager";
import { themeManager, JarvisTheme } from "../utils/themeManager";
import { GmailInboxCard } from "./GmailInboxCard";
import { GoogleDocCard } from "./GoogleDocCard";
import { GoogleMeetCard } from "./GoogleMeetCard";
import { FormFillTelemetryCard } from "./FormFillTelemetryCard";
import { RoomSentryGuardCard } from "./RoomSentryGuardCard";
import { ClapWakeCard } from "./ClapWakeCard";

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
  onOpenVoiceSettings?: () => void;
  onOpenThemeLibrary?: () => void;
  onOpenRealTab?: (url: string, name?: string) => void;
  onPlayYouTube?: (query: string) => void;
  onSendMessage?: (text: string, isVoice?: boolean) => void;
  onOpenVisionHUD?: () => void;
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
  onOpenVoiceSettings,
  onOpenThemeLibrary,
  onOpenRealTab,
  onPlayYouTube,
  onSendMessage,
  onOpenVisionHUD,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const miniCamRef = useRef<HTMLVideoElement | null>(null);

  const [activeVisMode, setActiveVisMode] = useState<VisualizerMode>("holographic_matrix");
  const [sensitivity, setSensitivity] = useState<number>(1.2);
  const [showTranscriptStream, setShowTranscriptStream] = useState<boolean>(true);
  const [visionState, setVisionState] = useState<OpticVisionState>(opticVisionManager.getState());
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());

  // Background Noise Elimination & Voice Interception States
  const [noiseConfig, setNoiseConfig] = useState<NoiseEliminationConfig>(() => voiceManager.getNoiseConfig());
  const [interceptionConfig, setInterceptionConfig] = useState<VoiceInterceptionConfig>(() => voiceManager.getInterceptionConfig());
  const [interceptionAlert, setInterceptionAlert] = useState<{ timestamp: string; reason: string } | null>(null);
  const [isCalibratingNoise, setIsCalibratingNoise] = useState(false);
  const [calibrationSuccess, setCalibrationSuccess] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(() => voiceManager.getIsPermissionDenied());
  const [typedCommand, setTypedCommand] = useState("");
  const [isRequestingMic, setIsRequestingMic] = useState(false);

  // Subscribe to themeManager
  useEffect(() => {
    const unsub = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });
    return () => unsub();
  }, []);

  // Subscribe to voiceManager for noise gate and interception updates
  useEffect(() => {
    const unsub = voiceManager.subscribe(() => {
      setNoiseConfig(voiceManager.getNoiseConfig());
      setInterceptionConfig(voiceManager.getInterceptionConfig());
      setPermissionDenied(voiceManager.getIsPermissionDenied());
    });

    voiceManager.onInterception((ev) => {
      setInterceptionAlert(ev);
      setTimeout(() => {
        setInterceptionAlert(null);
      }, 4500);
    });

    return () => {
      unsub();
    };
  }, []);

  const handleGrantMicPermission = async () => {
    setIsRequestingMic(true);
    SoundFX.playComputeChime();
    const success = await voiceManager.requestMicrophoneAccess();
    setIsRequestingMic(false);
    setPermissionDenied(!success);
  };

  const handleSendManualCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCommand.trim() || isProcessing) return;
    SoundFX.playComputeChime();
    onSendMessage(typedCommand.trim(), false);
    setTypedCommand("");
  };

  const handleToggleNoiseElimination = () => {
    SoundFX.playTargetClick();
    const nextVal = !noiseConfig.enabled;
    voiceManager.setNoiseConfig({ enabled: nextVal });
    setNoiseConfig(voiceManager.getNoiseConfig());
  };

  const handleToggleInterception = () => {
    SoundFX.playTargetClick();
    const nextVal = !interceptionConfig.enabled;
    voiceManager.setInterceptionConfig({ enabled: nextVal });
    setInterceptionConfig(voiceManager.getInterceptionConfig());
  };

  const handleQuickCalibrateNoise = async () => {
    setIsCalibratingNoise(true);
    setCalibrationSuccess(null);
    try {
      const newGate = await voiceManager.calibrateNoiseFloor();
      setCalibrationSuccess(newGate);
      setTimeout(() => setCalibrationSuccess(null), 4000);
    } catch (e) {
      console.warn("Noise calibration error", e);
    } finally {
      setIsCalibratingNoise(false);
    }
  };

  // Subscribe to opticVisionManager
  useEffect(() => {
    const unsub = opticVisionManager.subscribe((vState) => {
      setVisionState(vState);
    });
    return () => unsub();
  }, []);

  // Bind stream to miniCamRef when active
  useEffect(() => {
    if (miniCamRef.current && visionState.isActive) {
      const stream = opticVisionManager.getStream();
      if (stream && miniCamRef.current.srcObject !== stream) {
        miniCamRef.current.srcObject = stream;
        miniCamRef.current.play().catch(() => {});
      }
    }
  }, [visionState.isActive]);

  const handleToggleOptic = async () => {
    SoundFX.playComputeChime();
    await opticVisionManager.toggleOpticVision();
  };

  const handleScanUser = async () => {
    SoundFX.playComputeChime();
    await opticVisionManager.analyzeCurrentFrame("look_at_me");
  };

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
    { label: "🎨 Switch to Mark 42", prompt: "Jarvis, change theme to Mark 42" },
    { label: "🌲 Stealth Recon UI", prompt: "Jarvis, switch theme to Stealth Recon" },
    { label: "⚡ Hulkbuster Orange", prompt: "Jarvis, set theme to Hulkbuster" },
    { label: "🔮 Cosmic Valkyrie", prompt: "Jarvis, change theme to Valkyrie" },
    { label: "👏 Test Clap Wake", prompt: "Jarvis, enable clap to wake and test my microphone" },
    { label: "Arm Room Sentry (Away)", prompt: "Jarvis, monitor my room and keep an eye on it while I am away" },
    { label: "Can You See Me?", prompt: "Jarvis, can you see me right now?" },
    { label: "Look at Me & My Posture", prompt: "Jarvis, look at me and check my posture and lighting" },
    { label: "What Am I Holding?", prompt: "Jarvis, what am I holding in front of the camera?" },
    { label: "Fill Form on XYZ", prompt: "Jarvis, fill form on xyz website and login with my account" },
    { label: "Start Google Meet", prompt: "Jarvis, start a google meet for Tactical Briefing" },
    { label: "Make a Doc for Me", prompt: "Jarvis, make a document for me on Executive Strategy and System Roadmap" },
    { label: "Check My Gmail", prompt: "Jarvis, check my gmail inbox" },
    { label: "Interstellar in 4K", prompt: "Jarvis, play Hans Zimmer Interstellar in 4K" },
    { label: "Morning Briefing", prompt: "Jarvis, give me my morning productivity briefing" },
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
          FLASHING VOICE INTERCEPTION (BARGE-IN) ALERT NOTIFICATION
          ----------------------------------------------------------- */}
      {interceptionAlert && (
        <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-2 border-amber-400/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(251,191,36,0.4)] animate-pulse flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black tracking-widest text-amber-300 uppercase">
                  ⚡ VOICE INTERCEPTION DETECTED (BARGE-IN)
                </span>
                <span className="text-[10px] font-mono text-slate-300">[{interceptionAlert.timestamp}]</span>
              </div>
              <p className="text-xs font-mono text-slate-200">
                Speech synthesis halted immediately • Microphone re-armed for Sir Zain's command
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300 uppercase shrink-0">
            CUT-THROUGH ACTIVE
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------
          BACKGROUND NOISE ELIMINATION & VOICE INTERCEPTION HUD POD
          ----------------------------------------------------------- */}
      <div
        id="noise-elimination-hud-pod"
        className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3.5 relative overflow-hidden transition-all duration-300"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${noiseConfig.enabled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-500"}`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Noise Elimination & Voice Interception
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${noiseConfig.enabled ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-slate-800 border-white/10 text-slate-400"}`}>
                  {noiseConfig.enabled ? "DSP FILTER ACTIVE" : "BYPASSED"}
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${interceptionConfig.enabled ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-slate-800 border-white/10 text-slate-400"}`}>
                  {interceptionConfig.enabled ? "INTERCEPTION ARMED" : "INTERCEPTION OFF"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Filters background voices, AC hum, and room noise so JARVIS only hears you • Barge-in interruption enabled
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="calibrate-room-noise-quick-btn"
              type="button"
              onClick={handleQuickCalibrateNoise}
              disabled={isCalibratingNoise || !noiseConfig.enabled}
              className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="Measure room background noise for 1.5 seconds and auto-tune noise gate threshold"
            >
              <Gauge className={`w-3.5 h-3.5 ${isCalibratingNoise ? "animate-spin text-sky-400" : "text-sky-400"}`} />
              <span>{isCalibratingNoise ? "CALIBRATING (1.5s)..." : "AUTO-CALIBRATE ROOM"}</span>
            </button>

            {onOpenVoiceSettings && (
              <button
                onClick={() => {
                  SoundFX.playComputeChime();
                  onOpenVoiceSettings();
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Full Voice & Noise Elimination Settings"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>CALIBRATE</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Gate Meter & Status Bar */}
        <div className="bg-[#050508] border border-white/5 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">VOICE LEVEL:</span>
                <span className="font-bold text-sky-400">{noiseConfig.currentVoiceLevel}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">GATE THRESHOLD:</span>
                <span className="font-bold text-amber-400">{noiseConfig.gateThreshold}%</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-slate-500">PROFILE:</span>
                <span className="font-bold text-slate-300 uppercase">{noiseConfig.suppressionLevel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all ${
                noiseConfig.gateActive
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                  : "bg-slate-800 text-slate-400 border-white/10"
              }`}>
                {noiseConfig.gateActive ? "GATE: OPEN (VOICE PASSED)" : "GATE: CLOSED (ATTENUATING BACKGROUND)"}
              </span>
            </div>
          </div>

          {/* VU Energy Meter Bar */}
          <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
            {/* Gate Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
              style={{ left: `${noiseConfig.gateThreshold}%` }}
            />
            {/* Live Audio Energy */}
            <div
              className={`h-full transition-all duration-75 ${
                noiseConfig.currentVoiceLevel >= noiseConfig.gateThreshold
                  ? "bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-300"
                  : "bg-slate-700"
              }`}
              style={{ width: `${Math.min(100, noiseConfig.currentVoiceLevel)}%` }}
            />
          </div>

          {calibrationSuccess !== null && (
            <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1 flex items-center gap-1.5 font-mono">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Room silence measured! Noise gate calibrated to {calibrationSuccess}%. Ambient room noise will be ignored.</span>
            </div>
          )}
        </div>

        {/* Quick Toggles Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={handleToggleNoiseElimination}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              noiseConfig.enabled
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            <span>NOISE FILTER</span>
            <span className="font-bold text-[10px]">{noiseConfig.enabled ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleInterception}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              interceptionConfig.enabled
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            <span>INTERCEPTION</span>
            <span className="font-bold text-[10px]">{interceptionConfig.enabled ? "ARMED" : "OFF"}</span>
          </button>

          <div className="bg-[#050508] p-2 rounded-xl border border-white/5 flex items-center justify-between text-slate-400">
            <span>ISOLATION</span>
            <span className="font-bold text-emerald-400 text-[10px]">{noiseConfig.voiceIsolation ? "ACTIVE" : "OFF"}</span>
          </div>

          <div className="bg-[#050508] p-2 rounded-xl border border-white/5 flex items-center justify-between text-slate-400">
            <span>BARGE-INS</span>
            <span className="font-bold text-sky-400 text-[10px]">{interceptionConfig.totalInterceptions} CUTS</span>
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

          {/* Interactive Gmail Inbox Telemetry HUD */}
          {latestJarvisMessage.gmailTelemetry && (
            <div className="mt-2 pl-8">
              <GmailInboxCard
                telemetry={latestJarvisMessage.gmailTelemetry}
                onLaunchTab={onOpenRealTab}
              />
            </div>
          )}

          {/* Interactive Google Docs Telemetry HUD */}
          {latestJarvisMessage.googleDocTelemetry && (
            <div className="mt-2 pl-8">
              <GoogleDocCard
                telemetry={latestJarvisMessage.googleDocTelemetry}
                onLaunchTab={onOpenRealTab}
              />
            </div>
          )}

          {/* Interactive Google Meet Space Telemetry HUD */}
          {latestJarvisMessage.googleMeetTelemetry && (
            <div className="mt-2 pl-8">
              <GoogleMeetCard
                telemetry={latestJarvisMessage.googleMeetTelemetry}
                onLaunchTab={onOpenRealTab}
              />
            </div>
          )}

          {/* Interactive Form Fill & Login Telemetry HUD */}
          {latestJarvisMessage.formFillTelemetry && (
            <div className="mt-2 pl-8">
              <FormFillTelemetryCard
                telemetry={latestJarvisMessage.formFillTelemetry}
                onLaunchTab={onOpenRealTab}
              />
            </div>
          )}
        </div>
      )}

      {/* -----------------------------------------------------------
          J.A.R.V.I.S. MULTI-THEME UI MATRIX (10 Holographic UIs)
          ----------------------------------------------------------- */}
      <div
        id="jarvis-theme-quick-pod"
        className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden transition-all duration-300"
        style={{ borderColor: currentTheme.primaryColor + "40" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: currentTheme.primaryColor + "20",
                color: currentTheme.primaryColor,
              }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Stark Theme Matrix
                </span>
                <span
                  className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    backgroundColor: currentTheme.primaryColor + "25",
                    color: currentTheme.secondaryColor,
                  }}
                >
                  {currentTheme.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                20 Distinct Holographic UIs • Say: "Jarvis, change theme to [Name]"
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => themeManager.cycleNextTheme()}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Cycle to next UI theme"
            >
              <Shuffle className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Next UI</span>
            </button>

            {onOpenThemeLibrary && (
              <button
                onClick={() => {
                  SoundFX.playComputeChime();
                  onOpenThemeLibrary();
                }}
                className="px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-white shadow-sm flex items-center gap-1"
                style={{
                  backgroundColor: currentTheme.primaryColor,
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>All 20 Themes</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Swatch Bar (All 20 Themes) */}
        <div className="grid grid-cols-4 sm:grid-cols-10 gap-1.5 pt-1">
          {themeManager.getAllThemes().map((t) => {
            const isSelected = t.id === currentTheme.id;
            return (
              <button
                key={t.id}
                onClick={() => themeManager.setTheme(t.id)}
                title={`${t.name} (${t.suitArchetype})`}
                className={`group relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white/15 shadow-md scale-[1.03]"
                    : "bg-[#06080d] hover:bg-white/5 border-white/5 hover:border-white/20"
                }`}
                style={{
                  borderColor: isSelected ? t.primaryColor : undefined,
                  boxShadow: isSelected ? `0 0 10px ${t.primaryColor}50` : undefined,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/40 shadow-inner shrink-0"
                  style={{ backgroundColor: t.primaryColor }}
                />
                <span className="text-[8.5px] font-mono text-slate-400 truncate max-w-full group-hover:text-white">
                  {t.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -----------------------------------------------------------
          ACOUSTIC CLAP-TO-WAKE CONTROL POD
          ----------------------------------------------------------- */}
      <ClapWakeCard />

      {/* -----------------------------------------------------------
          AUTONOMOUS ROOM SENTRY & INTRUDER PERIMETER GUARD
          ----------------------------------------------------------- */}
      <RoomSentryGuardCard />

      {/* -----------------------------------------------------------
          ACTIVE OPTIC EYE TELEMETRY POD (JARVIS Visual Awareness)
          ----------------------------------------------------------- */}
      <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                visionState.isActive ? "bg-sky-400 animate-ping" : "bg-slate-600"
              }`}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              {visionState.isActive ? "Optic Vision Eye: Active & Watching" : "Optic Vision Sensor: Standby"}
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
              [{visionState.isActive ? "STARK-OPTIC-STREAM-LIVE" : "CAMERA-OFFLINE"}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleOptic}
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                visionState.isActive
                  ? "bg-sky-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {visionState.isActive ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Disable Vision</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enable Optic Eye</span>
                </>
              )}
            </button>

            {visionState.isActive && onOpenVisionHUD && (
              <button
                onClick={onOpenVisionHUD}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-sky-400 border border-white/10 transition-colors"
                title="Expand Full Holographic Air Canvas HUD"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Camera Viewport & Real-time Biometrics Strip */}
        {visionState.isActive ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-[#050507] p-3 rounded-xl border border-sky-500/20">
            {/* Mini Live Video Feed */}
            <div className="relative w-full h-32 md:h-28 rounded-lg overflow-hidden border border-sky-500/30 bg-black flex items-center justify-center">
              <video
                ref={miniCamRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute top-1 left-2 font-mono text-[9px] bg-black/70 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30">
                LIVE OPTIC STREAM
              </div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 border border-dashed border-sky-400/40 rounded-full" />
              </div>
            </div>

            {/* Live Telemetry Attributes */}
            <div className="md:col-span-2 flex flex-col justify-between h-full gap-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">POSTURE:</span>
                  <span className="font-bold text-sky-300">{visionState.biometrics.postureStatus}</span>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">GAZE:</span>
                  <span className="font-bold text-emerald-300">{visionState.biometrics.gazeDirection}</span>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">LIGHTING:</span>
                  <span className="font-bold text-amber-300">{visionState.biometrics.ambientLux} LM</span>
                </div>
                <div className="bg-black/50 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400">THREAT:</span>
                  <span className="font-bold text-emerald-400">{visionState.biometrics.threatLevel}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 italic">
                  JARVIS sees you continuously while conversing. Ask "Can you see me?" or "What am I holding?".
                </span>
                <button
                  onClick={handleScanUser}
                  disabled={visionState.isAnalyzing}
                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>{visionState.isAnalyzing ? "Scanning..." : "Deep Scan"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 font-mono">
            Enable Optic Eye so JARVIS can view your workspace, recognize items in your hands, check your posture, and maintain visual contact while talking to you.
          </p>
        )}
      </div>

      {/* -----------------------------------------------------------
          MICROPHONE PERMISSION RE-ARM BANNER (If Denied or Blocked)
          ----------------------------------------------------------- */}
      {permissionDenied && (
        <div className="bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-rose-500/20 border border-rose-500/60 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shrink-0 shadow-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider block">
                Microphone Access Required
              </span>
              <p className="text-xs font-mono text-slate-300">
                Browser blocked audio access. Click below to grant permission or type commands directly.
              </p>
            </div>
          </div>
          <button
            onClick={handleGrantMicPermission}
            disabled={isRequestingMic}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs font-mono transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Mic className="w-4 h-4" />
            <span>{isRequestingMic ? "Requesting..." : "Enable Microphone"}</span>
          </button>
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
          DIRECT COMMAND DISPATCH & KEYBOARD INPUT BAR
          ----------------------------------------------------------- */}
      <form
        onSubmit={handleSendManualCommand}
        className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 shadow-xl backdrop-blur-md"
      >
        <div className="pl-2.5 text-slate-500">
          <Terminal className="w-4 h-4 text-sky-400" />
        </div>
        <input
          type="text"
          value={typedCommand}
          onChange={(e) => setTypedCommand(e.target.value)}
          placeholder={
            isListening
              ? "Speak or type command (e.g. 'Jarvis, check my schedule' or 'Play lofi')..."
              : "Type a command or press spacebar to speak..."
          }
          className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm font-mono placeholder:text-slate-500 focus:outline-none px-2"
        />
        <button
          type="button"
          onClick={onToggleVoice}
          title={isListening ? "Listening active (Click to mute)" : "Click to speak"}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isListening
              ? "bg-sky-500/20 text-sky-300 border-sky-400 animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.3)]"
              : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
          }`}
        >
          {isListening ? <Mic className="w-4 h-4 text-sky-400" /> : <MicOff className="w-4 h-4" />}
        </button>
        <button
          type="submit"
          disabled={!typedCommand.trim() || isProcessing}
          className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-black font-bold text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

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
