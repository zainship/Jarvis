import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  ExternalLink,
  Search,
  Youtube,
  Github,
  Compass,
  FileCode,
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  Layers,
  Code2,
  Cpu,
  Tv,
  Music,
  Share2,
  Terminal,
  Play,
  Flame,
  BookOpen,
} from "lucide-react";
import { SoundFX } from "../utils/soundEffects";

interface RealBrowserBridgeProps {
  onOpenRealTab: (url: string, name?: string) => void;
  onPlayYouTube: (query: string) => void;
  onJarvisSpeak?: (text: string) => void;
}

interface LiveScrapedPage {
  url: string;
  title: string;
  description: string;
  status: number;
  headings: { h1: string[]; h2: string[] };
  links: Array<{ href: string; text: string }>;
  contentSnippet: string;
  timestamp: string;
}

export const RealBrowserBridge: React.FC<RealBrowserBridgeProps> = ({
  onOpenRealTab,
  onPlayYouTube,
  onJarvisSpeak,
}) => {
  const [targetUrl, setTargetUrl] = useState("https://github.com/trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [ytQuery, setYtQuery] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [livePageData, setLivePageData] = useState<LiveScrapedPage | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"quick_launch" | "live_inspector" | "voice_commands">("quick_launch");

  const REAL_WEBSITES = [
    {
      name: "YouTube",
      url: "https://www.youtube.com",
      category: "Media & Video",
      icon: Youtube,
      color: "text-red-400 border-red-500/30 hover:bg-red-500/10",
      desc: "Watch real videos & music streams",
    },
    {
      name: "Google Search",
      url: "https://www.google.com",
      category: "Search & Knowledge",
      icon: Search,
      color: "text-sky-400 border-sky-500/30 hover:bg-sky-500/10",
      desc: "Instant live internet search",
    },
    {
      name: "GitHub",
      url: "https://www.github.com",
      category: "Developer Hub",
      icon: Github,
      color: "text-purple-400 border-purple-500/30 hover:bg-purple-500/10",
      desc: "Repositories, pull requests & code",
    },
    {
      name: "Reddit",
      url: "https://www.reddit.com",
      category: "Discussions & Communities",
      icon: Globe,
      color: "text-orange-400 border-orange-500/30 hover:bg-orange-500/10",
      desc: "Front page of the internet",
    },
    {
      name: "X / Twitter",
      url: "https://www.x.com",
      category: "Social & News",
      icon: Compass,
      color: "text-blue-400 border-blue-500/30 hover:bg-blue-500/10",
      desc: "Real-time global discourse",
    },
    {
      name: "arXiv AI Papers",
      url: "https://arxiv.org/list/cs.AI/recent",
      category: "Academic Research",
      icon: BookOpen,
      color: "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10",
      desc: "Latest pre-print scientific papers",
    },
    {
      name: "Wikipedia",
      url: "https://www.wikipedia.org",
      category: "Encyclopedia",
      icon: Globe,
      color: "text-amber-400 border-amber-500/30 hover:bg-amber-500/10",
      desc: "Global verified encyclopedia",
    },
    {
      name: "ChatGPT",
      url: "https://chatgpt.com",
      category: "AI Neural Gateway",
      icon: Cpu,
      color: "text-teal-400 border-teal-500/30 hover:bg-teal-500/10",
      desc: "Conversational AI model portal",
    },
  ];

  const VOICE_COMMANDS = [
    { cmd: "JARVIS, play AC/DC on YouTube", desc: "Searches and plays official AC/DC music video in the HUD & browser" },
    { cmd: "JARVIS, play lofi hip hop", desc: "Starts continuous relaxing lo-fi beats in neural media player" },
    { cmd: "JARVIS, open YouTube", desc: "Launches real YouTube in a new browser tab" },
    { cmd: "JARVIS, search Google for quantum computing", desc: "Opens Google search results for the given query in your real browser" },
    { cmd: "JARVIS, open GitHub", desc: "Dispatches command to launch GitHub in a live tab" },
    { cmd: "JARVIS, open Reddit", desc: "Opens Reddit homepage in a real tab" },
    { cmd: "JARVIS, open arXiv", desc: "Opens the latest computer science AI pre-prints on arXiv.org" },
    { cmd: "JARVIS, pause music", desc: "Pauses active YouTube audio/video stream" },
  ];

  const handleLaunchUrl = (url: string, name?: string) => {
    SoundFX.playComputeChime();
    if (onJarvisSpeak) {
      onJarvisSpeak(`Opening ${name || url} in a real browser tab, sir.`);
    }
    onOpenRealTab(url, name);
  };

  const handleGoogleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
    handleLaunchUrl(url, `Google Search: "${searchQuery}"`);
    setSearchQuery("");
  };

  const handleYouTubePlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytQuery.trim()) return;
    SoundFX.playComputeChime();
    if (onJarvisSpeak) {
      onJarvisSpeak(`Searching YouTube for ${ytQuery} and initializing playback, sir.`);
    }
    onPlayYouTube(ytQuery.trim());
    setYtQuery("");
  };

  const handleInspectLiveWeb = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsInspecting(true);
    SoundFX.playComputeChime();
    if (onJarvisSpeak) {
      onJarvisSpeak(`Connecting to live web server and scraping real DOM for ${targetUrl}.`);
    }

    try {
      const res = await fetch("/api/jarvis/live-web-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      setLivePageData(data);
    } catch (err) {
      console.error("Failed to inspect live web:", err);
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="rounded-2xl p-5 border border-sky-500/20 bg-[#080d1a]/80 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                Real Browser Command & Live Web Bridge
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REAL BROWSER DISPATCHER
                </span>
              </h2>
              <p className="text-xs text-white/60 font-mono">
                Direct real browser tabs, real YouTube video player, and live website DOM inspection
              </p>
            </div>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              id="subtab-quick-launch"
              onClick={() => setActiveSubTab("quick_launch")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeSubTab === "quick_launch"
                  ? "bg-sky-500 text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Direct Launcher
            </button>
            <button
              id="subtab-live-inspector"
              onClick={() => {
                setActiveSubTab("live_inspector");
                if (!livePageData) handleInspectLiveWeb();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeSubTab === "live_inspector"
                  ? "bg-sky-500 text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Live Web Inspector
            </button>
            <button
              id="subtab-voice-commands"
              onClick={() => setActiveSubTab("voice_commands")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeSubTab === "voice_commands"
                  ? "bg-sky-500 text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Voice Directives
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DIRECT LAUNCHER & SEARCH */}
      {activeSubTab === "quick_launch" && (
        <div className="space-y-6">
          {/* Dual Action Bars: Real Google Search & Real YouTube Player */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real YouTube Search & Play */}
            <div className="rounded-2xl p-4 border border-red-500/20 bg-[#0c0812]/70 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-red-500" />
                  Play Real YouTube Video
                </span>
                <span className="text-[10px] font-mono text-white/40">In-HUD or Real Tab</span>
              </div>
              <form onSubmit={handleYouTubePlay} className="relative">
                <input
                  id="direct-yt-input"
                  type="text"
                  value={ytQuery}
                  onChange={(e) => setYtQuery(e.target.value)}
                  placeholder="e.g. Iron Man OST, Lofi Beats, AC/DC, Interstellar..."
                  className="w-full pl-9 pr-24 py-2 text-xs rounded-xl bg-black/60 border border-red-500/30 text-white placeholder-white/40 focus:outline-none focus:border-red-400 font-mono"
                />
                <Youtube className="w-4 h-4 text-red-400 absolute left-3 top-2.5" />
                <button
                  id="direct-yt-btn"
                  type="submit"
                  className="absolute right-1 top-1 px-3 py-1 text-xs font-mono uppercase bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  <span>Play</span>
                </button>
              </form>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-white/40">Quick:</span>
                {["Lofi Girl", "AC/DC", "Hans Zimmer", "Synthwave", "Mozart"].map((item) => (
                  <button
                    key={item}
                    id={`quick-yt-${item.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => {
                      onPlayYouTube(item);
                      if (onJarvisSpeak) onJarvisSpeak(`Playing ${item} on YouTube, sir.`);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-300 border border-white/10 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Real Google Search */}
            <div className="rounded-2xl p-4 border border-sky-500/20 bg-[#080f1a]/70 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-sky-400" />
                  Real Google Internet Search
                </span>
                <span className="text-[10px] font-mono text-white/40">Opens Live Tab</span>
              </div>
              <form onSubmit={handleGoogleSearch} className="relative">
                <input
                  id="direct-google-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. quantum computing breakthrough, latest tech news..."
                  className="w-full pl-9 pr-24 py-2 text-xs rounded-xl bg-black/60 border border-sky-500/30 text-white placeholder-white/40 focus:outline-none focus:border-sky-400 font-mono"
                />
                <Search className="w-4 h-4 text-sky-400 absolute left-3 top-2.5" />
                <button
                  id="direct-google-btn"
                  type="submit"
                  className="absolute right-1 top-1 px-3 py-1 text-xs font-mono uppercase bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Search</span>
                </button>
              </form>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-white/40">Quick:</span>
                {["AI News", "Stock Markets", "Weather", "SpaceX", "arXiv LLMs"].map((item) => (
                  <button
                    key={item}
                    id={`quick-search-${item.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => {
                      const url = `https://www.google.com/search?q=${encodeURIComponent(item)}`;
                      handleLaunchUrl(url, `Google: ${item}`);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 hover:bg-sky-500/20 text-white/70 hover:text-sky-300 border border-white/10 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real Website Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-white/60 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                Real Website Launch Station
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                Click any portal to command JARVIS to open it in your real browser
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {REAL_WEBSITES.map((site) => {
                const IconComponent = site.icon;
                return (
                  <div
                    key={site.name}
                    id={`real-site-card-${site.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    className={`rounded-xl p-4 border bg-black/40 backdrop-blur-sm transition-all duration-200 ${site.color} group hover:scale-[1.02] flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <button
                          id={`btn-open-${site.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                          onClick={() => handleLaunchUrl(site.url, site.name)}
                          className="opacity-80 group-hover:opacity-100 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title={`Open ${site.name} in a real tab`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors">
                        {site.name}
                      </h3>
                      <p className="text-[11px] text-white/50 mt-1 line-clamp-2">
                        {site.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-white/40">{site.category}</span>
                      <button
                        id={`btn-launch-pill-${site.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                        onClick={() => handleLaunchUrl(site.url, site.name)}
                        className="text-[10px] font-mono text-sky-400 group-hover:underline flex items-center gap-0.5"
                      >
                        <span>Launch</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE REAL WEBSITE INSPECTOR */}
      {activeSubTab === "live_inspector" && (
        <div className="space-y-4">
          {/* Target URL Input */}
          <form onSubmit={handleInspectLiveWeb} className="rounded-2xl p-4 border border-sky-500/20 bg-[#080d1a]/80 backdrop-blur-xl">
            <label className="text-xs font-mono uppercase tracking-wider text-sky-400 block mb-2 font-semibold">
              Live HTTP & DOM Extraction Gateway
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  id="live-inspector-url-input"
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="Enter any live URL to fetch and parse (e.g. https://news.ycombinator.com)..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/60 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-sky-400 font-mono"
                />
                <Globe className="w-4 h-4 text-sky-400 absolute left-3 top-2.5" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="live-inspector-fetch-btn"
                  type="submit"
                  disabled={isInspecting}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-mono uppercase bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {isInspecting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Inspecting...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Fetch Live DOM</span>
                    </>
                  )}
                </button>
                <button
                  id="live-inspector-open-real-btn"
                  type="button"
                  onClick={() => handleLaunchUrl(targetUrl)}
                  className="px-3 py-2 text-xs font-mono bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-1"
                  title="Open this URL in a real browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open Real Tab</span>
                </button>
              </div>
            </div>
          </form>

          {/* Scraped Results Display */}
          {livePageData && (
            <div className="rounded-2xl p-5 border border-sky-500/20 bg-black/50 backdrop-blur-xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      HTTP {livePageData.status} OK
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      Fetched: {new Date(livePageData.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">
                    {livePageData.title}
                  </h3>
                  {livePageData.description && (
                    <p className="text-xs text-white/60 mt-1">
                      {livePageData.description}
                    </p>
                  )}
                </div>

                <button
                  id="btn-open-scraped-real"
                  onClick={() => handleLaunchUrl(livePageData.url, livePageData.title)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch Live Site</span>
                </button>
              </div>

              {/* Headings & Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Real Extracted Links */}
                <div className="rounded-xl p-3 bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold block">
                    Extracted Interactive Links ({livePageData.links.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                    {livePageData.links.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded bg-white/5 hover:bg-white/10 text-xs transition-colors group"
                      >
                        <span className="text-white/80 truncate pr-2 text-[11px]">
                          {link.text}
                        </span>
                        <button
                          onClick={() => handleLaunchUrl(link.href, link.text)}
                          className="text-sky-400 hover:text-sky-300 shrink-0 opacity-80 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-mono"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Snippet */}
                <div className="rounded-xl p-3 bg-black/40 border border-white/5 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                    Clean Text Extraction
                  </span>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin text-xs text-white/70 font-mono leading-relaxed p-2 bg-black/60 rounded-lg border border-white/5">
                    {livePageData.contentSnippet}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VOICE DIRECTIVES REFERENCE */}
      {activeSubTab === "voice_commands" && (
        <div className="rounded-2xl p-5 border border-sky-500/20 bg-[#080d1a]/80 backdrop-blur-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Autonomous Real Browser Voice Matrix
            </h3>
            <p className="text-xs text-white/60 font-mono mt-0.5">
              Speak or type any of these natural commands to command JARVIS to interact with the real web and YouTube
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VOICE_COMMANDS.map((item, idx) => (
              <div
                key={idx}
                id={`voice-cmd-${idx}`}
                className="p-3 rounded-xl bg-black/40 border border-white/10 hover:border-sky-500/40 transition-colors group flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-mono text-sky-300 font-bold group-hover:text-sky-200">
                    "{item.cmd}"
                  </div>
                  <div className="text-[11px] text-white/50 mt-1">
                    {item.desc}
                  </div>
                </div>
                <button
                  id={`voice-cmd-test-btn-${idx}`}
                  onClick={() => {
                    if (item.cmd.toLowerCase().includes("play")) {
                      const song = item.cmd.replace(/^JARVIS, play\s+/i, "").replace(/\s+on YouTube$/i, "");
                      onPlayYouTube(song);
                    } else if (item.cmd.toLowerCase().includes("open")) {
                      const target = item.cmd.replace(/^JARVIS, open\s+/i, "");
                      const targetSite = REAL_WEBSITES.find((s) => s.name.toLowerCase().includes(target.toLowerCase()));
                      if (targetSite) handleLaunchUrl(targetSite.url, targetSite.name);
                    } else if (item.cmd.toLowerCase().includes("search")) {
                      const q = item.cmd.replace(/^JARVIS, search Google for\s+/i, "");
                      handleLaunchUrl(`https://www.google.com/search?q=${encodeURIComponent(q)}`, `Google: ${q}`);
                    }
                  }}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0"
                >
                  Test Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
