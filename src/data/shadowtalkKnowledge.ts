/**
 * SHADOWTALK AI - SYSTEM KNOWLEDGE & ARCHITECTURAL DOSSIER
 * Engineered & Co-Founded by Zain Ahmed & Fahad Patel (Karachi, Pakistan)
 * Repository: https://github.com/zain836/shadowtalk-ai-903ca615
 */

export interface ShadowTalkDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  highlights: string[];
}

export const SHADOWTALK_CORE_IDENTITY = {
  name: "ShadowTalk AI",
  slogan: "Think AI. Think ShadowTalk.",
  tagline: "The AI workspace that doesn't own you.",
  motto: "ChatGPT answers. ShadowTalk executes.",
  founders: [
    {
      name: "Sir Zain Ahmed",
      role: "Co-Founder & Lead AI Systems Architect",
      location: "Karachi, Pakistan",
    },
    {
      name: "Fahad Patel",
      role: "Co-Founder & Core Engineering Lead",
      location: "Karachi, Pakistan",
    },
  ],
  origin: "Karachi, Sindh, Pakistan",
  repository: "https://github.com/zain836/shadowtalk-ai-903ca615",
  officialUrls: {
    workspace: "https://www.shadowtalk-ai.com/chatbot",
    marketingHome: "https://www.shadowtalk-ai.com/home",
    docs: "https://www.shadowtalk-ai.com/docs",
    pricing: "https://www.shadowtalk-ai.com/pricing",
    ideBuilder: "https://www.shadowtalk-ai.com/ide",
  },
  missionStatement:
    "An agentic AI workspace engineered for developers and teams tired of chatbots that only talk. ShadowTalk lets you plan missions, execute 30+ tools from a single natural sentence, approve agent steps with human-in-the-loop safety gates, and ship real code on Web, PWA, or Desktop (Electron), while retaining 100% sovereignty over API keys and privacy.",
};

export const SHADOWTALK_ARCHITECTURAL_PILLARS = [
  {
    title: "1. Neural Chat & Multimodal Reasoning",
    description:
      "Context-aware AI conversational interface supporting multiple reasoning personas, rich markdown rendering, code block execution, and multimodal inputs.",
    features: [
      "Custom system personas tailored to coding, research, writing, and devops",
      "Streaming responses with low-latency token delivery",
      "Integrated tool triggering directly from conversation context",
    ],
  },
  {
    title: "2. Mission Control (Agentic Autonomous Pipeline)",
    description:
      "Multi-step autonomous execution engine capable of breaking down complex objectives into sequential tasks with real-time telemetry.",
    features: [
      "Decomposes high-level natural language prompts into executable sub-tasks",
      "Human-in-the-loop approval gates for critical actions (file writes, API calls, payments)",
      "Execution graphs and step-by-step progress visualizer",
    ],
  },
  {
    title: "3. 30+ Native Tool Ecosystem",
    description:
      "A comprehensive suite of 30+ agentic tools chained automatically without manual context-switching.",
    features: [
      "Real-time web search and live DOM scraping",
      "Code analysis, linting, and sandbox execution",
      "Mathematical modeling, unit conversion, and statistical computation",
      "Document generation, table parsing, and JSON payload manipulation",
    ],
  },
  {
    title: "4. Personal IDE & App Builder (/ide)",
    description:
      "A full browser-based integrated development environment and application builder.",
    features: [
      "Generates multi-file frontend and full-stack projects from natural chat",
      "Interactive code editing with live preview iframe updates",
      "One-click export to ZIP, GitHub, or container deployment",
    ],
  },
  {
    title: "5. BYOK Vault (Bring Your Own Key)",
    description:
      "Complete data privacy and economic sovereignty for AI models.",
    features: [
      "Direct API proxying for Google Gemini, Kimi, Anthropic, OpenAI, and custom endpoints",
      "Zero token markups or intermediate platform subscriptions required",
      "Encrypted client-side storage of keys with zero cloud telemetry retention",
    ],
  },
  {
    title: "6. Offline Intelligence & Hardware-Aware Fallback",
    description:
      "Local AI execution tiers enabling offline and private inference.",
    features: [
      "Tier A/B/C local model routing using SmolLM and Gemma",
      "Hardware-aware telemetry evaluating available CPU/GPU/NPU memory",
      "Seamless switching between local on-device models and frontier cloud APIs",
    ],
  },
  {
    title: "7. Native Desktop & Cross-Platform Suite",
    description:
      "Unified codebase available as Web, Progressive Web App (PWA), and native Desktop (Electron).",
    features: [
      "Native file system access via Electron",
      "Native OS notifications and system tray background daemon",
      "Offline-first state sync with VITE_LOCAL_FIRST=1 flag",
    ],
  },
  {
    title: "8. Instant Workspace UX",
    description:
      "Instantaneous entry into productivity without marketing gating.",
    features: [
      "Direct routing from root / to /chatbot with no splash delay",
      "Persistent session architecture supporting both anonymous guest and linked user states",
      "Dark and light adaptive cybernetic theme",
    ],
  },
];

export const SHADOWTALK_COMPARISON_MATRIX = [
  {
    feature: "Agentic Execution",
    chatgpt: "Single-turn text output",
    shadowtalk: "Mission Control (Autonomous multi-step agent runs)",
  },
  {
    feature: "Tool Ecosystem",
    chatgpt: "Limited single plugins",
    shadowtalk: "30+ tools chained in a single sentence",
  },
  {
    feature: "API Key Sovereignty",
    chatgpt: "Closed subscription paywall",
    shadowtalk: "BYOK (Bring Your Own Key for Gemini, Kimi, etc.)",
  },
  {
    feature: "Offline & Local Models",
    chatgpt: "Cloud-only connection required",
    shadowtalk: "On-device SmolLM & Gemma with hardware detection",
  },
  {
    feature: "Desktop Integration",
    chatgpt: "Web wrapper",
    shadowtalk: "Native Electron with file system & OS notifications",
  },
  {
    feature: "App Building",
    chatgpt: "Snippet display only",
    shadowtalk: "Generative IDE with multi-file preview at /ide",
  },
];

export function getShadowTalkBriefing(): string {
  return `ShadowTalk AI is an agentic AI workspace engineered and co-founded by Zain Ahmed and Fahad Patel in Karachi, Pakistan.
Slogan: "Think AI. Think ShadowTalk."
Key Capabilities: Mission Control for autonomous execution, 30+ native tools, IDE App Builder at /ide, BYOK Vault with zero lock-in, and offline SmolLM/Gemma on-device routing.
Official URLs: Workspace: https://www.shadowtalk-ai.com/chatbot | Docs: https://www.shadowtalk-ai.com/docs | GitHub: https://github.com/zain836/shadowtalk-ai-903ca615`;
}
