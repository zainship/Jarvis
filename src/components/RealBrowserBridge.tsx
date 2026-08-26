import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  ExternalLink,
  Search,
  Youtube,
  Github,
  Compass,
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  Terminal,
  Play,
  BookOpen,
  Cpu,
  Monitor,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Radio,
  Zap,
  Code,
  Download,
  Trash2,
  Clock,
  Layers,
  Puzzle,
  Laptop,
} from "lucide-react";
import { SoundFX } from "../utils/soundEffects";
import {
  hostBridgeManager,
  NODE_BRIDGE_SCRIPT,
  POWERSHELL_ONE_LINER,
  PYTHON_WEBHOOK_SCRIPT,
  CHROME_CDP_NODE_SCRIPT,
  CHROME_EXTENSION_MANIFEST,
  CHROME_EXTENSION_BACKGROUND,
} from "../utils/hostBridgeManager";
import { HostBridgeConfig, HostBridgeExecutionEvent } from "../types";

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
  const [activeSubTab, setActiveSubTab] = useState<
    "quick_launch" | "cdp_controller" | "chrome_extension" | "host_bridge" | "live_inspector" | "voice_commands"
  >("quick_launch");

  // Host Bridge State
  const [bridgeConfig, setBridgeConfig] = useState<HostBridgeConfig>(hostBridgeManager.getConfig());
  const [bridgeHistory, setBridgeHistory] = useState<HostBridgeExecutionEvent[]>(hostBridgeManager.getHistory());
  const [isPingingBridge, setIsPingingBridge] = useState(false);
  const [isPingingCdp, setIsPingingCdp] = useState(false);
  const [cdpStatus, setCdpStatus] = useState<"online" | "offline" | "unchecked">("unchecked");
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [testUrlInput, setTestUrlInput] = useState("https://www.youtube.com");
  const [testExecutionResult, setTestExecutionResult] = useState<string | null>(null);
  const [activeScriptTab, setActiveScriptTab] = useState<"nodejs" | "powershell" | "python">("nodejs");
  const [activeExtensionFile, setActiveExtensionFile] = useState<"manifest" | "background">("manifest");

  useEffect(() => {
    const unsubConfig = hostBridgeManager.onConfigChange((cfg) => setBridgeConfig({ ...cfg }));
    const unsubEvents = hostBridgeManager.onExecutionEvent(() => {
      setBridgeHistory(hostBridgeManager.getHistory());
    });

    // Initial ping to check local host bridge
    hostBridgeManager.pingHostBridge().catch(() => {});

    return () => {
      unsubConfig();
      unsubEvents();
    };
  }, []);

  const handlePingBridge = async () => {
    setIsPingingBridge(true);
    SoundFX.playComputeChime();
    const isOnline = await hostBridgeManager.pingHostBridge();
    setIsPingingBridge(false);
    if (onJarvisSpeak) {
      onJarvisSpeak(
        isOnline
          ? "Local Windows Host Bridge is connected and responding on port 18500, sir."
          : "Local Host Bridge is offline. Browser popup dual-dispatch fallback is active."
      );
    }
  };

  const handlePingCdp = async () => {
    setIsPingingCdp(true);
    SoundFX.playComputeChime();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch("http://localhost:9222/json/version", { signal: controller.signal });
      clearTimeout(timeout);
      const isOnline = res.ok;
      setCdpStatus(isOnline ? "online" : "offline");
      if (onJarvisSpeak) {
        onJarvisSpeak(
          isOnline
            ? "Google Chrome Remote Debugging (CDP) is connected on port 9222, sir."
            : "Chrome Remote Debugging on port 9222 is offline. Start Chrome with --remote-debugging-port=9222 to connect."
        );
      }
    } catch (e) {
      setCdpStatus("offline");
      if (onJarvisSpeak) {
        onJarvisSpeak("Chrome DevTools Protocol port 9222 is unreachable. Ensure Chrome is running with remote debugging.");
      }
    } finally {
      setIsPingingCdp(false);
    }
  };

  const handleCopyCode = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    SoundFX.playComputeChime();
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadFile = (content: string, filename: string, type: string = "text/plain") => {
    SoundFX.playComputeChime();
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  };

  const handleDownloadNodeScript = () => {
    handleDownloadFile(NODE_BRIDGE_SCRIPT, "jarvis-host-bridge.js", "application/javascript");
  };

  const handleDownloadCdpScript = () => {
    handleDownloadFile(CHROME_CDP_NODE_SCRIPT, "jarvis-cdp-daemon.js", "application/javascript");
  };

  const handleExecuteTestLaunch = async () => {
    SoundFX.playComputeChime();
    if (onJarvisSpeak) {
      onJarvisSpeak(`Dispatching test execution command to real browser for ${testUrlInput}, sir.`);
    }
    const result = await hostBridgeManager.dispatchHostExecution({
      action: testUrlInput.includes("youtube.com") ? "PLAY_YOUTUBE" : "OPEN_TAB",
      targetUrl: testUrlInput,
      title: `Test Host Launch: ${testUrlInput}`,
    });

    setTestExecutionResult(`Dispatched [${result.status}]. Command: ${result.windowsCommand}`);
    setTimeout(() => setTestExecutionResult(null), 5000);
  };

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
    { cmd: "JARVIS, play AC/DC on YouTube", desc: "Dispatches YouTube search, plays in HUD, and triggers Windows host browser shell command" },
    { cmd: "JARVIS, play lofi hip hop", desc: "Starts continuous relaxing lo-fi stream in HUD & host browser" },
    { cmd: "JARVIS, open YouTube", desc: "Executes Windows shell command: start https://www.youtube.com" },
    { cmd: "JARVIS, search Google for quantum computing", desc: "Launches Google search query on host machine & real tab" },
    { cmd: "JARVIS, open GitHub", desc: "Dispatches command to launch GitHub on Windows" },
    { cmd: "JARVIS, open Reddit", desc: "Opens Reddit homepage in host browser" },
    { cmd: "JARVIS, pause music", desc: "Pauses active YouTube stream" },
    { cmd: "JARVIS, resume music", desc: "Resumes playback stream" },
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
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                Real Browser Command & Host Execution Bridge
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  WINDOWS SHELL & WEBHOOK READY
                </span>
              </h2>
              <p className="text-xs text-white/60 font-mono">
                Command your host Windows machine to open real YouTube videos, custom URI handlers & browser tabs
              </p>
            </div>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 flex-wrap">
            <button
              id="subtab-quick-launch"
              onClick={() => setActiveSubTab("quick_launch")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeSubTab === "quick_launch"
                  ? "bg-sky-500 text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Real Launcher</span>
            </button>
            <button
              id="subtab-cdp-controller"
              onClick={() => setActiveSubTab("cdp_controller")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeSubTab === "cdp_controller"
                  ? "bg-sky-500 text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Chrome DevTools (CDP)</span>
              {cdpStatus === "online" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
            <button
              id="subtab-chrome-extension"
              onClick={() => setActiveSubTab("chrome_extension")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeSubTab === "chrome_extension"
                  ? "bg-sky-500 text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Puzzle className="w-3.5 h-3.5" />
              <span>Browser Extension</span>
            </button>
            <button
              id="subtab-host-bridge"
              onClick={() => setActiveSubTab("host_bridge")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                activeSubTab === "host_bridge"
                  ? "bg-sky-500 text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Host Daemon (18500)</span>
              {bridgeConfig.lastPingStatus === "online" && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
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
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Host Bridge & HUD Active
                </span>
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
                      if (onJarvisSpeak) onJarvisSpeak(`Playing ${item} on YouTube and commanding host execution, sir.`);
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
                <span className="text-[10px] font-mono text-white/40">Opens Live Tab & Windows Browser</span>
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
                Click any portal to command JARVIS to open it on your host system and browser
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
                          title={`Open ${site.name} on host machine`}
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

      {/* TAB: CHROME DEVTOOLS PROTOCOL (CDP) CONTROLLER */}
      {activeSubTab === "cdp_controller" && (
        <div className="space-y-6">
          <div className="rounded-2xl p-5 border border-sky-500/20 bg-[#080d1a]/80 backdrop-blur-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    cdpStatus === "online"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                  }`}
                >
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Chrome DevTools Protocol (CDP) Remote Controller
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                        cdpStatus === "online"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      {cdpStatus === "online" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>CHROME CDP ATTACHED (PORT 9222)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>CDP STANDBY / PORT 9222</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 font-mono mt-0.5">
                    Enables J.A.R.V.I.S. to connect to your running Google Chrome window, control tabs, type into inputs, and click elements directly on your desktop.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-ping-cdp"
                  onClick={handlePingCdp}
                  disabled={isPingingCdp}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPingingCdp ? "animate-spin" : ""}`} />
                  <span>Check Port 9222</span>
                </button>
              </div>
            </div>

            {/* Quick 3-Step Setup Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider block">
                  Step 1: Start Chrome in Debug Mode
                </span>
                <p className="text-[11px] text-white/70">
                  Open terminal/cmd and run:
                </p>
                <div className="flex items-center justify-between p-2 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-sky-300">
                  <span className="truncate">chrome.exe --remote-debugging-port=9222</span>
                  <button
                    onClick={() => handleCopyCode(`chrome.exe --remote-debugging-port=9222`, "cmd-cdp-chrome")}
                    className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
                  >
                    {copiedType === "cmd-cdp-chrome" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider block">
                  Step 2: Run J.A.R.V.I.S. CDP Daemon
                </span>
                <p className="text-[11px] text-white/70">
                  Download or copy the Node.js CDP Daemon:
                </p>
                <button
                  id="btn-download-cdp-daemon"
                  onClick={handleDownloadCdpScript}
                  className="w-full px-2.5 py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download jarvis-cdp-daemon.js</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider block">
                  Step 3: Direct Voice Control
                </span>
                <p className="text-[11px] text-white/70">
                  Speak naturally to J.A.R.V.I.S.:
                </p>
                <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
                  "JARVIS, search YouTube for Interstellar and play video"
                </div>
              </div>
            </div>

            {/* Script Code Viewer */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-sky-400" />
                  <span>J.A.R.V.I.S. Chrome CDP Daemon Script (jarvis-cdp-daemon.js)</span>
                </span>
                <button
                  onClick={() => handleCopyCode(CHROME_CDP_NODE_SCRIPT, "cdp-script")}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5"
                >
                  {copiedType === "cdp-script" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === "cdp-script" ? "Copied!" : "Copy Daemon Script"}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed scrollbar-thin">
                {CHROME_CDP_NODE_SCRIPT}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CHROME / EDGE EXTENSION */}
      {activeSubTab === "chrome_extension" && (
        <div className="space-y-6">
          <div className="rounded-2xl p-5 border border-sky-500/20 bg-[#080d1a]/80 backdrop-blur-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Puzzle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    J.A.R.V.I.S. Chrome / Edge Unpacked Extension
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      MANIFEST V3
                    </span>
                  </h3>
                  <p className="text-xs text-white/60 font-mono mt-0.5">
                    Install as an unpacked extension in Chrome/Edge in 15 seconds to give J.A.R.V.I.S. native browser permissions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-download-manifest"
                  onClick={() => handleDownloadFile(CHROME_EXTENSION_MANIFEST, "manifest.json", "application/json")}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>manifest.json</span>
                </button>
                <button
                  id="btn-download-background-js"
                  onClick={() => handleDownloadFile(CHROME_EXTENSION_BACKGROUND, "background.js", "application/javascript")}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>background.js</span>
                </button>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">1. Create Folder</span>
                <p className="text-[11px] text-white/70">
                  Create a folder named <code className="text-purple-300">jarvis-extension</code> on your computer and save <code className="text-purple-300">manifest.json</code> and <code className="text-purple-300">background.js</code> inside it.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">2. Open Extensions</span>
                <p className="text-[11px] text-white/70">
                  Go to <code className="text-purple-300">chrome://extensions</code> in your browser and enable <strong>"Developer mode"</strong> in the top-right corner.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">3. Load Unpacked</span>
                <p className="text-[11px] text-white/70">
                  Click <strong>"Load unpacked"</strong> and select your <code className="text-purple-300">jarvis-extension</code> folder. J.A.R.V.I.S. is now connected!
                </p>
              </div>
            </div>

            {/* Extension File Tabs */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveExtensionFile("manifest")}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      activeExtensionFile === "manifest"
                        ? "bg-purple-500 text-white font-bold"
                        : "bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    manifest.json
                  </button>
                  <button
                    onClick={() => setActiveExtensionFile("background")}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      activeExtensionFile === "background"
                        ? "bg-purple-500 text-white font-bold"
                        : "bg-white/5 text-white/60 hover:text-white"
                    }`}
                  >
                    background.js
                  </button>
                </div>
                <button
                  onClick={() =>
                    handleCopyCode(
                      activeExtensionFile === "manifest" ? CHROME_EXTENSION_MANIFEST : CHROME_EXTENSION_BACKGROUND,
                      `ext-${activeExtensionFile}`
                    )
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5"
                >
                  {copiedType === `ext-${activeExtensionFile}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === `ext-${activeExtensionFile}` ? "Copied!" : "Copy File"}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-black/70 border border-white/10 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed scrollbar-thin">
                {activeExtensionFile === "manifest" ? CHROME_EXTENSION_MANIFEST : CHROME_EXTENSION_BACKGROUND}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOST MACHINE & LOCAL BRIDGE EXECUTION */}
      {activeSubTab === "host_bridge" && (
        <div className="space-y-6">
          {/* Status & Quick Test Card */}
          <div className="rounded-2xl p-5 border border-sky-500/20 bg-[#080d1a]/80 backdrop-blur-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  bridgeConfig.lastPingStatus === "online"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Local Windows Execution Bridge</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                      bridgeConfig.lastPingStatus === "online"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}>
                      {bridgeConfig.lastPingStatus === "online" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>BRIDGE CONNECTED (PORT 18500)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          <span>BROWSER DUAL-DISPATCH (READY)</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 font-mono mt-0.5">
                    When you speak commands like "play AC/DC" or "open YouTube", JARVIS triggers direct Windows shell execution
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-ping-host-bridge"
                  onClick={handlePingBridge}
                  disabled={isPingingBridge}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPingingBridge ? "animate-spin" : ""}`} />
                  <span>Check Bridge Status</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Test Command Runner */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold block">
                Test Live Host Command Dispatcher
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  id="test-host-url-input"
                  type="text"
                  value={testUrlInput}
                  onChange={(e) => setTestUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-3 pr-4 py-2 text-xs rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-sky-400"
                />
                <button
                  id="btn-test-host-launch"
                  onClick={handleExecuteTestLaunch}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-mono uppercase bg-sky-500 hover:bg-sky-400 text-black font-bold rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Dispatch Command to Host</span>
                </button>
              </div>

              {testExecutionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between"
                >
                  <span>{testExecutionResult}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">EXECUTED</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bridge Configuration Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Settings Column */}
            <div className="rounded-2xl p-4 border border-white/10 bg-black/40 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider text-white font-semibold">
                  Execution & Webhook Settings
                </h4>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-white/60 block mb-1">Local Bridge Endpoint URL</label>
                  <input
                    id="host-endpoint-input"
                    type="text"
                    value={bridgeConfig.endpointUrl}
                    onChange={(e) => hostBridgeManager.updateConfig({ endpointUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono focus:border-sky-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">Default: http://localhost:18500/launch</span>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Preferred Host Browser (Windows CLI)</label>
                  <select
                    id="host-browser-select"
                    value={bridgeConfig.preferredBrowser}
                    onChange={(e) => hostBridgeManager.updateConfig({ preferredBrowser: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono focus:border-sky-400 focus:outline-none"
                  >
                    <option value="default">Default Windows System Browser (start "")</option>
                    <option value="chrome">Google Chrome (start chrome)</option>
                    <option value="msedge">Microsoft Edge (start msedge)</option>
                    <option value="firefox">Mozilla Firefox (start firefox)</option>
                    <option value="brave">Brave Browser (start brave)</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/60 block mb-1">Custom URI Protocol Handler (Optional)</label>
                  <input
                    id="host-custom-uri-input"
                    type="text"
                    value={bridgeConfig.customUriScheme}
                    onChange={(e) => hostBridgeManager.updateConfig({ customUriScheme: e.target.value })}
                    placeholder="jarvis://open?url="
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono focus:border-sky-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">Dispatches to registered Windows protocol schemes</span>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-white/80">
                    <input
                      type="checkbox"
                      checked={bridgeConfig.autoDispatchOnMedia}
                      onChange={(e) => hostBridgeManager.updateConfig({ autoDispatchOnMedia: e.target.checked })}
                      className="rounded border-white/20 text-sky-500 focus:ring-sky-500"
                    />
                    <span>Auto-dispatch Windows command on YouTube voice play</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-white/80">
                    <input
                      type="checkbox"
                      checked={bridgeConfig.autoDispatchOnTab}
                      onChange={(e) => hostBridgeManager.updateConfig({ autoDispatchOnTab: e.target.checked })}
                      className="rounded border-white/20 text-sky-500 focus:ring-sky-500"
                    />
                    <span>Auto-dispatch Windows command on website opens</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Generated Windows Command Preview */}
            <div className="rounded-2xl p-4 border border-sky-500/20 bg-sky-950/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    Exact Windows Shell Commands
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Live Computed</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-1">
                      <span>Windows CMD / Run Command:</span>
                      <button
                        onClick={() => handleCopyCode(hostBridgeManager.generateWindowsCommand(testUrlInput, bridgeConfig.preferredBrowser), "cmd")}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedType === "cmd" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === "cmd" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 rounded-lg bg-black/80 border border-white/10 text-sky-300 font-mono text-xs overflow-x-auto select-all">
                      {hostBridgeManager.generateWindowsCommand(testUrlInput, bridgeConfig.preferredBrowser)}
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-1">
                      <span>PowerShell Command:</span>
                      <button
                        onClick={() => handleCopyCode(hostBridgeManager.generatePowerShellCommand(testUrlInput, bridgeConfig.preferredBrowser), "ps")}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedType === "ps" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === "ps" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="block p-2 rounded-lg bg-black/80 border border-white/10 text-emerald-300 font-mono text-xs overflow-x-auto select-all">
                      {hostBridgeManager.generatePowerShellCommand(testUrlInput, bridgeConfig.preferredBrowser)}
                    </code>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-white/50">
                💡 <span className="text-white/80">How it works:</span> When you command JARVIS to open YouTube or play media, it sends an HTTP POST request to your local bridge at <code className="text-sky-300">127.0.0.1:18500</code> which executes the system shell command directly in your Windows host.
              </div>
            </div>
          </div>

          {/* Downloadable / Copyable Local Bridge Scripts */}
          <div className="rounded-2xl p-5 border border-white/10 bg-black/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-sky-400" />
                  Ready-to-Run Local Bridge Scripts (Host Machine)
                </h4>
                <p className="text-xs text-white/60 font-mono mt-0.5">
                  Run any of these lightweight scripts on your host Windows machine to enable direct shell execution from JARVIS
                </p>
              </div>

              {/* Script Tab Selector */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10">
                <button
                  id="tab-script-nodejs"
                  onClick={() => setActiveScriptTab("nodejs")}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    activeScriptTab === "nodejs" ? "bg-sky-500 text-black font-bold" : "text-white/60 hover:text-white"
                  }`}
                >
                  Node.js (Recommended)
                </button>
                <button
                  id="tab-script-powershell"
                  onClick={() => setActiveScriptTab("powershell")}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    activeScriptTab === "powershell" ? "bg-sky-500 text-black font-bold" : "text-white/60 hover:text-white"
                  }`}
                >
                  PowerShell 1-Liner
                </button>
                <button
                  id="tab-script-python"
                  onClick={() => setActiveScriptTab("python")}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    activeScriptTab === "python" ? "bg-sky-500 text-black font-bold" : "text-white/60 hover:text-white"
                  }`}
                >
                  Python Webhook
                </button>
              </div>
            </div>

            {/* Script Display */}
            {activeScriptTab === "nodejs" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white/70">
                    Run in terminal or cmd: <code className="text-sky-300">node jarvis-host-bridge.js</code>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-download-node-script"
                      onClick={handleDownloadNodeScript}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>Download .js</span>
                    </button>
                    <button
                      id="btn-copy-node-script"
                      onClick={() => handleCopyCode(NODE_BRIDGE_SCRIPT, "node_script")}
                      className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedType === "node_script" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === "node_script" ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-sky-300 font-mono text-xs overflow-x-auto max-h-56 scrollbar-thin">
                  {NODE_BRIDGE_SCRIPT}
                </pre>
              </div>
            )}

            {activeScriptTab === "powershell" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white/70">
                    Paste directly into Windows PowerShell:
                  </span>
                  <button
                    id="btn-copy-ps-script"
                    onClick={() => handleCopyCode(POWERSHELL_ONE_LINER, "ps_script")}
                    className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedType === "ps_script" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "ps_script" ? "Copied!" : "Copy 1-Liner"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-emerald-300 font-mono text-xs overflow-x-auto max-h-56 scrollbar-thin whitespace-pre-wrap">
                  {POWERSHELL_ONE_LINER}
                </pre>
              </div>
            )}

            {activeScriptTab === "python" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white/70">
                    Run in terminal or cmd: <code className="text-sky-300">python jarvis_bridge.py</code>
                  </span>
                  <button
                    id="btn-copy-py-script"
                    onClick={() => handleCopyCode(PYTHON_WEBHOOK_SCRIPT, "py_script")}
                    className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedType === "py_script" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === "py_script" ? "Copied!" : "Copy Python Code"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-amber-300 font-mono text-xs overflow-x-auto max-h-56 scrollbar-thin">
                  {PYTHON_WEBHOOK_SCRIPT}
                </pre>
              </div>
            )}
          </div>

          {/* Dispatched Commands Telemetry Feed */}
          <div className="rounded-2xl p-5 border border-white/10 bg-black/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Live Dispatched Host Executions ({bridgeHistory.length})
              </span>
              {bridgeHistory.length > 0 && (
                <button
                  id="btn-clear-bridge-history"
                  onClick={() => hostBridgeManager.clearHistory()}
                  className="text-[11px] font-mono text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {bridgeHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-white/40 font-mono">
                No commands dispatched yet. Speak or trigger a YouTube video or website to see live Windows execution telemetry.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                {bridgeHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                          item.status === "success"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-white font-medium truncate">{item.title}</span>
                      </div>
                      <div className="text-white/50 text-[10px] truncate">
                        URL: {item.targetUrl}
                      </div>
                      <div className="text-sky-400 text-[10px] truncate">
                        CLI: <code className="text-slate-300">{item.windowsCommand}</code>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-white/40 block">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => handleCopyCode(item.windowsCommand, item.id)}
                        className="text-[10px] text-sky-400 hover:text-sky-300 mt-1 cursor-pointer"
                      >
                        {copiedType === item.id ? "Copied" : "Copy CLI"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE REAL WEBSITE INSPECTOR */}
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
                  title="Open this URL on host browser"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Launch on Host</span>
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
                          className="text-sky-400 hover:text-sky-300 shrink-0 opacity-80 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-mono cursor-pointer"
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

      {/* TAB 4: VOICE DIRECTIVES REFERENCE */}
      {activeSubTab === "voice_commands" && (
        <div className="rounded-2xl p-5 border border-sky-500/20 bg-[#080d1a]/80 backdrop-blur-xl space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Autonomous Real Browser & Host Voice Matrix
            </h3>
            <p className="text-xs text-white/60 font-mono mt-0.5">
              Speak or type any of these natural commands to command JARVIS to interact with your host Windows browser and YouTube
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
                  className="text-[10px] font-mono px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0 cursor-pointer"
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
