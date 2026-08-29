/**
 * J.A.R.V.I.S. Interface 1: Tactical Command Core
 * Central Holographic Arc Reactor, Live Voice Frequency Visualizer,
 * Google Workspace cards, and Quick Command dispatch.
 */

import React, { useState, useEffect } from "react";
import { ArcReactorHUD } from "../ArcReactorHUD";
import { VoiceVisualizationConsole } from "../VoiceVisualizationConsole";
import { ChatMessage, JarvisState, YouTubeMedia, RealBrowserAction } from "../../types";
import { themeManager, JarvisTheme } from "../../utils/themeManager";
import { Zap, Activity, Radio, Sparkles } from "lucide-react";

interface CoreCommandInterfaceProps {
  jarvisState: JarvisState;
  frequencies: Uint8Array;
  onToggleVoice: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  statusMessage: string;
  onOpenVisionHUD: () => void;
  onDirectScan: () => void;
  messages: ChatMessage[];
  interimTranscript: string;
  isProcessing: boolean;
  onSpeakMessage: (text: string) => void;
  onOpenVoiceSettings: () => void;
  onOpenThemeLibrary: () => void;
  onOpenRealTab: (url: string, title?: string, winCmd?: string, psCmd?: string, bridge?: string) => void;
  onPlayYouTube: (query: string) => void;
  onSendMessage: (msg: string, isVoice?: boolean) => void;
}

export const CoreCommandInterface: React.FC<CoreCommandInterfaceProps> = ({
  jarvisState,
  frequencies,
  onToggleVoice,
  isListening,
  isSpeaking,
  statusMessage,
  onOpenVisionHUD,
  onDirectScan,
  messages,
  interimTranscript,
  isProcessing,
  onSpeakMessage,
  onOpenVoiceSettings,
  onOpenThemeLibrary,
  onOpenRealTab,
  onPlayYouTube,
  onSendMessage,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  return (
    <div
      id="jarvis-core-command-interface"
      className="w-full max-w-7xl mx-auto flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Arc Reactor HUD (5 COLS) */}
        <div
          className="lg:col-span-5 bg-[#0A0A0C]/90 border rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-xl"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <ArcReactorHUD
            state={jarvisState}
            frequencies={frequencies}
            onToggleVoice={onToggleVoice}
            isListening={isListening}
            isSpeaking={isSpeaking}
            statusMessage={statusMessage}
            onOpenVisionHUD={onOpenVisionHUD}
            onDirectScan={onDirectScan}
          />

          {/* Push to talk keyboard badge */}
          <div className="mt-4 pt-4 border-t border-white/5 w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="uppercase tracking-widest text-slate-500">Wake Word: "Jarvis"</span>
            <span
              className="px-3 py-1 rounded-full bg-[#050506] border text-sky-400 font-bold"
              style={{ borderColor: currentTheme.primaryColor + "40", color: currentTheme.secondaryColor }}
            >
              SPACEBAR: MIC TOGGLE
            </span>
          </div>
        </div>

        {/* Right Interactive Voice Visualization & Neural Matrix (7 COLS) */}
        <div className="lg:col-span-7">
          <VoiceVisualizationConsole
            messages={messages}
            frequencies={frequencies}
            state={jarvisState}
            isListening={isListening}
            isSpeaking={isSpeaking}
            interimTranscript={interimTranscript}
            isProcessing={isProcessing}
            onToggleVoice={onToggleVoice}
            onSpeakMessage={onSpeakMessage}
            onOpenVoiceSettings={onOpenVoiceSettings}
            onOpenThemeLibrary={onOpenThemeLibrary}
            onOpenRealTab={onOpenRealTab}
            onPlayYouTube={onPlayYouTube}
            onSendMessage={onSendMessage}
            onOpenVisionHUD={onOpenVisionHUD}
          />
        </div>
      </div>
    </div>
  );
};
