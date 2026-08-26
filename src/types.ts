export type JarvisState = "idle" | "listening" | "thinking" | "speaking" | "browsing" | "error";

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "jarvis" | "system";
  text: string;
  timestamp: string;
  sources?: GroundingSource[];
  isVoiceInput?: boolean;
  browserWorkflowTriggered?: boolean;
  workflowName?: string;
  realBrowserAction?: RealBrowserAction;
  youtubeMedia?: YouTubeMedia;
  visionAnalysis?: VisionAnalysisResult;
}

export interface DetectedObjectBox {
  id: string;
  label: string;
  category: "person" | "device" | "accessory" | "furniture" | "misc";
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in normalized 0-1000 coordinates
  confidence: number; // 0-100
  threatLevel: "NOMINAL" | "LOW" | "ELEVATED";
  distanceEstimate?: string;
  colorHex?: string;
}

export interface HandTrackingData {
  isDetected: boolean;
  centroid: { x: number; y: number };
  fingertip: { x: number; y: number };
  palmCenter: { x: number; y: number };
  bounds: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  confidence: number;
  gesture: "pointing" | "open_palm" | "pinch" | "fist" | "peace" | "unknown";
  isDrawing: boolean;
  pinchDistance?: number;
  velocity?: { vx: number; vy: number };
}

export interface AirDrawStroke {
  id: string;
  points: Array<{ x: number; y: number; pressure?: number }>;
  color: string;
  width: number;
  mode?: "laser" | "glow" | "sparkle";
  timestamp: number;
}

export interface DetectionLogEntry {
  id: string;
  timestamp: string;
  type: "hand_tracking" | "air_sketch" | "object" | "face" | "scan" | "manual_lock";
  label: string;
  category?: string;
  confidence: number;
  details?: string;
  coordinates?: string;
  sketchDataUrl?: string;
}

export interface VisionAnalysisResult {
  spokenObservation: string;
  detailedAnalysis: string;
  detectedAttributes: {
    subjectDetected: boolean;
    expression: string;
    postureStatus: string;
    ambientLighting: string;
    apparentMood: string;
    clothingStyle?: string;
    surroundingEnvironment?: string;
    detectedObjects: string[];
    threatLevel: "NOMINAL" | "LOW" | "ELEVATED";
    biometricScanConfidence: number;
  };
  detectedBoxes?: DetectedObjectBox[];
  suggestedAction?: string;
  timestamp: string;
  capturedImagePreview?: string;
}

export type BrowserActionType =
  | "NAVIGATE"
  | "TYPE"
  | "CLICK"
  | "SCROLL"
  | "WAIT"
  | "EXTRACT"
  | "SELECT"
  | "PRESS_KEY"
  | "HOVER"
  | "ASSERT"
  | "VISION_INSPECT"
  | "ANALYZE"
  | "COMPLETE";

export interface DomElementTarget {
  selector: string;
  xpath?: string;
  label: string;
  box?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  confidence?: number;
}

export interface BrowserStep {
  stepNumber: number;
  actionType: BrowserActionType;
  description: string;
  targetElement?: string;
  cssSelector?: string;
  xpathSelector?: string;
  inputValue?: string;
  targetUrl?: string;
  expectedOutcome: string;
  dataToExtractSample?: string;
  status?: "pending" | "planning" | "running" | "verifying" | "completed" | "failed";
  coordinates?: { x: number; y: number };
  playwrightCode?: string;
  puppeteerCode?: string;
  visionVerifyGoal?: string;
  actualOutcome?: string;
  executionTimeMs?: number;
  telemetry?: {
    matchedNodes?: number;
    wpm?: number;
    cursorSpeed?: string;
    verifiedByVision?: boolean;
  };
}

export interface PlaywrightScriptBundle {
  testFileTypescript: string;
  standaloneNodeScript: string;
  pythonScript: string;
  cliCommand: string;
}

export interface BrowserWorkflowPlan {
  workflowName: string;
  targetWebsite: string;
  estimatedTimeSeconds: number;
  objectiveSummary: string;
  steps: BrowserStep[];
  playwrightScript?: string;
  puppeteerScript?: string;
  pythonPlaywrightScript?: string;
  finalExtractionSchema?: {
    summaryTitle: string;
    keyFindings: string[];
    extractedRecords?: Array<{ field: string; value: string }>;
    suggestedFollowUps?: string[];
  };
}

export interface WebpageData {
  url: string;
  title: string;
  contentSnippet: string;
  links: Array<{ text: string; href: string }>;
  status: number;
  isSearchGroundingSnapshot?: boolean;
}

export interface DailyBriefingData {
  greetingTitle: string;
  spokenAudioScript: string;
  marketIntelligence: Array<{
    category: string;
    headline: string;
    summary: string;
  }>;
  productivityFocus: Array<{
    priority: string;
    task: string;
    actionTip: string;
  }>;
  motivationalThought?: string;
}

export interface ResearchDossier {
  title: string;
  executiveSummary: string;
  keyStatistics: Array<{
    metric: string;
    value: string;
    significance?: string;
  }>;
  mainPillars: Array<{
    heading: string;
    details: string;
    bulletPoints?: string[];
  }>;
  opportunitiesAndRisks: {
    opportunities: string[];
    risks: string[];
  };
  strategicRecommendations: string[];
}

export interface ProductivityTask {
  id: string;
  title: string;
  category: "work" | "research" | "automation" | "personal";
  priority: "high" | "medium" | "low";
  completed: boolean;
  dueDate?: string;
  autoGenerated?: boolean;
}

export interface TelemetryData {
  cpuUsage: number;
  memoryUsage: number;
  networkLatencyMs: number;
  uptimeSeconds: number;
  activeAgentsCount: number;
  voiceRecognitionConfidence: number;
  systemVolume?: number;
  activeMediaTitle?: string;
  activeTabName?: string;
  neuralLatencyMs?: number;
  opticsActive?: boolean;
}

export interface VoiceSettings {
  pitch: number; // 0.5 to 1.6
  rate: number;  // 0.6 to 1.8
  volume?: number; // 0.0 to 1.0
  voiceURI?: string;
  presetName?: string;
  language?: "auto" | "hi-IN" | "en-US" | "en-GB";
}

export interface YouTubeMedia {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 to 100
  currentTime?: number;
  duration?: number;
  artist?: string;
  genre?: string;
  mediaType?: "track" | "live_stream" | "playlist" | "acoustic" | "instrumental" | "official_video" | "podcast" | "remix" | "lofi_radio" | "orchestral" | "ambient";
  resolutionFilter?: "4K" | "1080p" | "Standard";
  isLiveStream?: boolean;
  isPlaylist?: boolean;
  isInstrumental?: boolean;
  isAcoustic?: boolean;
}

export type RealBrowserActionType =
  | "OPEN_TAB"
  | "SEARCH_GOOGLE"
  | "PLAY_YOUTUBE"
  | "PAUSE_YOUTUBE"
  | "RESUME_YOUTUBE"
  | "STOP_YOUTUBE"
  | "NAVIGATE_URL"
  | "INSPECT_WEBSITE"
  | "NONE";

export interface RealBrowserAction {
  action: RealBrowserActionType;
  targetUrl?: string;
  query?: string;
  videoId?: string;
  videoTitle?: string;
  confirmationSpeech?: string;
  hostCommandWindows?: string;
  hostCommandPowerShell?: string;
  bridgeDispatched?: boolean;
}

export interface HostBridgeConfig {
  enabled: boolean;
  endpointUrl: string; // e.g. "http://localhost:18500/launch"
  customUriScheme: string; // e.g. "jarvis://open?url="
  autoDispatchOnMedia: boolean;
  autoDispatchOnTab: boolean;
  preferredBrowser: "default" | "chrome" | "msedge" | "firefox" | "brave";
  webhookSecret?: string;
  lastPingStatus?: "online" | "offline" | "unchecked";
  lastPingTime?: number;
}

export interface HostBridgeExecutionEvent {
  id: string;
  timestamp: number;
  action: RealBrowserActionType;
  targetUrl: string;
  title: string;
  videoId?: string;
  windowsCommand: string;
  powershellCommand: string;
  status: "dispatched" | "success" | "local_bridge_offline" | "fallback_window_open";
  httpStatus?: number;
  error?: string;
}
