import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Youtube,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Minimize2,
  Maximize2,
  X,
  Search,
  Radio,
  Sparkles,
  Music,
  Headphones,
  Compass,
} from "lucide-react";
import { YouTubeMedia } from "../types";
import { SoundFX } from "../utils/soundEffects";
import { hostBridgeManager } from "../utils/hostBridgeManager";

interface YouTubeMediaHUDProps {
  media: YouTubeMedia | null;
  onUpdateMedia: (media: YouTubeMedia | null) => void;
  onPlayQuery: (query: string) => void;
  onJarvisSpeak?: (text: string) => void;
}

const PRESET_TRACKS = [
  { name: "Lofi Beats", query: "lofi hip hop radio", desc: "Relax / Study Chill" },
  { name: "Iron Man OST", query: "iron man ramin djawadi", desc: "Stark Heavy Rock" },
  { name: "Back in Black", query: "acdc back in black", desc: "AC/DC High Energy" },
  { name: "Synthwave", query: "synthwave radio chill beats", desc: "Cyberpunk Focus" },
  { name: "Interstellar", query: "interstellar hans zimmer", desc: "Hans Zimmer Theme" },
  { name: "Deep Focus", query: "deep focus ambient study", desc: "Binaural Matrix" },
  { name: "Classical", query: "mozart classical study", desc: "Mozart Symphony" },
  { name: "Jazz Cafe", query: "warm coffee shop jazz", desc: "Smooth Piano" },
];

export const YouTubeMediaHUD: React.FC<YouTubeMediaHUDProps> = ({
  media,
  onUpdateMedia,
  onPlayQuery,
  onJarvisSpeak,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  if (!media) {
    return null;
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    SoundFX.playComputeChime();
    try {
      await onPlayQuery(searchQuery);
      setSearchQuery("");
    } finally {
      setIsSearching(false);
    }
  };

  const handlePresetSelect = (query: string, name: string) => {
    SoundFX.playComputeChime();
    if (onJarvisSpeak) {
      onJarvisSpeak(`Cueing up ${name} on real YouTube media stream, sir.`);
    }
    onPlayQuery(query);
  };

  const handleOpenRealTab = () => {
    SoundFX.playComputeChime();
    const url = `https://www.youtube.com/watch?v=${media.videoId}`;
    try {
      window.open(url, "jarvis_media_stream_tab", "noopener,noreferrer");
    } catch (e) {
      console.log("Direct tab opener notice:", e);
    }
    hostBridgeManager.dispatchHostExecution({
      action: "PLAY_YOUTUBE",
      targetUrl: url,
      title: media.title,
      videoId: media.videoId,
    });
    if (onJarvisSpeak) {
      onJarvisSpeak(`Opening ${media.title || "the requested track"} in your dedicated YouTube browser tab, sir.`);
    }
  };

  const handleOpenPopoutWindow = () => {
    SoundFX.playComputeChime();
    const url = `https://www.youtube.com/watch?v=${media.videoId}`;
    window.open(url, "jarvis_yt_popout", "width=840,height=540,menubar=no,toolbar=no,location=no,status=no");
  };

  return (
    <AnimatePresence>
      <motion.div
        id="jarvis-youtube-media-hud"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className={`fixed z-50 transition-all duration-300 ${
          isMinimized
            ? "bottom-5 right-5 w-72"
            : "bottom-5 right-5 md:right-8 w-[92vw] sm:w-[420px] md:w-[460px]"
        }`}
      >
        <div className="relative rounded-2xl overflow-hidden border border-sky-500/30 bg-[#070b14]/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(14,165,233,0.15)]">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-sky-950/40 border-b border-sky-500/20">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                <Youtube className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-semibold block leading-none">
                  REAL YOUTUBE MEDIA HUD
                </span>
                <span className="text-xs text-white/90 font-medium truncate block">
                  {media.title || "Autonomous Media Stream"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Equalizer Visualizer */}
              {media.isPlaying && (
                <div className="flex items-end gap-0.5 h-3.5 px-1 mr-1">
                  <span className="w-0.5 bg-red-400 h-3 animate-pulse"></span>
                  <span className="w-0.5 bg-sky-400 h-2 animate-bounce"></span>
                  <span className="w-0.5 bg-emerald-400 h-3.5 animate-pulse"></span>
                  <span className="w-0.5 bg-amber-400 h-1.5 animate-bounce"></span>
                </div>
              )}

              {/* Popout to Real Browser Window */}
              <button
                id="yt-popout-btn"
                onClick={handleOpenPopoutWindow}
                title="Pop out Real YouTube Window"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
              </button>

              {/* Open in Real YouTube Tab */}
              <button
                id="yt-open-tab-btn"
                onClick={handleOpenRealTab}
                title="Open Video in Real YouTube Browser Tab"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-sky-400 hover:text-sky-300 flex items-center justify-center transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Minimize / Maximize */}
              <button
                id="yt-minimize-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand HUD" : "Minimize HUD"}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close */}
              <button
                id="yt-close-btn"
                onClick={() => {
                  SoundFX.playComputeChime();
                  onUpdateMedia(null);
                }}
                title="Close YouTube Stream"
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="p-3 space-y-3">
              {/* Real YouTube Embedded Iframe */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-sky-500/20 shadow-inner">
                <iframe
                  id="jarvis-real-youtube-iframe"
                  src={`https://www.youtube.com/embed/${media.videoId}?autoplay=1&enablejsapi=1&rel=0`}
                  title={media.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Search & Query Input Bar */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  id="yt-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask JARVIS to play any song, artist, or YouTube URL..."
                  className="w-full pl-8 pr-20 py-1.5 text-xs rounded-xl bg-black/60 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-sky-400 font-mono transition-colors"
                />
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                <button
                  id="yt-search-submit-btn"
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-1 top-1 px-2.5 py-1 text-[10px] font-mono uppercase bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-lg transition-colors disabled:opacity-40"
                >
                  {isSearching ? "Searching..." : "Play"}
                </button>
              </form>

              {/* Quick Preset Selector Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-sky-400" />
                    Quick Autonomous Radio Channels
                  </span>
                  <button
                    id="yt-toggle-presets-btn"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-[10px] font-mono text-sky-400 hover:underline"
                  >
                    {showPresets ? "Hide Presets" : "Show All"}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {(showPresets ? PRESET_TRACKS : PRESET_TRACKS.slice(0, 4)).map((preset) => (
                    <button
                      key={preset.name}
                      id={`yt-preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => handlePresetSelect(preset.query, preset.name)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono shrink-0 bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-white/80 hover:text-sky-300 transition-all flex items-center gap-1"
                    >
                      <Music className="w-2.5 h-2.5 text-sky-400" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[11px] text-white/60 font-mono">
                <span className="flex items-center gap-1">
                  <Headphones className="w-3 h-3 text-emerald-400" />
                  Real YouTube Audio Active
                </span>
                <button
                  id="yt-open-real-site-btn"
                  onClick={handleOpenRealTab}
                  className="text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                >
                  <span>Open Full Video in Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {isMinimized && (
            <div className="p-2.5 flex items-center justify-between bg-black/40">
              <span className="text-xs text-white/90 font-medium truncate pr-2">
                {media.title}
              </span>
              <button
                id="yt-mini-open-btn"
                onClick={handleOpenRealTab}
                className="text-sky-400 hover:text-sky-300 p-1"
                title="Open in Tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
