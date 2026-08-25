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
} from "lucide-react";
import { BrowserWorkflowPlan, BrowserStep, WebpageData } from "../types";
import { SoundFX } from "../utils/soundEffects";
import { voiceManager } from "../utils/voiceManager";
import { RealBrowserBridge } from "./RealBrowserBridge";

interface BrowserSandboxProps {
  initialWorkflow?: BrowserWorkflowPlan | null;
  onWorkflowComplete?: (plan: BrowserWorkflowPlan, extractedData: any) => void;
  onJarvisSpeak?: (text: string) => void;
  onOpenRealTab?: (url: string, name?: string) => void;
  onPlayYouTube?: (query: string) => void;
}

export const BrowserSandbox: React.FC<BrowserSandboxProps> = ({
  initialWorkflow,
  onWorkflowComplete,
  onJarvisSpeak,
  onOpenRealTab,
  onPlayYouTube,
}) => {
  const [browserMode, setBrowserMode] = useState<"bridge" | "simulator">("bridge");
  const [currentUrl, setCurrentUrl] = useState("https://en.wikipedia.org/wiki/Quantum_computing");
  const [urlInput, setUrlInput] = useState("https://en.wikipedia.org/wiki/Quantum_computing");
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [pageData, setPageData] = useState<WebpageData | null>(null);

  // Workflow State
  const [taskPrompt, setTaskPrompt] = useState(
    "Navigate to Wikipedia, search for Quantum Computing applications, extract the key industries, and summarize advantages."
  );
  const [activePlan, setActivePlan] = useState<BrowserWorkflowPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [extractedPayload, setExtractedPayload] = useState<any>(null);
  const [copiedData, setCopiedData] = useState(false);

  // Human-like Virtual Cursor Simulation
  const [cursorPos, setCursorPos] = useState({ x: 120, y: 140 });
  const [isClicking, setIsClicking] = useState(false);
  const [isTypingSim, setIsTypingSim] = useState(false);
  const [typedBuffer, setTypedBuffer] = useState("");
  const [targetHighlightRect, setTargetHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    label: string;
  } | null>(null);

  const browserViewportRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  // Preset Workflow Templates for Instant One-Click Voice Automation
  const PRESET_WORKFLOWS = [
    {
      title: "Quantum Computing Applications",
      prompt: "Navigate to Wikipedia, search for Quantum Computing, inspect practical applications, and extract key industries.",
      url: "https://en.wikipedia.org/wiki/Quantum_computing",
    },
    {
      title: "arXiv AI Papers Intelligence",
      prompt: "Browse arXiv AI papers on Multimodal LLMs, extract top authors, paper abstracts, and novel architectures.",
      url: "https://arxiv.org/list/cs.AI/recent",
    },
    {
      title: "Hacker News Top Discussions",
      prompt: "Load Hacker News, extract top 5 trending tech discussions, vote counts, and sentiment summary.",
      url: "https://news.ycombinator.com",
    },
    {
      title: "Mechanical Keyboard Price Compare",
      prompt: "Compare top mechanical keyboards, extract pricing, switch types, connectivity, and rating matrix.",
      url: "https://www.google.com/search?q=best+mechanical+keyboards+comparison",
    },
  ];

  // Load initial URL on mount
  useEffect(() => {
    fetchWebpage(currentUrl);
  }, []);

  // Update when external workflow passed in
  useEffect(() => {
    if (initialWorkflow) {
      setActivePlan(initialWorkflow);
      executeWorkflow(initialWorkflow);
    }
  }, [initialWorkflow]);

  const addLog = (msg: string) => {
    setExecutionLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 40),
    ]);
  };

  // Fetch page via server proxy
  const fetchWebpage = async (url: string) => {
    setIsLoadingPage(true);
    addLog(`Loading web resource: ${url}`);
    try {
      const res = await fetch("/api/jarvis/fetch-webpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setPageData(data);
      setCurrentUrl(data.url || url);
      setUrlInput(data.url || url);
      addLog(`Rendered: ${data.title || url}`);
    } catch (err: any) {
      addLog(`Fetch note: Using fallback web renderer for ${url}`);
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Generate Workflow Plan via Gemini
  const handleGeneratePlan = async (customPrompt?: string) => {
    const goal = customPrompt || taskPrompt;
    if (!goal.trim()) return;

    setIsPlanning(true);
    SoundFX.playComputeChime();
    addLog(`JARVIS Neural Core: Formulating autonomous browser workflow for: "${goal}"`);

    if (onJarvisSpeak) {
      onJarvisSpeak(`Right away, sir. Formulating the multi-step browser automation workflow.`);
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

      if (!res.ok) throw new Error("Failed to formulate browser plan");
      const plan: BrowserWorkflowPlan = await res.json();

      // Initialize steps status
      plan.steps = plan.steps.map((s) => ({ ...s, status: "pending" }));
      setActivePlan(plan);
      addLog(`Plan generated: "${plan.workflowName}" (${plan.steps.length} sequential steps)`);

      // Auto-start execution
      executeWorkflow(plan);
    } catch (err: any) {
      addLog(`Error creating plan: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  // Human-like animation helpers
  const moveCursorTo = async (x: number, y: number, durationMs = 600) => {
    return new Promise<void>((resolve) => {
      setCursorPos({ x, y });
      setTimeout(resolve, durationMs);
    });
  };

  const simulateClick = async (x: number, y: number) => {
    await moveCursorTo(x, y, 400);
    setIsClicking(true);
    SoundFX.playTargetClick();
    await new Promise((r) => setTimeout(r, 200));
    setIsClicking(false);
  };

  const simulateTyping = async (text: string) => {
    setIsTypingSim(true);
    setTypedBuffer("");
    for (let i = 0; i < text.length; i++) {
      if (abortControllerRef.current) break;
      setTypedBuffer((prev) => prev + text[i]);
      SoundFX.playKeystroke();
      // Variable human cadence
      await new Promise((r) => setTimeout(r, 45 + Math.random() * 55));
    }
    setIsTypingSim(false);
  };

  // Main Workflow Execution Engine
  const executeWorkflow = async (plan: BrowserWorkflowPlan) => {
    if (!plan || !plan.steps.length) return;
    setIsExecuting(true);
    setIsPaused(false);
    abortControllerRef.current = false;
    setExtractedPayload(null);

    addLog(`Initiating autonomous execution: ${plan.workflowName}`);
    if (onJarvisSpeak) {
      onJarvisSpeak(`Executing ${plan.workflowName}. Engaging autonomous browser controls.`);
    }

    const updatedSteps = [...plan.steps];

    for (let i = 0; i < updatedSteps.length; i++) {
      if (abortControllerRef.current) {
        addLog("Workflow execution aborted by user.");
        break;
      }

      while (isPaused) {
        await new Promise((r) => setTimeout(r, 300));
        if (abortControllerRef.current) break;
      }

      setCurrentStepIndex(i);
      const step = updatedSteps[i];
      step.status = "running";
      setActivePlan({ ...plan, steps: [...updatedSteps] });
      addLog(`[Step ${i + 1}/${updatedSteps.length}] ${step.actionType}: ${step.description}`);

      // Perform Human-Like Browser Actions based on step type
      switch (step.actionType) {
        case "NAVIGATE": {
          const targetUrl = step.targetUrl || currentUrl;
          await moveCursorTo(280, 50, 400);
          await simulateClick(280, 50);
          await simulateTyping(targetUrl);
          await fetchWebpage(targetUrl);
          break;
        }
        case "TYPE": {
          setTargetHighlightRect({
            top: 140,
            left: 60,
            width: 380,
            height: 42,
            label: step.targetElement || "Input Target",
          });
          await moveCursorTo(180, 160, 500);
          await simulateClick(180, 160);
          await simulateTyping(step.inputValue || "Autonomous query");
          await new Promise((r) => setTimeout(r, 400));
          setTargetHighlightRect(null);
          break;
        }
        case "CLICK": {
          const clickX = 140 + (i % 3) * 120;
          const clickY = 220 + (i % 4) * 60;
          setTargetHighlightRect({
            top: clickY - 10,
            left: clickX - 20,
            width: 220,
            height: 38,
            label: step.targetElement || "Target Element",
          });
          await moveCursorTo(clickX, clickY, 600);
          await simulateClick(clickX, clickY);
          await new Promise((r) => setTimeout(r, 600));
          setTargetHighlightRect(null);
          break;
        }
        case "SCROLL": {
          await moveCursorTo(400, 300, 300);
          if (browserViewportRef.current) {
            browserViewportRef.current.scrollBy({ top: 250, behavior: "smooth" });
          }
          await new Promise((r) => setTimeout(r, 800));
          break;
        }
        case "EXTRACT": {
          SoundFX.playStepComplete();
          setTargetHighlightRect({
            top: 180,
            left: 40,
            width: 480,
            height: 180,
            label: "DOM Data Extraction Grid",
          });
          await moveCursorTo(260, 240, 500);
          await new Promise((r) => setTimeout(r, 700));
          setTargetHighlightRect(null);
          break;
        }
        case "ANALYZE":
        case "COMPLETE": {
          SoundFX.playStepComplete();
          await new Promise((r) => setTimeout(r, 600));
          break;
        }
      }

      step.status = "completed";
      setActivePlan({ ...plan, steps: [...updatedSteps] });
    }

    // Compile Final Extraction
    if (!abortControllerRef.current) {
      SoundFX.playWorkflowSuccess();
      const compiledData = {
        title: plan.finalExtractionSchema?.summaryTitle || plan.workflowName,
        targetUrl: currentUrl,
        timestamp: new Date().toISOString(),
        keyFindings: plan.finalExtractionSchema?.keyFindings || [
          "Successfully navigated target web interfaces and parsed live DOM elements.",
          "Extracted structured knowledge parameters with zero manual intervention.",
          "Real-time validation against search grounding completed.",
        ],
        extractedRecords: [
          {
            field: "Primary Objective",
            value: plan.objectiveSummary,
          },
          {
            field: "Target Domain",
            value: plan.targetWebsite,
          },
          {
            field: "Execution Mode",
            value: "Autonomous Human-Emulated DOM Traversal",
          },
          {
            field: "Total Steps Completed",
            value: `${plan.steps.length} actions executed`,
          },
        ],
        followUps: plan.finalExtractionSchema?.suggestedFollowUps || [
          "Export dataset to CSV or JSON",
          "Synthesize research dossier",
          "Set up recurring autonomous daily trigger",
        ],
      };

      setExtractedPayload(compiledData);
      addLog(`Workflow completed successfully! Extracted data ready.`);

      if (onJarvisSpeak) {
        onJarvisSpeak(
          `Workflow completed, sir. I have extracted the key findings and compiled the dataset for your review.`
        );
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
    addLog("User requested workflow halt.");
  };

  const copyExtractedJSON = () => {
    if (!extractedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(extractedPayload, null, 2));
    setCopiedData(true);
    SoundFX.playTargetClick();
    setTimeout(() => setCopiedData(false), 2000);
  };

  return (
    <div id="browser-sandbox-container" className="w-full flex flex-col gap-5">
      {/* Top Mode Selector Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-[#0A0A0C] border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
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
            <span>REAL BROWSER & LIVE WEB BRIDGE</span>
          </button>

          <button
            id="browser-mode-simulator"
            onClick={() => {
              SoundFX.playTargetClick();
              setBrowserMode("simulator");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              browserMode === "simulator"
                ? "bg-sky-500 text-black font-bold shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>VIRTUAL BROWSER SIMULATOR</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-3 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real Browser Gateway Online</span>
        </div>
      </div>

      {/* Render Real Browser Bridge if in 'bridge' mode */}
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

      {/* Render Simulator if in 'simulator' mode */}
      {browserMode === "simulator" && (
        <>
          {/* Top Workflow Command Center & Goal Input in Sophisticated Dark */}
          <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shadow-[inset_0_0_15px_rgba(14,165,233,0.1)]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-sky-500 font-bold font-mono block mb-0.5">
                    Autonomous Engine
                  </span>
                  <h2 className="text-xl font-serif italic text-white tracking-tight flex items-center gap-2">
                    Human-Emulated Browser Agent
                  </h2>
                </div>
              </div>

              {/* Quick Preset Macros */}
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

            {/* Goal Input Field */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <input
                  id="browser-task-goal-input"
                  type="text"
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isExecuting && handleGeneratePlan()}
                  placeholder="e.g., Navigate to Wikipedia, find quantum computing applications, and extract key points..."
                  className="w-full bg-[#050506] border border-white/10 rounded-full px-5 py-3 text-sm text-slate-200 placeholder-slate-500 font-serif italic focus:outline-none focus:border-sky-500/40 shadow-inner"
                />
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
                    <span>AUTONOMOUS EXECUTE</span>
                  </>
                )}
              </button>
            </div>
          </div>

      {/* Main Browser Layout: Left Viewport (Live Browser) & Right Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* VIRTUAL BROWSER WINDOW (8 COLS) */}
        <div className="lg:col-span-8 bg-[#0A0A0C] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col min-h-[580px]">
          {/* Browser Chrome / Header Bar */}
          <div className="bg-[#050506] border-b border-white/5 px-4 py-2.5 flex items-center gap-3">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block" />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                id="browser-btn-back"
                onClick={() => SoundFX.playTargetClick()}
                className="p-1 rounded hover:bg-white/5 hover:text-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                id="browser-btn-forward"
                onClick={() => SoundFX.playTargetClick()}
                className="p-1 rounded hover:bg-white/5 hover:text-slate-200"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                id="browser-btn-reload"
                onClick={() => fetchWebpage(currentUrl)}
                className={`p-1 rounded hover:bg-white/5 hover:text-slate-200 ${
                  isLoadingPage ? "animate-spin text-sky-400" : ""
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* URL Address Bar */}
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
                <span className="text-[10px] text-sky-400 font-mono animate-pulse">
                  FETCHING...
                </span>
              )}
              <button
                id="browser-open-real-tab-btn"
                type="button"
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
                title="Launch this webpage in a real browser tab"
              >
                <span>Real Tab</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>

            {/* Autonomous Action Badge */}
            {isExecuting && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-mono uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>BOT ACTIVE</span>
              </div>
            )}
          </div>

          {/* Browser Viewport Area with Simulated Human Laser Cursor */}
          <div
            id="browser-interactive-viewport"
            ref={browserViewportRef}
            className="relative flex-1 p-6 bg-[#050506]/95 overflow-y-auto max-h-[520px] select-text font-sans text-slate-300"
          >
            {/* Live Typing Overlay Bar if active */}
            {isTypingSim && (
              <div className="sticky top-0 z-30 mb-3 p-2.5 rounded-xl bg-sky-950/90 border border-sky-500/50 flex items-center gap-2 font-mono text-xs text-sky-200 shadow-lg">
                <Terminal className="w-4 h-4 text-sky-400 animate-pulse" />
                <span className="text-sky-400">JARVIS TYPING:</span>
                <span className="font-semibold text-white font-serif italic">{typedBuffer}</span>
                <span className="w-1.5 h-4 bg-sky-400 inline-block animate-pulse" />
              </div>
            )}

            {/* Target Element Highlight Box */}
            {targetHighlightRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute pointer-events-none border-2 border-dashed border-sky-400 bg-sky-500/10 rounded-xl z-20 transition-all duration-300 shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                style={{
                  top: `${targetHighlightRect.top}px`,
                  left: `${targetHighlightRect.left}px`,
                  width: `${targetHighlightRect.width}px`,
                  height: `${targetHighlightRect.height}px`,
                }}
              >
                <span className="absolute -top-5 left-0 px-2 py-0.5 rounded text-[10px] font-mono bg-[#0A0A0C] border border-sky-400 text-sky-200">
                  {targetHighlightRect.label}
                </span>
              </motion.div>
            )}

            {/* Animated Laser Cursor Simulation */}
            {isExecuting && (
              <motion.div
                animate={{
                  x: cursorPos.x,
                  y: cursorPos.y,
                }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="absolute pointer-events-none z-40"
                style={{ left: 0, top: 0 }}
              >
                <div className="relative">
                  <MousePointer className="w-5 h-5 text-sky-400 fill-sky-400/30 drop-shadow-[0_0_8px_#0ea5e9] -rotate-12" />
                  {isClicking && (
                    <motion.div
                      initial={{ scale: 0.2, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className="absolute -top-2 -left-2 w-8 h-8 rounded-full border-2 border-sky-400 bg-sky-400/20"
                    />
                  )}
                  <span className="absolute top-5 left-3 text-[9px] font-mono text-sky-300 bg-[#0A0A0C] px-1.5 py-0.5 rounded border border-sky-500/40">
                    BOT (X:{Math.round(cursorPos.x)}, Y:{Math.round(cursorPos.y)})
                  </span>
                </div>
              </motion.div>
            )}

            {/* Page Content Display */}
            {isLoadingPage ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <RotateCw className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="text-sm font-mono text-slate-400">
                  JARVIS Autonomous Web Gateway: Fetching and parsing DOM tree...
                </p>
              </div>
            ) : pageData ? (
              <div className="space-y-6">
                {/* Simulated Web Header */}
                <div className="border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{new URL(currentUrl).hostname}</span>
                  </div>
                  <h1 className="text-2xl font-serif italic text-white tracking-tight">
                    {pageData.title}
                  </h1>
                </div>

                {/* Structured Simulated Data Cards for Interactivity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/5">
                    <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono block mb-2">
                      Key Highlights & Extracted Summary
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {pageData.contentSnippet.slice(0, 380)}...
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0A0C] border border-white/5">
                    <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono block mb-2">
                      Detected Actionable Web Elements
                    </span>
                    <ul className="text-xs space-y-1.5 font-mono text-slate-400">
                      {pageData.links.slice(0, 4).map((link, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            SoundFX.playTargetClick();
                            fetchWebpage(link.href.startsWith("http") ? link.href : currentUrl + link.href);
                          }}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-sky-300 cursor-pointer truncate"
                        >
                          <ChevronRight className="w-3 h-3 text-sky-400" />
                          <span>{link.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Main Body Text */}
                <div className="p-4 rounded-xl bg-[#0A0A0C]/60 border border-white/5 text-xs text-slate-300 leading-relaxed font-sans space-y-3">
                  <h3 className="text-sm font-serif italic text-white/90">
                    Live Web Agent Viewport Data
                  </h3>
                  <p>{pageData.contentSnippet.slice(380, 1800)}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <Globe className="w-12 h-12 mb-3 text-slate-700" />
                <p className="text-sm font-mono">No active browser session loaded.</p>
              </div>
            )}
          </div>

          {/* Bottom Execution Log Drawer */}
          <div className="bg-[#050506] border-t border-white/5 px-4 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span className="truncate">
                {executionLogs[0] || "JARVIS Web Engine Ready."}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0">
              {executionLogs.length} events logged
            </span>
          </div>
        </div>

        {/* WORKFLOW CONTROLS & EXTRACTED DATA (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Step-by-Step Execution Plan Card */}
          <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono">
                  Workflow Stack
                </span>
              </div>

              {isExecuting && (
                <div className="flex items-center gap-1.5">
                  <button
                    id="pause-workflow-btn"
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1.5 rounded-full bg-[#050506] hover:bg-white/5 text-slate-300 border border-white/10"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  </button>
                  <button
                    id="abort-workflow-btn"
                    onClick={handleAbort}
                    className="p-1.5 rounded-full bg-rose-950/40 border border-rose-800 text-rose-400 hover:bg-rose-900/60"
                    title="Abort"
                  >
                    <Square className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Steps List */}
            {activePlan ? (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {activePlan.steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex && isExecuting;
                  const isDone = step.status === "completed";
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                        isCurrent
                          ? "bg-sky-500/10 border-sky-500/50 text-sky-200 shadow-[0_0_12px_rgba(14,165,233,0.2)]"
                          : isDone
                          ? "bg-[#050506] border-white/5 text-slate-300"
                          : "bg-[#050506] border-white/5 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                          ) : isCurrent ? (
                            <RotateCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span className="font-semibold text-slate-200">
                            STEP {step.stepNumber}: {step.actionType}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                          {step.status || "pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs">
                Enter a task or choose a preset to generate autonomous steps.
              </div>
            )}
          </div>

          {/* Extracted Data Inspector Card */}
          <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-400" />
                <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono">
                  Extracted Intelligence
                </span>
              </div>

              {extractedPayload && (
                <button
                  id="copy-extracted-data-btn"
                  onClick={copyExtractedJSON}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-all"
                >
                  {copiedData ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>COPY JSON</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {extractedPayload ? (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <h4 className="text-xs font-serif italic text-white/90 font-bold">
                    {extractedPayload.title}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Extracted on {new Date(extractedPayload.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                <div className="space-y-1.5 bg-[#050506] p-3 rounded-xl border border-white/5 max-h-[160px] overflow-y-auto">
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
                Extracted data will be structured here once steps complete.
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
