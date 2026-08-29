import React, { useState } from "react";
import {
  Video,
  Mic,
  Copy,
  Check,
  ExternalLink,
  Users,
  Clock,
  Sparkles,
  Plus,
  Share2,
  Radio,
  X,
  PhoneCall,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { GoogleMeetTelemetry } from "../types";
import { createGoogleMeetSpace, getRecentMeetings } from "../utils/meetManager";
import { signInWithGoogle } from "../lib/firebase";
import { SoundFX } from "../utils/soundEffects";

interface GoogleMeetCardProps {
  telemetry: GoogleMeetTelemetry;
  onRefresh?: (updated: GoogleMeetTelemetry) => void;
  onLaunchTab?: (url: string, title?: string) => void;
}

export const GoogleMeetCard: React.FC<GoogleMeetCardProps> = ({
  telemetry: initialTelemetry,
  onRefresh,
  onLaunchTab,
}) => {
  const [telemetry, setTelemetry] = useState<GoogleMeetTelemetry>(initialTelemetry);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const recentHistory = getRecentMeetings();

  const handleCopyLink = () => {
    SoundFX.playComputeChime();
    navigator.clipboard.writeText(telemetry.meetingUri);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    SoundFX.playComputeChime();
    navigator.clipboard.writeText(telemetry.meetingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinMeeting = (uri?: string, topic?: string) => {
    SoundFX.playStepComplete();
    const targetUrl = uri || telemetry.meetingUri || "https://meet.google.com";
    const meetingTitle = topic || telemetry.topic || "Google Meet Conference";
    if (onLaunchTab) {
      onLaunchTab(targetUrl, meetingTitle);
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      const updated = await createGoogleMeetSpace(telemetry.topic || "Tactical Conference");
      setTelemetry(updated);
      if (onRefresh) onRefresh(updated);
    } catch (e) {
      console.error("Sign-in failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setIsLoading(true);
    setIsModalOpen(false);

    try {
      const res = await createGoogleMeetSpace(newTopic.trim());
      setTelemetry(res);
      if (onRefresh) onRefresh(res);
      setNewTopic("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Required State
  if (telemetry.status === "auth_required") {
    return (
      <div className="mt-3 p-4 rounded-xl bg-[#061214] border border-emerald-500/30 space-y-3 shadow-[0_0_25px_rgba(16,185,129,0.15)] font-mono">
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                GOOGLE MEET SECURE GATEWAY
              </h4>
              <p className="text-[10px] text-emerald-400">Workspace Video Conference OAuth</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
            AUTHENTICATION NEEDED
          </span>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          JARVIS requires Google Workspace authorization to create instant virtual conference spaces and video uplink channels via Google Meet.
        </p>

        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs shadow-md transition-all cursor-pointer font-sans"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{isLoading ? "Establishing Uplink..." : "Sign in with Google to Launch Meet"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleJoinMeeting("https://meet.google.com/new", "Instant Meet")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-mono text-xs border border-emerald-500/30 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open meet.google.com</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Meeting Room HUD Card
  return (
    <div className="mt-3 rounded-xl bg-[#041014] border border-emerald-500/40 overflow-hidden shadow-[0_0_35px_rgba(16,185,129,0.2)] font-sans">
      {/* Top Banner */}
      <div className="p-3.5 bg-gradient-to-r from-[#061C22] to-[#0A2E35] border-b border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Video className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono tracking-wider">
                GOOGLE MEET LIVE SPACE
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-[420px]">
              {telemetry.topic || "Command Briefing"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleJoinMeeting()}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 fill-current" />
            <span>Join Call</span>
          </button>
        </div>
      </div>

      {/* Conference Room Details Bar */}
      <div className="p-3.5 bg-black/60 border-b border-white/5 space-y-3 font-mono">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Meeting Link Box */}
          <div className="p-2.5 rounded-lg bg-[#07191C] border border-emerald-500/20 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Meeting Link</span>
              <p className="text-xs text-emerald-300 font-bold truncate">
                {telemetry.meetingUri}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy Meeting URL"
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Meeting Passcode / Space Code Box */}
          <div className="p-2.5 rounded-lg bg-[#07191C] border border-emerald-500/20 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Meeting Code</span>
              <p className="text-xs text-emerald-300 font-bold tracking-widest uppercase truncate">
                {telemetry.meetingCode}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              title="Copy Code"
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Telemetry Hardware Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <Video className="w-3 h-3" />
              <span>HD Video Ready</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Mic className="w-3 h-3" />
              <span>Audio Uplink Active</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{new Date(telemetry.createdAt || Date.now()).toLocaleTimeString()}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New Meeting</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Quick Launcher */}
      <div className="p-2.5 bg-[#030C0E] border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 text-[11px] truncate">
          Room Status: <span className="text-emerald-400">Ready for participants</span>
        </span>
        <button
          type="button"
          onClick={() => handleJoinMeeting()}
          className="text-emerald-300 hover:text-white text-xs inline-flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>Open Room</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New Meeting Setup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewMeeting}
            className="w-full max-w-md bg-[#051417] border border-emerald-500/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.25)] font-sans"
          >
            <div className="p-3.5 bg-[#082025] border-b border-emerald-500/20 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <Video className="w-4 h-4" />
                <h3 className="text-xs font-bold text-white">INITIALIZE GOOGLE MEET</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Meeting Topic / Conference Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Architecture Sync"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTopic.trim() || isLoading}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Generating Space..." : "Launch Space"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
