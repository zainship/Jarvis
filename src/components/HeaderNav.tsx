import React, { useEffect, useState } from "react";
import {
  Globe,
  Radio,
  Calendar,
  Search,
  Volume2,
  VolumeX,
  Activity,
  Shield,
  ShieldCheck,
  ExternalLink,
  Cloud,
  LogOut,
  User as UserIcon,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  Mail,
  FileText,
  Video,
  Palette,
  Layers,
  Heart,
  Satellite,
  Box,
  ShieldAlert,
  Cpu,
  Music,
  Flame,
  ChevronDown,
} from "lucide-react";
import { SoundFX } from "../utils/soundEffects";
import { themeManager, JarvisTheme } from "../utils/themeManager";
import { auth, signInWithGoogle, signOutUser } from "../lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { JarvisInterfaceId } from "../types";
import { JARVIS_INTERFACES } from "../utils/interfacesRegistry";

interface HeaderNavProps {
  activeTab: "core" | "productivity" | "research";
  setActiveTab: (tab: "core" | "productivity" | "research") => void;
  activeInterface: JarvisInterfaceId;
  setActiveInterface: (iface: JarvisInterfaceId) => void;
  onOpenInterfaceSelector: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isListening: boolean;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenVoiceSettings: () => void;
  onOpenThemeLibrary?: () => void;
  isVisionOpen: boolean;
  onToggleVision: () => void;
  onCheckGmail?: () => void;
  onOpenDocs?: () => void;
  onOpenMeet?: () => void;
  onOpenShadowTalk?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  activeInterface,
  setActiveInterface,
  onOpenInterfaceSelector,
  isMuted,
  setIsMuted,
  isListening,
  isFocusMode,
  onToggleFocusMode,
  onOpenVoiceSettings,
  onOpenThemeLibrary,
  isVisionOpen,
  onToggleVision,
  onCheckGmail,
  onOpenDocs,
  onOpenMeet,
  onOpenShadowTalk,
}) => {
  const [time, setTime] = useState("");
  const [utcTime, setUtcTime] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());

  useEffect(() => {
    const unsubTheme = themeManager.subscribe((t) => {
      setCurrentTheme(t);
    });

    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
      setUtcTime(now.toUTCString().slice(17, 25) + " UTC");
    };
    update();
    const interval = setInterval(update, 1000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });

    return () => {
      unsubTheme();
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleInterfaceChange = (ifaceId: JarvisInterfaceId) => {
    SoundFX.playTargetClick();
    setActiveInterface(ifaceId);
    if (ifaceId === "productivity") setActiveTab("productivity");
    else if (ifaceId === "quantum") setActiveTab("research");
    else setActiveTab("core");
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    SoundFX.setEnabled(!next);
  };

  const currentIfaceMeta = JARVIS_INTERFACES.find((i) => i.id === activeInterface) || JARVIS_INTERFACES[0];

  const handleGoogleAuth = async () => {
    SoundFX.playComputeChime();
    try {
      if (currentUser) {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (e) {
      console.error("Auth action failed:", e);
    }
  };

  return (
    <header
      id="jarvis-header-nav"
      className="w-full bg-[#050506]/95 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 select-none shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
    >
      {/* Brand & Identity in Sophisticated Dark Serif Italic */}
      <div className="flex items-center gap-3.5">
        <div
          id="jarvis-logo-badge"
          className="relative w-10 h-10 rounded-xl bg-[#0A0A0C] border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(14,165,233,0.15)]"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_12px_#0ea5e9]" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] tracking-[0.3em] uppercase text-sky-500 font-bold mb-0.5">
            System Core
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-serif italic text-white tracking-tight">
              J.A.R.V.I.S.
            </h1>
            <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono">
              10 UIs
            </span>
          </div>
        </div>
      </div>

      {/* 10 Operational Interfaces Switcher Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0A0A0C] border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
        {/* All 10 Interfaces Matrix Launcher Modal Button */}
        <button
          id="open-interfaces-matrix-btn"
          onClick={() => {
            SoundFX.playComputeChime();
            onOpenInterfaceSelector();
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
          style={{
            backgroundColor: currentTheme.primaryColor + "25",
            borderColor: currentTheme.primaryColor + "60",
            color: currentTheme.secondaryColor,
            borderWidth: "1px",
          }}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>10 WORKSTATIONS</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />

        {/* Quick Access Top Interface Pills */}
        {(
          [
            { id: "core", label: "Core", icon: Radio },
            { id: "armor", label: "Armor", icon: Shield },
            { id: "satellite", label: "Radar", icon: Satellite },
            { id: "vitals", label: "Vitals", icon: Heart },
            { id: "schematics", label: "CAD Lab", icon: Box },
            { id: "security", label: "Sentry", icon: ShieldAlert },
            { id: "quantum", label: "Quantum", icon: Cpu },
            { id: "productivity", label: "Workspace", icon: Calendar },
            { id: "media", label: "Media", icon: Music },
            { id: "veronica", label: "Veronica", icon: Flame },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const isActive = activeInterface === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleInterfaceChange(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white/15 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              style={{
                color: isActive ? currentTheme.secondaryColor : undefined,
                borderColor: isActive ? currentTheme.primaryColor + "60" : "transparent",
                borderWidth: "1px",
              }}
            >
              <Icon className="w-3 h-3" style={{ color: isActive ? currentTheme.primaryColor : undefined }} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Telemetry & Controls */}
      <div className="flex items-center gap-2.5">
        {/* ShadowTalk Project Specialized Browser Workflow Button */}
        {onOpenShadowTalk && (
          <button
            id="shadowtalk-header-btn"
            onClick={() => {
              SoundFX.playComputeChime();
              onOpenShadowTalk();
            }}
            title="Launch ShadowTalk Specialized Browser Workflow — Primary Repository & Project Hub (Zain Ahmed & Fahad Patel, Karachi)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-950/40 border border-violet-500/50 hover:border-violet-400 hover:bg-violet-900/40 text-violet-200 text-xs font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)] group hover:scale-[1.02]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-violet-300">SHADOWTALK</span>
            <ExternalLink className="w-3 h-3 text-violet-400/80" />
          </button>
        )}

        {/* Gmail Workspace Comm Feed Button */}
        {onCheckGmail && (
          <button
            id="gmail-header-btn"
            onClick={() => {
              SoundFX.playComputeChime();
              onCheckGmail();
            }}
            title="Scan & Retrieve Live Gmail Influx"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-950/30 border border-red-500/30 hover:border-red-400/60 hover:bg-red-900/30 text-red-300 text-xs font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.15)]"
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden lg:inline font-bold">GMAIL</span>
          </button>
        )}

        {/* Google Docs Fast Access Button */}
        {onOpenDocs && (
          <button
            id="docs-header-btn"
            onClick={() => {
              SoundFX.playComputeChime();
              onOpenDocs();
            }}
            title="Create or Manage Google Docs in Google Drive"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-950/30 border border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-900/30 text-blue-300 text-xs font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.15)]"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline font-bold">DOCS</span>
          </button>
        )}

        {/* Google Meet Video Uplink Button */}
        {onOpenMeet && (
          <button
            id="meet-header-btn"
            onClick={() => {
              SoundFX.playComputeChime();
              onOpenMeet();
            }}
            title="Launch Instant Google Meet Video Conference"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400/60 hover:bg-emerald-900/30 text-emerald-300 text-xs font-mono tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline font-bold">MEET</span>
          </button>
        )}

        {/* Firebase Cloud Sync Status */}
        <div
          id="firestore-cloud-status"
          title="Google Cloud Firestore Real-time Persistence: Active"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono tracking-wider"
        >
          <Cloud className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>FIRESTORE SYNC</span>
        </div>

        {/* Commander Google Auth Profile Button */}
        <button
          id="google-auth-btn"
          onClick={handleGoogleAuth}
          disabled={isAuthLoading}
          title={currentUser ? `Signed in as ${currentUser.displayName || currentUser.email} (Click to Sign Out)` : "Sign in with Google to sync intelligence to Firestore"}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
            currentUser
              ? "bg-[#0A0A0C] border-sky-500/40 text-sky-300 hover:border-rose-500/50 hover:text-rose-300"
              : "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
          }`}
        >
          {currentUser ? (
            <>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Commander Avatar"
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full border border-sky-400/50"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span className="truncate max-w-[100px] text-[11px]">
                {currentUser.displayName?.split(" ")[0] || "Commander"}
              </span>
              <LogOut className="w-3 h-3 opacity-60 ml-0.5" />
            </>
          ) : (
            <>
              <UserIcon className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-bold">GOOGLE SIGN IN</span>
            </>
          )}
        </button>

        {/* Real-time Clock */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500 bg-[#0A0A0C] px-3 py-1.5 rounded-full border border-white/5">
          <Activity className="w-3 h-3 text-sky-400" />
          <span className="text-slate-400">{time}</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">{utcTime}</span>
        </div>

        {/* Optic Vision Sensors / Hand Tracking & Air Draw Toggle Button */}
        <button
          id="optic-vision-toggle-btn"
          onClick={() => {
            SoundFX.playComputeChime();
            onToggleVision();
          }}
          title={isVisionOpen ? "Disengage Optic Camera HUD & Air Canvas" : "Activate Hand Tracking & Holographic Air Draw (Vision HUD)"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
            isVisionOpen
              ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse"
              : "bg-[#0A0A0C] border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40"
          }`}
        >
          <Eye className={`w-3.5 h-3.5 ${isVisionOpen ? "text-cyan-400 animate-spin" : "text-cyan-400"}`} />
          <span className="hidden sm:inline font-semibold">OPTICS & AIR DRAW</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isVisionOpen ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-slate-600"}`} />
        </button>

        {/* J.A.R.V.I.S. Multi-Theme Matrix (10 UIs) Button */}
        {onOpenThemeLibrary && (
          <button
            id="theme-matrix-header-btn"
            onClick={() => {
              SoundFX.playComputeChime();
              onOpenThemeLibrary();
            }}
            title="Open J.A.R.V.I.S. Theme Matrix — Choose from 10 distinct Stark UI themes"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border cursor-pointer group"
            style={{
              backgroundColor: currentTheme.primaryColor + "15",
              borderColor: currentTheme.primaryColor + "50",
              color: currentTheme.secondaryColor,
              boxShadow: `0 0 12px ${currentTheme.primaryColor}25`,
            }}
          >
            <Palette className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" style={{ color: currentTheme.primaryColor }} />
            <span className="font-bold">THEME</span>
            <span
              className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase hidden md:inline"
              style={{
                backgroundColor: currentTheme.primaryColor + "30",
                color: "#ffffff",
              }}
            >
              {currentTheme.name.split(" ")[0]}
            </span>
          </button>
        )}

        {/* Voice Synthesis Calibration / Tuning Button */}
        <button
          id="voice-settings-toggle-btn"
          onClick={() => {
            SoundFX.playComputeChime();
            onOpenVoiceSettings();
          }}
          title="Voice Synthesis & Noise Elimination Settings — Customize JARVIS Pitch, Noise Gate & Interception"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0A0C] border border-white/10 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 transition-all text-xs font-mono group cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden md:inline font-semibold">VOICE & NOISE GATE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" title="Noise Gate & Interception Armed" />
        </button>

        {/* Mute Audio Button */}
        <button
          id="toggle-audio-mute-btn"
          onClick={toggleMute}
          title={isMuted ? "Unmute Audio FX & Voice" : "Mute Audio FX & Voice"}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
            isMuted
              ? "bg-rose-950/40 border-rose-800/50 text-rose-400"
              : "bg-[#0A0A0C] border-white/10 text-white/60 hover:text-white hover:border-white/20"
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Focus Mode Toggle Button */}
        <button
          id="focus-mode-btn"
          onClick={() => {
            SoundFX.playComputeChime();
            onToggleFocusMode();
          }}
          title={isFocusMode ? "Exit Focus Mode (Esc or F)" : "Enter Focus Mode — Minimizes non-essential UI elements to keep only Arc Reactor & Voice Console (F)"}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
            isFocusMode
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse"
              : "bg-[#0A0A0C] border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/60"
          }`}
        >
          {isFocusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold tracking-wider">EXIT FOCUS</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold tracking-wider hidden sm:inline">FOCUS MODE</span>
              <span className="text-[10px] opacity-60 hidden md:inline px-1 py-0.2 rounded bg-white/5 border border-white/10">F</span>
            </>
          )}
        </button>

        {/* Voice Sensor Status Pill */}
        <div
          id="voice-sensor-indicator"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider border transition-all ${
            isListening
              ? "bg-sky-500/10 border-sky-500/40 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.2)]"
              : "bg-[#0A0A0C] border-white/10 text-slate-500"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isListening ? "bg-sky-400 animate-ping" : "bg-slate-600"
            }`}
          />
          <span>{isListening ? "LISTENING" : "STANDBY"}</span>
        </div>
      </div>
    </header>
  );
};

