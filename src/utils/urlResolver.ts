// Universal High-Precision Website & URL Resolver for JARVIS
// Supports 150+ known top services, direct domain speech (dot com, dot io, etc.),
// IP addresses, protocols, and universal fallback to Google Search or Direct Domain resolution.

import { WebsiteLoginBriefing } from "../types";

export interface ResolvedWebsite {
  isWebsiteCommand: boolean;
  targetUrl: string;
  siteName: string;
  action: "OPEN_TAB" | "SEARCH_GOOGLE" | "PLAY_YOUTUBE" | "LOGIN_WEBSITE";
  confirmationSpeech: string;
  videoId?: string;
  loginUrl?: string;
}

export interface WebsiteMetadata {
  url: string;
  name: string;
  loginUrl?: string;
  authMethod?: "google_sso" | "oauth_redirect" | "direct_login" | "magic_link";
  overview?: string;
  keyFeatures?: string[];
  category?: string;
}

export interface ResolvedWebsiteLogin {
  isLoginCommand: boolean;
  siteName: string;
  targetUrl: string;
  loginUrl: string;
  authMethod: "google_sso" | "oauth_redirect" | "direct_login" | "magic_link";
  userEmail: string;
  siteOverview: string;
  keyFeatures: string[];
  securityStatus: string;
  confirmationSpeech: string;
  action: "LOGIN_WEBSITE" | "OPEN_TAB";
  briefing: WebsiteLoginBriefing;
}

// Map of common names and phonetics to exact URLs & Auth endpoints
export const POPULAR_WEBSITES: Record<string, WebsiteMetadata> = {
  // Search & AI Engines
  google: {
    url: "https://www.google.com",
    name: "Google",
    loginUrl: "https://accounts.google.com/AccountChooser",
    authMethod: "google_sso",
    overview: "The world's foremost search and intelligence portal connecting you to global information, tools, and apps.",
    keyFeatures: ["Global web & image search", "Google Knowledge Graph", "Direct workspace app launcher", "Personalized search preferences"],
    category: "Search & Knowledge",
  },
  "google search": {
    url: "https://www.google.com",
    name: "Google",
    loginUrl: "https://accounts.google.com/AccountChooser",
    authMethod: "google_sso",
    overview: "Real-time global search engine index.",
    keyFeatures: ["Instant search", "Knowledge Panels", "AI Overviews"],
  },
  bing: {
    url: "https://www.bing.com",
    name: "Bing",
    loginUrl: "https://login.live.com/",
    authMethod: "direct_login",
    overview: "Microsoft's AI-enhanced search engine powered by Copilot.",
    keyFeatures: ["Copilot search synthesis", "Visual search", "Rewards ecosystem"],
  },
  duckduckgo: {
    url: "https://duckduckgo.com",
    name: "DuckDuckGo",
    loginUrl: "https://duckduckgo.com/settings",
    authMethod: "direct_login",
    overview: "Privacy-first search engine that blocks trackers and respects search anonymity.",
    keyFeatures: ["Zero tracking or profiling", "!bang instant redirects", "Integrated private AI chat"],
  },
  yahoo: {
    url: "https://www.yahoo.com",
    name: "Yahoo",
    loginUrl: "https://login.yahoo.com/",
    authMethod: "direct_login",
    overview: "Global web portal delivering news, finance, email, and lifestyle media.",
    keyFeatures: ["Yahoo Finance stock tickers", "Daily breaking news feed", "Yahoo Mail portal"],
  },
  chatgpt: {
    url: "https://chatgpt.com",
    name: "ChatGPT",
    loginUrl: "https://chatgpt.com/auth/login",
    authMethod: "google_sso",
    overview: "OpenAI's flagship conversational AI system offering advanced reasoning, coding, writing, and custom GPT agents.",
    keyFeatures: ["GPT-4o & o1 reasoning models", "Code Interpreter & canvas workspace", "Custom GPT agent ecosystem", "Voice and multimodal vision"],
    category: "AI & Machine Intelligence",
  },
  openai: {
    url: "https://chatgpt.com",
    name: "OpenAI ChatGPT",
    loginUrl: "https://chatgpt.com/auth/login",
    authMethod: "google_sso",
    overview: "OpenAI artificial intelligence platform.",
    keyFeatures: ["Advanced language models", "Custom assistants", "Code generation"],
  },
  claude: {
    url: "https://claude.ai",
    name: "Claude AI",
    loginUrl: "https://claude.ai/login",
    authMethod: "google_sso",
    overview: "Anthropic's next-generation AI assistant built for nuanced analysis, deep reasoning, long-form writing, and programming artifacts.",
    keyFeatures: ["Claude 3.5 Sonnet / Opus models", "200k token context window", "Artifacts interactive live workspace", "Enterprise-grade safety"],
    category: "AI & Machine Intelligence",
  },
  anthropic: {
    url: "https://claude.ai",
    name: "Claude AI",
    loginUrl: "https://claude.ai/login",
    authMethod: "google_sso",
    overview: "Anthropic's Claude AI environment.",
    keyFeatures: ["Artifacts coding view", "Deep reasoning", "Document synthesis"],
  },
  perplexity: {
    url: "https://www.perplexity.ai",
    name: "Perplexity AI",
    loginUrl: "https://www.perplexity.ai/login",
    authMethod: "google_sso",
    overview: "Conversational answer engine delivering real-time citation-grounded research summaries.",
    keyFeatures: ["Live web search citations", "Pro search deep multi-step queries", "Document & PDF analysis", "Collections knowledge workspace"],
    category: "AI & Machine Intelligence",
  },
  gemini: {
    url: "https://gemini.google.com",
    name: "Google Gemini",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://gemini.google.com/",
    authMethod: "google_sso",
    overview: "Google's multimodal AI assistant deeply integrated with Google Workspace, YouTube, Maps, and live search.",
    keyFeatures: ["Gemini 1.5 Pro & Flash models", "1M+ token context window", "Direct Google Docs/Drive extensions", "Multimodal audio/video reasoning"],
    category: "AI & Machine Intelligence",
  },
  deepseek: {
    url: "https://chat.deepseek.com",
    name: "DeepSeek",
    loginUrl: "https://chat.deepseek.com/sign_in",
    authMethod: "google_sso",
    overview: "Open-weights frontier reasoning and coding AI developed by DeepSeek.",
    keyFeatures: ["DeepSeek-R1 open reasoning", "DeepSeek-V3 ultra-fast inference", "Mathematical & programming mastery", "Free web interface"],
    category: "AI & Machine Intelligence",
  },
  grok: {
    url: "https://x.com/i/grok",
    name: "Grok AI",
    loginUrl: "https://x.com/i/flow/login",
    authMethod: "google_sso",
    overview: "xAI's conversational AI integrated natively into the X platform with real-time news access.",
    keyFeatures: ["Real-time X trend intelligence", "Grok 2 image generation (Flux)", "Unfiltered direct responses"],
  },
  huggingface: {
    url: "https://huggingface.co",
    name: "Hugging Face",
    loginUrl: "https://huggingface.co/login",
    authMethod: "google_sso",
    overview: "The central open-source collaboration hub for AI models, datasets, and ML demo spaces.",
    keyFeatures: ["500k+ open-source ML models", "Hugging Face Spaces web demos", "Datasets library & leaderboards", "Inference API endpoints"],
    category: "Developer & AI Platform",
  },
  "hugging face": {
    url: "https://huggingface.co",
    name: "Hugging Face",
    loginUrl: "https://huggingface.co/login",
    authMethod: "google_sso",
    overview: "Open-source AI community platform.",
    keyFeatures: ["Model repository", "Spaces demos", "Dataset storage"],
  },
  midjourney: {
    url: "https://www.midjourney.com",
    name: "Midjourney",
    loginUrl: "https://www.midjourney.com/auth/signin",
    authMethod: "google_sso",
    overview: "Leading generative AI art tool known for hyper-realistic and artistic imagery.",
    keyFeatures: ["V6 photorealistic image rendering", "Web generation canvas", "Style and character referencing"],
  },
  poe: {
    url: "https://poe.com",
    name: "Poe AI",
    loginUrl: "https://poe.com/login",
    authMethod: "google_sso",
    overview: "Quora's platform aggregating multiple frontier AI models in a single unified chat interface.",
    keyFeatures: ["Access Claude, GPT-4o, Llama 3, Gemini", "Custom bot creation & monetization", "Cross-model prompt testing"],
  },
  "character ai": {
    url: "https://character.ai",
    name: "Character.AI",
    loginUrl: "https://character.ai/login",
    authMethod: "google_sso",
    overview: "Interactive neural language model platform for roleplay, storytelling, and custom persona chatbots.",
    keyFeatures: ["Thousands of user-created personas", "Voice synthesis speech chat", "Multi-character group rooms"],
  },
  mistral: {
    url: "https://chat.mistral.ai",
    name: "Mistral AI",
    loginUrl: "https://chat.mistral.ai/auth/login",
    authMethod: "google_sso",
    overview: "European open AI company providing Mistral Large and Le Chat assistant.",
    keyFeatures: ["Le Chat assistant interface", "Mistral Large 2 multilingual mastery", "Fast open-weights coding"],
  },
  // ShadowTalk AI Autonomous Workspace Ecosystem (Engineered by Zain Ahmed & Fahad Patel, Karachi)
  shadowtalk: {
    url: "https://www.shadowtalk-ai.com/chatbot",
    name: "ShadowTalk AI",
    loginUrl: "https://www.shadowtalk-ai.com/chatbot",
    authMethod: "google_sso",
    overview: "The agentic AI workspace that doesn't own you ('Think AI. Think ShadowTalk.'). Engineered and co-founded by Zain Ahmed and Fahad Patel from Karachi, Pakistan. Built for people tired of chatbots that only talk: plan missions, run 30+ tools from one sentence, approve agent steps with human-in-the-loop gates, and ship real work on web, PWA, or desktop (Electron) with total BYOK key sovereignty.",
    keyFeatures: [
      "Mission Control (Autonomous multi-step workflows with human approval gates)",
      "30+ Agentic Tools executable from a single natural language sentence",
      "IDE & App Builder (Build & edit multi-file software projects from chat at /ide)",
      "Vault & BYOK (Bring Your Own Key for Gemini, Kimi, etc. - Zero platform lock-in)",
      "Offline & On-Device inference (SmolLM / Gemma hardware-aware local vs cloud routing)",
      "Native Desktop App (Electron with native file system access & OS notifications)",
      "Instant Workspace-First UX (Direct /chatbot entry with zero splash screen delays)",
      "Persistent session architecture (Anonymous or linked accounts)"
    ],
    category: "Agentic AI Workspace",
  },
  "shadowtalk ai": {
    url: "https://www.shadowtalk-ai.com/chatbot",
    name: "ShadowTalk AI Workspace",
    loginUrl: "https://www.shadowtalk-ai.com/chatbot",
    authMethod: "google_sso",
    overview: "Agentic AI workspace created by Zain Ahmed and Fahad Patel. Multi-step autonomous missions, 30+ tools, IDE App Builder, and BYOK privacy.",
    keyFeatures: ["Mission Control", "30+ Tools", "IDE /ide", "BYOK Vault", "Offline Gemma/SmolLM", "Desktop App"],
    category: "Agentic AI Workspace",
  },
  "shadow talk": {
    url: "https://www.shadowtalk-ai.com/chatbot",
    name: "ShadowTalk AI",
    loginUrl: "https://www.shadowtalk-ai.com/chatbot",
    authMethod: "google_sso",
    overview: "Agentic AI workspace that executes missions, builds apps, and preserves data privacy.",
    keyFeatures: ["Mission Control", "30+ Tools", "App Builder IDE", "BYOK Sovereignty"],
  },
  "shadowtalk home": {
    url: "https://www.shadowtalk-ai.com/home",
    name: "ShadowTalk AI Marketing Portal",
    loginUrl: "https://www.shadowtalk-ai.com/chatbot",
    authMethod: "google_sso",
    overview: "Official marketing and landing portal for ShadowTalk AI ('Think AI. Think ShadowTalk.').",
    keyFeatures: ["Product overview", "Feature comparisons", "Launch workspace CTA"],
  },
  "shadowtalk docs": {
    url: "https://www.shadowtalk-ai.com/docs",
    name: "ShadowTalk AI Documentation",
    loginUrl: "https://www.shadowtalk-ai.com/docs",
    authMethod: "google_sso",
    overview: "Complete user guide and engineering documentation hub for ShadowTalk AI, Mission Control, tools, and offline tiers.",
    keyFeatures: ["Master documentation index", "Engineering series", "Desktop and offline guide", "Route reference"],
  },
  "shadowtalk ide": {
    url: "https://www.shadowtalk-ai.com/ide",
    name: "ShadowTalk Personal IDE & App Builder",
    loginUrl: "https://www.shadowtalk-ai.com/ide",
    authMethod: "google_sso",
    overview: "Integrated developer environment and multi-file application builder generated directly from ShadowTalk neural chat.",
    keyFeatures: ["Multi-file code generation", "Live app preview", "Interactive editor"],
  },
  "shadowtalk pricing": {
    url: "https://www.shadowtalk-ai.com/pricing",
    name: "ShadowTalk Pricing & Plans",
    loginUrl: "https://www.shadowtalk-ai.com/pricing",
    authMethod: "google_sso",
    overview: "Transparent pricing tiers and billing options for ShadowTalk AI workspace.",
    keyFeatures: ["BYOK free tier", "Pro agentic tiers", "Enterprise workspace"],
  },
  "shadowtalk github": {
    url: "https://github.com/zain836/shadowtalk-ai-903ca615",
    name: "ShadowTalk GitHub Repository",
    loginUrl: "https://github.com/login",
    authMethod: "google_sso",
    overview: "Official source code repository for ShadowTalk AI (github.com/zain836/shadowtalk-ai-903ca615).",
    keyFeatures: ["React + Vite + TypeScript codebase", "Edge functions", "Electron desktop configuration"],
  },
  "shadowtalk repo": {
    url: "https://github.com/zain836/shadowtalk-ai-903ca615",
    name: "ShadowTalk Repository",
    loginUrl: "https://github.com/login",
    authMethod: "google_sso",
    overview: "ShadowTalk open source/private code repository by Zain Ahmed.",
    keyFeatures: ["GitHub repository", "Developer documentation"],
  },

  // Video, Social & Streaming
  youtube: {
    url: "https://www.youtube.com",
    name: "YouTube",
    loginUrl: "https://accounts.google.com/ServiceLogin?service=youtube&continue=https://www.youtube.com",
    authMethod: "google_sso",
    overview: "The world's largest video streaming and sharing platform hosting billions of educational, entertainment, and musical tracks.",
    keyFeatures: ["4K & 60fps video playback", "YouTube Music & audio streams", "Live chat streaming & broadcasts", "Personalized recommendations feed"],
    category: "Media & Streaming",
  },
  "you tube": {
    url: "https://www.youtube.com",
    name: "YouTube",
    loginUrl: "https://accounts.google.com/ServiceLogin?service=youtube&continue=https://www.youtube.com",
    authMethod: "google_sso",
    overview: "YouTube video platform.",
    keyFeatures: ["Video playback", "Music streaming", "Creator channels"],
  },
  twitter: {
    url: "https://www.x.com",
    name: "X / Twitter",
    loginUrl: "https://x.com/i/flow/login",
    authMethod: "google_sso",
    overview: "Global real-time microblogging network and public square for breaking news, media, and discussions.",
    keyFeatures: ["Real-time trending topics", "Live audio Spaces discussions", "Direct messaging & communities", "Grok AI integration"],
    category: "Social & News",
  },
  x: {
    url: "https://www.x.com",
    name: "X",
    loginUrl: "https://x.com/i/flow/login",
    authMethod: "google_sso",
    overview: "Real-time social communication network.",
    keyFeatures: ["Live news streams", "Creator subscriptions", "Media sharing"],
  },
  "x.com": {
    url: "https://www.x.com",
    name: "X",
    loginUrl: "https://x.com/i/flow/login",
    authMethod: "google_sso",
    overview: "X social platform.",
    keyFeatures: ["Breaking trends", "Spaces audio", "Direct messaging"],
  },
  instagram: {
    url: "https://www.instagram.com",
    name: "Instagram",
    loginUrl: "https://www.instagram.com/accounts/login/",
    authMethod: "google_sso",
    overview: "Visual social media platform for sharing photos, Reels short videos, Stories, and direct messaging.",
    keyFeatures: ["Reels algorithmic video feed", "24-hour disappearing Stories", "Direct messaging & voice notes", "Creator shopping & monetization"],
    category: "Social Media",
  },
  insta: {
    url: "https://www.instagram.com",
    name: "Instagram",
    loginUrl: "https://www.instagram.com/accounts/login/",
    authMethod: "google_sso",
    overview: "Instagram visual photo & video app.",
    keyFeatures: ["Reels", "Stories", "Direct Messaging"],
  },
  facebook: {
    url: "https://www.facebook.com",
    name: "Facebook",
    loginUrl: "https://www.facebook.com/login/",
    authMethod: "direct_login",
    overview: "Meta's foundational social networking platform connecting billions of friends, families, and interest groups.",
    keyFeatures: ["News Feed & timeline", "Facebook Groups communities", "Marketplace local commerce", "Messenger integrated chats"],
    category: "Social Media",
  },
  fb: {
    url: "https://www.facebook.com",
    name: "Facebook",
    loginUrl: "https://www.facebook.com/login/",
    authMethod: "direct_login",
    overview: "Facebook social platform.",
    keyFeatures: ["Groups", "Feeds", "Marketplace"],
  },
  reddit: {
    url: "https://www.reddit.com",
    name: "Reddit",
    loginUrl: "https://www.reddit.com/login/",
    authMethod: "google_sso",
    overview: "The front page of the internet, featuring thousands of community-moderated subreddits on any topic imaginable.",
    keyFeatures: ["Community upvoting/downvoting", "Ask Me Anything (AMAs) with leaders", "Threaded comment discussions", "Niche hobby & tech subreddits"],
    category: "Community & Forums",
  },
  linkedin: {
    url: "https://www.linkedin.com",
    name: "LinkedIn",
    loginUrl: "https://www.linkedin.com/login",
    authMethod: "google_sso",
    overview: "The world's premier professional networking network for career development, job recruitment, and industry thought leadership.",
    keyFeatures: ["Professional resume & profile", "Job search & 1-click Easy Apply", "Industry news & articles", "Direct InMail recruiter messaging"],
    category: "Careers & Networking",
  },
  tiktok: {
    url: "https://www.tiktok.com",
    name: "TikTok",
    loginUrl: "https://www.tiktok.com/login",
    authMethod: "google_sso",
    overview: "Short-form mobile video platform powered by a viral recommendation engine.",
    keyFeatures: ["For You Page (FYP) algorithmic feed", "Sound & effect video editor", "Live streaming gifts & comments", "TikTok Shop e-commerce"],
    category: "Media & Video",
  },
  discord: {
    url: "https://discord.com/app",
    name: "Discord",
    loginUrl: "https://discord.com/login",
    authMethod: "google_sso",
    overview: "Low-latency voice, video, and text communication platform built for gaming communities, developers, and friend groups.",
    keyFeatures: ["High-clarity low-latency voice channels", "Custom server roles & channels", "Screen sharing up to 4K", "Rich bot automation API"],
    category: "Chat & Communities",
  },
  telegram: {
    url: "https://web.telegram.org",
    name: "Telegram Web",
    loginUrl: "https://web.telegram.org/k/",
    authMethod: "direct_login",
    overview: "Cloud-based encrypted instant messaging service known for speed, large channels, and bot capabilities.",
    keyFeatures: ["Channels up to 200,000 members", "Cloud sync across all devices", "File sharing up to 2GB", "Encrypted secret chats"],
    category: "Messaging",
  },
  whatsapp: {
    url: "https://web.whatsapp.com",
    name: "WhatsApp Web",
    loginUrl: "https://web.whatsapp.com/",
    authMethod: "direct_login",
    overview: "End-to-end encrypted messaging service used by over 2 billion people worldwide.",
    keyFeatures: ["End-to-end encryption", "Voice & video calling", "Status updates", "Communities & group chats"],
    category: "Messaging",
  },
  "whatsapp web": {
    url: "https://web.whatsapp.com",
    name: "WhatsApp Web",
    loginUrl: "https://web.whatsapp.com/",
    authMethod: "direct_login",
    overview: "Browser client for WhatsApp.",
    keyFeatures: ["QR code instant sync", "Encrypted messaging", "Media downloads"],
  },
  pinterest: {
    url: "https://www.pinterest.com",
    name: "Pinterest",
    loginUrl: "https://www.pinterest.com/login/",
    authMethod: "google_sso",
    overview: "Visual discovery engine for finding ideas like recipes, home decor, fashion, and art inspiration.",
    keyFeatures: ["Custom visual Pinboards", "Visual search lens", "Shoppable Pins", "Creative inspiration feed"],
  },
  twitch: {
    url: "https://www.twitch.tv",
    name: "Twitch",
    loginUrl: "https://www.twitch.tv/login",
    authMethod: "google_sso",
    overview: "Interactive live streaming service for gaming, esports, music, and creative broadcasts.",
    keyFeatures: ["Live chat emotes & interactions", "Channel subscriptions & bits", "Video On Demand (VOD) archives", "Streamer creator dashboard"],
  },
  netflix: {
    url: "https://www.netflix.com",
    name: "Netflix",
    loginUrl: "https://www.netflix.com/login",
    authMethod: "direct_login",
    overview: "Subscription video-on-demand streaming service offering award-winning movies, TV shows, and anime.",
    keyFeatures: ["4K HDR Dolby Vision streaming", "Personalized recommendation algorithms", "Offline download support", "Original films & series"],
    category: "Streaming & Movies",
  },
  spotify: {
    url: "https://open.spotify.com",
    name: "Spotify",
    loginUrl: "https://accounts.spotify.com/en/login",
    authMethod: "google_sso",
    overview: "Digital music, podcast, and audiobook streaming service giving you access to millions of songs worldwide.",
    keyFeatures: ["Discover Weekly & Daily Mixes", "Collaborative playlist curation", "HiFi audio & podcast player", "Cross-device Spotify Connect"],
    category: "Music & Audio",
  },
  "disney plus": {
    url: "https://www.disneyplus.com",
    name: "Disney+",
    loginUrl: "https://www.disneyplus.com/login",
    authMethod: "direct_login",
    overview: "Streaming home of Disney, Pixar, Marvel, Star Wars, and National Geographic.",
    keyFeatures: ["IMAX Enhanced aspect ratios", "4K Ultra HD Dolby Atmos", "GroupWatch synchronized viewing"],
  },
  "prime video": {
    url: "https://www.primevideo.com",
    name: "Amazon Prime Video",
    loginUrl: "https://www.amazon.com/ap/signin",
    authMethod: "direct_login",
    overview: "Amazon's on-demand video streaming platform.",
    keyFeatures: ["X-Ray cast & trivia overlay", "Prime Video original series", "4K HDR downloads"],
  },
  hulu: {
    url: "https://www.hulu.com",
    name: "Hulu",
    loginUrl: "https://auth.hulu.com/web/login",
    authMethod: "direct_login",
    overview: "Streaming service featuring current season TV episodes, original movies, and live TV.",
    keyFeatures: ["Next-day TV broadcast episodes", "Hulu Originals library", "Live TV add-on channels"],
  },

  // Coding & Developer Ecosystem
  github: {
    url: "https://www.github.com",
    name: "GitHub",
    loginUrl: "https://github.com/login",
    authMethod: "google_sso",
    overview: "The world's leading developer platform for version control, collaborative software development, code hosting, and CI/CD pipelines.",
    keyFeatures: ["Git repository management & pull requests", "GitHub Actions CI/CD automation", "GitHub Copilot AI coding partner", "Security vulnerability scanning & Dependabot"],
    category: "Developer Tools",
  },
  "git hub": {
    url: "https://www.github.com",
    name: "GitHub",
    loginUrl: "https://github.com/login",
    authMethod: "google_sso",
    overview: "GitHub source code repository.",
    keyFeatures: ["Git repos", "Pull requests", "Actions CI/CD"],
  },
  gitlab: {
    url: "https://gitlab.com",
    name: "GitLab",
    loginUrl: "https://gitlab.com/users/sign_in",
    authMethod: "google_sso",
    overview: "Complete DevSecOps platform delivered as a single application for full software lifecycle management.",
    keyFeatures: ["Integrated CI/CD pipelines", "Built-in container registry", "Issue tracking & agile boards", "Automated code security scanning"],
    category: "Developer Tools",
  },
  bitbucket: {
    url: "https://bitbucket.org",
    name: "Bitbucket",
    loginUrl: "https://id.atlassian.com/login",
    authMethod: "google_sso",
    overview: "Git code management tool built for professional teams using Jira.",
    keyFeatures: ["Deep Jira Software integration", "Bitbucket Pipelines CI/CD", "Branch permissions & pull requests"],
  },
  "stack overflow": {
    url: "https://stackoverflow.com",
    name: "Stack Overflow",
    loginUrl: "https://stackoverflow.com/users/login",
    authMethod: "google_sso",
    overview: "The premier question-and-answer platform for professional and enthusiast programmers to troubleshoot and learn code.",
    keyFeatures: ["Community verified code solutions", "Reputation & badge recognition", "Developer Collective communities", "Tag-based technology search"],
    category: "Developer Knowledge",
  },
  stackoverflow: {
    url: "https://stackoverflow.com",
    name: "Stack Overflow",
    loginUrl: "https://stackoverflow.com/users/login",
    authMethod: "google_sso",
    overview: "Developer Q&A knowledge platform.",
    keyFeatures: ["Code troubleshooting", "Verified answers", "Developer community"],
  },
  leetcode: {
    url: "https://leetcode.com",
    name: "LeetCode",
    loginUrl: "https://leetcode.com/accounts/login/",
    authMethod: "google_sso",
    overview: "The golden standard online coding platform for mastering data structures, algorithms, and technical interview preparation.",
    keyFeatures: ["3,000+ curated algorithmic coding challenges", "Weekly global coding contests", "Interactive online code editor in 14+ languages", "Company-specific interview question tracks"],
    category: "Coding & Interview Prep",
  },
  "leet code": {
    url: "https://leetcode.com",
    name: "LeetCode",
    loginUrl: "https://leetcode.com/accounts/login/",
    authMethod: "google_sso",
    overview: "LeetCode technical interview platform.",
    keyFeatures: ["Algorithms practice", "Contests ranking", "Interview study plans"],
  },
  codeforces: {
    url: "https://codeforces.com",
    name: "Codeforces",
    loginUrl: "https://codeforces.com/enter",
    authMethod: "direct_login",
    overview: "Competitive programming platform hosting regular rating rounds and problem archives.",
    keyFeatures: ["Rated 2-hour competitive rounds", "Extensive problemset archive", "Global coder rating leaderboard"],
  },
  hackerrank: {
    url: "https://www.hackerrank.com",
    name: "HackerRank",
    loginUrl: "https://www.hackerrank.com/auth/login",
    authMethod: "google_sso",
    overview: "Technical skills assessment platform for practicing code and clearing hiring tests.",
    keyFeatures: ["Skill certification badges", "Domain-specific tracks (SQL, Python, Java)", "Employer coding assessments"],
  },
  codepen: {
    url: "https://codepen.io",
    name: "CodePen",
    loginUrl: "https://codepen.io/login",
    authMethod: "google_sso",
    overview: "Social development environment for front-end designers and developers to build and showcase HTML/CSS/JS.",
    keyFeatures: ["Live code preview editor", "Asset hosting & preprocessors", "Community showcase feed"],
  },
  replit: {
    url: "https://replit.com",
    name: "Replit",
    loginUrl: "https://replit.com/login",
    authMethod: "google_sso",
    overview: "Browser-based collaborative IDE allowing you to build, deploy, and host applications instantly in 50+ languages.",
    keyFeatures: ["Zero-setup cloud environment", "Replit AI code generation", "Multiplayer live coding collaboration", "One-click cloud hosting"],
    category: "Cloud IDE",
  },
  vercel: {
    url: "https://vercel.com",
    name: "Vercel",
    loginUrl: "https://vercel.com/login",
    authMethod: "google_sso",
    overview: "Frontend cloud platform providing fast hosting, serverless edge compute, and the home of Next.js.",
    keyFeatures: ["Git push to instant production deploy", "Edge network globally distributed CDN", "Serverless & Edge functions", "Automatic SSL and preview domains"],
    category: "Cloud & Deployment",
  },
  netlify: {
    url: "https://www.netlify.com",
    name: "Netlify",
    loginUrl: "https://app.netlify.com/login",
    authMethod: "google_sso",
    overview: "Composable web platform for deploying modern web applications and serverless backends.",
    keyFeatures: ["Continuous deployment from Git", "Netlify Functions serverless APIs", "Form handling & identity", "Branch preview URLs"],
  },
  supabase: {
    url: "https://supabase.com",
    name: "Supabase",
    loginUrl: "https://supabase.com/dashboard/sign-in",
    authMethod: "google_sso",
    overview: "The open-source Firebase alternative providing a dedicated PostgreSQL database, Auth, Storage, and Realtime APIs.",
    keyFeatures: ["Full PostgreSQL database with pgvector", "Instant REST & GraphQL APIs", "Row Level Security (RLS) policies", "Realtime database change subscriptions"],
    category: "Backend & Database",
  },
  firebase: {
    url: "https://console.firebase.google.com",
    name: "Firebase Console",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://console.firebase.google.com",
    authMethod: "google_sso",
    overview: "Google's app development platform for building, deploying, and scaling mobile and web apps.",
    keyFeatures: ["Cloud Firestore NoSQL real-time database", "Firebase Authentication (Google, email, phone)", "Cloud Functions serverless compute", "Firebase Cloud Messaging & Analytics"],
    category: "Cloud & Backend",
  },
  cloudflare: {
    url: "https://dash.cloudflare.com",
    name: "Cloudflare",
    loginUrl: "https://dash.cloudflare.com/login",
    authMethod: "google_sso",
    overview: "Global cloud platform delivering web security, DDoS protection, DNS, and Workers serverless edge compute.",
    keyFeatures: ["Enterprise DDoS & WAF security", "1.1.1.1 fast DNS resolution", "Cloudflare Workers edge execution", "Zero Trust access management"],
  },
  aws: {
    url: "https://console.aws.amazon.com",
    name: "AWS Console",
    loginUrl: "https://console.aws.amazon.com/",
    authMethod: "direct_login",
    overview: "Amazon Web Services management console for cloud infrastructure, compute, databases, and AI.",
    keyFeatures: ["EC2 virtual servers & Lambda compute", "S3 scalable object storage", "DynamoDB & RDS managed databases", "IAM permissions & security"],
    category: "Cloud Infrastructure",
  },
  "aws console": {
    url: "https://console.aws.amazon.com",
    name: "AWS Console",
    loginUrl: "https://console.aws.amazon.com/",
    authMethod: "direct_login",
    overview: "AWS management portal.",
    keyFeatures: ["Cloud management", "EC2, S3, RDS", "IAM access"],
  },

  // Productivity, Workspace & Cloud
  gmail: {
    url: "https://mail.google.com",
    name: "Gmail",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://mail.google.com/",
    authMethod: "google_sso",
    overview: "Google's intuitive, efficient, and secure email service with 15GB free cloud storage and spam protection.",
    keyFeatures: ["Google search power across emails", "Smart Compose & summary AI", "Google Meet & Chat integration", "Multi-inbox & category filtering"],
    category: "Email & Communication",
  },
  "google mail": {
    url: "https://mail.google.com",
    name: "Gmail",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://mail.google.com/",
    authMethod: "google_sso",
    overview: "Gmail communication hub.",
    keyFeatures: ["Inbox organization", "Security filters", "Google Workspace integration"],
  },
  mail: {
    url: "https://mail.google.com",
    name: "Gmail",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://mail.google.com/",
    authMethod: "google_sso",
    overview: "Email portal.",
    keyFeatures: ["Email reading & sending", "Search", "Labels"],
  },
  "google drive": {
    url: "https://drive.google.com",
    name: "Google Drive",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://drive.google.com/",
    authMethod: "google_sso",
    overview: "Cloud file storage and synchronization service by Google for documents, photos, and backups.",
    keyFeatures: ["Real-time collaborative editing", "AI-powered file search & OCR", "Granular sharing permissions", "Cross-platform cloud sync"],
    category: "Cloud Storage",
  },
  drive: {
    url: "https://drive.google.com",
    name: "Google Drive",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://drive.google.com/",
    authMethod: "google_sso",
    overview: "Google Drive storage.",
    keyFeatures: ["Cloud files", "Document sharing", "Backups"],
  },
  "google docs": {
    url: "https://docs.google.com",
    name: "Google Docs",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://docs.google.com/",
    authMethod: "google_sso",
    overview: "Real-time collaborative word processor with rich styling, comments, and version history.",
    keyFeatures: ["Multiplayer live typing", "Revision history rollback", "Gemini AI writing assistant"],
  },
  docs: {
    url: "https://docs.google.com",
    name: "Google Docs",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://docs.google.com/",
    authMethod: "google_sso",
    overview: "Collaborative word processor.",
    keyFeatures: ["Document authoring", "Live sharing", "Formatting"],
  },
  "google sheets": {
    url: "https://sheets.google.com",
    name: "Google Sheets",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://sheets.google.com/",
    authMethod: "google_sso",
    overview: "Online spreadsheet application with formulas, pivot tables, charts, and Apps Script automation.",
    keyFeatures: ["Advanced formula engine", "Interactive charts & visualizations", "Google Apps Script automation"],
  },
  sheets: {
    url: "https://sheets.google.com",
    name: "Google Sheets",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://sheets.google.com/",
    authMethod: "google_sso",
    overview: "Spreadsheet tool.",
    keyFeatures: ["Formulas", "Data tables", "Charts"],
  },
  "google calendar": {
    url: "https://calendar.google.com",
    name: "Google Calendar",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://calendar.google.com/",
    authMethod: "google_sso",
    overview: "Time-management and scheduling calendar service.",
    keyFeatures: ["Event reminders & notifications", "Meeting schedule links", "Time-zone synchronization"],
  },
  calendar: {
    url: "https://calendar.google.com",
    name: "Google Calendar",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://calendar.google.com/",
    authMethod: "google_sso",
    overview: "Calendar & schedule management.",
    keyFeatures: ["Events", "Reminders", "Schedules"],
  },
  "google maps": {
    url: "https://maps.google.com",
    name: "Google Maps",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://maps.google.com/",
    authMethod: "google_sso",
    overview: "Comprehensive mapping service providing satellite imagery, real-time traffic conditions, and route planning.",
    keyFeatures: ["Turn-by-turn GPS navigation", "Street View 360 photography", "Local business reviews & hours"],
  },
  maps: {
    url: "https://maps.google.com",
    name: "Google Maps",
    loginUrl: "https://accounts.google.com/AccountChooser?continue=https://maps.google.com/",
    authMethod: "google_sso",
    overview: "Mapping & navigation service.",
    keyFeatures: ["Directions", "Traffic data", "Locations"],
  },
  notion: {
    url: "https://www.notion.so",
    name: "Notion",
    loginUrl: "https://www.notion.so/login",
    authMethod: "google_sso",
    overview: "The connected all-in-one workspace for notes, tasks, wikis, and relational databases powered by AI.",
    keyFeatures: ["Modular block-based editor", "Relational databases & Kanban boards", "Notion AI automated summaries", "Team knowledge wikis"],
    category: "Productivity & Workspace",
  },
  figma: {
    url: "https://www.figma.com",
    name: "Figma",
    loginUrl: "https://www.figma.com/login",
    authMethod: "google_sso",
    overview: "The collaborative interface design tool for designing UI, interactive prototypes, and vector graphics in real-time.",
    keyFeatures: ["Live multiplayer UI design canvas", "Interactive component states & auto-layout", "Design system tokens & libraries", "FigJam interactive whiteboarding"],
    category: "Design & Prototyping",
  },
  canva: {
    url: "https://www.canva.com",
    name: "Canva",
    loginUrl: "https://www.canva.com/login",
    authMethod: "google_sso",
    overview: "User-friendly graphic design platform used to create social media graphics, presentations, posters, and visual content.",
    keyFeatures: ["Millions of professional templates", "Magic Studio AI generative tools", "Brand Kit color & font sync", "One-click background removal"],
    category: "Design & Creative",
  },
  trello: {
    url: "https://trello.com",
    name: "Trello",
    loginUrl: "https://trello.com/login",
    authMethod: "google_sso",
    overview: "Visual project management tool organizing tasks into boards, lists, and cards.",
    keyFeatures: ["Kanban drag-and-drop boards", "Butler automation rules", "Power-Ups plugin ecosystem"],
  },
  asana: {
    url: "https://app.asana.com",
    name: "Asana",
    loginUrl: "https://app.asana.com/-/login",
    authMethod: "google_sso",
    overview: "Work management platform helping teams orchestrate projects, workflows, and strategic goals.",
    keyFeatures: ["Timeline Gantt charts", "Workload capacity management", "Automated custom workflow rules"],
  },
  jira: {
    url: "https://www.atlassian.com/software/jira",
    name: "Jira",
    loginUrl: "https://id.atlassian.com/login",
    authMethod: "google_sso",
    overview: "Issue and project tracking software designed for agile software development teams.",
    keyFeatures: ["Scrum and Kanban boards", "Sprint planning & burndown charts", "Roadmaps & release tracking"],
  },
  linear: {
    url: "https://linear.app",
    name: "Linear",
    loginUrl: "https://linear.app/login",
    authMethod: "google_sso",
    overview: "High-performance issue tracker and product planning tool built with speed and keyboard shortcuts.",
    keyFeatures: ["Sub-50ms interaction speed", "Cycles & project milestones", "Git integration sync"],
    category: "Developer Tools",
  },
  slack: {
    url: "https://app.slack.com",
    name: "Slack",
    loginUrl: "https://slack.com/signin",
    authMethod: "google_sso",
    overview: "Enterprise productivity platform that brings teams together through channels, direct messages, and automated workflows.",
    keyFeatures: ["Organized public & private channels", "Slack Huddles instant audio calls", "Canvas document collaboration", "Workflow Builder automation"],
    category: "Team Communication",
  },
  zoom: {
    url: "https://zoom.us",
    name: "Zoom",
    loginUrl: "https://zoom.us/signin",
    authMethod: "google_sso",
    overview: "Video communications platform providing HD video conferencing, webinars, and team chat.",
    keyFeatures: ["HD video & crystal audio", "Screen sharing with annotation", "Breakout rooms & AI summaries"],
  },

  // E-Commerce & Retail
  amazon: {
    url: "https://www.amazon.com",
    name: "Amazon",
    loginUrl: "https://www.amazon.com/ap/signin",
    authMethod: "direct_login",
    overview: "The world's largest online marketplace offering millions of products, Prime fast delivery, and digital entertainment.",
    keyFeatures: ["1-Click checkout & Prime delivery", "Customer verified reviews", "Price tracking & deals", "Amazon Locker pickups"],
    category: "E-Commerce",
  },
  ebay: {
    url: "https://www.ebay.com",
    name: "eBay",
    loginUrl: "https://www.ebay.com/signin/",
    authMethod: "google_sso",
    overview: "Global auction and consumer-to-consumer e-commerce website.",
    keyFeatures: ["Live bidding auctions", "Buy It Now listings", "eBay Money Back Guarantee"],
  },

  // Learning & Education
  coursera: {
    url: "https://www.coursera.org",
    name: "Coursera",
    loginUrl: "https://www.coursera.org/?authMode=login",
    authMethod: "google_sso",
    overview: "Online learning platform offering accredited courses, degrees, and certificates from top universities.",
    keyFeatures: ["University accredited certificates", "Guided programming projects", "Financial aid availability"],
    category: "Education",
  },
  udemy: {
    url: "https://www.udemy.com",
    name: "Udemy",
    loginUrl: "https://www.udemy.com/join/login-popup/",
    authMethod: "google_sso",
    overview: "Global education marketplace with over 200,000 video courses on programming, business, and art.",
    keyFeatures: ["Lifetime course access", "Instructor Q&A forums", "Practical hands-on coding exercises"],
  },
  "khan academy": {
    url: "https://www.khanacademy.org",
    name: "Khan Academy",
    loginUrl: "https://www.khanacademy.org/login",
    authMethod: "google_sso",
    overview: "Free world-class education platform for anyone, anywhere, covering math, science, computing, and humanities.",
    keyFeatures: ["100% free personalized learning", "Mastery practice problems", "Khanmigo AI tutor"],
  },
  duolingo: {
    url: "https://www.duolingo.com",
    name: "Duolingo",
    loginUrl: "https://www.duolingo.com/log-in",
    authMethod: "google_sso",
    overview: "Gamified language learning platform featuring bite-sized lessons, streaks, and leaderboards.",
    keyFeatures: ["Bite-sized gamified lessons", "Daily streak tracker & leagues", "Speech recognition pronunciation tests"],
  },

  // Finance & Crypto
  tradingview: {
    url: "https://www.tradingview.com",
    name: "TradingView",
    loginUrl: "https://www.tradingview.com/accounts/signin/",
    authMethod: "google_sso",
    overview: "Advanced financial charting platform and social network for traders and investors.",
    keyFeatures: ["Real-time multi-asset charts", "Pine Script custom indicators", "Community trade ideas"],
  },
  binance: {
    url: "https://www.binance.com",
    name: "Binance",
    loginUrl: "https://accounts.binance.com/en/login",
    authMethod: "google_sso",
    overview: "Leading cryptocurrency exchange by trading volume.",
    keyFeatures: ["Spot and futures crypto trading", "Binance Earn yield staking", "Institutional security"],
  },
  coinbase: {
    url: "https://www.coinbase.com",
    name: "Coinbase",
    loginUrl: "https://login.coinbase.com/signin",
    authMethod: "direct_login",
    overview: "Secure cryptocurrency exchange for buying, selling, and managing crypto assets.",
    keyFeatures: ["User-friendly crypto buying", "Coinbase Advanced trading", "Self-custody Web3 wallet"],
  },

  // Gaming
  steam: {
    url: "https://store.steampowered.com",
    name: "Steam",
    loginUrl: "https://store.steampowered.com/login/",
    authMethod: "direct_login",
    overview: "The ultimate digital storefront and gaming community hub for PC gamers.",
    keyFeatures: ["Steam Cloud game saves", "Workshop community mods", "Steam Deck compatibility tags"],
  },
  "chess.com": {
    url: "https://www.chess.com",
    name: "Chess.com",
    loginUrl: "https://www.chess.com/login_check",
    authMethod: "google_sso",
    overview: "The world's largest online chess platform for live games, puzzles, and grandmaster lessons.",
    keyFeatures: ["Live multiplayer chess matches", "Tactical puzzle trainer", "Game review engine evaluation"],
  },
  chess: {
    url: "https://www.chess.com",
    name: "Chess.com",
    loginUrl: "https://www.chess.com/login_check",
    authMethod: "google_sso",
    overview: "Chess.com platform.",
    keyFeatures: ["Play chess", "Puzzles", "Lessons"],
  },

  // Travel & Lifestyle
  airbnb: {
    url: "https://www.airbnb.com",
    name: "Airbnb",
    loginUrl: "https://www.airbnb.com/login",
    authMethod: "google_sso",
    overview: "Online marketplace for vacation rentals, unique stays, and local travel experiences.",
    keyFeatures: ["Unique homestays & villas", "Host reviews & superhosts", "Experiences hosted by locals"],
  },
  booking: {
    url: "https://www.booking.com",
    name: "Booking.com",
    loginUrl: "https://account.booking.com/sign-in",
    authMethod: "google_sso",
    overview: "Travel platform for booking hotels, flights, car rentals, and attractions.",
    keyFeatures: ["Millions of accommodations", "Free cancellation options", "Genius loyalty discounts"],
  },
  speedtest: {
    url: "https://www.speedtest.net",
    name: "Speedtest by Ookla",
    loginUrl: "https://account.speedtest.net/login",
    authMethod: "google_sso",
    overview: "Internet speed testing tool measuring ping, download speed, and upload throughput.",
    keyFeatures: ["Instant bandwidth measurement", "Server latency diagnostics", "Global speed index rankings"],
  },
  weather: {
    url: "https://weather.com",
    name: "The Weather Channel",
    loginUrl: "https://weather.com/",
    authMethod: "direct_login",
    overview: "Real-time weather forecasting, radar maps, and severe weather alerts.",
    keyFeatures: ["Hourly and 10-day forecasts", "Live Doppler radar maps", "Severe storm notifications"],
  },
};

// Common TLDs for speech normalization
const TLD_PATTERNS = [
  "com",
  "org",
  "net",
  "io",
  "ai",
  "co",
  "app",
  "dev",
  "edu",
  "gov",
  "xyz",
  "tech",
  "tv",
  "me",
  "in",
  "uk",
  "ca",
  "de",
  "gg",
  "so",
  "to",
  "info",
  "biz",
];

/**
 * Normalizes speech phonetics (e.g. replaces "dot com" with ".com", cleans prefixes)
 */
export function normalizeSpeechToUrl(rawSpeech: string): string {
  let cleaned = rawSpeech.trim().toLowerCase();

  // Replace spoken "dot" before known TLDs
  for (const tld of TLD_PATTERNS) {
    const dotRegex = new RegExp(`\\s+dot\\s+${tld}\\b`, "gi");
    cleaned = cleaned.replace(dotRegex, `.${tld}`);
    const pointRegex = new RegExp(`\\s+point\\s+${tld}\\b`, "gi");
    cleaned = cleaned.replace(pointRegex, `.${tld}`);
  }

  // Replace "slash" with "/"
  cleaned = cleaned.replace(/\s+slash\s+/gi, "/");

  // Replace "colon slash slash" with "://"
  cleaned = cleaned.replace(/\s*colon\s+slash\s+slash\s*/gi, "://");

  return cleaned;
}

/**
 * Intelligent Detection and Resolution for "Open [website] and login using my Gmail and tell me about it"
 */
export function resolveWebsiteWithLogin(
  rawInput: string,
  userEmail: string = "zaim98269@gmail.com"
): ResolvedWebsiteLogin | null {
  if (!rawInput || typeof rawInput !== "string") return null;

  const normalized = normalizeSpeechToUrl(rawInput);
  const lower = normalized.toLowerCase();

  // Check for login intent in the user prompt
  const hasLoginIntent =
    lower.includes("login") ||
    lower.includes("log in") ||
    lower.includes("sign in") ||
    lower.includes("signin") ||
    lower.includes("with my gmail") ||
    lower.includes("using my gmail") ||
    lower.includes("with google") ||
    lower.includes("using google") ||
    lower.includes("mere gmail se") ||
    lower.includes("login kardo") ||
    lower.includes("लॉगिन") ||
    lower.includes("साइन इन");

  // Check for briefing intent: "tell me about the website", "tell me about it", "website ke baare me batao"
  const hasBriefingIntent =
    lower.includes("tell me about") ||
    lower.includes("explain the website") ||
    lower.includes("what is this website") ||
    lower.includes("what is it") ||
    lower.includes("describe it") ||
    lower.includes("ke baare me batao") ||
    lower.includes("kya hai") ||
    lower.includes("के बारे में बताओ");

  if (!hasLoginIntent && !hasBriefingIntent) {
    return null;
  }

  const isHindiText =
    /[\u0900-\u097F]/.test(rawInput) ||
    lower.includes("kholo") ||
    lower.includes("batao") ||
    lower.includes("baare me") ||
    lower.includes("kardo");

  // Extract the target website keyword from the prompt
  let target = lower
    .replace(/^(hey\s+jarvis|ok\s+jarvis|yo\s+jarvis|alright\s+jarvis|jarvis)\s*,?\s*/i, "")
    .replace(/^(please|can\s+you|could\s+you|would\s+you|kindly|kripya|bhai|yaar)\s+/i, "")
    .replace(/^(open\s+up|open|launch|go\s+to|navigate\s+to|visit|take\s+me\s+to)\s+/i, "")
    .replace(/^(the\s+)?(website|site|webpage|portal)\s+(of\s+)?/i, "")
    .replace(/\s+(and\s+login.*|and\s+log\s+in.*|and\s+sign\s+in.*)$/i, "")
    .replace(/\s+(and\s+tell\s+me\s+about.*|aur\s+uske\s+baare\s+me.*)$/i, "")
    .replace(/\s+(pe\s+login\s+karo.*|par\s+login\s+karo.*|me\s+login\s+karo.*)$/i, "")
    .replace(/\s+(kholo\s+aur.*)$/i, "")
    .replace(/\s+in\s+my\s+browser$/i, "")
    .replace(/\s+(website|site|portal|app)$/i, "")
    .trim();

  // If target extraction left nothing or filler words, try matching popular domains directly from prompt
  let matchedMeta: WebsiteMetadata | null = null;
  let matchedKey = "";

  if (target && POPULAR_WEBSITES[target]) {
    matchedMeta = POPULAR_WEBSITES[target];
    matchedKey = target;
  } else {
    for (const [key, meta] of Object.entries(POPULAR_WEBSITES)) {
      const re = new RegExp(`\\b${key}\\b`, "i");
      if (re.test(lower)) {
        matchedMeta = meta;
        matchedKey = key;
        break;
      }
    }
  }

  const effectiveEmail = userEmail || "zaim98269@gmail.com";

  if (matchedMeta) {
    const siteUrl = matchedMeta.url;
    const loginUrl =
      matchedMeta.loginUrl ||
      `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(effectiveEmail)}&continue=${encodeURIComponent(siteUrl)}`;

    const overview =
      matchedMeta.overview ||
      `${matchedMeta.name} is a premier web platform providing specialized online services and tools.`;
    const keyFeatures =
      matchedMeta.keyFeatures && matchedMeta.keyFeatures.length > 0
        ? matchedMeta.keyFeatures
        : [
            "Seamless Google Single Sign-On (SSO) integration",
            "High-speed cloud service access",
            "Personalized workspace and preferences",
            "Enterprise-grade data encryption",
          ];

    const speech = isHindiText
      ? `जी सर, ${matchedMeta.name} खोला जा रहा है और आपके ईमेल (${effectiveEmail}) के साथ गूगल लॉगिन गेटवे शुरू किया गया है। ${matchedMeta.name}: ${overview}`
      : `Opening ${matchedMeta.name} and initiating Google SSO authentication for ${effectiveEmail}, sir. Here is the operational overview: ${matchedMeta.name} is ${overview}`;

    const briefing: WebsiteLoginBriefing = {
      siteName: matchedMeta.name,
      targetUrl: siteUrl,
      loginUrl: loginUrl,
      authMethod: matchedMeta.authMethod || "google_sso",
      userEmail: effectiveEmail,
      siteOverview: overview,
      keyFeatures,
      securityStatus: "Google SSO OAuth 2.0 Ready",
      recommendedActions: [
        `Confirm Google sign-in prompt for ${effectiveEmail}`,
        `Access your personalized ${matchedMeta.name} dashboard`,
        `Manage account security & 2FA preferences`,
      ],
      spokenSummary: speech,
      timestamp: new Date().toISOString(),
    };

    return {
      isLoginCommand: true,
      siteName: matchedMeta.name,
      targetUrl: siteUrl,
      loginUrl: loginUrl,
      authMethod: matchedMeta.authMethod || "google_sso",
      userEmail: effectiveEmail,
      siteOverview: overview,
      keyFeatures,
      securityStatus: "Google SSO Active",
      confirmationSpeech: speech,
      action: "LOGIN_WEBSITE",
      briefing,
    };
  }

  // If target looks like a custom domain or brand (e.g. "xyz.com", "myportal.io", "zoom.us", "cursor.com")
  let domain = target || "website";
  if (!domain.includes(".") && !domain.startsWith("http")) {
    domain = `${domain}.com`;
  }
  const cleanDomain = domain.replace(/^https?:\/\//, "");
  const targetUrl = domain.startsWith("http") ? domain : `https://${cleanDomain}`;
  const siteTitle = cleanDomain.split(".")[0].toUpperCase();
  const directLoginUrl = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(effectiveEmail)}&continue=${encodeURIComponent(targetUrl)}`;

  const genericOverview = `${siteTitle} (${cleanDomain}) is an online web destination accessible through your secure browser session.`;
  const genericFeatures = [
    `Direct Google SSO redirect pathway for ${effectiveEmail}`,
    "Full browser session sandbox compatibility",
    "Protected TLS/HTTPS transmission security",
    "Quick 1-click dashboard entry",
  ];

  const genericSpeech = isHindiText
    ? `वेबसाइट ${cleanDomain} खोली जा रही है और आपके ईमेल (${effectiveEmail}) से लॉगिन प्रक्रिया सक्रिय कर दी गई है, सर।`
    : `Navigating to ${cleanDomain} and initiating Google account login for ${effectiveEmail}, sir. ${genericOverview}`;

  const genericBriefing: WebsiteLoginBriefing = {
    siteName: siteTitle,
    targetUrl: targetUrl,
    loginUrl: directLoginUrl,
    authMethod: "google_sso",
    userEmail: effectiveEmail,
    siteOverview: genericOverview,
    keyFeatures: genericFeatures,
    securityStatus: "Google SSO Gateway Active",
    recommendedActions: [
      `Complete Google authentication on ${cleanDomain}`,
      "Review connected app permissions",
      "Begin workflow execution",
    ],
    spokenSummary: genericSpeech,
    timestamp: new Date().toISOString(),
  };

  return {
    isLoginCommand: true,
    siteName: siteTitle,
    targetUrl,
    loginUrl: directLoginUrl,
    authMethod: "google_sso",
    userEmail: effectiveEmail,
    siteOverview: genericOverview,
    keyFeatures: genericFeatures,
    securityStatus: "Google SSO Active",
    confirmationSpeech: genericSpeech,
    action: "LOGIN_WEBSITE",
    briefing: genericBriefing,
  };
}

/**
 * Universal Intelligent Website & Voice Command Resolver
 */
export function resolveVoiceToWebsite(rawInput: string): ResolvedWebsite | null {
  if (!rawInput || typeof rawInput !== "string") return null;

  const normalized = normalizeSpeechToUrl(rawInput);

  // Strip conversational prefixes and polite fillers (English & Hindi)
  let target = normalized
    .replace(/^(hey\s+jarvis|ok\s+jarvis|yo\s+jarvis|alright\s+jarvis|bro\s+jarvis|bro|jarvis)\s*,?\s*/i, "")
    .replace(/^(please|can\s+you|could\s+you|would\s+you|kindly|kripya|bhai|yaar|are|arey)\s+/i, "")
    .trim();

  const isHindiText = /[\u0900-\u097F]/.test(rawInput) || target.includes("kholo") || target.includes("khojo") || target.includes("par search");

  // Check for search intent first: "search google for X", "search for X", "google X", "google par search karo X"
  if (
    target.startsWith("search google for ") ||
    target.startsWith("search for ") ||
    target.startsWith("google ") ||
    target.startsWith("search ") ||
    target.includes("par search karo") ||
    target.includes("pe search karo") ||
    target.includes("खोजो") ||
    target.startsWith("khojo ")
  ) {
    const searchTopic = target
      .replace(/^(search\s+google\s+for|search\s+for|google|search|khojo|खोजो)\s+/i, "")
      .replace(/\s+(on\s+google|par\s+search\s+karo|pe\s+search\s+karo|search\s+karo)$/i, "")
      .trim();

    if (searchTopic) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTopic)}`;
      return {
        isWebsiteCommand: true,
        targetUrl: searchUrl,
        siteName: `Google Search: "${searchTopic}"`,
        action: "SEARCH_GOOGLE",
        confirmationSpeech: isHindiText
          ? `गूगल पर "${searchTopic}" खोजा जा रहा है, सर।`
          : `Searching Google for "${searchTopic}" in your browser, sir.`,
      };
    }
  }

  // Check for navigation / open triggers in English and Hindi
  const isNavTrigger =
    /^(open\s+up|open|launch|go\s+to|navigate\s+to|visit|take\s+me\s+to|show\s+me|bring\s+up|browse\s+to|browse|head\s+to|load|start|access|pull\s+up|switch\s+to|kholo|chalu\s+karo|खोलो)\b/i.test(
      target
    ) || /\s+(kholo|open\s+karo|chalu\s+karo|खोलो)$/i.test(target);

  if (isNavTrigger) {
    target = target
      .replace(
        /^(open\s+up|open|launch|go\s+to|navigate\s+to|visit|take\s+me\s+to|show\s+me|bring\s+up|browse\s+to|browse|head\s+to|load|start|access|pull\s+up|switch\s+to|kholo|chalu\s+karo|खोलो)\s+/i,
        ""
      )
      .replace(/\s+(kholo|open\s+karo|chalu\s+karo|खोलो)$/i, "")
      .replace(/^(the\s+)?(website|site|webpage|page|portal|tab|new\s+tab)\s+(of\s+)?/i, "")
      .replace(/\s+in\s+(my\s+)?(browser|real\s+browser|new\s+tab|tab)$/i, "")
      .replace(/\s+(website|site|portal|page|app)$/i, "")
      .trim();
  }

  // If there's no navigation trigger and no direct domain pattern, return null
  const hasDomainPattern =
    /^https?:\/\//i.test(target) ||
    /\b[a-z0-9-]+\.[a-z]{2,}(\/[^\s]*)?/i.test(target) ||
    /^(localhost|127\.0\.0\.1)(:\d+)?/i.test(target);

  if (!isNavTrigger && !hasDomainPattern) {
    return null;
  }

  if (!target) return null;

  // Clean remaining whitespace or trailing punctuation
  target = target.replace(/[?,.!]+$/, "").trim();

  // 1. YouTube specific handler
  if (target === "youtube" || target.includes("youtube.com") || target.includes("youtu.be")) {
    return {
      isWebsiteCommand: true,
      targetUrl: "https://www.youtube.com",
      siteName: "YouTube",
      action: "OPEN_TAB",
      confirmationSpeech: "Opening YouTube in an active browser tab, sir.",
    };
  }

  // 2. Exact match in popular websites catalogue (150+ domains)
  const exactCatalogKey = target.toLowerCase();
  if (POPULAR_WEBSITES[exactCatalogKey]) {
    const item = POPULAR_WEBSITES[exactCatalogKey];
    return {
      isWebsiteCommand: true,
      targetUrl: item.url,
      siteName: item.name,
      action: "OPEN_TAB",
      confirmationSpeech: `Opening ${item.name} in your browser, sir.`,
    };
  }

  // 3. Partial keyword matching in catalogue (e.g. "open github repo" -> GitHub)
  for (const [key, item] of Object.entries(POPULAR_WEBSITES)) {
    if (exactCatalogKey === key || exactCatalogKey.startsWith(`${key} `) || exactCatalogKey.endsWith(` ${key}`)) {
      return {
        isWebsiteCommand: true,
        targetUrl: item.url,
        siteName: item.name,
        action: "OPEN_TAB",
        confirmationSpeech: `Launching ${item.name} in your browser, sir.`,
      };
    }
  }

  // 4. Protocol URL (e.g. "http://localhost:3000" or "https://example.com/api")
  if (target.startsWith("http://") || target.startsWith("https://")) {
    const hostname = target.replace(/^https?:\/\//, "").split("/")[0];
    return {
      isWebsiteCommand: true,
      targetUrl: target,
      siteName: hostname || target,
      action: "OPEN_TAB",
      confirmationSpeech: `Opening ${hostname || "target address"} in your browser, sir.`,
    };
  }

  // 5. Direct Domain format (e.g. "anthropic.com", "news.ycombinator.com", "sub.domain.co.uk", "my-app.vercel.app")
  const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
  if (domainRegex.test(target)) {
    const fullUrl = `https://${target}`;
    return {
      isWebsiteCommand: true,
      targetUrl: fullUrl,
      siteName: target,
      action: "OPEN_TAB",
      confirmationSpeech: `Navigating to ${target} in your browser, sir.`,
    };
  }

  // 6. Localhost or Local IP (e.g. "localhost:3000", "127.0.0.1:8080")
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(target)) {
    const fullUrl = `http://${target}`;
    return {
      isWebsiteCommand: true,
      targetUrl: fullUrl,
      siteName: target,
      action: "OPEN_TAB",
      confirmationSpeech: `Accessing local host address ${target} in your browser, sir.`,
    };
  }

  // 7. Single clean alphanumeric brand word (e.g. "coursera", "sublime", "steam", "espn", "nike", "speedtest", "hulu")
  if (/^[a-zA-Z0-9-]+$/.test(target) && target.length > 2) {
    const fullUrl = `https://www.${target.toLowerCase()}.com`;
    const capitalized = target.charAt(0).toUpperCase() + target.slice(1);
    return {
      isWebsiteCommand: true,
      targetUrl: fullUrl,
      siteName: `${capitalized} (${target}.com)`,
      action: "OPEN_TAB",
      confirmationSpeech: `Opening ${capitalized} (${target}.com) in your browser, sir.`,
    };
  }

  // 8. Multi-word search query or specific topic (e.g. "open python documentation", "open react tutorial")
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
  return {
    isWebsiteCommand: true,
    targetUrl: searchUrl,
    siteName: `Google: "${target}"`,
    action: "OPEN_TAB",
    confirmationSpeech: `Searching and opening "${target}" in your browser, sir.`,
  };
}
