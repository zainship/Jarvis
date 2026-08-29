export type JarvisState = "idle" | "listening" | "thinking" | "speaking" | "browsing" | "error";

export type JarvisInterfaceId =
  | "core"
  | "armor"
  | "satellite"
  | "vitals"
  | "schematics"
  | "security"
  | "quantum"
  | "productivity"
  | "media"
  | "veronica";

export interface JarvisInterfaceMeta {
  id: JarvisInterfaceId;
  name: string;
  codename: string;
  tagline: string;
  category: "command" | "tactical" | "science" | "operations";
  badge: string;
  description: string;
  iconName?: string;
  voiceKeywords: string[];
}

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
  websiteLoginBriefing?: WebsiteLoginBriefing;
  gmailTelemetry?: GmailInboxTelemetry;
  googleDocTelemetry?: GoogleDocTelemetry;
  googleMeetTelemetry?: GoogleMeetTelemetry;
  formFillTelemetry?: FormFillTelemetry;
}

export interface FormField {
  id: string;
  label: string;
  name: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "number" | "radio";
  value: string;
  selector: string;
  placeholder?: string;
  isRequired?: boolean;
  status: "auto_filled" | "verified" | "user_edited";
  category?: "identity" | "contact" | "organization" | "content" | "consent";
}

export interface FormExecutionStep {
  id: string;
  stepNumber: number;
  title: string;
  action: "NAVIGATE" | "AUTHENTICATE" | "DOM_SCAN" | "SYNTHESIZE_VALUES" | "TYPE_FIELDS" | "VALIDATE" | "SUBMIT_READY";
  status: "completed" | "in_progress" | "pending" | "failed";
  details: string;
  timestamp?: string;
}

export interface FormFillTelemetry {
  id: string;
  status: "ready" | "authenticating" | "scanning" | "filling" | "completed" | "error";
  targetWebsite: string;
  targetUrl: string;
  loginUrl: string;
  authMethod: "google_sso" | "oauth_redirect" | "direct_login" | "magic_link";
  userEmail: string;
  userName: string;
  formType: "job_application" | "registration" | "contact_inquiry" | "feedback" | "survey" | "general" | "support_ticket";
  formTitle: string;
  fields: FormField[];
  executionSteps: FormExecutionStep[];
  autoSubmitReady: boolean;
  summaryScript: string;
  javascriptInjectionScript?: string;
  playwrightCode?: string;
  timestamp: string;
}

export interface GoogleMeetSpace {
  name: string; // "spaces/{spaceId}"
  meetingUri: string; // "https://meet.google.com/xxx-yyyy-zzz"
  meetingCode: string; // "xxx-yyyy-zzz"
  config?: {
    accessType?: string;
    entryPointAccess?: string;
  };
  activeConference?: {
    conferenceRecord?: string;
  };
}

export interface GoogleMeetTelemetry {
  status: "created" | "ready" | "auth_required" | "error" | "loading";
  spaceId?: string;
  meetingUri: string;
  meetingCode: string;
  topic?: string;
  summaryScript?: string;
  errorMessage?: string;
  createdAt?: string;
  recentSpaces?: Array<{
    name: string;
    meetingUri: string;
    meetingCode: string;
    createTime?: string;
    activeConference?: boolean;
  }>;
}

export interface GoogleDocTelemetry {
  documentId: string;
  title: string;
  documentUrl: string;
  status: "created" | "listed" | "auth_required" | "error" | "loading";
  summaryScript?: string;
  previewContent?: string;
  wordCount?: number;
  lastModified?: string;
  errorMessage?: string;
  recentDocs?: Array<{
    id: string;
    name: string;
    modifiedTime?: string;
    webViewLink?: string;
    thumbnailLink?: string;
  }>;
}

export interface GmailEmailItem {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  fromName?: string;
  to?: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
  labelIds: string[];
  bodyText?: string;
  bodyHtml?: string;
}

export interface GmailInboxTelemetry {
  userEmail: string;
  unreadCount: number;
  totalMessages: number;
  messages: GmailEmailItem[];
  lastChecked: string;
  status: "success" | "auth_required" | "loading" | "error";
  errorMessage?: string;
  summaryScript?: string;
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

export interface NoiseEliminationConfig {
  enabled: boolean;
  gateThreshold: number; // 0 to 100 (default: 18)
  suppressionLevel: "low" | "medium" | "aggressive" | "ultra_tactical";
  voiceIsolation: boolean; // Rejects low energy / ambient murmur
  highPassFilter: boolean; // Cuts low rumble < 100Hz
  vocalBoost: boolean; // Formant peaking 1.8-3.0 kHz
  ambientNoiseFloor: number; // 0-100 measured
  currentVoiceLevel: number; // 0-100 live RMS meter
  gateActive: boolean; // true = gate open (voice passed), false = gate closed (attenuating noise)
  micProfile?: "studio_condenser" | "headset_boom" | "laptop_array" | "conference_omni" | "ultra_directional";
  echoCancellation?: boolean;
  feedbackShield?: boolean;
}

export interface AudioChannelTelemetry {
  rmsLevel: number;
  peakDb: number;
  snrDb: number;
  isClipping: boolean;
  gateOpen: boolean;
  dominantHz: number;
  sampleRate: number;
  channelCount: number;
  inputLatencyMs: number;
}

export interface VoiceInterceptionConfig {
  enabled: boolean;
  sensitivity: "normal" | "high" | "instant";
  bargeInActive: boolean;
  lastInterceptionTime: string | null;
  totalInterceptions: number;
  keywordTriggers?: string[];
  autoResumeListening?: boolean;
}

export interface VoiceSettings {
  pitch: number; // 0.5 to 1.6
  rate: number;  // 0.6 to 1.8
  volume?: number; // 0.0 to 1.0
  voiceURI?: string;
  presetName?: string;
  language?: "auto" | "hi-IN" | "en-US" | "en-GB" | "en-IN";
  noiseElimination?: {
    enabled: boolean;
    gateThreshold: number;
    suppressionLevel: "low" | "medium" | "aggressive" | "ultra_tactical";
    voiceIsolation: boolean;
    highPassFilter?: boolean;
    vocalBoost?: boolean;
    micProfile?: "studio_condenser" | "headset_boom" | "laptop_array" | "conference_omni" | "ultra_directional";
    echoCancellation?: boolean;
    feedbackShield?: boolean;
  };
  voiceInterception?: {
    enabled: boolean;
    sensitivity: "normal" | "high" | "instant";
    keywordTriggers?: string[];
    autoResumeListening?: boolean;
  };
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
  | "LOGIN_WEBSITE"
  | "BRIEF_WEBSITE"
  | "NONE";

export interface WebsiteLoginBriefing {
  siteName: string;
  targetUrl: string;
  loginUrl: string;
  authMethod: "google_sso" | "oauth_redirect" | "direct_login" | "magic_link";
  userEmail: string;
  siteOverview: string;
  keyFeatures: string[];
  securityStatus: string;
  recommendedActions?: string[];
  spokenSummary?: string;
  timestamp: string;
}

export interface RealBrowserAction {
  action: RealBrowserActionType;
  targetUrl?: string;
  loginUrl?: string;
  userEmail?: string;
  query?: string;
  videoId?: string;
  videoTitle?: string;
  confirmationSpeech?: string;
  hostCommandWindows?: string;
  hostCommandPowerShell?: string;
  bridgeDispatched?: boolean;
  websiteBriefing?: WebsiteLoginBriefing;
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

export interface SentryIntrusionEvent {
  id: string;
  timestamp: string;
  confidence: number;
  detectedCount: number;
  threatLevel: "ELEVATED" | "CRITICAL" | "CAUTION";
  details: string;
  capturedSnapshot?: string;
  alarmActive: boolean;
}

export interface ClapDetectionEvent {
  id: string;
  timestamp: string;
  peakVolume: number;
  energyRatio: number;
  decayMs: number;
  type: "single_clap" | "double_clap";
}

export interface ClapWakeConfig {
  enabled: boolean;
  sensitivity: "low" | "medium" | "high" | "tactical";
  mode: "single_clap" | "double_clap";
  spokenGreetingEnabled: boolean;
  soundChimeEnabled: boolean;
  totalClapsDetected: number;
  lastClapTime: string | null;
  ambientNoiseFloor: number; // 0-100
  currentPeakLevel: number; // 0-100 live meter
}

export interface RoomSentryState {
  enabled: boolean;
  armed: boolean;
  status: "disarmed" | "arming" | "patrolling" | "intrusion_detected" | "standby";
  sensitivity: "low" | "medium" | "high" | "tactical_ultra";
  beepingAlarmEnabled: boolean;
  spokenWarningEnabled: boolean;
  autoSnapshots: boolean;
  lastIntrusionTime: string | null;
  totalIntrusionsCount: number;
  motionScore: number; // 0 - 100
  history: SentryIntrusionEvent[];
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
