import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Minimize2,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  ExternalLink,
  Bot,
  User,
  Shield,
  Activity,
  Zap,
  Sliders,
  Youtube,
  ArrowUpRight,
  Play,
  Compass,
} from "lucide-react";
import { ArcReactorHUD } from "./ArcReactorHUD";
import { ChatMessage, JarvisState } from "../types";
import { SoundFX } from "../utils/soundEffects";

interface FocusModeHUDProps {
  jarvisState: JarvisState;
  frequencies: Uint8Array;
  onToggleVoice: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  statusMessage: string;
  messages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => void;
  onSpeakMessage: (text: string) => void;
  interimTranscript: string;
  isProcessing: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onExitFocusMode: () => void;
  onOpenVoiceSettings: () => void;
  onOpenRealTab?: (url: string, name?: string) => void;
  onPlayYouTube?: (query: string) => void;
}

export const FocusModeHUD: React.FC<FocusModeHUDProps> = ({
  jarvisState,
  frequencies,
  onToggleVoice,
  isListening,
  isSpeaking,
  statusMessage,
  messages,
  onSendMessage,
  onSpeakMessage,
  interimTranscript,
  isProcessing,
  isMuted,
  onToggleMute,
  onExitFocusMode,
  onOpenVoiceSettings,
  onOpenRealTab,
  onPlayYouTube,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages in focus mode
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const FOCUS_RESEARCH_PROMPTS = [
    { label: "Look at Me (Optic)", prompt: "Jarvis, look at me" },
    { label: "Open YouTube", prompt: "Jarvis, open YouTube" },
    { label: "Open ChatGPT", prompt: "Jarvis, open ChatGPT" },
    { label: "Open GitHub", prompt: "Jarvis, open GitHub" },
    { label: "Open Reddit", prompt: "Jarvis, open Reddit" },
    { label: "Search Google", prompt: "Jarvis, search Google for latest breakthroughs in AI" },
  ];

  return (
    <div
      id="focus-mode-canvas"
      className="w-full min-h-[calc(100vh-2rem)] flex flex-col justify-between py-2 px-4 max-w-5xl mx-auto relative select-none animate-fadeIn"
    >
      {/* Sleek Floating Top Focus Bar */}
      <header className="w-full flex items-center justify-between py-2.5 px-5 rounded-full bg-[#0A0A0C]/90 backdrop-blur-xl border border-sky-500/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
              FOCUS PROTOCOL ACTIVE
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-slate-500">
              // ZERO-DISTRACTION RESEARCH
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Voice Tuning Button */}
          <button
            id="focus-voice-settings-btn"
            onClick={() => {
              SoundFX.playComputeChime();
              onOpenVoiceSettings();
            }}
            title="Voice Synthesis Settings — Customize Pitch & Speed"
            className="w-8 h-8 rounded-full border bg-[#050506] border-white/10 text-white/70 hover:text-sky-400 hover:border-sky-500/40 flex items-center justify-center transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Mute toggle */}
          <button
            id="focus-mute-btn"
            onClick={onToggleMute}
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
              isMuted
                ? "bg-rose-950/40 border-rose-800/50 text-rose-400"
                : "bg-[#050506] border-white/10 text-white/70 hover:text-white"
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Voice State Pill */}
          <div
            onClick={onToggleVoice}
            className={`cursor-pointer flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all ${
              isListening
                ? "bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                : "bg-[#050506] border-white/10 text-slate-500 hover:border-white/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isListening ? "bg-sky-400 animate-ping" : "bg-slate-600"
              }`}
            />
            <span>{isListening ? "MIC LISTENING" : "MIC STANDBY"}</span>
          </div>

          {/* Exit Focus Mode Button */}
          <button
            id="exit-focus-mode-btn"
            onClick={() => {
              SoundFX.playComputeChime();
              onExitFocusMode();
            }}
            title="Exit Focus Mode (ESC or F)"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono hover:bg-amber-500/25 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="font-bold">EXIT FOCUS</span>
            <span className="text-[9px] opacity-60 hidden md:inline px-1 py-0.2 rounded bg-black/40 border border-amber-500/30">ESC</span>
          </button>
        </div>
      </header>

      {/* Central Ambient Hero: Arc Reactor HUD */}
      <div className="my-auto flex flex-col items-center justify-center py-4 relative">
        <div className="w-full max-w-md flex flex-col items-center">
          <ArcReactorHUD
            state={jarvisState}
            frequencies={frequencies}
            onToggleVoice={onToggleVoice}
            isListening={isListening}
            isSpeaking={isSpeaking}
            statusMessage={statusMessage}
          />
        </div>

        {/* Focused Sub-prompt triggers */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2 max-w-2xl px-4">
          {FOCUS_RESEARCH_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(item.prompt, false)}
              className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-[#0A0A0C]/80 border border-white/10 text-slate-400 hover:text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/10 transition-all shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Streamlined Bottom Neural Conversation Stream & Query Bar */}
      <div className="w-full bg-[#0A0A0C]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        {/* Streamlined Live Messages Log (shows latest entries with high contrast) */}
        <div
          id="focus-chat-stream"
          className="max-h-[180px] min-h-[80px] overflow-y-auto space-y-3 font-sans pr-2 select-text"
        >
          {messages.slice(-4).map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-sky-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed border ${
                    isUser
                      ? "bg-sky-600/15 border-sky-500/30 text-sky-200 text-right"
                      : "bg-[#101014] border-white/10 text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Real Browser Action Launch Button */}
                  {msg.realBrowserAction?.targetUrl && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-sky-400 truncate max-w-[150px]">
                        {msg.realBrowserAction.targetUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLaunchTab(msg.realBrowserAction!.targetUrl!, msg.realBrowserAction!.query)}
                        className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-black font-semibold text-[10px] font-mono flex items-center gap-1 shadow-sm transition-all"
                      >
                        <span>Open ↗</span>
                      </button>
                    </div>
                  )}

                  {/* YouTube Media Action Button */}
                  {msg.youtubeMedia && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Youtube className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="text-[10px] text-white truncate max-w-[140px]">
                          {msg.youtubeMedia.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLaunchTab(`https://www.youtube.com/watch?v=${msg.youtubeMedia!.videoId}`, msg.youtubeMedia!.title)}
                        className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold text-[10px] font-mono shrink-0 shadow-sm transition-all"
                      >
                        <span>Watch ↗</span>
                      </button>
                    </div>
                  )}

                  {/* Grounding sources citation */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/10 flex flex-wrap gap-1.5 text-[10px]">
                      {msg.sources.slice(0, 2).map((src, i) => (
                        <a
                          key={i}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:underline"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[120px]">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Interim speech transcript */}
          {interimTranscript && (
            <div className="flex items-start gap-2.5 justify-end">
              <div className="max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed bg-sky-600/10 border border-sky-500/20 text-sky-300 italic">
                <span>{interimTranscript}...</span>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-sky-400 font-mono py-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>JARVIS Neural Engine formulating research synthesis...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Master Voice Mic & Audio Trigger Bar (Voice-First Experience) */}
        <div className="flex items-center justify-between bg-[#050506] border border-white/10 rounded-xl p-2.5">
          <button
            type="button"
            onClick={onToggleVoice}
            title={isListening ? "Pause Microphone (Spacebar)" : "Activate Microphone (Spacebar)"}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
              isListening
                ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
                : "bg-[#0A0A0C] border-white/10 text-slate-300 hover:text-sky-400 hover:border-sky-500/30"
            }`}
          >
            {isListening ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4 text-slate-400" />}
            <span className="font-mono text-xs font-bold uppercase">
              {isListening ? "Voice Listening Active" : "Click / Press Space to Speak"}
            </span>
          </button>

          {/* Frequency EQ Mini Waveform in Focus Mode */}
          <div className="flex items-end gap-1 h-6 px-3">
            {Array.from({ length: 16 }).map((_, i) => {
              const val = frequencies[i * 2] || (isSpeaking ? 30 + (i % 4) * 20 : 8);
              const pct = isListening || isSpeaking ? Math.min(100, Math.max(20, (val / 255) * 100)) : 15;
              return (
                <div
                  key={i}
                  className="w-1 rounded-full bg-sky-400 transition-all duration-75"
                  style={{ height: `${pct}%`, opacity: 0.6 + (pct / 100) * 0.4 }}
                />
              );
            })}
          </div>
        </div>

        {/* Hotkey helper footer in Focus Mode */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
          <span>[SPACEBAR] TOGGLE MIC // [ESC] EXIT FOCUS</span>
          <span className="text-amber-400/80">DISTRACTION-FREE INTEL MATRIX</span>
        </div>
      </div>
    </div>
  );
};
