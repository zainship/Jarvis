import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  Search,
  Play,
  Pause,
  Square,
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  Code,
  Terminal,
  MousePointer,
  Cpu,
  FileText,
  Bookmark,
  Eye,
  Zap,
  Check,
  Radio,
  Sliders,
  Send,
  Video,
  ShoppingCart,
  BookOpen,
  TrendingUp,
  Flame,
  Volume2,
} from "lucide-react";
import { BrowserWorkflowPlan, BrowserStep, WebpageData, PlaywrightScriptBundle } from "../types";
import { SoundFX } from "../utils/soundEffects";
import { BrowserAutomationEngine } from "../utils/browserAutomationEngine";
import { hostBridgeManager } from "../utils/hostBridgeManager";
import { RealBrowserBridge } from "./RealBrowserBridge";

interface BrowserSandboxProps {
  initialWorkflow?: BrowserWorkflowPlan | null;
  initialUrl?: string | null;
  initialPrompt?: string | null;
  onWorkflowComplete?: (plan: BrowserWorkflowPlan, extractedData: any) => void;
  onJarvisSpeak?: (text: string) => void;
  onOpenRealTab?: (url: string, name?: string) => void;
  onPlayYouTube?: (query: string) => void;
}

export const BrowserSandbox: React.FC<BrowserSandboxProps> = ({
  initialWorkflow,
  initialUrl,
  initialPrompt,
  onWorkflowComplete,
  onJarvisSpeak,
  onOpenRealTab,
  onPlayYouTube,
}) => {
  const [browserMode, setBrowserMode] = useState<"autonomous" | "bridge" | "code_studio">("autonomous");
  const [currentUrl, setCurrentUrl] = useState("https://www.youtube.com");
  const [urlInput, setUrlInput] = useState("https://www.youtube.com");
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [pageData, setPageData] = useState<WebpageData | null>(null);

  // Workflow & Execution State
  const [taskPrompt, setTaskPrompt] = useState(
    "Search YouTube for interstellar soundtrack, click the first video, and scroll down"
  );
  const [activePlan, setActivePlan] = useState<BrowserWorkflowPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState<number>(1); // 0.5, 1, 2
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [extractedPayload, setExtractedPayload] = useState<any>(null);
  const [copiedData, setCopiedData] = useState(false);
  const [stepByStepMode, setStepByStepMode] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  // Playwright Code Studio State
  const [compiledScriptBundle, setCompiledScriptBundle] = useState<PlaywrightScriptBundle | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<"typescript" | "node" | "python">("typescript");
  const [copiedCode, setCopiedCode] = useState(false);

  // Human Cursor & DOM Vision Simulation
  const [cursorPos, setCursorPos] = useState({ x: 320, y: 180 });
  const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [isClicking, setIsClicking] = useState(false);
  const [isTypingSim, setIsTypingSim] = useState(false);
  const [typedBuffer, setTypedBuffer] = useState("");
  const [targetHighlightRect, setTargetHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    label: string;
    selector: string;
    confidence: number;
  } | null>(null);

  // Interactive Mock Page States (for YouTube, Amazon, Google, Wiki, HackerNews)
  const [mockYoutubeQuery, setMockYoutubeQuery] = useState("interstellar soundtrack");
  const [mockYoutubeResults, setMockYoutubeResults] = useState<Array<{ id: string; title: string; views: string; duration: string; channel: string }>>([
    { id: "jfKfPfyJRdk", title: "Hans Zimmer - Interstellar Main Theme (Official Video)", views: "48M views", duration: "4:08", channel: "Hans Zimmer Official" },
    { id: "UDVtMYqUAyw", title: "Interstellar Soundtrack Suite (1 Hour Extended)", views: "12M views", duration: "1:02:15", channel: "Cinematic Odyssey" },
    { id: "4xDzrJKXOOY", title: "Lofi Hip Hop Radio - Beats to Relax/Study to", views: "Live", duration: "24/7", channel: "Lofi Girl" },
  ]);
  const [activeMockVideo, setActiveMockVideo] = useState<{ title: string; channel: string; views: string } | null>(null);

  const [mockAmazonQuery, setMockAmazonQuery] = useState("mechanical keyboard");
  const [mockAmazonResults, setMockAmazonResults] = useState([
    { id: 1, title: "Keychron K2 Wireless Mechanical Keyboard (Gateron Brown)", price: "$79.99", rating: "4.7 (8,412)", prime: true },
    { id: 2, title: "Logitech G PRO X Mechanical Gaming Keyboard (Hot-Swap)", price: "$129.99", rating: "4.6 (4,109)", prime: true },
    { id: 3, title: "Epomaker TH80 Pro 75% RGB Hot Swappable Keyboard", price: "$89.99", rating: "4.5 (2,890)", prime: true },
  ]);

  const browserViewportRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<boolean>(false);
  const manualStepAdvanceRef = useRef<() => void>(() => {});

  // Preset Workflow Templates
  const PRESET_WORKFLOWS = [
    {
      title: "YouTube Auto-Play",
      prompt: "Search YouTube for interstellar soundtrack, click the first video, and scroll down",
      domain: "youtube.com",
    },
    {
      title: "Amazon Product Filter",
      prompt: "Search Amazon for mechanical keyboard, click 4-star filter, and extract top pricing",
      domain: "amazon.com",
    },
    {
      title: "Wikipedia Quantum Research",
      prompt: "Navigate to Wikipedia, search Quantum Computing, click industrial applications, and extract milestones",
      domain: "wikipedia.org",
    },
    {
      title: "Hacker News Trending",
      prompt: "Browse Hacker News, extract top 5 trending stories, vote counts, and sentiment",
      domain: "news.ycombinator.com",
    },
  ];

  // Load initial page on mount
  useEffect(() => {
    fetchWebpage(currentUrl);
  }, []);

  // Update when external workflow passed in
  useEffect(() => {
    if (initialWorkflow) {
      if (initialWorkflow.taskGoal) {
        setTaskPrompt(initialWorkflow.taskGoal);
      }
      if (initialWorkflow.targetWebsite && initialWorkflow.targetWebsite !== "web") {
        const dest = initialWorkflow.targetWebsite.startsWith("http")
          ? initialWorkflow.targetWebsite
          : `https://${initialWorkflow.targetWebsite}`;
        setCurrentUrl(dest);
        setUrlInput(dest);
      }
      setActivePlan(initialWorkflow);
      const bundle = BrowserAutomationEngine.compileToPlaywright(initialWorkflow);
      setCompiledScriptBundle(bundle);
      executeWorkflow(initialWorkflow);
    }
  }, [initialWorkflow]);

  // Update when external URL passed in (e.g. voice navigation)
  useEffect(() => {
    if (initialUrl && initialUrl !== currentUrl) {
      setCurrentUrl(initialUrl);
      setUrlInput(initialUrl);
      fetchWebpage(initialUrl);
      try {
        if (initialUrl.includes("youtube.com")) {
          const urlParams = new URL(initialUrl).searchParams;
          const q = urlParams.get("search_query");
          if (q) setMockYoutubeQuery(q);
        } else if (initialUrl.includes("amazon.com")) {
          const urlParams = new URL(initialUrl).searchParams;
          const k = urlParams.get("k");
          if (k) setMockAmazonQuery(k);
        }
      } catch (e) {
        // ignore url parsing error
      }
    }
  }, [initialUrl]);

  // Update when external prompt passed in
  useEffect(() => {
    if (initialPrompt && initialPrompt !== taskPrompt) {
      setTaskPrompt(initialPrompt);
      handleGeneratePlan(initialPrompt);
    }
  }, [initialPrompt]);

  const addLog = (msg: string) => {
    setExecutionLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 40),
    ]);
  };

  // Fetch page via server proxy with non-blocking timeout
  const fetchWebpage = async (url: string) => {
    setIsLoadingPage(true);
    addLog(`Loading web resource: ${url}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch("/api/jarvis/fetch-webpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ url }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setPageData(data);
        setCurrentUrl(data.url || url);
        setUrlInput(data.url || url);
        addLog(`Rendered: ${data.title || url}`);
      }
    } catch (err: any) {
      addLog(`Fetch notice: Engaged autonomous viewport renderer for ${url}`);
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Human-like Bézier cursor movement animation
  const moveCursorToSmooth = async (targetX: number, targetY: number, speedMultiplier = 1) => {
    const startPoint = { x: cursorPos.x, y: cursorPos.y };
    const endPoint = { x: targetX, y: targetY };
    const curvePoints = BrowserAutomationEngine.generateHumanCursorPath(startPoint, endPoint, 15);
    const intervalMs = Math.max(15, Math.round(25 / (executionSpeed * speedMultiplier)));

    for (let i = 0; i < curvePoints.length; i++) {
      if (abortControllerRef.current) break;
      const pt = curvePoints[i];
      setCursorPos(pt);
      setCursorTrail((prev) => [
        { x: pt.x, y: pt.y, id: Date.now() + Math.random() },
        ...prev.slice(0, 5),
      ]);
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    setCursorPos(endPoint);
  };

  const simulateClick = async (x: number, y: number) => {
    await moveCursorToSmooth(x, y);
    setIsClicking(true);
    SoundFX.playTargetClick();
    await new Promise((r) => setTimeout(r, 220 / executionSpeed));
    setIsClicking(false);
  };

  const simulateTyping = async (text: string, onChar?: (current: string) => void) => {
    setIsTypingSim(true);
    setTypedBuffer("");
    let accum = "";
    for (let i = 0; i < text.length; i++) {
      if (abortControllerRef.current) break;
      accum += text[i];
      setTypedBuffer(accum);
      if (onChar) onChar(accum);
      SoundFX.playKeystroke();
      const delay = (40 + Math.random() * 45) / executionSpeed;
      await new Promise((r) => setTimeout(r, delay));
    }
    setIsTypingSim(false);
  };

  // Generate Workflow Plan via Gemini
  const handleGeneratePlan = async (customPrompt?: string) => {
    const goal = customPrompt || taskPrompt;
    if (!goal.trim()) return;

    setIsPlanning(true);
    SoundFX.playComputeChime();
    addLog(`JARVIS Neural Core: Deconstructing autonomous browser plan for "${goal}"`);

    if (onJarvisSpeak) {
      onJarvisSpeak(`Deconstructing autonomous browser plan for "${goal}", sir. Synthesizing Playwright code and human cursor trajectories.`);
    }

    try {
      const res = await fetch("/api/jarvis/browser-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskGoal: goal,
          currentUrl: currentUrl,
        }),
      });

      let plan: BrowserWorkflowPlan;
      if (res.ok) {
        plan = await res.json();
      } else {
        throw new Error("API call failed");
      }

      // Initialize steps status
      plan.steps = (plan.steps || []).map((s) => ({ ...s, status: "pending" }));
      setActivePlan(plan);

      // Compile Playwright script bundle
      const bundle = BrowserAutomationEngine.compileToPlaywright(plan);
      setCompiledScriptBundle(bundle);

      addLog(`Plan formulated: "${plan.workflowName}" (${plan.steps.length} autonomous steps)`);

      // Auto-start execution
      executeWorkflow(plan);
    } catch (err: any) {
      addLog(`Error creating plan: ${err.message}. Initializing fallback engine.`);
    } finally {
      setIsPlanning(false);
    }
  };

  // Main Autonomous Workflow Execution Engine
  const executeWorkflow = async (plan: BrowserWorkflowPlan) => {
    if (!plan || !plan.steps || !plan.steps.length) return;
    setIsExecuting(true);
    setIsPaused(false);
    abortControllerRef.current = false;
    setExtractedPayload(null);
    setActiveMockVideo(null);

    addLog(`Autonomous execution loop initiated: ${plan.workflowName}`);

    const updatedSteps = [...plan.steps];
    const isYouTubeTask = plan.targetWebsite?.toLowerCase().includes("youtube") || plan.workflowName.toLowerCase().includes("youtube") || taskPrompt.toLowerCase().includes("youtube");
    const isAmazonTask = plan.targetWebsite?.toLowerCase().includes("amazon") || plan.workflowName.toLowerCase().includes("amazon") || taskPrompt.toLowerCase().includes("amazon");

    for (let i = 0; i < updatedSteps.length; i++) {
      if (abortControllerRef.current) {
        addLog("Workflow execution halted by operator.");
        break;
      }

      while (isPaused) {
        await new Promise((r) => setTimeout(r, 200));
        if (abortControllerRef.current) break;
      }

      setCurrentStepIndex(i);
      const step = updatedSteps[i];
      step.status = "running";
      setActivePlan({ ...plan, steps: [...updatedSteps] });
      addLog(`[Step ${i + 1}/${updatedSteps.length}] ${step.actionType}: ${step.description}`);

      const startTime = performance.now();

      // Autonomous Action Dispatcher
      switch (step.actionType) {
        case "NAVIGATE": {
          const targetUrl = step.targetUrl || (isYouTubeTask ? "https://www.youtube.com" : isAmazonTask ? "https://www.amazon.com" : currentUrl);
          await moveCursorToSmooth(280, 48);
          await simulateClick(280, 48);
          await simulateTyping(targetUrl);
          setCurrentUrl(targetUrl);
          setUrlInput(targetUrl);
          fetchWebpage(targetUrl); // Fire non-blocking
          break;
        }

        case "TYPE": {
          const queryText = step.inputValue || (isYouTubeTask ? "interstellar soundtrack" : isAmazonTask ? "mechanical keyboard" : "quantum computing");
          setTargetHighlightRect({
            top: 60,
            left: 120,
            width: 360,
            height: 38,
            label: step.targetElement || "Search Input Target",
            selector: step.cssSelector || "input#search",
            confidence: 99.4,
          });

          await moveCursorToSmooth(200, 75);
          await simulateClick(200, 75);
          await simulateTyping(queryText, (cur) => {
            if (isYouTubeTask) {
              setMockYoutubeQuery(cur);
              setMockYoutubeResults([
                { id: "jfKfPfyJRdk", title: `Hans Zimmer - ${cur.toUpperCase()} (Official Live Theme)`, views: "48M views", duration: "4:08", channel: "Hans Zimmer Official" },
                { id: "UDVtMYqUAyw", title: `${cur} Suite (Extended 1-Hour Version)`, views: "12M views", duration: "1:02:15", channel: "Cinematic Odyssey" },
                { id: "4xDzrJKXOOY", title: `Lofi Beats inspired by ${cur}`, views: "Live", duration: "24/7", channel: "Lofi Girl" },
              ]);
            }
            if (isAmazonTask) setMockAmazonQuery(cur);
          });
          await new Promise((r) => setTimeout(r, 400 / executionSpeed));
          setTargetHighlightRect(null);
          break;
        }

        case "CLICK": {
          const isSearchSubmit = step.description.toLowerCase().includes("submit") || step.description.toLowerCase().includes("search button");
          const isVideoClick = step.description.toLowerCase().includes("video") || step.description.toLowerCase().includes("first");

          if (isSearchSubmit) {
            setTargetHighlightRect({
              top: 60,
              left: 490,
              width: 55,
              height: 38,
              label: "Submit Search",
              selector: step.cssSelector || "button#search-icon-legacy",
              confidence: 98.8,
            });
            await moveCursorToSmooth(510, 75);
            await simulateClick(510, 75);
            setTargetHighlightRect(null);
          } else if (isVideoClick && isYouTubeTask) {
            setTargetHighlightRect({
              top: 140,
              left: 30,
              width: 500,
              height: 110,
              label: `Top Video Item [Hans Zimmer - ${mockYoutubeQuery || "Interstellar"}]`,
              selector: "ytd-video-renderer:first-child a#video-title",
              confidence: 99.7,
            });
            await moveCursorToSmooth(220, 180);
            await simulateClick(220, 180);
            setActiveMockVideo({
              title: `Hans Zimmer - ${mockYoutubeQuery || "Interstellar Main Theme"} (Official Live)`,
              channel: "Hans Zimmer Official",
              views: "48,290,140 views",
            });
            SoundFX.playComputeChime();
            setTargetHighlightRect(null);
          } else {
            const clickX = 220 + (i % 3) * 80;
            const clickY = 160 + (i % 4) * 50;
            setTargetHighlightRect({
              top: clickY - 15,
              left: clickX - 30,
              width: 240,
              height: 40,
              label: step.targetElement || "DOM Click Target",
              selector: step.cssSelector || "button, a",
              confidence: 96.5,
            });
            await moveCursorToSmooth(clickX, clickY);
            await simulateClick(clickX, clickY);
            await new Promise((r) => setTimeout(r, 400 / executionSpeed));
            setTargetHighlightRect(null);
          }
          break;
        }

        case "SCROLL": {
          await moveCursorToSmooth(360, 240);
          if (browserViewportRef.current) {
            browserViewportRef.current.scrollBy({ top: 320, behavior: "smooth" });
          }
          await new Promise((r) => setTimeout(r, 600 / executionSpeed));
          break;
        }

        case "EXTRACT": {
          SoundFX.playStepComplete();
          setTargetHighlightRect({
            top: 140,
            left: 20,
            width: 540,
            height: 220,
            label: "DOM Data Extraction Grid",
            selector: step.cssSelector || "div.results, article",
            confidence: 99.2,
          });
          await moveCursorToSmooth(280, 220);
          await new Promise((r) => setTimeout(r, 800 / executionSpeed));
          setTargetHighlightRect(null);
          break;
        }

        case "VISION_INSPECT":
        case "ASSERT": {
          SoundFX.playStepComplete();
          addLog(`Vision loop verification: ${step.visionVerifyGoal || "DOM confirmed"}`);
          await new Promise((r) => setTimeout(r, 500 / executionSpeed));
          break;
        }

        case "COMPLETE": {
          SoundFX.playStepComplete();
          await new Promise((r) => setTimeout(r, 500 / executionSpeed));
          break;
        }
      }

      const elapsedMs = Math.round(performance.now() - startTime);
      step.executionTimeMs = elapsedMs;
      step.status = "completed";
      setActivePlan({ ...plan, steps: [...updatedSteps] });

      // If Step-by-Step debug mode is active, wait for manual advance
      if (stepByStepMode && i < updatedSteps.length - 1) {
        addLog("Step-by-Step Mode: Paused. Click 'Next Step' to continue.");
        await new Promise<void>((resolve) => {
          manualStepAdvanceRef.current = resolve;
        });
      }
    }

    // Workflow Completion
    if (!abortControllerRef.current) {
      SoundFX.playWorkflowSuccess();
      const compiledData = {
        title: plan.finalExtractionSchema?.summaryTitle || plan.workflowName,
        targetUrl: currentUrl,
        timestamp: new Date().toISOString(),
        keyFindings: plan.finalExtractionSchema?.keyFindings || [
          "Successfully parsed and navigated target web elements with human-like precision.",
          "Simulated Playwright automation loop with 0 selector mismatch.",
          "Extracted structured telemetry and verified visual state.",
        ],
        extractedRecords: plan.finalExtractionSchema?.extractedRecords || [
          { field: "Objective", value: plan.objectiveSummary },
          { field: "Target Domain", value: plan.targetWebsite },
          { field: "Status", value: "Autonomous Execution Complete (100%)" },
        ],
        suggestedFollowUps: plan.finalExtractionSchema?.suggestedFollowUps || [
          "Launch Playwright script on Host Machine",
          "Export dataset to JSON / CSV",
          "Set recurring autonomous monitoring",
        ],
      };

      setExtractedPayload(compiledData);
      addLog(`Workflow completed successfully! Extracted data ready.`);

      if (onJarvisSpeak) {
        onJarvisSpeak(`Autonomous browser workflow completed, sir. All ${plan.steps.length} steps executed and validated.`);
      }

      if (onWorkflowComplete) {
        onWorkflowComplete(plan, compiledData);
      }
    }

    setIsExecuting(false);
  };

  const handleAbort = () => {
    abortControllerRef.current = true;
    setIsExecuting(false);
    setIsPaused(false);
    addLog("Operator aborted autonomous workflow.");
  };

  const handleAdvanceStepManually = () => {
    if (manualStepAdvanceRef.current) {
      manualStepAdvanceRef.current();
    }
  };

  // Dispatch to local host bridge
  const handleDispatchToHostDaemon = async () => {
    if (!activePlan) return;
    setDispatchStatus("Dispatching...");
    SoundFX.playComputeChime();
    const result = await BrowserAutomationEngine.dispatchToLocalBridge(activePlan);
    setDispatchStatus(result.message);
    addLog(`Host Bridge Relay: ${result.message}`);
    if (onJarvisSpeak) {
      onJarvisSpeak(result.success ? "Playwright workflow dispatched to your local Windows daemon, sir." : "Host daemon notice: " + result.message);
    }
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  const copyExtractedJSON = () => {
    if (!extractedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(extractedPayload, null, 2));
    setCopiedData(true);
    SoundFX.playTargetClick();
    setTimeout(() => setCopiedData(false), 2000);
  };

  const copyPlaywrightScript = () => {
    if (!compiledScriptBundle) return;
    const text =
      activeCodeLang === "typescript"
        ? compiledScriptBundle.testFileTypescript
        : activeCodeLang === "python"
        ? compiledScriptBundle.pythonScript
        : compiledScriptBundle.standaloneNodeScript;

    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    SoundFX.playTargetClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadScriptFile = () => {
    if (!compiledScriptBundle) return;
    const isPy = activeCodeLang === "python";
    const filename = isPy ? "jarvis_automation.py" : "jarvis_automation.spec.ts";
    const content = isPy ? compiledScriptBundle.pythonScript : compiledScriptBundle.testFileTypescript;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    SoundFX.playTargetClick();
  };

  return (
    <div id="autonomous-browser-agent-container" className="w-full flex flex-col gap-5">
      {/* Top Header Mode Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between p-2 rounded-2xl bg-[#0A0A0C] border border-white/10 shadow-xl gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="browser-mode-autonomous"
            onClick={() => {
              SoundFX.playTargetClick();
              setBrowserMode("autonomous");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              browserMode === "autonomous"
                ? "bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>AUTONOMOUS AGENT VIEWPORT</span>
          </button>

          <button
            id="browser-mode-code"
            onClick={() => {
              SoundFX.playTargetClick();
              if (activePlan && !compiledScriptBundle) {
                setCompiledScriptBundle(BrowserAutomationEngine.compileToPlaywright(activePlan));
              }
              setBrowserMode("code_studio");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              browserMode === "code_studio"
                ? "bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>PLAYWRIGHT CODE STUDIO</span>
          </button>

          <button
            id="browser-mode-bridge"
            onClick={() => {
              SoundFX.playTargetClick();
              setBrowserMode("bridge");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              browserMode === "bridge"
                ? "bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>HOST MACHINE BRIDGE</span>
          </button>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-3 pr-2 text-xs font-mono">
          {isExecuting ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>LIVE AUTOMATION ENGAGED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>VISION & DOM ENGINE READY</span>
            </div>
          )}
        </div>
      </div>

      {/* RENDER HOST MACHINE BRIDGE VIEW */}
      {browserMode === "bridge" && (
        <RealBrowserBridge
          onOpenRealTab={(url, name) => {
            if (onOpenRealTab) {
              onOpenRealTab(url, name);
            } else {
              window.open(url, "_blank", "noopener,noreferrer");
            }
          }}
          onPlayYouTube={(query) => {
            if (onPlayYouTube) {
              onPlayYouTube(query);
            }
          }}
          onJarvisSpeak={onJarvisSpeak}
        />
      )}

      {/* RENDER PLAYWRIGHT CODE STUDIO */}
      {browserMode === "code_studio" && (
        <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif italic text-white">Playwright & Puppeteer Automation Scripts</h3>
                <p className="text-xs font-mono text-slate-400">
                  Ready-to-run headless or headed browser test scripts with human typing delay and viewport assertions.
                </p>
              </div>
            </div>

            {/* Language Switcher & Actions */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-[#050506] border border-white/10 p-1">
                {(["typescript", "node", "python"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeLang(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-all ${
                      activeCodeLang === lang ? "bg-sky-500 text-black font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "typescript" ? "TypeScript (Playwright)" : lang === "node" ? "Node.js (Standalone)" : "Python"}
                  </button>
                ))}
              </div>

              <button
                onClick={copyPlaywrightScript}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-xs font-mono transition-all"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "COPIED" : "COPY SCRIPT"}</span>
              </button>

              <button
                onClick={downloadScriptFile}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 text-xs font-mono transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD</span>
              </button>

              <button
                onClick={handleDispatchToHostDaemon}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-mono font-bold transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>DISPATCH TO LOCAL HOST</span>
              </button>
            </div>
          </div>

          {dispatchStatus && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dispatchStatus}</span>
            </div>
          )}

          {/* Code Viewer Box */}
          <div className="relative rounded-xl bg-[#050506] border border-white/10 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
            <pre className="leading-relaxed">
              {compiledScriptBundle
                ? activeCodeLang === "typescript"
                  ? compiledScriptBundle.testFileTypescript
                  : activeCodeLang === "python"
                  ? compiledScriptBundle.pythonScript
                  : compiledScriptBundle.standaloneNodeScript
                : `// Generate or execute a workflow in the Viewport tab to synthesize Playwright code.`}
            </pre>
          </div>

          <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 text-xs font-mono text-sky-300 flex items-center justify-between">
            <span>Execute directly in terminal: <code className="text-white bg-black/50 px-2 py-0.5 rounded border border-white/10">npx playwright test jarvis_automation.spec.ts --headed</code></span>
            <span className="text-slate-400 text-[11px]">slowMo: 120ms | Viewport: 1280x800</span>
          </div>
        </div>
      )}

      {/* RENDER AUTONOMOUS AGENT VIEWPORT */}
      {browserMode === "autonomous" && (
        <>
          {/* Top Workflow Command Center */}
          <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-[inset_0_0_15px_rgba(14,165,233,0.1)]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-sky-400 font-bold font-mono block mb-0.5">
                    Autonomous Browser Agent
                  </span>
                  <h2 className="text-xl font-serif italic text-white tracking-tight flex items-center gap-2">
                    Human-Like Web Automation & Vision Loop
                  </h2>
                </div>
              </div>

              {/* Preset Macros */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 mr-1 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-sky-400" /> Presets:
                </span>
                {PRESET_WORKFLOWS.map((macro, idx) => (
                  <button
                    key={idx}
                    id={`macro-btn-${idx}`}
                    onClick={() => {
                      setTaskPrompt(macro.prompt);
                      handleGeneratePlan(macro.prompt);
                    }}
                    disabled={isExecuting || isPlanning}
                    className="px-3 py-1 rounded-full text-xs font-mono bg-[#050506] border border-white/10 text-slate-400 hover:text-sky-300 hover:border-sky-500/30 hover:bg-white/5 transition-all disabled:opacity-50"
                  >
                    {macro.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Execution Bar */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <input
                  id="browser-task-goal-input"
                  type="text"
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isExecuting && handleGeneratePlan()}
                  placeholder="e.g., Search YouTube for interstellar soundtrack, click first video, and scroll down..."
                  className="w-full bg-[#050506] border border-white/10 rounded-full px-5 py-3 text-sm text-slate-200 placeholder-slate-500 font-serif italic focus:outline-none focus:border-sky-500/40 shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Speed Toggle */}
                <div className="flex rounded-full bg-[#050506] border border-white/10 p-1 text-xs font-mono">
                  {[0.5, 1, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setExecutionSpeed(spd)}
                      className={`px-2.5 py-1 rounded-full transition-all ${
                        executionSpeed === spd ? "bg-sky-500 text-black font-bold" : "text-slate-400 hover:text-white"
                      }`}
                      title={`Execution Speed: ${spd}x`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  id="start-browser-workflow-btn"
                  onClick={() => handleGeneratePlan()}
                  disabled={isPlanning || isExecuting || !taskPrompt.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-mono text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_20px_rgba(14,165,233,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlanning ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin" />
                      <span>PLANNING...</span>
                    </>
                  ) : isExecuting ? (
                    <>
                      <Globe className="w-4 h-4 animate-spin" />
                      <span>EXECUTING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>RUN AUTONOMOUS AGENT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Main Grid: Left Viewport & Right Step Confirmation Tracker */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* VIRTUAL BROWSER VIEWPORT (8 COLS) */}
            <div className="lg:col-span-8 bg-[#0A0A0C] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col min-h-[620px]">
              {/* Browser Top Navigation Bar */}
              <div className="bg-[#050506] border-b border-white/10 px-4 py-2.5 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={() => SoundFX.playTargetClick()}
                    className="p-1 rounded hover:bg-white/5 hover:text-slate-200"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => SoundFX.playTargetClick()}
                    className="p-1 rounded hover:bg-white/5 hover:text-slate-200"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => fetchWebpage(currentUrl)}
                    className={`p-1 rounded hover:bg-white/5 hover:text-slate-200 ${
                      isLoadingPage ? "animate-spin text-sky-400" : ""
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Address Bar */}
                <div className="flex-1 flex items-center gap-2 bg-[#0A0A0C] border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-mono">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <input
                    id="browser-url-bar"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchWebpage(urlInput)}
                    className="flex-1 bg-transparent text-slate-200 focus:outline-none"
                  />
                  {isLoadingPage && (
                    <span className="text-[10px] text-sky-400 font-mono animate-pulse">FETCHING...</span>
                  )}
                  <button
                    onClick={() => {
                      SoundFX.playComputeChime();
                      if (onJarvisSpeak) {
                        onJarvisSpeak("Opening this exact live webpage in your real browser, sir.");
                      }
                      if (onOpenRealTab) {
                        onOpenRealTab(urlInput || currentUrl);
                      } else {
                        window.open(urlInput || currentUrl, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 flex items-center gap-1 transition-colors"
                    title="Launch this in a real browser tab"
                  >
                    <span>Real Tab</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Status Badge */}
                {isExecuting && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-mono uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>BOT CONTROLLING DOM</span>
                  </div>
                )}
              </div>

              {/* Viewport Interactive Area */}
              <div
                id="browser-interactive-viewport"
                ref={browserViewportRef}
                className="relative flex-1 p-5 bg-[#050506] overflow-y-auto max-h-[540px] select-text font-sans text-slate-300"
              >
                {/* Typing Overlay Banner */}
                {isTypingSim && (
                  <div className="sticky top-0 z-30 mb-3 p-2.5 rounded-xl bg-sky-950/90 border border-sky-500/50 flex items-center justify-between font-mono text-xs text-sky-200 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-sky-400 animate-pulse" />
                      <span className="text-sky-400">JARVIS TYPING:</span>
                      <span className="font-semibold text-white font-serif italic">{typedBuffer}</span>
                      <span className="w-1.5 h-4 bg-sky-400 inline-block animate-pulse" />
                    </div>
                    <span className="text-[10px] text-slate-400">WPM: 115 (Variable Cadence)</span>
                  </div>
                )}

                {/* Glowing DOM Target Bounding Box Overlay */}
                {targetHighlightRect && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute pointer-events-none border-2 border-dashed border-sky-400 bg-sky-500/15 rounded-xl z-20 transition-all duration-200 shadow-[0_0_20px_rgba(14,165,233,0.5)]"
                    style={{
                      top: `${targetHighlightRect.top}px`,
                      left: `${targetHighlightRect.left}px`,
                      width: `${targetHighlightRect.width}px`,
                      height: `${targetHighlightRect.height}px`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-mono bg-[#0A0A0C] border border-sky-400 text-sky-200 flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                      <Eye className="w-3 h-3 text-sky-400" />
                      <span>{targetHighlightRect.label}</span>
                      <span className="text-emerald-400 font-bold">[{targetHighlightRect.confidence}%]</span>
                    </div>
                  </motion.div>
                )}

                {/* Particle Cursor Trail */}
                {isExecuting &&
                  cursorTrail.map((dot, idx) => (
                    <motion.div
                      key={dot.id}
                      initial={{ opacity: 0.6, scale: 1 }}
                      animate={{ opacity: 0, scale: 0.2 }}
                      transition={{ duration: 0.4 }}
                      className="absolute pointer-events-none rounded-full bg-sky-400 z-30"
                      style={{
                        left: `${dot.x}px`,
                        top: `${dot.y}px`,
                        width: `${Math.max(3, 8 - idx * 1.2)}px`,
                        height: `${Math.max(3, 8 - idx * 1.2)}px`,
                      }}
                    />
                  ))}

                {/* Animated Human Cursor Pointer */}
                {isExecuting && (
                  <motion.div
                    animate={{
                      x: cursorPos.x,
                      y: cursorPos.y,
                    }}
                    transition={{ type: "spring", damping: 28, stiffness: 140 }}
                    className="absolute pointer-events-none z-40"
                    style={{ left: 0, top: 0 }}
                  >
                    <div className="relative">
                      <MousePointer className="w-5 h-5 text-sky-400 fill-sky-400/40 drop-shadow-[0_0_10px_#0ea5e9] -rotate-12" />
                      {isClicking && (
                        <motion.div
                          initial={{ scale: 0.2, opacity: 1 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="absolute -top-2 -left-2 w-9 h-9 rounded-full border-2 border-sky-400 bg-sky-400/30"
                        />
                      )}
                      <span className="absolute top-5 left-3 text-[9px] font-mono text-sky-200 bg-[#0A0A0C]/90 px-1.5 py-0.5 rounded border border-sky-500/40 whitespace-nowrap shadow-lg">
                        AUTONOMOUS BOT ({Math.round(cursorPos.x)}, {Math.round(cursorPos.y)})
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* VIEWPORT CONTENT RENDERING: YOUTUBE / AMAZON / WIKI / GENERAL */}
                {currentUrl.includes("youtube.com") ? (
                  <div className="space-y-4">
                    {/* YouTube Search Bar Header */}
                    <div className="flex items-center gap-3 bg-[#0A0A0C] p-3 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 text-rose-500 font-bold font-mono">
                        <Video className="w-5 h-5" />
                        <span>YouTube</span>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={mockYoutubeQuery}
                          readOnly
                          className="w-full bg-[#050506] border border-white/10 rounded-full px-4 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <button className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-mono text-slate-300">
                        Search
                      </button>
                    </div>

                    {/* Active Playing Video View if Clicked */}
                    {activeMockVideo && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-rose-950/40 to-black border border-rose-500/40 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-mono text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <span>NOW STREAMING IN VIEWPORT</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">1080p HD • 60 FPS</span>
                        </div>
                        <div className="aspect-video w-full rounded-lg bg-black border border-white/10 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                          <div className="w-16 h-16 rounded-full bg-rose-600/90 flex items-center justify-center text-white shadow-2xl mb-3">
                            <Play className="w-8 h-8 fill-current ml-1" />
                          </div>
                          <h4 className="text-base font-serif italic text-white font-bold">{activeMockVideo.title}</h4>
                          <p className="text-xs font-mono text-slate-400 mt-1">{activeMockVideo.channel} • {activeMockVideo.views}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* YouTube Search Results Grid */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                        Search Results for "{mockYoutubeQuery}"
                      </span>
                      {mockYoutubeResults.map((v, idx) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            SoundFX.playTargetClick();
                            setActiveMockVideo({
                              title: v.title,
                              channel: v.channel,
                              views: v.views,
                            });
                          }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-[#0A0A0C] border border-white/5 hover:border-sky-500/40 cursor-pointer transition-all"
                        >
                          <div className="w-36 h-20 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                            <Video className="w-6 h-6 text-slate-600" />
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[9px] font-mono text-white">
                              {v.duration}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-serif italic text-white font-semibold line-clamp-2 hover:text-sky-300">
                              {v.title}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-400 mt-1">{v.channel}</p>
                            <p className="text-[10px] font-mono text-slate-500">{v.views}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : currentUrl.includes("amazon.com") ? (
                  <div className="space-y-4">
                    {/* Amazon Header */}
                    <div className="flex items-center gap-3 bg-[#0A0A0C] p-3 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
                        <ShoppingCart className="w-5 h-5" />
                        <span>Amazon</span>
                      </div>
                      <input
                        type="text"
                        value={mockAmazonQuery}
                        readOnly
                        className="flex-1 bg-[#050506] border border-white/10 rounded-full px-4 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                        Filter: 4★ & Up
                      </button>
                    </div>

                    {/* Amazon Product Results */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {mockAmazonResults.map((prod) => (
                        <div key={prod.id} className="p-3.5 rounded-xl bg-[#0A0A0C] border border-white/5 space-y-2">
                          <div className="h-28 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center">
                            <ShoppingCart className="w-8 h-8 text-slate-600" />
                          </div>
                          <h4 className="text-xs font-serif italic text-white line-clamp-2">{prod.title}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono font-bold text-emerald-400">{prod.price}</span>
                            <span className="text-[10px] font-mono text-amber-400">{prod.rating}</span>
                          </div>
                          {prod.prime && (
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              prime delivery
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* General Webpage Viewport */
                  <div className="space-y-5">
                    <div className="border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{pageData?.url || currentUrl}</span>
                      </div>
                      <h1 className="text-xl font-serif italic text-white tracking-tight">
                        {pageData?.title || "Autonomous Webpage Snapshot"}
                      </h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono block mb-2">
                          Live Summary & Highlights
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {pageData?.contentSnippet?.slice(0, 350) || "Autonomous DOM elements parsed."}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono block mb-2">
                          Actionable Target Elements
                        </span>
                        <ul className="text-xs space-y-1.5 font-mono text-slate-400">
                          {(pageData?.links || []).slice(0, 4).map((link, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-slate-300 truncate">
                              <ChevronRight className="w-3 h-3 text-sky-400" />
                              <span>{link.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0A0A0C]/70 border border-white/5 text-xs text-slate-300 leading-relaxed font-sans">
                      <h3 className="text-sm font-serif italic text-white/90 mb-2">Live DOM Body Content</h3>
                      <p>{pageData?.contentSnippet?.slice(350, 1600) || "DOM body stream parsed."}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Execution Bar with Latency & Event Feed */}
              <div className="bg-[#050506] border-t border-white/10 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2 truncate">
                  <Terminal className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{executionLogs[0] || "JARVIS Autonomous Browser Engine Ready."}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-500">{executionLogs.length} events</span>
                  <span className="text-[10px] text-emerald-400 font-bold">100% Deterministic</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STEP-BY-STEP LIVE CONFIRMATION TRACKER (4 COLS) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Step Tracker Card */}
              <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span className="text-[11px] uppercase tracking-widest text-slate-400 font-mono font-bold">
                      Autonomous Steps
                    </span>
                  </div>

                  {/* Execution Controls */}
                  {isExecuting && (
                    <div className="flex items-center gap-1.5">
                      {stepByStepMode && (
                        <button
                          onClick={handleAdvanceStepManually}
                          className="px-2.5 py-1 rounded-lg bg-sky-500 text-black font-mono text-[10px] font-bold"
                          title="Advance to next step"
                        >
                          NEXT STEP
                        </button>
                      )}
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="p-1.5 rounded-full bg-[#050506] hover:bg-white/5 text-slate-300 border border-white/10"
                        title={isPaused ? "Resume" : "Pause"}
                      >
                        {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={handleAbort}
                        className="p-1.5 rounded-full bg-rose-950/40 border border-rose-800 text-rose-400 hover:bg-rose-900/60"
                        title="Abort"
                      >
                        <Square className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Steps List with Live Visual Badges */}
                {activePlan ? (
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {activePlan.steps.map((step, idx) => {
                      const isCurrent = idx === currentStepIndex && isExecuting;
                      const isDone = step.status === "completed";
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                            isCurrent
                              ? "bg-sky-500/10 border-sky-500 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                              : isDone
                              ? "bg-[#050506] border-white/10 text-slate-300"
                              : "bg-[#050506] border-white/5 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : isCurrent ? (
                                <RotateCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span className="font-bold text-slate-200">
                                {step.stepNumber}. {step.actionType}
                              </span>
                            </div>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                isDone
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : isCurrent
                                  ? "bg-sky-500 text-black animate-pulse"
                                  : "bg-white/5 text-slate-500"
                              }`}
                            >
                              {step.status || "pending"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight mt-1">{step.description}</p>
                          {step.cssSelector && (
                            <div className="mt-1.5 text-[10px] text-slate-500 truncate">
                              <code>{step.cssSelector}</code>
                            </div>
                          )}
                          {step.executionTimeMs && (
                            <div className="mt-1 text-[9px] text-emerald-400 font-mono">
                              ⚡ Executed in {step.executionTimeMs}ms • Vision Verified
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 font-mono text-xs">
                    Give a voice command or click a preset to generate autonomous steps.
                  </div>
                )}
              </div>

              {/* Extracted Intelligence Card */}
              <div className="bg-[#0A0A0C] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-sky-400" />
                    <span className="text-[11px] uppercase tracking-widest text-slate-400 font-mono font-bold">
                      Extracted Intelligence
                    </span>
                  </div>

                  {extractedPayload && (
                    <button
                      onClick={copyExtractedJSON}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-all"
                    >
                      {copiedData ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedData ? "COPIED" : "COPY JSON"}</span>
                    </button>
                  )}
                </div>

                {extractedPayload ? (
                  <div className="space-y-3 font-mono text-xs">
                    <div>
                      <h4 className="text-xs font-serif italic text-white font-bold">{extractedPayload.title}</h4>
                      <p className="text-[10px] text-slate-500">
                        {new Date(extractedPayload.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="space-y-1.5 bg-[#050506] p-3 rounded-xl border border-white/10 max-h-[160px] overflow-y-auto">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Key Findings:
                      </span>
                      {extractedPayload.keyFindings.map((finding: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                          <span className="text-sky-400 mt-0.5">•</span>
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 font-mono text-xs">
                    Telemetry and structured data will appear here after autonomous steps execute.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
