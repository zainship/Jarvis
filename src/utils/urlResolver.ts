// Universal High-Precision Website & URL Resolver for JARVIS
// Supports 150+ known top services, direct domain speech (dot com, dot io, etc.),
// IP addresses, protocols, and universal fallback to Google Search or Direct Domain resolution.

export interface ResolvedWebsite {
  isWebsiteCommand: boolean;
  targetUrl: string;
  siteName: string;
  action: "OPEN_TAB" | "SEARCH_GOOGLE" | "PLAY_YOUTUBE";
  confirmationSpeech: string;
  videoId?: string;
}

// Map of common names and phonetics to exact URLs
export const POPULAR_WEBSITES: Record<string, { url: string; name: string }> = {
  // Search & AI Engines
  google: { url: "https://www.google.com", name: "Google" },
  "google search": { url: "https://www.google.com", name: "Google" },
  bing: { url: "https://www.bing.com", name: "Bing" },
  duckduckgo: { url: "https://duckduckgo.com", name: "DuckDuckGo" },
  yahoo: { url: "https://www.yahoo.com", name: "Yahoo" },
  chatgpt: { url: "https://chatgpt.com", name: "ChatGPT" },
  openai: { url: "https://chatgpt.com", name: "OpenAI ChatGPT" },
  claude: { url: "https://claude.ai", name: "Claude AI" },
  anthropic: { url: "https://claude.ai", name: "Claude AI" },
  perplexity: { url: "https://www.perplexity.ai", name: "Perplexity AI" },
  gemini: { url: "https://gemini.google.com", name: "Google Gemini" },
  deepseek: { url: "https://chat.deepseek.com", name: "DeepSeek" },
  grok: { url: "https://x.com/i/grok", name: "Grok AI" },
  huggingface: { url: "https://huggingface.co", name: "Hugging Face" },
  "hugging face": { url: "https://huggingface.co", name: "Hugging Face" },
  midjourney: { url: "https://www.midjourney.com", name: "Midjourney" },
  poe: { url: "https://poe.com", name: "Poe AI" },
  "character ai": { url: "https://character.ai", name: "Character.AI" },
  mistral: { url: "https://chat.mistral.ai", name: "Mistral AI" },

  // Video, Social & Streaming
  youtube: { url: "https://www.youtube.com", name: "YouTube" },
  "you tube": { url: "https://www.youtube.com", name: "YouTube" },
  twitter: { url: "https://www.x.com", name: "X / Twitter" },
  x: { url: "https://www.x.com", name: "X" },
  "x.com": { url: "https://www.x.com", name: "X" },
  instagram: { url: "https://www.instagram.com", name: "Instagram" },
  insta: { url: "https://www.instagram.com", name: "Instagram" },
  facebook: { url: "https://www.facebook.com", name: "Facebook" },
  fb: { url: "https://www.facebook.com", name: "Facebook" },
  reddit: { url: "https://www.reddit.com", name: "Reddit" },
  linkedin: { url: "https://www.linkedin.com", name: "LinkedIn" },
  tiktok: { url: "https://www.tiktok.com", name: "TikTok" },
  discord: { url: "https://discord.com/app", name: "Discord" },
  telegram: { url: "https://web.telegram.org", name: "Telegram Web" },
  whatsapp: { url: "https://web.whatsapp.com", name: "WhatsApp Web" },
  "whatsapp web": { url: "https://web.whatsapp.com", name: "WhatsApp Web" },
  pinterest: { url: "https://www.pinterest.com", name: "Pinterest" },
  twitch: { url: "https://www.twitch.tv", name: "Twitch" },
  netflix: { url: "https://www.netflix.com", name: "Netflix" },
  spotify: { url: "https://open.spotify.com", name: "Spotify" },
  "disney plus": { url: "https://www.disneyplus.com", name: "Disney+" },
  "prime video": { url: "https://www.primevideo.com", name: "Amazon Prime Video" },
  hulu: { url: "https://www.hulu.com", name: "Hulu" },
  "apple music": { url: "https://music.apple.com", name: "Apple Music" },
  soundcloud: { url: "https://soundcloud.com", name: "SoundCloud" },
  crunchyroll: { url: "https://www.crunchyroll.com", name: "Crunchyroll" },
  threads: { url: "https://www.threads.net", name: "Threads" },
  quora: { url: "https://www.quora.com", name: "Quora" },
  medium: { url: "https://medium.com", name: "Medium" },
  bluesky: { url: "https://bsky.app", name: "Bluesky" },
  snapchat: { url: "https://web.snapchat.com", name: "Snapchat Web" },

  // Coding & Developer Ecosystem
  github: { url: "https://www.github.com", name: "GitHub" },
  "git hub": { url: "https://www.github.com", name: "GitHub" },
  gitlab: { url: "https://gitlab.com", name: "GitLab" },
  bitbucket: { url: "https://bitbucket.org", name: "Bitbucket" },
  "stack overflow": { url: "https://stackoverflow.com", name: "Stack Overflow" },
  stackoverflow: { url: "https://stackoverflow.com", name: "Stack Overflow" },
  leetcode: { url: "https://leetcode.com", name: "LeetCode" },
  "leet code": { url: "https://leetcode.com", name: "LeetCode" },
  codeforces: { url: "https://codeforces.com", name: "Codeforces" },
  hackerrank: { url: "https://www.hackerrank.com", name: "HackerRank" },
  codepen: { url: "https://codepen.io", name: "CodePen" },
  replit: { url: "https://replit.com", name: "Replit" },
  vercel: { url: "https://vercel.com", name: "Vercel" },
  netlify: { url: "https://www.netlify.com", name: "Netlify" },
  supabase: { url: "https://supabase.com", name: "Supabase" },
  firebase: { url: "https://console.firebase.google.com", name: "Firebase Console" },
  cloudflare: { url: "https://dash.cloudflare.com", name: "Cloudflare" },
  aws: { url: "https://console.aws.amazon.com", name: "AWS Console" },
  "aws console": { url: "https://console.aws.amazon.com", name: "AWS Console" },
  gcp: { url: "https://console.cloud.google.com", name: "Google Cloud Platform" },
  "google cloud": { url: "https://console.cloud.google.com", name: "Google Cloud Platform" },
  azure: { url: "https://portal.azure.com", name: "Microsoft Azure" },
  npm: { url: "https://www.npmjs.com", name: "NPM Registry" },
  pypi: { url: "https://pypi.org", name: "PyPI" },
  docker: { url: "https://hub.docker.com", name: "Docker Hub" },
  "docker hub": { url: "https://hub.docker.com", name: "Docker Hub" },
  mdn: { url: "https://developer.mozilla.org", name: "MDN Web Docs" },
  "mdn web docs": { url: "https://developer.mozilla.org", name: "MDN Web Docs" },
  w3schools: { url: "https://www.w3schools.com", name: "W3Schools" },
  devto: { url: "https://dev.to", name: "DEV Community" },
  "dev community": { url: "https://dev.to", name: "DEV Community" },
  "hacker news": { url: "https://news.ycombinator.com", name: "Hacker News" },
  hackernews: { url: "https://news.ycombinator.com", name: "Hacker News" },
  ycombinator: { url: "https://news.ycombinator.com", name: "Hacker News" },
  kaggle: { url: "https://www.kaggle.com", name: "Kaggle" },
  arxiv: { url: "https://arxiv.org", name: "arXiv AI Archive" },

  // Productivity, Workspace & Cloud
  gmail: { url: "https://mail.google.com", name: "Gmail" },
  "google mail": { url: "https://mail.google.com", name: "Gmail" },
  mail: { url: "https://mail.google.com", name: "Gmail" },
  "google drive": { url: "https://drive.google.com", name: "Google Drive" },
  drive: { url: "https://drive.google.com", name: "Google Drive" },
  "google docs": { url: "https://docs.google.com", name: "Google Docs" },
  docs: { url: "https://docs.google.com", name: "Google Docs" },
  "google sheets": { url: "https://sheets.google.com", name: "Google Sheets" },
  sheets: { url: "https://sheets.google.com", name: "Google Sheets" },
  "google slides": { url: "https://slides.google.com", name: "Google Slides" },
  slides: { url: "https://slides.google.com", name: "Google Slides" },
  "google calendar": { url: "https://calendar.google.com", name: "Google Calendar" },
  calendar: { url: "https://calendar.google.com", name: "Google Calendar" },
  "google maps": { url: "https://maps.google.com", name: "Google Maps" },
  maps: { url: "https://maps.google.com", name: "Google Maps" },
  "google meet": { url: "https://meet.google.com", name: "Google Meet" },
  meet: { url: "https://meet.google.com", name: "Google Meet" },
  "google keep": { url: "https://keep.google.com", name: "Google Keep" },
  notion: { url: "https://www.notion.so", name: "Notion" },
  figma: { url: "https://www.figma.com", name: "Figma" },
  canva: { url: "https://www.canva.com", name: "Canva" },
  trello: { url: "https://trello.com", name: "Trello" },
  asana: { url: "https://app.asana.com", name: "Asana" },
  jira: { url: "https://www.atlassian.com/software/jira", name: "Jira" },
  linear: { url: "https://linear.app", name: "Linear" },
  miro: { url: "https://miro.com", name: "Miro" },
  slack: { url: "https://app.slack.com", name: "Slack" },
  zoom: { url: "https://zoom.us", name: "Zoom" },
  outlook: { url: "https://outlook.live.com", name: "Microsoft Outlook" },
  office: { url: "https://www.office.com", name: "Microsoft Office 365" },
  dropbox: { url: "https://www.dropbox.com", name: "Dropbox" },
  overleaf: { url: "https://www.overleaf.com", name: "Overleaf LaTeX" },

  // E-Commerce & Retail
  amazon: { url: "https://www.amazon.com", name: "Amazon" },
  ebay: { url: "https://www.ebay.com", name: "eBay" },
  aliexpress: { url: "https://www.aliexpress.com", name: "AliExpress" },
  walmart: { url: "https://www.walmart.com", name: "Walmart" },
  target: { url: "https://www.target.com", name: "Target" },
  "best buy": { url: "https://www.bestbuy.com", name: "Best Buy" },
  bestbuy: { url: "https://www.bestbuy.com", name: "Best Buy" },
  etsy: { url: "https://www.etsy.com", name: "Etsy" },
  apple: { url: "https://www.apple.com", name: "Apple" },
  "apple store": { url: "https://www.apple.com", name: "Apple" },
  nike: { url: "https://www.nike.com", name: "Nike" },
  adidas: { url: "https://www.adidas.com", name: "Adidas" },
  flipkart: { url: "https://www.flipkart.com", name: "Flipkart" },
  shopify: { url: "https://www.shopify.com", name: "Shopify" },

  // News, Knowledge & Media
  wikipedia: { url: "https://www.wikipedia.org", name: "Wikipedia" },
  wiki: { url: "https://www.wikipedia.org", name: "Wikipedia" },
  cnn: { url: "https://www.cnn.com", name: "CNN" },
  bbc: { url: "https://www.bbc.com", name: "BBC News" },
  nytimes: { url: "https://www.nytimes.com", name: "The New York Times" },
  "new york times": { url: "https://www.nytimes.com", name: "The New York Times" },
  reuters: { url: "https://www.reuters.com", name: "Reuters" },
  bloomberg: { url: "https://www.bloomberg.com", name: "Bloomberg" },
  theverge: { url: "https://www.theverge.com", name: "The Verge" },
  "the verge": { url: "https://www.theverge.com", name: "The Verge" },
  techcrunch: { url: "https://techcrunch.com", name: "TechCrunch" },
  wired: { url: "https://www.wired.com", name: "Wired" },
  forbes: { url: "https://www.forbes.com", name: "Forbes" },
  wsj: { url: "https://www.wsj.com", name: "Wall Street Journal" },
  "wall street journal": { url: "https://www.wsj.com", name: "Wall Street Journal" },
  guardian: { url: "https://www.theguardian.com", name: "The Guardian" },
  "the guardian": { url: "https://www.theguardian.com", name: "The Guardian" },
  espn: { url: "https://www.espn.com", name: "ESPN" },

  // Education & Learning
  coursera: { url: "https://www.coursera.org", name: "Coursera" },
  udemy: { url: "https://www.udemy.com", name: "Udemy" },
  edx: { url: "https://www.edx.org", name: "edX" },
  "khan academy": { url: "https://www.khanacademy.org", name: "Khan Academy" },
  duolingo: { url: "https://www.duolingo.com", name: "Duolingo" },
  "wolfram alpha": { url: "https://www.wolframalpha.com", name: "Wolfram Alpha" },
  wolframalpha: { url: "https://www.wolframalpha.com", name: "Wolfram Alpha" },
  quizlet: { url: "https://quizlet.com", name: "Quizlet" },

  // Finance & Crypto
  binance: { url: "https://www.binance.com", name: "Binance" },
  coinbase: { url: "https://www.coinbase.com", name: "Coinbase" },
  tradingview: { url: "https://www.tradingview.com", name: "TradingView" },
  "yahoo finance": { url: "https://finance.yahoo.com", name: "Yahoo Finance" },
  coinmarketcap: { url: "https://coinmarketcap.com", name: "CoinMarketCap" },
  coingecko: { url: "https://www.coingecko.com", name: "CoinGecko" },
  robinhood: { url: "https://robinhood.com", name: "Robinhood" },
  paypal: { url: "https://www.paypal.com", name: "PayPal" },
  stripe: { url: "https://dashboard.stripe.com", name: "Stripe" },

  // Gaming, Travel & Utilities
  steam: { url: "https://store.steampowered.com", name: "Steam" },
  "epic games": { url: "https://store.epicgames.com", name: "Epic Games Store" },
  roblox: { url: "https://www.roblox.com", name: "Roblox" },
  "chess.com": { url: "https://www.chess.com", name: "Chess.com" },
  chess: { url: "https://www.chess.com", name: "Chess.com" },
  lichess: { url: "https://lichess.org", name: "Lichess" },
  airbnb: { url: "https://www.airbnb.com", name: "Airbnb" },
  booking: { url: "https://www.booking.com", name: "Booking.com" },
  "google flights": { url: "https://www.google.com/travel/flights", name: "Google Flights" },
  expedia: { url: "https://www.expedia.com", name: "Expedia" },
  speedtest: { url: "https://www.speedtest.net", name: "Speedtest by Ookla" },
  weather: { url: "https://weather.com", name: "The Weather Channel" },
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
 * Universal Intelligent Website & Voice Command Resolver
 */
export function resolveVoiceToWebsite(rawInput: string): ResolvedWebsite | null {
  if (!rawInput || typeof rawInput !== "string") return null;

  const normalized = normalizeSpeechToUrl(rawInput);

  // Strip conversational prefixes and polite fillers
  let target = normalized
    .replace(/^(hey\s+jarvis|ok\s+jarvis|yo\s+jarvis|alright\s+jarvis|bro\s+jarvis|bro|jarvis)\s*,?\s*/i, "")
    .replace(/^(please|can\s+you|could\s+you|would\s+you|kindly)\s+/i, "")
    .trim();

  // Check for search intent first: "search google for X", "search for X", "google X"
  if (
    target.startsWith("search google for ") ||
    target.startsWith("search for ") ||
    target.startsWith("google ") ||
    target.startsWith("search ")
  ) {
    const searchTopic = target
      .replace(/^(search\s+google\s+for|search\s+for|google|search)\s+/i, "")
      .replace(/\s+on\s+google$/i, "")
      .trim();

    if (searchTopic) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTopic)}`;
      return {
        isWebsiteCommand: true,
        targetUrl: searchUrl,
        siteName: `Google Search: "${searchTopic}"`,
        action: "SEARCH_GOOGLE",
        confirmationSpeech: `Searching Google for "${searchTopic}" in your browser, sir.`,
      };
    }
  }

  // Check for navigation / open triggers
  const isNavTrigger =
    /^(open\s+up|open|launch|go\s+to|navigate\s+to|visit|take\s+me\s+to|show\s+me|bring\s+up|browse\s+to|browse|head\s+to|load|start|access|pull\s+up|switch\s+to)\b/i.test(
      target
    );

  if (isNavTrigger) {
    target = target
      .replace(
        /^(open\s+up|open|launch|go\s+to|navigate\s+to|visit|take\s+me\s+to|show\s+me|bring\s+up|browse\s+to|browse|head\s+to|load|start|access|pull\s+up|switch\s+to)\s+/i,
        ""
      )
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
