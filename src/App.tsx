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
import { RealBrowserBridge } from "./components/RealBrowserBridge";
import { ChatMessage, JarvisState, BrowserWorkflowPlan, YouTubeMedia, RealBrowserAction, VisionAnalysisResult } from "./types";
import { voiceManager } from "./utils/voiceManager";
import { SoundFX } from "./utils/soundEffects";
import { processLocalJarvisHeuristics, SystemActionDirective } from "./utils/localJarvisBrain";
import { resolveVoiceToWebsite } from "./utils/urlResolver";
import { parsePrecisionMedia, ParsedMediaDirective } from "./utils/mediaParser";
import { hostBridgeManager } from "./utils/hostBridgeManager";
import { Globe, ArrowUpRight, X, Terminal, Copy, Check, Zap } from "lucide-react";
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
  const [systemVolume, setSystemVolume] = useState<number>(85);
  const [activeYouTubeMedia, setActiveYouTubeMedia] = useState<YouTubeMedia | null>(null);
  const [activeTabDispatch, setActiveTabDispatch] = useState<{
    url: string;
    title: string;
    timestamp: number;
    windowsCommand?: string;
    powershellCommand?: string;
    bridgeStatus?: string;
  } | null>(null);
  const [copiedToastCmd, setCopiedToastCmd] = useState(false);

  // Cross-component Browser Workflow & Action Triggers
  const [pendingBrowserWorkflow, setPendingBrowserWorkflow] = useState<BrowserWorkflowPlan | null>(null);
  const [browserSandboxUrl, setBrowserSandboxUrl] = useState<string>("https://www.youtube.com");
  const [browserControlMode, setBrowserControlMode] = useState<"real" | "sandbox">("real");
  const [pendingResearchTopic, setPendingResearchTopic] = useState<string | null>(null);
  const [pendingNewTask, setPendingNewTask] = useState<{
    title: string;
    category?: "work" | "research" | "automation" | "personal";
    priority?: "low" | "medium" | "high";
  } | null>(null);

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
              language: voiceData.language || "auto",
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

  // Real Browser Tab Safe Opener with Dual-Execution Strategy, Host Bridge & Floating Toast
  const openBrowserTabSafely = useCallback((url: string, name?: string, actionType: any = "OPEN_TAB", videoId?: string) => {
    SoundFX.playComputeChime();
    const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const siteTitle = name || url;

    // Direct browser attempt
    try {
      window.open(formattedUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.log("Direct window.open handled:", e);
    }
    setBrowserSandboxUrl(formattedUrl);

    // Dispatch host execution via multi-strategy pipeline (Local Node bridge, Webhook, URI scheme, and window.open)
    hostBridgeManager.dispatchHostExecution({
      action: actionType,
      targetUrl: formattedUrl,
      title: siteTitle,
      videoId,
    }).then((event) => {
      setActiveTabDispatch({
        url: formattedUrl,
        title: siteTitle,
        timestamp: Date.now(),
        windowsCommand: event.windowsCommand,
        powershellCommand: event.powershellCommand,
        bridgeStatus: event.status,
      });
    }).catch(() => {
      setActiveTabDispatch({
        url: formattedUrl,
        title: siteTitle,
        timestamp: Date.now(),
        windowsCommand: hostBridgeManager.generateWindowsCommand(formattedUrl),
      });
    });
  }, []);

  // Real YouTube Video Search and Playback Dispatcher with Precision Directives & Ambient Feedback
  const handlePlayYouTube = useCallback(async (query: string, parsedDirective?: ParsedMediaDirective) => {
    SoundFX.playComputeChime();
    try {
      const res = await fetch("/api/jarvis/youtube-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, directive: parsedDirective }),
      });
      const data = await res.json();
      if (data.media) {
        // Enforce volume and precision properties
        const enrichedMedia: YouTubeMedia = {
          ...data.media,
          volume: systemVolume,
          artist: parsedDirective?.artist || data.media.artist,
          genre: parsedDirective?.genre || data.media.genre,
          mediaType: parsedDirective?.mediaType || data.media.mediaType,
          resolutionFilter: parsedDirective?.resolutionFilter || data.media.resolutionFilter,
          isLiveStream: parsedDirective?.isLiveStream ?? data.media.isLiveStream,
          isPlaylist: parsedDirective?.isPlaylist ?? data.media.isPlaylist,
          isInstrumental: parsedDirective?.isInstrumental ?? data.media.isInstrumental,
          isAcoustic: parsedDirective?.isAcoustic ?? data.media.isAcoustic,
        };

        setActiveYouTubeMedia(enrichedMedia);
        const ytUrl = `https://www.youtube.com/watch?v=${enrichedMedia.videoId}`;

        // Safe tab & Windows host bridge dispatch
        openBrowserTabSafely(ytUrl, enrichedMedia.title, "PLAY_YOUTUBE", enrichedMedia.videoId);

        const winCmd = hostBridgeManager.generateWindowsCommand(ytUrl);
        const psCmd = hostBridgeManager.generatePowerShellCommand(ytUrl);

        const isHindi = /[\u0900-\u097F]/.test(query) || query.includes("gaana") || query.includes("chalao");
        const jarvisAck = parsedDirective?.ambientVoiceFeedback || (
          isHindi
            ? `यूट्यूब पर "${enrichedMedia.title}" बजाया जा रहा है, सर।`
            : `Initiating playback sequence, sir. Now streaming "${enrichedMedia.title}" on YouTube.`
        );

        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: jarvisAck,
          timestamp: new Date().toISOString(),
          youtubeMedia: enrichedMedia,
          realBrowserAction: {
            action: "PLAY_YOUTUBE",
            targetUrl: ytUrl,
            videoId: enrichedMedia.videoId,
            videoTitle: enrichedMedia.title,
            confirmationSpeech: jarvisAck,
            hostCommandWindows: winCmd,
            hostCommandPowerShell: psCmd,
            bridgeDispatched: true,
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
  }, [handleSpeak, openBrowserTabSafely, systemVolume]);

  // Real Browser Tab Dispatcher
  const handleOpenRealTab = useCallback((url: string, name?: string) => {
    const formattedUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    const siteTitle = name || url;
    
    // Switch active view directly to the interactive browser sandbox so the user sees the page execute
    setActiveTab("browser");
    setBrowserSandboxUrl(formattedUrl);
    
    openBrowserTabSafely(formattedUrl, siteTitle, "OPEN_TAB");

    const winCmd = hostBridgeManager.generateWindowsCommand(formattedUrl);
    const psCmd = hostBridgeManager.generatePowerShellCommand(formattedUrl);
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
        hostCommandWindows: winCmd,
        hostCommandPowerShell: psCmd,
        bridgeDispatched: true,
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

    // Fast-path System State Awareness, Volume Shortcuts & Tab Controls
    const localCheck = processLocalJarvisHeuristics(text);
    if (localCheck.systemAction) {
      const action = localCheck.systemAction;
      let ackText = localCheck.text;

      if (action.type === "SET_VOLUME" && action.volumeLevel !== undefined) {
        const newVol = action.volumeLevel;
        setSystemVolume(newVol);
        SoundFX.setMasterVolume(newVol / 100);
        voiceManager.setVolume(newVol / 100);
        setActiveYouTubeMedia((prev) => (prev ? { ...prev, volume: newVol } : null));
      } else if (action.type === "INCREASE_VOLUME") {
        setSystemVolume((prev) => {
          const next = Math.min(100, prev + (action.delta || 15));
          SoundFX.setMasterVolume(next / 100);
          voiceManager.setVolume(next / 100);
          setActiveYouTubeMedia((p) => (p ? { ...p, volume: next } : null));
          return next;
        });
      } else if (action.type === "DECREASE_VOLUME") {
        setSystemVolume((prev) => {
          const next = Math.max(0, prev - (action.delta || 15));
          SoundFX.setMasterVolume(next / 100);
          voiceManager.setVolume(next / 100);
          setActiveYouTubeMedia((p) => (p ? { ...p, volume: next } : null));
          return next;
        });
      } else if (action.type === "MUTE") {
        setIsMuted(true);
        SoundFX.setEnabled(false);
      } else if (action.type === "UNMUTE") {
        setIsMuted(false);
        SoundFX.setEnabled(true);
      } else if (action.type === "SWITCH_TAB" && action.targetTab) {
        setActiveTab(action.targetTab);
        if (action.browserUrl) {
          setBrowserSandboxUrl(action.browserUrl);
        }
      } else if (action.type === "CLOSE_TAB") {
        setActiveTabDispatch(null);
        setActiveYouTubeMedia(null);
      } else if (action.type === "TOGGLE_VISION") {
        setIsVisionOpen(true);
      } else if (action.type === "ADD_TASK") {
        if (action.targetTab) setActiveTab(action.targetTab);
        setPendingNewTask({
          title: action.taskTitle || "New Task",
          category: action.taskCategory || "work",
          priority: action.taskPriority || "medium",
        });
      } else if (action.type === "START_RESEARCH") {
        if (action.targetTab) setActiveTab(action.targetTab);
        setPendingResearchTopic(action.researchTopic || text);
      } else if (action.type === "OPEN_BROWSER_URL") {
        if (action.browserUrl) {
          handleOpenRealTab(action.browserUrl);
        }
      }

      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: ackText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
      handleSpeak(ackText);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Fast-path Precision Media Parsing & Ambient Feedback (e.g., "play interstellar soundtrack in 4k", "play ac/dc back in black", "play lofi hip hop")
    const parsedMedia = parsePrecisionMedia(text);
    if (parsedMedia && parsedMedia.isMediaCommand && !lower.includes("workflow")) {
      await handlePlayYouTube(parsedMedia.cleanSearchQuery, parsedMedia);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
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

    // Intent 1: High-Priority Autonomous Browser Workflow & Multi-Step Agent Commands
    // (e.g. "search youtube for interstellar soundtrack and click first video", "search amazon for mechanical keyboard and extract pricing", "automate wikipedia research", etc.)
    const isCompoundBrowserTask =
      lower.includes(" and click") ||
      lower.includes(" and scroll") ||
      lower.includes(" and type") ||
      lower.includes(" and extract") ||
      lower.includes(" and play") ||
      lower.includes(" and filter") ||
      lower.includes(" and select") ||
      lower.includes(" and search") ||
      lower.includes(" and buy") ||
      lower.startsWith("automate ") ||
      lower.startsWith("autonomous ") ||
      lower.includes("workflow") ||
      lower.includes("fill form") ||
      lower.includes("fill the form") ||
      lower.includes("fill out") ||
      lower.includes("book flight") ||
      lower.includes("search amazon for") ||
      lower.includes("search youtube for") ||
      lower.includes("browse ") ||
      lower.includes("navigate to ") ||
      lower.includes("extract from") ||
      lower.includes("scrape ") ||
      lower.includes("compare prices") ||
      lower.includes("playwright") ||
      lower.includes("puppeteer") ||
      (lower.includes("search") && (lower.includes("click") || lower.includes("select") || lower.includes("first video") || lower.includes("first result") || lower.includes("scroll")));

    if (isCompoundBrowserTask) {
      setActiveTab("browser");
      setJarvisState("browsing");
      setStatusMessage("Autonomous Browser Agent Engaged.");

      const jarvisAck = `Understood, sir. Initiating Autonomous Browser Agent and executing: "${text}". Synthesizing Playwright code and human cursor trajectories.`;
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

      // Trigger browser workflow formulation and execution
      try {
        const planRes = await fetch("/api/jarvis/browser-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskGoal: text }),
        });
        const planData: BrowserWorkflowPlan = await planRes.json();
        setPendingBrowserWorkflow({ ...planData, timestamp: Date.now() } as any);
      } catch (e) {
        console.error("Browser plan formulation error:", e);
      }
      return;
    }

    // Universal Fast-path Real Website & Navigation Resolver (Single tabs: "open youtube", "go to google.com", "open github")
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let data: any = null;
      try {
        const res = await fetch("/api/jarvis/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: text,
            conversationHistory: messages.slice(-4).map((m) => ({
              role: m.sender,
              text: m.text,
            })),
          }),
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          data = await res.json();
        } else {
          data = processLocalJarvisHeuristics(text);
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        data = processLocalJarvisHeuristics(text);
      }

      if (!data) {
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
            setActiveTab("browser");
            setBrowserSandboxUrl(rAction.targetUrl);
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
            setActiveTab("browser");
            setBrowserSandboxUrl(rAction.targetUrl);
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

      {/* Real Browser Tab & Windows Host Dispatch Floating Banner */}
      {activeTabDispatch && (
        <div
          id="real-tab-dispatch-toast"
          className="fixed top-4 right-4 z-50 flex flex-col gap-1.5 bg-[#0A0A0C]/95 border border-sky-500/40 px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.25)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-sky-400 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                    Host & Browser Dispatched
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-xs text-white font-medium max-w-[180px] truncate">
                  {activeTabDispatch.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={activeTabDispatch.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => SoundFX.playComputeChime()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-mono shadow-md transition-all"
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
          </div>

          {activeTabDispatch.windowsCommand && (
            <div className="mt-1 pt-1.5 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-1 text-slate-400 truncate">
                <Terminal className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate text-slate-300">{activeTabDispatch.windowsCommand}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeTabDispatch.windowsCommand!);
                  SoundFX.playComputeChime();
                  setCopiedToastCmd(true);
                  setTimeout(() => setCopiedToastCmd(false), 2000);
                }}
                className="text-sky-400 hover:text-sky-300 shrink-0 flex items-center gap-0.5"
                title="Copy Windows Shell Command"
              >
                {copiedToastCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedToastCmd ? "Copied" : "Copy CLI"}</span>
              </button>
            </div>
          )}
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

            {/* Browser Module: Real Browser Controller & Simulator Sandbox */}
            {activeTab === "browser" && (
              <div className="space-y-6">
                {/* Mode Selector Navigation Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#080d1a]/90 border border-sky-500/30 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                        <span>BROWSER EXECUTION MODE</span>
                        <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {browserControlMode === "real" ? "REAL HOST MACHINE" : "SIMULATED SANDBOX"}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-white/50">
                        {browserControlMode === "real"
                          ? "Commands your real Google Chrome, Edge, and Windows tabs via CDP, Host Bridge, and direct window dispatcher"
                          : "Visual DOM engine with virtual mouse cursor, step execution, and live DOM tree inspector"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 shrink-0">
                    <button
                      id="btn-switch-real-browser"
                      onClick={() => {
                        SoundFX.playTargetClick();
                        setBrowserControlMode("real");
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        browserControlMode === "real"
                          ? "bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>CONTROL MY REAL BROWSER</span>
                    </button>

                    <button
                      id="btn-switch-sandbox-browser"
                      onClick={() => {
                        SoundFX.playTargetClick();
                        setBrowserControlMode("sandbox");
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        browserControlMode === "sandbox"
                          ? "bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>SIMULATED SANDBOX</span>
                    </button>
                  </div>
                </div>

                {/* Active View: Real Browser Bridge vs Sandbox Engine */}
                {browserControlMode === "real" ? (
                  <RealBrowserBridge
                    onOpenRealTab={handleOpenRealTab}
                    onPlayYouTube={handlePlayYouTube}
                    onJarvisSpeak={handleSpeak}
                  />
                ) : (
                  <BrowserSandbox
                    initialWorkflow={pendingBrowserWorkflow}
                    initialUrl={browserSandboxUrl}
                    onJarvisSpeak={handleSpeak}
                    onOpenRealTab={handleOpenRealTab}
                    onPlayYouTube={handlePlayYouTube}
                  />
                )}
              </div>
            )}

            {/* Daily Productivity & Morning Intelligence Briefing */}
            {activeTab === "productivity" && (
              <DailyProductivity
                initialNewTask={pendingNewTask}
                onJarvisSpeak={handleSpeak}
                onTriggerBrowserWorkflow={handleTriggerBrowserWorkflow}
              />
            )}

            {/* Deep Research Lab */}
            {activeTab === "research" && (
              <ResearchLab initialTopic={pendingResearchTopic} onJarvisSpeak={handleSpeak} />
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
