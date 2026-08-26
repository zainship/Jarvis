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
  Cloud,
  LogOut,
  User as UserIcon,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
} from "lucide-react";
import { SoundFX } from "../utils/soundEffects";
import { auth, signInWithGoogle, signOutUser } from "../lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

interface HeaderNavProps {
  activeTab: "core" | "productivity" | "research";
  setActiveTab: (tab: "core" | "productivity" | "research") => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isListening: boolean;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenVoiceSettings: () => void;
  isVisionOpen: boolean;
  onToggleVision: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  setIsMuted,
  isListening,
  isFocusMode,
  onToggleFocusMode,
  onOpenVoiceSettings,
  isVisionOpen,
  onToggleVision,
}) => {
  const [time, setTime] = useState("");
  const [utcTime, setUtcTime] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
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
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleTabChange = (tab: "core" | "productivity" | "research") => {
    SoundFX.playTargetClick();
    setActiveTab(tab);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    SoundFX.setEnabled(!next);
  };

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
      className="w-full bg-[#050506]/95 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 select-none shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
    >
      {/* Brand & Identity in Sophisticated Dark Serif Italic */}
      <div className="flex items-center gap-4">
        <div
          id="jarvis-logo-badge"
          className="relative w-10 h-10 rounded-xl bg-[#0A0A0C] border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(14,165,233,0.15)]"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_12px_#0ea5e9]" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.4em] uppercase text-sky-500 font-bold mb-0.5">
            System Core
          </span>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif italic text-white tracking-tight">
              J.A.R.V.I.S. V.4
            </h1>
            <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 font-mono">
              AUTONOMOUS
            </span>
          </div>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="hidden lg:flex items-center space-x-6 text-[11px] uppercase tracking-widest text-slate-500 font-mono">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-sky-500 mr-2 shadow-[0_0_8px_#0ea5e9]"></div>
          Core Online
        </div>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isListening ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-emerald-500/50"}`}></div>
          Voice Interface: {isListening ? "Listening" : "Ready"}
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_#f59e0b]"></div>
          Research Engine: Standby
        </div>
      </div>

      {/* Primary Module Navigation Tabs */}
      <nav id="module-nav-tabs" className="flex items-center p-1 rounded-full bg-[#0A0A0C] border border-white/10 backdrop-blur-md">
        <button
          id="tab-core-hud"
          onClick={() => handleTabChange("core")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
            activeTab === "core"
              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-sky-400" />
          <span>VOICE HUD</span>
        </button>

        <button
          id="tab-productivity"
          onClick={() => handleTabChange("productivity")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
            activeTab === "productivity"
              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>PRODUCTIVITY</span>
        </button>

        <button
          id="tab-research"
          onClick={() => handleTabChange("research")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
            activeTab === "research"
              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-sky-400" />
          <span>RESEARCH LAB</span>
        </button>
      </nav>

      {/* Telemetry & Controls */}
      <div className="flex items-center gap-3">
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

        {/* Voice Synthesis Calibration / Tuning Button */}
        <button
          id="voice-settings-toggle-btn"
          onClick={() => {
            SoundFX.playComputeChime();
            onOpenVoiceSettings();
          }}
          title="Voice Synthesis Settings — Customize JARVIS Pitch & Speed"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A0A0C] border border-white/10 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 transition-all text-xs font-mono group"
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden md:inline font-semibold">VOICE TUNING</span>
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

