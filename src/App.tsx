/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { HeaderNav } from "./components/HeaderNav";
import { ArcReactorHUD } from "./components/ArcReactorHUD";
import { JarvisConsole } from "./components/JarvisConsole";
import { VoiceVisualizationConsole } from "./components/VoiceVisualizationConsole";
import { DailyProductivity } from "./components/DailyProductivity";
import { ResearchLab } from "./components/ResearchLab";
import { FocusModeHUD } from "./components/FocusModeHUD";
import { VoiceSettingsModal } from "./components/VoiceSettingsModal";
import { YouTubeMediaHUD } from "./components/YouTubeMediaHUD";
import { VisionOpticsHUD } from "./components/VisionOpticsHUD";
import { ChatMessage, JarvisState, YouTubeMedia, RealBrowserAction, VisionAnalysisResult, JarvisInterfaceId } from "./types";
import { CoreCommandInterface } from "./components/interfaces/CoreCommandInterface";
import { ArmorDiagnosticsInterface } from "./components/interfaces/ArmorDiagnosticsInterface";
import { SatelliteReconInterface } from "./components/interfaces/SatelliteReconInterface";
import { VitalsCryoInterface } from "./components/interfaces/VitalsCryoInterface";
import { SchematicsCADInterface } from "./components/interfaces/SchematicsCADInterface";
import { SecurityOverwatchInterface } from "./components/interfaces/SecurityOverwatchInterface";
import { QuantumResearchInterface } from "./components/interfaces/QuantumResearchInterface";
import { ProductivityDeckInterface } from "./components/interfaces/ProductivityDeckInterface";
import { MediaSignalsInterface } from "./components/interfaces/MediaSignalsInterface";
import { VeronicaDeploymentInterface } from "./components/interfaces/VeronicaDeploymentInterface";
import { InterfaceSelectorModal } from "./components/InterfaceSelectorModal";
import { JARVIS_INTERFACES } from "./utils/interfacesRegistry";
import { voiceManager } from "./utils/voiceManager";
import { SoundFX } from "./utils/soundEffects";
import { processLocalJarvisHeuristics, SystemActionDirective } from "./utils/localJarvisBrain";
import { resolveVoiceToWebsite, resolveWebsiteWithLogin } from "./utils/urlResolver";
import { parsePrecisionMedia, ParsedMediaDirective } from "./utils/mediaParser";
import { isGmailCheckIntent, fetchGmailInbox } from "./utils/gmailManager";
import {
  isGoogleDocIntent,
  parseGoogleDocIntent,
  createGoogleDoc,
  fetchRecentGoogleDocs,
} from "./utils/docsManager";
import {
  isGoogleMeetIntent,
  parseGoogleMeetIntent,
  createGoogleMeetSpace,
} from "./utils/meetManager";
import { isFormFillIntent, createFormFillTelemetry } from "./utils/formFillManager";
import { opticVisionManager } from "./utils/opticVisionManager";
import { roomSentryManager } from "./utils/roomSentryManager";
import { clapDetector } from "./utils/clapDetector";
import { themeManager, JarvisTheme } from "./utils/themeManager";
import { ThemeLibraryModal } from "./components/ThemeLibraryModal";
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
  const [activeTab, setActiveTab] = useState<"core" | "productivity" | "research">("core");
  const [activeInterface, setActiveInterface] = useState<JarvisInterfaceId>("core");
  const [isInterfaceSelectorOpen, setIsInterfaceSelectorOpen] = useState(false);
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
  const [isThemeLibraryOpen, setIsThemeLibraryOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
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

  // Cross-component Triggers
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
      text: "Hi sir zain and i am ready. By the way sir may i ask you how is you ShadowTalk project going,",
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

    // Auto-start acoustic clap wake detector
    clapDetector.start();

    // Startup Greeting for Sir Zain: "Hi sir zain and i am ready. By the way sir may i ask you how is you ShadowTalk project going,"
    let hasSpokenStartup = false;
    const triggerStartupSpeech = () => {
      voiceManager.unlockAudioAndListen();
      if (hasSpokenStartup) return;
      hasSpokenStartup = true;
      handleSpeak("Hi sir zain and i am ready. By the way sir may i ask you how is you ShadowTalk project going,");
    };

    const startupTimer = setTimeout(() => {
      triggerStartupSpeech();
    }, 700);

    const onUserInteraction = () => {
      triggerStartupSpeech();
      voiceManager.unlockAudioAndListen();
      window.removeEventListener("pointerdown", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      window.removeEventListener("click", onUserInteraction);
    };

    window.addEventListener("pointerdown", onUserInteraction, { once: true });
    window.addEventListener("keydown", onUserInteraction, { once: true });
    window.addEventListener("click", onUserInteraction, { once: true });

    // Subscribe to Theme Manager
    const unsubTheme = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });

    const unsubClap = clapDetector.onClap((evt) => {
      // Force microphone listening online
      voiceManager.startListening();
      setIsListening(true);
      setJarvisState("listening");
      setStatusMessage("👏 Acoustic hand clap detected! JARVIS online and listening...");

      const greetings = [
        "At your service, sir. All systems online and standing by.",
        "Yes, sir! I am listening. What is your command?",
        "Right here, sir. How may I assist you today?",
        "Systems fully responsive, sir. Ready when you are.",
      ];
      const selectedGreeting = greetings[Math.floor(Math.random() * greetings.length)];

      if (clapDetector.getConfig().spokenGreetingEnabled) {
        handleSpeak(selectedGreeting);
      }

      const jarvisMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: "jarvis",
        text: `👏 Hand clap acoustic trigger received (${evt.type.replace("_", " ")} - Peak ${evt.peakVolume}%). ${selectedGreeting}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
    });

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
      clearTimeout(startupTimer);
      window.removeEventListener("pointerdown", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      window.removeEventListener("click", onUserInteraction);
      window.removeEventListener("keydown", handleKeyDown);
      voiceManager.stopListening();
      unsubClap();
      unsubTheme();
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

    // Use a single dedicated tab for YouTube media playback, and _blank for general web links
    const windowTarget = actionType === "PLAY_YOUTUBE" ? "jarvis_media_stream_tab" : "_blank";

    // Direct browser attempt
    try {
      window.open(formattedUrl, windowTarget, "noopener,noreferrer");
    } catch (e) {
      console.log("Direct window.open handled:", e);
    }

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
      const mediaObj = data.media || (data.videoId ? data : null);
      if (mediaObj) {
        // Enforce volume and precision properties
        const enrichedMedia: YouTubeMedia = {
          ...mediaObj,
          volume: systemVolume,
          artist: parsedDirective?.artist || mediaObj.artist,
          genre: parsedDirective?.genre || mediaObj.genre,
          mediaType: parsedDirective?.mediaType || mediaObj.mediaType,
          resolutionFilter: parsedDirective?.resolutionFilter || mediaObj.resolutionFilter,
          isLiveStream: parsedDirective?.isLiveStream ?? mediaObj.isLiveStream,
          isPlaylist: parsedDirective?.isPlaylist ?? mediaObj.isPlaylist,
          isInstrumental: parsedDirective?.isInstrumental ?? mediaObj.isInstrumental,
          isAcoustic: parsedDirective?.isAcoustic ?? mediaObj.isAcoustic,
        };

        setActiveYouTubeMedia(enrichedMedia);
        const ytUrl = `https://www.youtube.com/watch?v=${enrichedMedia.videoId}`;

        // Safe tab & Windows host bridge dispatch to open in single dedicated YouTube tab
        openBrowserTabSafely(ytUrl, enrichedMedia.title, "PLAY_YOUTUBE", enrichedMedia.videoId);

        const winCmd = hostBridgeManager.generateWindowsCommand(ytUrl);
        const psCmd = hostBridgeManager.generatePowerShellCommand(ytUrl);

        const isHindi = /[\u0900-\u097F]/.test(query) || query.includes("gaana") || query.includes("chalao");
        const jarvisAck = parsedDirective?.ambientVoiceFeedback || (
          isHindi
            ? `यूट्यूब पर "${enrichedMedia.title}" को एक समर्पित टैब में बजाया जा रहा है, सर।`
            : `Initiating playback sequence in a dedicated browser tab, sir. Streaming "${enrichedMedia.title}" on YouTube.`
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

  // Specialized ShadowTalk Browser Workflow (Zain Ahmed & Fahad Patel, Karachi)
  const handleOpenShadowTalkWorkflow = useCallback(() => {
    SoundFX.playComputeChime();
    const primaryRepoUrl = "https://github.com/topics/shadowtalk";
    const projectTitle = "ShadowTalk Primary Repository & Project Hub (Zain Ahmed & Fahad Patel — Karachi)";

    setStatusMessage("Initiating ShadowTalk browser uplink for Sir Zain Ahmed & Fahad Patel (Karachi)...");

    // Safe tab dispatch & host command bridge
    openBrowserTabSafely(primaryRepoUrl, "ShadowTalk Repository & Project Hub", "OPEN_TAB");

    const winCmd = hostBridgeManager.generateWindowsCommand(primaryRepoUrl);
    const psCmd = hostBridgeManager.generatePowerShellCommand(primaryRepoUrl);
    const jarvisAck = "Initiating specialized browser uplink for ShadowTalk, sir. Opening the primary repository and project hub for Sir Zain Ahmed and Fahad Patel in Karachi.";

    const jarvisMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: "jarvis",
      text: jarvisAck,
      timestamp: new Date().toISOString(),
      realBrowserAction: {
        action: "OPEN_TAB",
        targetUrl: primaryRepoUrl,
        query: projectTitle,
        confirmationSpeech: jarvisAck,
        hostCommandWindows: winCmd,
        hostCommandPowerShell: psCmd,
        bridgeDispatched: true,
      },
      sources: [
        { title: "ShadowTalk Primary Repository (GitHub)", url: primaryRepoUrl },
        { title: "ShadowTalk Initiative — Zain Ahmed & Fahad Patel (Karachi)", url: "https://www.google.com/search?q=ShadowTalk+Zain+Ahmed+Fahad+Patel+Karachi" },
      ],
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

    // Fast-path Define ShadowTalk & Project Intelligence for Zain Ahmed & Fahad Patel from Karachi
    const isShadowTalkQuery =
      lower.includes("shadowtalk") ||
      lower.includes("shadow talk") ||
      (lower.includes("define") && (lower.includes("shadow") || lower.includes("talk"))) ||
      (lower.includes("what is") && lower.includes("shadow")) ||
      (lower.includes("research") && lower.includes("shadow"));

    if (isShadowTalkQuery) {
      SoundFX.playComputeChime();
      const isBrowseAction =
        lower.includes("open") ||
        lower.includes("launch") ||
        lower.includes("repo") ||
        lower.includes("github") ||
        lower.includes("page") ||
        lower.includes("landing") ||
        lower.includes("browse") ||
        lower.includes("visit");

      if (isBrowseAction) {
        handleOpenShadowTalkWorkflow();
        setIsProcessing(false);
        setJarvisState("idle");
        return;
      }

      setStatusMessage("Accessing project archives for ShadowTalk by Zain Ahmed & Fahad Patel (Karachi)...");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch("/api/jarvis/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: `Define ShadowTalk. Note: This refers specifically to the ShadowTalk project engineered and co-founded by Zain Ahmed and Fahad Patel from Karachi, Pakistan. Define its vision as a next-generation encrypted communication and AI-assisted conversational intelligence platform built from Karachi, and highlight Sir Zain Ahmed and Fahad Patel's technical leadership.`,
            conversationHistory: messages.slice(-4).map((m) => ({
              role: m.sender,
              text: m.text,
            })),
          }),
        });

        clearTimeout(timeoutId);

        let data: any = null;
        if (res.ok) {
          data = await res.json();
        } else {
          data = processLocalJarvisHeuristics(text);
        }

        const responseText =
          data?.text ||
          "ShadowTalk is the groundbreaking, high-security communication and conversational intelligence system engineered by Zain Ahmed and Fahad Patel from Karachi, Pakistan. Designed with advanced encrypted networking, real-time data streaming, and autonomous AI integration, ShadowTalk empowers secure, low-latency dialogue and intelligent collaboration. It stands as an innovative technology venture crafted right out of Karachi under the visionary development of Sir Zain Ahmed and Fahad Patel.";

        const responseSources =
          data?.sources && data.sources.length > 0
            ? data.sources
            : [
                { title: "ShadowTalk Project Repository (Zain Ahmed & Fahad Patel)", url: "https://github.com" },
                { title: "Karachi Technology & AI Innovation Index", url: "https://www.google.com/search?q=ShadowTalk+Zain+Ahmed+Fahad+Patel+Karachi" },
              ];

        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: responseText,
          timestamp: new Date().toISOString(),
          sources: responseSources,
        };

        setMessages((prev) => [...prev, jarvisMsg]);
        if (auth.currentUser) {
          syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
        }
        setStatusMessage("ShadowTalk definition (Zain Ahmed & Fahad Patel, Karachi) delivered.");
        handleSpeak(responseText);
      } catch (err: any) {
        console.error("ShadowTalk research error:", err);
        const fallback = processLocalJarvisHeuristics(text);
        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: fallback.text,
          timestamp: new Date().toISOString(),
          sources: fallback.sources || [
            { title: "ShadowTalk Initiative - Zain Ahmed & Fahad Patel", url: "https://www.google.com/search?q=ShadowTalk+Zain+Ahmed+Fahad+Patel+Karachi" },
          ],
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        handleSpeak(fallback.text);
      }

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

    // Fast-path Gmail Check Intent (e.g., "Jarvis check my gmail", "check my emails", "unread emails")
    if (isGmailCheckIntent(text)) {
      setStatusMessage("Accessing Gmail Workspace feeds...");
      SoundFX.playComputeChime();

      try {
        const gmailTelemetry = await fetchGmailInbox(8);
        const speechText =
          gmailTelemetry.status === "auth_required"
            ? "I require Google Workspace authorization to scan your Gmail inbox, Commander. Please click the Google sign-in button on your HUD card to establish the connection."
            : gmailTelemetry.status === "error"
            ? `I encountered an issue connecting to your Gmail inbox: ${gmailTelemetry.errorMessage || "Unknown error"}`
            : gmailTelemetry.summaryScript || "Gmail telemetry retrieved successfully, sir.";

        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: speechText,
          timestamp: new Date().toISOString(),
          sources: [
            { title: "Google Workspace Gmail API", url: "https://mail.google.com" },
          ],
          gmailTelemetry,
        };

        setMessages((prev) => [...prev, jarvisMsg]);
        if (auth.currentUser) {
          syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
        }

        setStatusMessage(
          gmailTelemetry.status === "success"
            ? `Gmail checked: ${gmailTelemetry.unreadCount} unread / ${gmailTelemetry.totalMessages} total`
            : "Gmail authentication required."
        );

        handleSpeak(speechText);
      } catch (err: any) {
        console.error("Gmail check error:", err);
        const errMsg = "An error occurred while scanning your Gmail inbox, sir.";
        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: errMsg,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        handleSpeak(errMsg);
      }

      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Fast-path Google Docs Intent (e.g., "Jarvis, make a document for me on AI", "create a google doc", "list my docs")
    if (isGoogleDocIntent(text)) {
      const parsedDocIntent = parseGoogleDocIntent(text);
      SoundFX.playComputeChime();

      if (parsedDocIntent.type === "list") {
        setStatusMessage("Accessing Google Drive documents...");
        try {
          const docTelemetry = await fetchRecentGoogleDocs(8);
          const speechText =
            docTelemetry.status === "auth_required"
              ? "I require Google Workspace authorization to access your Google Docs in Drive, sir. Please click the Google sign-in button on the HUD card."
              : docTelemetry.summaryScript || `Retrieved ${docTelemetry.recentDocs?.length || 0} documents from your Google Drive, Commander.`;

          const jarvisMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: "jarvis",
            text: speechText,
            timestamp: new Date().toISOString(),
            sources: [
              { title: "Google Docs & Drive Workspace", url: "https://docs.google.com" },
            ],
            googleDocTelemetry: docTelemetry,
          };

          setMessages((prev) => [...prev, jarvisMsg]);
          if (auth.currentUser) {
            syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
          }

          setStatusMessage("Google Docs library retrieved.");
          handleSpeak(speechText);
        } catch (err: any) {
          console.error("Fetch Google Docs error:", err);
          const errMsg = "An error occurred while accessing your Google Docs library, sir.";
          const jarvisMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: "jarvis",
            text: errMsg,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, jarvisMsg]);
          handleSpeak(errMsg);
        }
      } else {
        // Create Document Intent
        setStatusMessage(`Generating Google Doc: "${parsedDocIntent.title}"...`);
        try {
          const docTelemetry = await createGoogleDoc(
            parsedDocIntent.title,
            parsedDocIntent.topic,
            parsedDocIntent.instructions
          );

          const speechText =
            docTelemetry.status === "auth_required"
              ? "I require your Google Workspace authorization to create Google Documents in your Google Drive, Commander. Please connect via the Google sign-in button below."
              : docTelemetry.status === "error"
              ? `I encountered an issue generating your Google Document: ${docTelemetry.errorMessage || "Unknown error"}`
              : docTelemetry.summaryScript || `I have generated the document "${parsedDocIntent.title}" and saved it directly to your Google Drive, Commander.`;

          const jarvisMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: "jarvis",
            text: speechText,
            timestamp: new Date().toISOString(),
            sources: docTelemetry.documentUrl
              ? [{ title: docTelemetry.title, url: docTelemetry.documentUrl }]
              : [{ title: "Google Docs", url: "https://docs.google.com" }],
            googleDocTelemetry: docTelemetry,
          };

          setMessages((prev) => [...prev, jarvisMsg]);
          if (auth.currentUser) {
            syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
          }

          setStatusMessage(
            docTelemetry.status === "created"
              ? `Google Doc created: "${docTelemetry.title}"`
              : "Google Docs authorization required."
          );

          handleSpeak(speechText);

          // If document was created successfully, offer to open in tab or inform user
          if (docTelemetry.status === "created" && docTelemetry.documentUrl) {
            // Document is available on HUD
          }
        } catch (err: any) {
          console.error("Create Google Doc error:", err);
          const errMsg = "An error occurred while creating your Google Document, sir.";
          const jarvisMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: "jarvis",
            text: errMsg,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, jarvisMsg]);
          handleSpeak(errMsg);
        }
      }

      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Fast-path Google Meet Intent (e.g., "Jarvis start a google meet", "create a meeting for Project Atlas", "open google meet")
    if (isGoogleMeetIntent(text)) {
      const parsedMeet = parseGoogleMeetIntent(text);
      SoundFX.playComputeChime();
      setStatusMessage(`Initializing Google Meet space: "${parsedMeet.topic}"...`);

      try {
        const meetTelemetry = await createGoogleMeetSpace(parsedMeet.topic);
        const speechText =
          meetTelemetry.status === "auth_required"
            ? "I require Google Workspace Meet authorization to launch a video conference room for you, Commander. Please connect using the Google sign-in button below."
            : meetTelemetry.summaryScript || `Google Meet room initialized for ${parsedMeet.topic}. Video and audio uplink is standing by.`;

        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: speechText,
          timestamp: new Date().toISOString(),
          sources: [
            { title: `Google Meet (${parsedMeet.topic})`, url: meetTelemetry.meetingUri },
          ],
          googleMeetTelemetry: meetTelemetry,
        };

        setMessages((prev) => [...prev, jarvisMsg]);
        if (auth.currentUser) {
          syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
        }

        setStatusMessage(
          meetTelemetry.status === "created"
            ? `Google Meet space active: ${meetTelemetry.meetingCode}`
            : "Google Meet authorization required."
        );

        handleSpeak(speechText);
      } catch (err: any) {
        console.error("Google Meet creation error:", err);
        const errMsg = "An error occurred while establishing your Google Meet conference space, sir.";
        const jarvisMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "jarvis",
          text: errMsg,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, jarvisMsg]);
        handleSpeak(errMsg);
      }

      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Fast-path Autonomous Form Infill & Login Flow (e.g. "fill form on xyz website", "open xyz and login and fill form")
    if (isFormFillIntent(text)) {
      SoundFX.playComputeChime();
      const formTelemetry = createFormFillTelemetry(
        text,
        auth.currentUser?.email || undefined,
        auth.currentUser?.displayName || undefined
      );

      // Open target URL or Google SSO login in real browser tab
      openBrowserTabSafely(
        formTelemetry.loginUrl || formTelemetry.targetUrl,
        `${formTelemetry.targetWebsite} (Form Infill & Login)`
      );

      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: formTelemetry.summaryScript,
        timestamp: new Date().toISOString(),
        sources: [
          { title: `${formTelemetry.targetWebsite} (${formTelemetry.formTitle})`, url: formTelemetry.targetUrl },
          { title: `${formTelemetry.targetWebsite} (Authentication Gateway)`, url: formTelemetry.loginUrl },
        ],
        realBrowserAction: {
          action: "LOGIN_WEBSITE",
          targetUrl: formTelemetry.targetUrl,
          loginUrl: formTelemetry.loginUrl,
          userEmail: formTelemetry.userEmail,
          query: formTelemetry.targetWebsite,
          confirmationSpeech: formTelemetry.summaryScript,
        },
        formFillTelemetry: formTelemetry,
      };

      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
      setStatusMessage(`Autonomous form infill & SSO session active for ${formTelemetry.targetWebsite}.`);
      handleSpeak(formTelemetry.summaryScript);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Fast-path Website Login & Briefing Flow (e.g., "open xyz website and login using my gmail on that website and tell me about the website")
    const resolvedLogin = resolveWebsiteWithLogin(text);
    if (resolvedLogin) {
      // 1. Open Google SSO login link (or targetUrl) in real browser
      openBrowserTabSafely(resolvedLogin.loginUrl, `${resolvedLogin.siteName} (Google SSO Login)`);

      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: resolvedLogin.confirmationSpeech,
        timestamp: new Date().toISOString(),
        sources: [
          { title: `${resolvedLogin.siteName} (Website)`, url: resolvedLogin.targetUrl },
          { title: `${resolvedLogin.siteName} (Login Gateway)`, url: resolvedLogin.loginUrl },
        ],
        realBrowserAction: {
          action: "LOGIN_WEBSITE",
          targetUrl: resolvedLogin.targetUrl,
          loginUrl: resolvedLogin.loginUrl,
          userEmail: resolvedLogin.userEmail,
          query: resolvedLogin.siteName,
          confirmationSpeech: resolvedLogin.confirmationSpeech,
          websiteBriefing: resolvedLogin.briefing,
        },
        websiteLoginBriefing: resolvedLogin.briefing,
      };

      setMessages((prev) => [...prev, jarvisMsg]);
      if (auth.currentUser) {
        syncMessageToFirestore(auth.currentUser.uid, jarvisMsg).catch(console.error);
      }
      setStatusMessage(`Website briefing & Google SSO dispatched for ${resolvedLogin.siteName}.`);
      handleSpeak(resolvedLogin.confirmationSpeech);
      setIsProcessing(false);
      setJarvisState("idle");
      return;
    }

    // Intent 1: Direct Browser Commands & Search Queries (e.g. "search amazon for ...", "search youtube for ...", "open github", etc.)
    const isSearchOrNavQuery =
      lower.startsWith("search ") ||
      lower.startsWith("browse ") ||
      lower.startsWith("open ") ||
      lower.startsWith("navigate to ") ||
      lower.includes("search amazon for") ||
      lower.includes("search youtube for") ||
      lower.includes("search google for");

    if (isSearchOrNavQuery) {
      let targetUrl = "https://www.google.com";
      let siteName = "Web Search";
      
      if (lower.includes("amazon")) {
        const query = text.replace(/.*amazon\s+(for\s+)?/i, "").trim();
        targetUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query || "deals")}`;
        siteName = "Amazon Search";
      } else if (lower.includes("youtube")) {
        const query = text.replace(/.*youtube\s+(for\s+)?/i, "").trim();
        targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query || "trending")}`;
        siteName = "YouTube Search";
      } else if (lower.includes("github")) {
        const query = text.replace(/.*github\s+(for\s+)?/i, "").trim();
        targetUrl = query ? `https://github.com/search?q=${encodeURIComponent(query)}` : `https://github.com`;
        siteName = "GitHub";
      } else if (lower.startsWith("search ")) {
        const query = text.replace(/^search\s+(google\s+for\s+|for\s+)?/i, "").trim();
        targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        siteName = "Google Search";
      }

      handleOpenRealTab(targetUrl, siteName);
      setIsProcessing(false);
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

    // Intent 4: Room Sentry & Intruder Surveillance Mode
    if (
      lower.includes("monitor my room") ||
      lower.includes("keep an eye on my room") ||
      lower.includes("watch my room") ||
      lower.includes("guard my room") ||
      lower.includes("room sentry") ||
      lower.includes("sentry mode") ||
      lower.includes("away mode") ||
      lower.includes("beep if someone") ||
      lower.includes("alert if someone")
    ) {
      await roomSentryManager.armSentry(2);
      const jarvisAck =
        "Room Sentry perimeter surveillance armed, sir. I have locked the Optic Eye on your room. If any movement or unauthorized person is detected while you are away, I shall immediately initiate acoustic intrusion beeping.";
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

    if (
      lower.includes("disarm room") ||
      lower.includes("disarm sentry") ||
      lower.includes("stop monitoring room") ||
      lower.includes("im back") ||
      lower.includes("i am back") ||
      lower.includes("i'm back") ||
      lower.includes("silence alarm")
    ) {
      roomSentryManager.disarmSentry();
      const jarvisAck = "Welcome back, sir. Room Sentry perimeter stood down and security alarm disarmed.";
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

    // Intent 5: Acoustic Clap to Wake Commands
    if (
      lower.includes("enable clap to wake") ||
      lower.includes("turn on clap") ||
      lower.includes("enable clap wake") ||
      lower.includes("activate clap") ||
      lower.includes("wake on clap") ||
      lower.includes("wake up when i clap") ||
      lower.includes("wake up on clap")
    ) {
      clapDetector.updateConfig({ enabled: true });
      clapDetector.start();
      const jarvisAck = "Acoustic clap-to-wake sensor active, sir. You may now clap your hands to instantly wake me at any time.";
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

    if (
      lower.includes("disable clap to wake") ||
      lower.includes("turn off clap") ||
      lower.includes("disable clap wake") ||
      lower.includes("stop clap wake")
    ) {
      clapDetector.updateConfig({ enabled: false });
      clapDetector.stop();
      const jarvisAck = "Acoustic clap-to-wake sensor placed on standby, sir.";
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

    // Intent 6: Optic Vision Sensor Disengage Command
    if (
      lower.includes("turn off camera") ||
      lower.includes("disable camera") ||
      lower.includes("disable vision") ||
      lower.includes("stop camera") ||
      lower.includes("close camera") ||
      lower.includes("stop watching")
    ) {
      opticVisionManager.stopOpticVision();
      const jarvisAck = "Optic camera array disengaged and placed on standby, sir.";
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

    // Intent 6.5: Mark L Nanotech Visor & Complete Iron Man Suite Direct Triggers
    if (
      lower.includes("mark l") ||
      lower.includes("mark 50") ||
      lower.includes("nanotech visor") ||
      lower.includes("iron man suite") ||
      lower.includes("ironman suite") ||
      lower.includes("iron man suit") ||
      lower.includes("helmet visor") ||
      lower.includes("nanotech suit") ||
      lower.includes("mark fifty")
    ) {
      setActiveInterface("armor");
      setActiveTab("core");
      SoundFX.playNaniteMorph();
      const jarvisAck = "Engaging Mark L Nanotech Visor HUD and Complete Iron Man Suite, sir. Tactical telemetry, live optical sensor, and weapon morphogenesis bays are online.";
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

    // Direct Mark L Weapon Voice Triggers
    if (lower.includes("fire repulsor") || lower.includes("shoot repulsor") || lower.includes("repulsor blast")) {
      SoundFX.playRepulsorBlast();
      const jarvisAck = "Repulsor beam discharged at 100% capacitor charge, sir. Target hit.";
      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: jarvisAck,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      handleSpeak(jarvisAck);
      setIsProcessing(false);
      return;
    }

    if (lower.includes("fire unibeam") || lower.includes("chest unibeam") || lower.includes("unibeam burst")) {
      SoundFX.playUnibeamBurst();
      const jarvisAck = "Chest RT Unibeam burst discharged. RT Core drawing 4.2 Gigawatts.";
      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: jarvisAck,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      handleSpeak(jarvisAck);
      setIsProcessing(false);
      return;
    }

    if (lower.includes("deploy nano shield") || lower.includes("energy shield") || lower.includes("deploy shield")) {
      SoundFX.playShieldDeploy();
      const jarvisAck = "Mark L Nanotech energy shield deployed. Deflecting incoming kinetic and thermal ordnance.";
      const jarvisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "jarvis",
        text: jarvisAck,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, jarvisMsg]);
      handleSpeak(jarvisAck);
      setIsProcessing(false);
      return;
    }

    // Intent 7: J.A.R.V.I.S. 10 Operational User Interfaces Voice Switcher
    const matchedInterface = JARVIS_INTERFACES.find((iface) =>
      iface.voiceKeywords.some((kw) => lower.includes(kw)) &&
      (lower.includes("switch") ||
        lower.includes("open") ||
        lower.includes("show") ||
        lower.includes("launch") ||
        lower.includes("interface") ||
        lower.includes("workstation") ||
        lower.includes("view") ||
        lower.includes("mode") ||
        lower.includes("hub") ||
        lower.includes("deck") ||
        lower.includes("screen"))
    );

    if (matchedInterface) {
      setActiveInterface(matchedInterface.id);
      if (matchedInterface.id === "productivity") setActiveTab("productivity");
      else if (matchedInterface.id === "quantum") setActiveTab("research");
      else setActiveTab("core");

      const jarvisAck = `Switching workstation interface to ${matchedInterface.name} (${matchedInterface.codename}), sir. Subsystems initialized.`;
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

    if (
      lower.includes("next interface") ||
      lower.includes("cycle interface") ||
      lower.includes("next workstation")
    ) {
      const curIdx = JARVIS_INTERFACES.findIndex((i) => i.id === activeInterface);
      const nextIdx = (curIdx + 1) % JARVIS_INTERFACES.length;
      const nextIface = JARVIS_INTERFACES[nextIdx];
      setActiveInterface(nextIface.id);
      if (nextIface.id === "productivity") setActiveTab("productivity");
      else if (nextIface.id === "quantum") setActiveTab("research");
      else setActiveTab("core");

      const jarvisAck = `Cycling workstation to UI #${nextIdx + 1}: ${nextIface.name}, sir.`;
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

    if (
      lower.includes("show all interfaces") ||
      lower.includes("open interface matrix") ||
      lower.includes("10 interfaces") ||
      lower.includes("choose interface") ||
      lower.includes("all workstations")
    ) {
      setIsInterfaceSelectorOpen(true);
      const jarvisAck = "Opening the 10 J.A.R.V.I.S. Operational Interfaces matrix for you, sir. Select any workstation to deploy.";
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

    // Intent 8: J.A.R.V.I.S. Multi-Theme UI Engine Commands
    if (
      lower.includes("theme") ||
      lower.includes("ui color") ||
      lower.includes("custom theme")
    ) {
      // 1. Check for specific named theme (e.g. "change theme to mark 42", "switch to hulkbuster", "set theme to stealth")
      const matchedTheme = themeManager.findThemeByVoiceQuery(text);
      if (matchedTheme) {
        themeManager.setTheme(matchedTheme.id);
        const jarvisAck = `Holographic interface reconfigured to ${matchedTheme.name} (${matchedTheme.codename}), sir. Suit matrix and HUD parameters updated.`;
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

      // 2. Check for next / cycle theme
      if (lower.includes("next theme") || lower.includes("cycle theme") || lower.includes("next ui")) {
        const nextTheme = themeManager.cycleNextTheme();
        const jarvisAck = `Cycling interface to ${nextTheme.name} (${nextTheme.codename}), sir.`;
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

      // 3. Check for open / show theme library modal
      if (
        lower.includes("show theme") ||
        lower.includes("open theme") ||
        lower.includes("theme library") ||
        lower.includes("theme matrix") ||
        lower.includes("change theme") ||
        lower.includes("choose theme")
      ) {
        setIsThemeLibraryOpen(true);
        const jarvisAck = "Opening the J.A.R.V.I.S. Theme Matrix for you, sir. You can choose from our 20 customized holographic UI systems.";
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
    }

    // Check if query is asking JARVIS to see or look at the user
    const isVisionQuery =
      lower.includes("see me") ||
      lower.includes("look at me") ||
      lower.includes("can you see") ||
      lower.includes("turn on camera") ||
      lower.includes("start camera") ||
      lower.includes("enable vision") ||
      lower.includes("what am i holding") ||
      lower.includes("what am i wearing") ||
      lower.includes("how is my posture") ||
      lower.includes("check my posture") ||
      lower.includes("watch me");

    if (isVisionQuery && !opticVisionManager.getState().isActive) {
      await opticVisionManager.startOpticVision();
      // Allow brief moment for webcam frame buffer
      await new Promise((r) => setTimeout(r, 300));
    }

    // Capture live video frame if optic vision is active
    let liveVisionFrame: string | null = null;
    const isOpticActive = opticVisionManager.getState().isActive;
    if (isOpticActive) {
      liveVisionFrame = opticVisionManager.captureLiveFrame();
    }

    // Default: General Query with Real-time Search Grounding & Real Browser Action Detection & Real-time Vision Frame
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
            imageBase64: liveVisionFrame || undefined,
            visionActive: isOpticActive,
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
            openBrowserTabSafely(rAction.targetUrl, data.youtubeMedia.title, "PLAY_YOUTUBE", data.youtubeMedia.videoId);
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
        } else if (rAction.action === "LOGIN_WEBSITE") {
          const launchUrl = rAction.loginUrl || rAction.targetUrl;
          if (launchUrl) {
            openBrowserTabSafely(launchUrl, `${rAction.query || "Website"} (Google SSO Login)`);
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
        websiteLoginBriefing: data.websiteLoginBriefing || data.realBrowserAction?.websiteBriefing || null,
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
            openBrowserTabSafely(rAction.targetUrl, rAction.query || "Requested Web Page");
          }
        } else if (rAction.action === "LOGIN_WEBSITE") {
          const launchUrl = rAction.loginUrl || rAction.targetUrl;
          if (launchUrl) {
            openBrowserTabSafely(launchUrl, `${rAction.query || "Website"} (Google SSO Login)`);
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
        websiteLoginBriefing: localResult.websiteLoginBriefing || localResult.realBrowserAction?.websiteBriefing || null,
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
      className="min-h-screen text-slate-300 flex flex-col selection:bg-sky-500 selection:text-white font-sans relative overflow-x-hidden transition-colors duration-500"
      style={{ backgroundColor: currentTheme.bgCanvas }}
    >
      {/* Dynamic Ambient Holographic Glow matching active theme */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 transition-all duration-700"
        style={{ background: currentTheme.ambientGlow }}
      />

      {/* Real Browser Tab Link Notification */}
      {activeTabDispatch && (
        <div
          id="real-tab-dispatch-toast"
          className="fixed top-4 right-4 z-50 flex items-center justify-between gap-3 bg-[#0A0A0C]/95 border border-sky-500/40 px-4 py-3 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.25)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                External Link Dispatched
              </span>
              <span className="text-xs text-white font-medium max-w-[180px] truncate">
                {activeTabDispatch.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={activeTabDispatch.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => SoundFX.playComputeChime()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs font-mono shadow-md transition-all cursor-pointer"
            >
              <span>Open</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setActiveTabDispatch(null)}
              className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
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
            activeInterface={activeInterface}
            setActiveInterface={setActiveInterface}
            onOpenInterfaceSelector={() => setIsInterfaceSelectorOpen(true)}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            isListening={isListening}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => {
              SoundFX.playComputeChime();
              setIsFocusMode(true);
            }}
            onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
            onOpenThemeLibrary={() => setIsThemeLibraryOpen(true)}
            isVisionOpen={isVisionOpen}
            onToggleVision={() => setIsVisionOpen((prev) => !prev)}
            onCheckGmail={() => handleSendMessage("Jarvis, check my gmail inbox")}
            onOpenDocs={() => handleSendMessage("Jarvis, show my google docs library")}
            onOpenMeet={() => handleSendMessage("Jarvis, start an instant google meet")}
            onOpenShadowTalk={handleOpenShadowTalkWorkflow}
          />

          {/* Main Responsive Canvas Container: 10 Operational User Interfaces */}
          <main id="main-content-viewport" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
            {/* UI 1: Tactical Command Core (Arc Reactor & Voice Waveform Console) */}
            {activeInterface === "core" && (
              <CoreCommandInterface
                jarvisState={jarvisState}
                frequencies={frequencies}
                onToggleVoice={toggleVoice}
                isListening={isListening}
                isSpeaking={isSpeaking}
                statusMessage={statusMessage}
                onOpenVisionHUD={() => setIsVisionOpen(true)}
                onDirectScan={() => handleSendMessage("Jarvis, look at me and check my status")}
                messages={messages}
                interimTranscript={interimTranscript}
                isProcessing={isProcessing}
                onSpeakMessage={handleSpeak}
                onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
                onOpenThemeLibrary={() => setIsThemeLibraryOpen(true)}
                onOpenRealTab={handleOpenRealTab}
                onPlayYouTube={handlePlayYouTube}
                onSendMessage={handleSendMessage}
              />
            )}

            {/* UI 2: Mark 85 Armor Diagnostics & Suit Telemetry Matrix */}
            {activeInterface === "armor" && (
              <ArmorDiagnosticsInterface onJarvisSpeak={handleSpeak} />
            )}

            {/* UI 3: Orbital Satellite Recon & E.D.I.T.H. Defense Radar Grid */}
            {activeInterface === "satellite" && (
              <SatelliteReconInterface onJarvisSpeak={handleSpeak} />
            )}

            {/* UI 4: Sub-Zero Cryo-Biometrics & Vitals Cardio Lab */}
            {activeInterface === "vitals" && (
              <VitalsCryoInterface onJarvisSpeak={handleSpeak} />
            )}

            {/* UI 5: Cleanroom Holographic CAD & 3D Schematics Lab */}
            {activeInterface === "schematics" && (
              <SchematicsCADInterface onJarvisSpeak={handleSpeak} />
            )}

            {/* UI 6: Surveillance Overwatch & Room Sentry Hub */}
            {activeInterface === "security" && (
              <SecurityOverwatchInterface
                onJarvisSpeak={handleSpeak}
                onSendMessage={handleSendMessage}
              />
            )}

            {/* UI 7: Quantum Computing & Deep Neural Research Lab */}
            {activeInterface === "quantum" && (
              <QuantumResearchInterface
                initialTopic={pendingResearchTopic}
                onJarvisSpeak={handleSpeak}
              />
            )}

            {/* UI 8: Stark Executive Workspace & Productivity Deck */}
            {activeInterface === "productivity" && (
              <ProductivityDeckInterface
                pendingNewTask={pendingNewTask}
                onJarvisSpeak={handleSpeak}
                onNavigateToResearch={(topic) => {
                  setPendingResearchTopic(topic);
                  setActiveInterface("quantum");
                }}
              />
            )}

            {/* UI 9: Sonic Radar, Radio Scanner & Media Hub */}
            {activeInterface === "media" && (
              <MediaSignalsInterface
                onJarvisSpeak={handleSpeak}
                activeYouTubeMedia={activeYouTubeMedia}
                onCloseYouTubeMedia={() => setActiveYouTubeMedia(null)}
                onPlayYouTubeTrack={handlePlayYouTube}
              />
            )}

            {/* UI 10: Veronica Orbital Deployment & Emergency Hulkbuster Bay */}
            {activeInterface === "veronica" && (
              <VeronicaDeploymentInterface onJarvisSpeak={handleSpeak} />
            )}
          </main>

          {/* Global Minimalist Footer */}
          <footer className="w-full border-t border-white/5 bg-[#050506] py-3.5 px-6 text-center text-[10px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="tracking-widest uppercase">J.A.R.V.I.S. Autonomous Neural Core V.4</span>
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

      {/* J.A.R.V.I.S. 10 UI Holographic Theme Matrix Modal */}
      <ThemeLibraryModal
        isOpen={isThemeLibraryOpen}
        onClose={() => setIsThemeLibraryOpen(false)}
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

      {/* J.A.R.V.I.S. 10 Operational User Interfaces Workstation Matrix Modal */}
      <InterfaceSelectorModal
        isOpen={isInterfaceSelectorOpen}
        onClose={() => setIsInterfaceSelectorOpen(false)}
        activeInterface={activeInterface}
        onSelectInterface={(id) => {
          setActiveInterface(id);
          if (id === "productivity") setActiveTab("productivity");
          else if (id === "quantum") setActiveTab("research");
          else setActiveTab("core");
        }}
        onJarvisSpeak={handleSpeak}
      />
    </div>
  );
}
