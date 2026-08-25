/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { HeaderNav } from "./components/HeaderNav";
import { ArcReactorHUD } from "./components/ArcReactorHUD";
import { JarvisConsole } from "./components/JarvisConsole";
import { VoiceVisualizationConsole } from "./components/VoiceVisualizationConsole";
import { BrowserSandbox } from "./components/BrowserSandbox";
import { DailyProductivity } from "./components/DailyProductivity";
import { ResearchLab } from "./components/ResearchLab";
import { FocusModeHUD } from "./components/FocusModeHUD";
import { VoiceSettingsModal } from "./components/VoiceSettingsModal";
import { YouTubeMediaHUD } from "./components/YouTubeMediaHUD";
import { VisionOpticsHUD } from "./components/VisionOpticsHUD";
import { ChatMessage, JarvisState, BrowserWorkflowPlan, YouTubeMedia, RealBrowserAction, VisionAnalysisResult } from "./types";
import { voiceManager } from "./utils/voiceManager";
import { SoundFX } from "./utils/soundEffects";
import { processLocalJarvisHeuristics } from "./utils/localJarvisBrain";
import { resolveVoiceToWebsite } from "./utils/urlResolver";
import { Globe, ArrowUpRight, X } from "lucide-react";
import {
  auth,
  db,
  testFirestoreConnection,
  syncMessageToFirestore,
  handleFirestoreError,
  OperationType,
} from "./lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";

export default function App() {
  const [activeTab, setActiveTab] = useState<"core" | "browser" | "productivity" | "research">("core");
  const [jarvisState, setJarvisState] = useState<JarvisState>("idle");
  const [statusMessage, setStatusMessage] = useState("JARVIS Neural Core Online. Say 'Jarvis' or click the Arc Reactor.");
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [frequencies, setFrequencies] = useState<Uint8Array>(new Uint8Array(32));
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [activeYouTubeMedia, setActiveYouTubeMedia] = useState<YouTubeMedia | null>(null);
  const [activeTabDispatch, setActiveTabDispatch] = useState<{
    url: string;
    title: string;
    timestamp: number;
  } | null>(null);

  // Cross-component Browser Workflow Trigger
  const [pendingBrowserWorkflow, setPendingBrowserWorkflow] = useState<BrowserWorkflowPlan | null>(null);

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "jarvis",
      text: "Good day, sir. All neural subsystems, real-time internet search grounding, and autonomous browser automation protocols are fully operational. How may I assist your workflow today?",
      timestamp: new Date().toISOString(),
    },
  ]);

  // Test Firestore Connection on Boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sync Messages and Settings from Firestore for Authenticated User
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load voice settings
        try {
          const voiceDoc = await getDoc(doc(db, "users", user.uid, "settings", "voice"));
          if (voiceDoc.exists()) {
            const voiceData = voiceDoc.data();
            voiceManager.setSettings({
              pitch: voiceData.pitch,
              rate: voiceData.rate,
              voiceURI: voiceData.voiceURI,
              presetName: voiceData.presetName,
            });
          }
        } catch (e) {
          console.warn("Could not load cloud voice settings", e);
        }

        const messagesPath = `users/${user.uid}/messages`;
        const q = query(collection(db, messagesPath), orderBy("createdAt", "asc"));
        const unsubscribeMessages = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: ChatMessage[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                  id: data.id || doc.id,
                  sender: data.sender,
                  text: data.text,
                  timestamp: data.timestamp,
                  isVoiceInput: data.isVoiceInput,
                };
              });
              setMessages(loaded);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, messagesPath);
          }
        );
        return () => unsubscribeMessages();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Voice manager setup on mount
  useEffect(() => {
    voiceManager.setCallbacks(
      (text: string, isFinal: boolean) => {
        if (!isFinal) {
          setInterimTranscript(text);
          setJarvisState("listening");
        } else {
          setInterimTranscript("");
          handleVoiceCommand(text);
        }
      },
      (listening: boolean, speaking: boolean) => {
        setIsListening(listening);
        setIsSpeaking(speaking);
        if (speaking) {
          setJarvisState("speaking");
          setStatusMessage("JARVIS speaking...");
        } else if (listening && !isProcessing) {
          setJarvisState("listening");
          setStatusMessage("Voice sensor active. Standing by for commands...");
        } else if (!isProcessing) {
          setJarvisState("idle");
        }
      },
      (freqData: Uint8Array) => {
        setFrequencies(new Uint8Array(freqData));
      }
    );

    // Auto-start listener gracefully
    voiceManager.startListening();

    // Hotkey listener (Spacebar for quick voice toggle, F for Focus Mode, Esc to exit)
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") {
        if (e.key === "Escape") {
          setIsFocusMode(false);
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        toggleVoice();
      } else if (e.code === "KeyF" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        SoundFX.playComputeChime();
        setIsFocusMode((prev) => !prev);
      } else if (e.code === "Escape") {
        setIsFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      voiceManager.stopListening();
    };
  }, []);

  const toggleVoice = () => {
    const nextState = voiceManager.toggleListening();
    setIsListening(nextState);
    if (nextState) {
      setStatusMessage("Voice sensor engaged. Listening for commands...");
    } else {
      setStatusMessage("Voice sensor on standby. Click to activate.");
    }
  };

  const handleSpeak = useCallback((text: string) => {
    if (isMuted) {
      setTimeout(() => {
        voiceManager.startListening();
        setJarvisState("listening");
        setStatusMessage("Voice sensor active. Listening for your command...");
      }, 400);
      return;
    }
    voiceManager.speak(text, () => {
      setJarvisState("listening");
      setStatusMessage("Listening for your next command, sir...");
    });
  }, [isMuted]);

  // Real Browser Tab Safe Opener with Dual-Execution Strategy & Floating Toast
  const openBrowserTabSafely = useCallback((url: string, name?: string) => {
    SoundFX.playComputeChime();
    const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const siteTitle = name || url;

    // 1. Direct window.open attempt
    try {
      const win = window.open(formattedUrl, "_blank", "noopener,noreferrer");
      if (win) win.focus();
    } catch (e) {
      console.warn("window.open blocked or restricted:", e);
    }

    // 2. Dynamic Invisible Anchor fallback for browser security policies
    try {
      const a = document.createElement("a");
      a.href = formattedUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 150);
    } catch (e) {}

    // 3. Set global Active Tab Dispatch notification banner
    setActiveTabDispatch({
      url: formattedUrl,
      title: siteTitle,
      timestamp: Date.now(),
    });
  }, []);

  // Real YouTube Video Search and Playback Dispatcher
  const handlePlayYouTube = useCallback(async (query: string) => {
    SoundFX.playComputeChime();
    try {
      const res = await fetch("/api/jarvis/youtube-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.media) {
        setActiveYouTubeMedia(data.media);
        const ytUrl = `https://www.youtube.com/watch?v=${data.media.videoId}`;

        // Safe tab dispatch
        openBrowserTabSafely(ytUrl, data.media.title);

        const jarvisAck = `Now streaming "${data.media.title}" on YouTube media player, sir.`;
        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: jarvisAck,
          timestamp: new Date().toISOString(),
          youtubeMedia: data.media,
          realBrowserAction: {
            action: "PLAY_YOUTUBE",
            targetUrl: ytUrl,
            videoId: data.media.videoId,
            videoTitle: data.media.title,
            confirmationSpeech: jarvisAck,
          },
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        if (auth.currentUser) {
          syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
        }
        handleSpeak(jarvisAck);
      }
    } catch (err) {
      console.error("YouTube search error:", err);
    }
  }, [handleSpeak, openBrowserTabSafely]);

  // Real Browser Tab Dispatcher
  const handleOpenRealTab = useCallback((url: string, name?: string) => {
    const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const siteTitle = name || url;
    
    openBrowserTabSafely(formattedUrl, siteTitle);

    const jarvisAck = `Launching ${siteTitle} in an active browser tab, sir.`;
    const jarvisMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: "jarvis",
      text: jarvisAck,
      timestamp: new Date().toISOString(),
      realBrowserAction: {
        action: "OPEN_TAB",
        targetUrl: formattedUrl,
        query: siteTitle,
        confirmationSpeech: jarvisAck,
      },
    };

    setMessages((prev) => [...prev, jarvisMsg]);
    if (auth.currentUser) {
      syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
    }
    handleSpeak(jarvisAck);
  }, [handleSpeak, openBrowserTabSafely]);

  // Vision Analysis Callback
  const handleVisionResult = useCallback((result: VisionAnalysisResult, imagePreviewUrl: string) => {
    const jarvisMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: "jarvis",
      text: result.detailedAnalysis || result.spokenObservation,
      timestamp: new Date().toISOString(),
      visionAnalysis: result,
    };

    setMessages((prev) => [...prev, jarvisMsg]);
    if (auth.currentUser) {
      syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
    }
  }, []);

  // Handle Intent Detection and Voice Routing
  const handleVoiceCommand = async (rawTranscript: string) => {
    const text = rawTranscript.trim();
    if (!text) return;

    // Immediately turn mic OFF while thinking and answering
    voiceManager.pauseListeningForThinking();
    setIsListening(false);
    SoundFX.playComputeChime();
    setIsProcessing(true);
    setJarvisState("thinking");
    setStatusMessage(`Processing command: "${text}"`);

    // Add user message to conversation stream
    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
      isVoiceInput: true,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    if (auth.currentUser) {
      syncMessageToFirestore(auth.currentUser.uid, newUserMsg).catch(console.error);
    }

    const lower = text.toLowerCase();

    // Fast-path Optic Vision & Camera Controls: "look at me", "can you see me", "scan me", "open camera", "check posture"
    if (
      lower.includes("close camera") ||
      lower.includes("turn off camera") ||
      lower.includes("stop camera") ||
      lower.includes("disable vision")
    ) {
      setIsVisionOpen(false);
      const ack = "Disengaging optic camera sensors, sir.";
      handleSpeak(ack);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Fast-path Hand Tracking & Air Draw Commands
    if (
      lower.includes("hand movement") ||
      lower.includes("track hand") ||
      lower.includes("hand tracking") ||
      lower.includes("track my hand") ||
      lower.includes("air draw") ||
      lower.includes("air canvas") ||
      lower.includes("draw with hand") ||
      lower.includes("start drawing") ||
      lower.includes("draw in the air")
    ) {
      setIsVisionOpen(true);
      const ack = "Engaging isolated 60 FPS Hand Tracking and Air-Draw matrix, sir. Raise your hand in front of the lens to begin drawing.";
      handleSpeak(ack);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    if (
      lower.includes("look at me") ||
      lower.includes("see me") ||
      lower.includes("can you see me") ||
      lower.includes("scan me") ||
      lower.includes("what do you see") ||
      lower.includes("open camera") ||
      lower.includes("turn on camera") ||
      lower.includes("start camera") ||
      lower.includes("check my posture") ||
      lower.includes("scan my room") ||
      lower.includes("check posture") ||
      lower.includes("optic sensor") ||
      lower.includes("optic vision") ||
      lower.includes("detect object") ||
      lower.includes("detect objects") ||
      lower.includes("object detection") ||
      lower.includes("track objects") ||
      lower.includes("realtime detection") ||
      lower.includes("track target")
    ) {
      setIsVisionOpen(true);
      const ack = "Optic camera array engaged, sir. Real-time object detection matrix and targeting reticles are online.";
      handleSpeak(ack);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Fast-path Real YouTube Voice commands (e.g. "play acdc", "play lofi", "play interstellar on youtube")
    if (
      (lower.startsWith("play ") || lower.includes("play on youtube") || lower.includes("play song") || lower.includes("play video")) &&
      !lower.includes("workflow")
    ) {
      const songQuery = text
        .replace(/^(jarvis|jarvis,|please)\s+/i, "")
        .replace(/^play\s+/i, "")
        .replace(/\s+on\s+youtube/i, "")
        .trim();

      if (songQuery) {
        await handlePlayYouTube(songQuery);
        setIsProcessing(false);
        setJarvisState("idle");
        return;
      }
    }

    // Fast-path Media Controls: "pause music", "stop video", "resume music"
    if (lower.includes("pause music") || lower.includes("pause video") || lower.includes("pause youtube")) {
      setActiveYouTubeMedia((prev) => (prev ? { ...prev, isPlaying: false } : null));
      const ack = "Pausing media playback, sir.";
      handleSpeak(ack);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    if (lower.includes("resume music") || lower.includes("resume video") || lower.includes("resume youtube") || lower.includes("unpause")) {
      setActiveYouTubeMedia((prev) => (prev ? { ...prev, isPlaying: true } : null));
      const ack = "Resuming YouTube stream, sir.";
      handleSpeak(ack);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    if (lower.includes("stop music") || lower.includes("stop video") || lower.includes("close youtube")) {
      setActiveYouTubeMedia(null);
      const ack = "Closing YouTube media HUD, sir.";
      handleSpeak(ack);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Universal Fast-path Real Website & Navigation Resolver (Supports ALL websites, custom domains, search queries, etc.)
    const resolvedWeb = resolveVoiceToWebsite(text);
    if (resolvedWeb) {
      if (resolvedWeb.targetUrl.includes("youtube.com") && !activeYouTubeMedia) {
        setActiveYouTubeMedia({
          videoId: "jfKfPfyJRdk",
          title: "YouTube Main Portal",
          channelTitle: "YouTube",
          thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
          isPlaying: true,
          isMuted: false,
          volume: 80,
        });
      }

      handleOpenRealTab(resolvedWeb.targetUrl, resolvedWeb.siteName);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Intent 1: Autonomous Browser Command ("browse", "navigate", "extract from", "scrape", "compare prices")
    if (
      lower.includes("browse") ||
      lower.includes("navigate") ||
      lower.includes("extract from") ||
      lower.includes("scrape") ||
      lower.includes("compare prices")
    ) {
      setActiveTab("browser");
      setJarvisState("browsing");
      setStatusMessage("Autonomous Browser Agent Engaged.");

      const jarvisAck = `Understood, sir. Switching to Autonomous Browser mode and executing: "${text}".`;
      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: jarvisAck,
        timestamp: new Date().toISOString(),
        browserWorkflowTriggered: true,
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
      handleSpeak(jarvisAck);
      setIsProcessing(false);

      // Trigger browser workflow formulation
      try {
        const planRes = await fetch("/api/jarvis/browser-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskGoal: text }),
        });
        const planData: BrowserWorkflowPlan = await planRes.json();
        setPendingBrowserWorkflow(planData);
      } catch (e) {
        console.error("Browser plan formulation error:", e);
      }
      return;
    }

    // Intent 2: Daily Briefing ("morning briefing", "daily briefing", "agenda", "tasks for today")
    if (lower.includes("briefing") || lower.includes("morning report") || lower.includes("daily summary")) {
      setActiveTab("productivity");
      const jarvisAck = "Opening your Autonomous Daily Briefing Matrix right away, sir.";
      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: jarvisAck,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
      handleSpeak(jarvisAck);
      setIsProcessing(false);
      return;
    }

    // Intent 3: Deep Research ("deep research", "research paper", "dossier on")
    if (lower.includes("research on") || lower.includes("deep research") || lower.includes("dossier on")) {
      setActiveTab("research");
      const jarvisAck = `Initiating Deep Research Lab on your topic, sir. Gathering grounded web citations.`;
      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: jarvisAck,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
      handleSpeak(jarvisAck);
      setIsProcessing(false);
      return;
    }

    // Default: General Query with Real-time Search Grounding & Real Browser Action Detection
    try {
      const res = await fetch("/api/jarvis/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-4).map((m) => ({
            role: m.sender,
            text: m.text,
          })),
        }),
      });

      let data: any;
      if (res.ok) {
        data = await res.json();
      } else {
        console.warn("Backend chat endpoint returned non-200, activating local neural fallback.");
        data = processLocalJarvisHeuristics(text);
      }

      const responseText = data.text || "At your service, sir.";
      const responseSources = data.sources || [];

      // Handle real browser action if detected by backend or local heuristics
      if (data.realBrowserAction) {
        const rAction = data.realBrowserAction as RealBrowserAction;
        if (rAction.action === "PLAY_YOUTUBE" && data.youtubeMedia) {
          setActiveYouTubeMedia(data.youtubeMedia);
          if (rAction.targetUrl) {
            openBrowserTabSafely(rAction.targetUrl, data.youtubeMedia.title);
          }
        } else if (rAction.action === "PAUSE_YOUTUBE") {
          setActiveYouTubeMedia((prev) => (prev ? { ...prev, isPlaying: false } : null));
        } else if (rAction.action === "RESUME_YOUTUBE") {
          setActiveYouTubeMedia((prev) => (prev ? { ...prev, isPlaying: true } : null));
        } else if (rAction.action === "STOP_YOUTUBE") {
          setActiveYouTubeMedia(null);
        } else if (rAction.action === "OPEN_TAB" || rAction.action === "SEARCH_GOOGLE") {
          if (rAction.targetUrl) {
            openBrowserTabSafely(rAction.targetUrl, rAction.query || "Requested Web Page");
          }
        }
      }

      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: responseText,
        timestamp: new Date().toISOString(),
        sources: responseSources,
        realBrowserAction: data.realBrowserAction,
        youtubeMedia: data.youtubeMedia,
      };

      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
      setStatusMessage("Response delivered.");
      handleSpeak(responseText);
    } catch (err: any) {
      console.error("Chat network notice (activating local heuristics):", err);
      const localResult = processLocalJarvisHeuristics(text);

      if (localResult.realBrowserAction) {
        const rAction = localResult.realBrowserAction;
        if (rAction.action === "PLAY_YOUTUBE" && localResult.youtubeMedia) {
          setActiveYouTubeMedia(localResult.youtubeMedia);
          if (rAction.targetUrl) {
            openBrowserTabSafely(rAction.targetUrl, localResult.youtubeMedia.title);
          }
        } else if (rAction.action === "OPEN_TAB" || rAction.action === "SEARCH_GOOGLE") {
          if (rAction.targetUrl) {
            openBrowserTabSafely(rAction.targetUrl, rAction.query || "Requested Web Page");
          }
        }
      }

      const errJarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: localResult.text,
        timestamp: new Date().toISOString(),
        sources: localResult.sources,
        realBrowserAction: localResult.realBrowserAction,
        youtubeMedia: localResult.youtubeMedia,
      };
      setMessages((prev) => [...prev, errJarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, errJarvisMsg).catch(console.error);
      }
      handleSpeak(localResult.text);
    } finally {
      setIsProcessing(false);
      if (!isSpeaking) setJarvisState("idle");
    }
  };

  const handleSendMessage = (text: string, isVoice = false) => {
    handleVoiceCommand(text);
  };

  const handleTriggerBrowserWorkflow = (prompt: string) => {
    setActiveTab("browser");
    handleVoiceCommand(prompt);
  };

  return (
    <div
      id="jarvis-app-root"
      className="min-h-screen bg-[#050506] text-slate-300 flex flex-col selection:bg-sky-500 selection:text-white font-sans relative overflow-x-hidden"
    >
      {/* Ambient Sophisticated Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.06),_transparent_70%)] -z-10" />

      {/* Real Browser Tab Dispatch Floating Banner */}
      {activeTabDispatch && (
        <div
          id="real-tab-dispatch-toast"
          className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-[#0A0A0C]/95 border border-sky-500/40 px-4 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.25)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-sky-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400">Browser Tab Dispatched</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-xs text-white font-medium max-w-[200px] truncate">
              {activeTabDispatch.title}
            </span>
          </div>
          <a
            href={activeTabDispatch.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => SoundFX.playComputeChime()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-mono shadow-md transition-all ml-1"
          >
            <span>Open ↗</span>
          </a>
          <button
            onClick={() => setActiveTabDispatch(null)}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Focus Mode View: Minimizes all non-essential UI elements to keep only Arc Reactor & Voice Console */}
      {isFocusMode ? (
        <FocusModeHUD
          jarvisState={jarvisState}
          frequencies={frequencies}
          onToggleVoice={toggleVoice}
          isListening={isListening}
          isSpeaking={isSpeaking}
          statusMessage={statusMessage}
          messages={messages}
          onSendMessage={handleSendMessage}
          onSpeakMessage={handleSpeak}
          interimTranscript={interimTranscript}
          isProcessing={isProcessing}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            SoundFX.setEnabled(!next);
          }}
          onExitFocusMode={() => setIsFocusMode(false)}
          onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
          onOpenRealTab={handleOpenRealTab}
          onPlayYouTube={handlePlayYouTube}
        />
      ) : (
        <>
          {/* Global Sophisticated Header Navigation */}
          <HeaderNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isListening={isListening}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => {
              SoundFX.playComputeChime();
              setIsFocusMode(true);
            }}
            onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
            isVisionOpen={isVisionOpen}
            onToggleVision={() => setIsVisionOpen((prev) => !prev)}
          />

          {/* Main Responsive Canvas Container */}
          <main id="main-content-viewport" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
            {/* Core Tab: Central Arc Reactor HUD + Live Voice Console */}
            {activeTab === "core" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Arc Reactor HUD (5 COLS) */}
                <div className="lg:col-span-5 bg-[#0A0A0C] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                  <ArcReactorHUD
                    state={jarvisState}
                    frequencies={frequencies}
                    onToggleVoice={toggleVoice}
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    statusMessage={statusMessage}
                  />

                  {/* Push to talk keyboard badge */}
                  <div className="mt-4 pt-4 border-t border-white/5 w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="uppercase tracking-widest text-slate-500">Wake Word: "Jarvis"</span>
                    <span className="px-3 py-1 rounded-full bg-[#050506] border border-white/10 text-sky-400">
                      SPACEBAR: MIC TOGGLE
                    </span>
                  </div>
                </div>

                {/* Right Interactive Voice Visualization & Sonic Spectrogram Matrix (7 COLS) */}
                <div className="lg:col-span-7">
                  <VoiceVisualizationConsole
                    messages={messages}
                    frequencies={frequencies}
                    state={jarvisState}
                    isListening={isListening}
                    isSpeaking={isSpeaking}
                    interimTranscript={interimTranscript}
                    isProcessing={isProcessing}
                    onToggleVoice={toggleVoice}
                    onSpeakMessage={handleSpeak}
                    onTriggerBrowserWorkflow={handleTriggerBrowserWorkflow}
                    onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
                    onOpenRealTab={handleOpenRealTab}
                    onPlayYouTube={handlePlayYouTube}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              </div>
            )}

            {/* Autonomous Browser Agent Sandbox View */}
            {activeTab === "browser" && (
              <BrowserSandbox
                initialWorkflow={pendingBrowserWorkflow}
                onJarvisSpeak={handleSpeak}
                onOpenRealTab={handleOpenRealTab}
                onPlayYouTube={handlePlayYouTube}
              />
            )}

            {/* Daily Productivity & Morning Intelligence Briefing */}
            {activeTab === "productivity" && (
              <DailyProductivity
                onJarvisSpeak={handleSpeak}
                onTriggerBrowserWorkflow={handleTriggerBrowserWorkflow}
              />
            )}

            {/* Deep Research Lab */}
            {activeTab === "research" && (
              <ResearchLab onJarvisSpeak={handleSpeak} />
            )}
          </main>

          {/* Global Minimalist Footer */}
          <footer className="w-full border-t border-white/5 bg-[#050506] py-3.5 px-6 text-center text-[10px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="tracking-widest uppercase">J.A.R.V.I.S. Autonomous Neural Core & Browser Engine</span>
            </div>
            <div>
              <span className="tracking-wider uppercase text-slate-500">Google Gemini Live Search Grounding & Real-Time Voice Synthesis</span>
            </div>
          </footer>
        </>
      )}

      {/* Real YouTube Media HUD Player (Accessible across all views & Focus Mode) */}
      <YouTubeMediaHUD
        media={activeYouTubeMedia}
        onUpdateMedia={setActiveYouTubeMedia}
        onPlayQuery={handlePlayYouTube}
        onJarvisSpeak={handleSpeak}
      />

      {/* Voice Synthesis Pitch, Velocity & Model Customization Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />

      {/* Futuristic JARVIS Optic Vision HUD & Biometric Tracking Matrix */}
      <VisionOpticsHUD
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        onVisionResult={handleVisionResult}
        onJarvisSpeak={handleSpeak}
        isProcessing={isProcessing}
      />
    </div>
  );
}
