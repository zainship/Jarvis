import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  ExternalLink,
  Sparkles,
  Globe,
  Bot,
  User,
  Zap,
  Sliders,
  Youtube,
  Play,
  ArrowUpRight,
  Compass,
  Eye,
  Scan,
  Shield,
  Smile,
  Activity,
  Sun,
  Camera,
} from "lucide-react";
import { ChatMessage, YouTubeMedia } from "../types";

interface JarvisConsoleProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  onSpeakMessage: (text: string) => void;
  interimTranscript: string;
  isProcessing: boolean;
  onOpenVoiceSettings?: () => void;
  onOpenRealTab?: (url: string, name?: string) => void;
  onPlayYouTube?: (query: string) => void;
}

export const JarvisConsole: React.FC<JarvisConsoleProps> = ({
  messages,
  onSendMessage,
  isListening,
  onToggleVoice,
  onSpeakMessage,
  interimTranscript,
  isProcessing,
  onOpenVoiceSettings,
  onOpenRealTab,
  onPlayYouTube,
}) => {
  const [inputText, setInputText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const QUICK_COMMANDS = [
    {
      label: "Look at Me (Optic Vision)",
      prompt: "Jarvis, look at me",
      isBrowser: false,
    },
    {
      label: "Check My Posture",
      prompt: "Jarvis, check my posture and energy",
      isBrowser: false,
    },
    {
      label: "Scan My Room",
      prompt: "Jarvis, scan my surroundings and room",
      isBrowser: false,
    },
    {
      label: "Open YouTube",
      prompt: "Jarvis, open YouTube",
      isBrowser: false,
    },
    {
      label: "Open ChatGPT",
      prompt: "Jarvis, open ChatGPT",
      isBrowser: false,
    },
    {
      label: "Open GitHub",
      prompt: "Jarvis, open GitHub",
      isBrowser: false,
    },
    {
      label: "Open Reddit",
      prompt: "Jarvis, open Reddit",
      isBrowser: false,
    },
    {
      label: "Open Netflix",
      prompt: "Jarvis, open Netflix",
      isBrowser: false,
    },
    {
      label: "Open Spotify",
      prompt: "Jarvis, open Spotify",
      isBrowser: false,
    },
    {
      label: "Open Google Maps",
      prompt: "Jarvis, open Google Maps",
      isBrowser: false,
    },
    {
      label: "Search Google",
      prompt: "Jarvis, search Google for latest AI breakthroughs",
      isBrowser: false,
    },
  ];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim(), false);
    setInputText("");
  };

  const handleLaunchTab = (url: string, name?: string) => {
    if (onOpenRealTab) {
      onOpenRealTab(url, name);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div id="jarvis-console-container" className="w-full flex flex-col gap-4">
      {/* Messages Stream Container in Sophisticated Dark Card */}
      <div
        id="jarvis-chat-stream"
        className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-5 min-h-[380px] max-h-[460px] overflow-y-auto space-y-4 shadow-2xl font-sans"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono">
            Autonomous Voice & Neural Log
          </span>
          <div className="flex items-center gap-2">
            {onOpenVoiceSettings && (
              <button
                id="console-voice-tuning-btn"
                type="button"
                onClick={onOpenVoiceSettings}
                title="Voice Synthesis Settings — Customize Pitch & Speed"
                className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-sky-400 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <Sliders className="w-2.5 h-2.5" />
                <span>VOICE TUNING</span>
              </button>
            )}
            <span className="text-[10px] text-sky-500 font-mono">
              GROUNDED MATRIX
            </span>
          </div>
        </div>

        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const hasAction = !!msg.realBrowserAction;
          const action = msg.realBrowserAction;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                  isUser
                    ? "bg-white/5 border-white/10 text-slate-300"
                    : "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs font-mono space-y-2 border transition-all ${
                  isUser
                    ? "bg-white/5 border-white/10 text-slate-200 rounded-tr-sm"
                    : "bg-[#050506] border-white/5 text-slate-300 rounded-tl-sm shadow-md"
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-[10px] text-slate-500 font-mono">
                  <span className="font-semibold text-slate-400">
                    {isUser ? "USER" : "J.A.R.V.I.S."}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* Message Text Body */}
                <p className={`leading-relaxed whitespace-pre-wrap ${!isUser ? "font-serif italic text-[14px] text-white/90" : "font-sans text-xs text-slate-200"}`}>
                  {msg.text}
                </p>

                {/* Real Browser Action Interactive Card (Direct 1-Click Launch) */}
                {hasAction && action && (
                  <div className="mt-3 p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                        <Compass className="w-3 h-3 text-sky-400 animate-spin" />
                        <span>Real Browser Dispatch</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                        READY
                      </span>
                    </div>

                    {/* Open Tab / Search Action */}
                    {action.targetUrl && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-300 font-mono truncate max-w-[240px]">
                          {action.targetUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleLaunchTab(action.targetUrl!, action.query)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-mono shadow-[0_0_15px_rgba(14,165,233,0.4)] transition-all cursor-pointer"
                        >
                          <span>Open in Real Tab</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Real YouTube Media Launcher Card */}
                {msg.youtubeMedia && (
                  <div className="mt-3 p-3 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <span>YouTube Media Stream</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                        CUE READY
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {msg.youtubeMedia.thumbnailUrl && (
                        <img
                          src={msg.youtubeMedia.thumbnailUrl}
                          alt={msg.youtubeMedia.title}
                          className="w-16 h-12 object-cover rounded-lg border border-white/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="overflow-hidden flex-1">
                        <h4 className="text-xs text-white font-medium truncate">
                          {msg.youtubeMedia.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {msg.youtubeMedia.channelTitle || "YouTube"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleLaunchTab(`https://www.youtube.com/watch?v=${msg.youtubeMedia!.videoId}`, msg.youtubeMedia!.title)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs font-mono shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Watch on YouTube.com</span>
                      </button>

                      {onPlayYouTube && (
                        <button
                          type="button"
                          onClick={() => onPlayYouTube(msg.youtubeMedia!.videoId)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono border border-white/10 transition-colors"
                        >
                          <Play className="w-3 h-3 text-sky-400" />
                          <span>HUD Player</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Optic Vision & Biometric Analysis Card */}
                {msg.visionAnalysis && (
                  <div className="mt-3 p-3 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                        <Eye className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                        <span>Biometric & Optic Telemetry</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
                        SCAN LOCKED
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {msg.visionAnalysis.capturedImagePreview && (
                        <img
                          src={msg.visionAnalysis.capturedImagePreview}
                          alt="Optic Frame"
                          className="w-20 h-14 object-cover rounded-lg border border-sky-400/30 shrink-0 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                        />
                      )}
                      <div className="overflow-hidden flex-1 space-y-1">
                        <p className="text-xs text-sky-100 italic">
                          "{msg.visionAnalysis.spokenObservation}"
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Confidence: {msg.visionAnalysis.detectedAttributes.biometricScanConfidence}% | Threat: {msg.visionAnalysis.detectedAttributes.threatLevel}
                        </p>
                      </div>
                    </div>

                    {/* Telemetry chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono pt-1">
                      <div className="p-1.5 rounded bg-black/40 border border-white/5 flex items-center gap-1">
                        <Smile className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate text-slate-300">{msg.visionAnalysis.detectedAttributes.expression}</span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate text-slate-300">{msg.visionAnalysis.detectedAttributes.postureStatus}</span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate text-slate-300">{msg.visionAnalysis.detectedAttributes.ambientLighting}</span>
                      </div>
                      <div className="p-1.5 rounded bg-black/40 border border-white/5 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate text-emerald-400">{msg.visionAnalysis.detectedAttributes.threatLevel}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grounding Web Sources if available */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-sky-400 block mb-1.5 font-semibold">
                      Verified Real-Time Web Grounding ({msg.sources.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0A0A0C] border border-white/5 hover:border-sky-500/40 text-[10px] font-mono text-slate-400 hover:text-sky-300 transition-all max-w-[200px] truncate"
                        >
                          <ExternalLink className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                          <span className="truncate">{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions (Vocal replay & Browser Automation Trigger) */}
                {!isUser && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSpeakMessage(msg.text)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 hover:border-sky-500/30 transition-all"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Speak</span>
                    </button>

                    {msg.browserWorkflowTriggered && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-300 bg-sky-950/40 px-2.5 py-0.5 rounded-full border border-sky-800/40">
                        <Globe className="w-3 h-3 text-sky-400" />
                        <span>Workflow Launched</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Interim Voice Transcript */}
        {interimTranscript && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center shrink-0">
              <Mic className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="p-3 rounded-2xl bg-sky-950/20 border border-sky-500/30 text-xs font-mono text-sky-300 animate-pulse">
              <span className="text-[10px] text-sky-400 uppercase tracking-widest block mb-1">
                Listening:
              </span>
              <span className="font-serif italic text-sm">"{interimTranscript}"</span>
            </div>
          </div>
        )}

        {/* Neural Computing Indicator */}
        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-[#050506] border border-amber-500/20 text-xs font-mono text-amber-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <span>JARVIS Neural Core: Querying real-time internet & reasoning...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Voice Command Action Chips */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-sky-400" /> Presets:
        </span>
        {QUICK_COMMANDS.map((cmd, idx) => (
          <button
            key={idx}
            id={`quick-cmd-btn-${idx}`}
            onClick={() => {
              onSendMessage(cmd.prompt, false);
            }}
            className="px-3 py-1 rounded-full text-xs font-mono bg-[#0A0A0C] border border-white/5 text-slate-400 hover:text-sky-300 hover:border-sky-500/30 hover:bg-white/5 transition-all shadow-sm cursor-pointer"
          >
            {cmd.label}
          </button>
        ))}
      </div>

      {/* Pill Input Bar with Circular Controls matching Design HTML */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 h-12"
      >
        {/* Toggle Voice Recording Button */}
        <button
          id="toggle-mic-input-btn"
          type="button"
          onClick={onToggleVoice}
          title={isListening ? "Mute Microphone" : "Activate Microphone"}
          className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 transition-all ${
            isListening
              ? "bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.4)] animate-pulse"
              : "bg-[#0A0A0C] border-white/10 text-white/40 hover:text-white hover:border-white/20"
          }`}
        >
          {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Text Input Pill */}
        <div className="flex-1 bg-[#0A0A0C] border border-white/10 rounded-full h-full flex items-center px-5 focus-within:border-sky-500/40 transition-colors shadow-inner">
          <input
            id="jarvis-command-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? "Voice sensor active... Speak or type query..."
                : "Ready for voice command or manual query input..."
            }
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 italic font-serif focus:outline-none"
          />
        </div>

        {/* Submit / Send Button */}
        <button
          id="send-command-btn"
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="w-12 h-12 rounded-full border border-white/10 bg-[#0A0A0C] flex items-center justify-center shrink-0 text-white/40 hover:text-white hover:border-sky-500/50 hover:bg-sky-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

