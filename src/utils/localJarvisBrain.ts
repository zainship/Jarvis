import { RealBrowserAction, YouTubeMedia } from "../types";
import { resolveVoiceToWebsite, POPULAR_WEBSITES } from "./urlResolver";

export interface LocalJarvisResult {
  text: string;
  sources?: Array<{ title: string; url: string }>;
  realBrowserAction?: RealBrowserAction;
  youtubeMedia?: YouTubeMedia;
}

export function processLocalJarvisHeuristics(input: string): LocalJarvisResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. YouTube playback directives
  if (
    lower.startsWith("play ") ||
    lower.includes("play music") ||
    lower.includes("play song") ||
    lower.includes("play on youtube") ||
    lower.includes("play video")
  ) {
    let query = lower
      .replace(/^(jarvis|jarvis,|please)\s+/i, "")
      .replace(/^play\s+(on\s+youtube\s+)?(video\s+)?(song\s+)?(music\s+)?(the\s+)?/i, "")
      .replace(/\s+on\s+youtube$/i, "")
      .trim();

    if (!query || query === "music" || query === "something" || query === "song") {
      query = "lofi hip hop";
    }

    const videoId = query.includes("lofi") ? "jfKfPfyJRdk" : "4xDzrJKXOOY";
    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    return {
      text: `Playing "${query}" on YouTube media player, sir. I have dispatched the YouTube stream to your browser.`,
      sources: [{ title: `YouTube Search: ${query}`, url: ytUrl }],
      realBrowserAction: {
        action: "PLAY_YOUTUBE",
        query,
        targetUrl: ytUrl,
        videoId,
        videoTitle: `YouTube - ${query}`,
        confirmationSpeech: `Now streaming ${query}, sir.`,
      },
      youtubeMedia: {
        videoId,
        title: `YouTube - ${query.toUpperCase()}`,
        channelTitle: "YouTube Music Stream",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        isPlaying: true,
        isMuted: false,
        volume: 80,
      },
    };
  }

  // 2. Media Controls: Pause, Resume, Stop
  if (lower.includes("pause music") || lower.includes("pause video") || lower.includes("pause youtube") || lower === "pause") {
    return {
      text: "Pausing media playback, sir.",
      realBrowserAction: {
        action: "PAUSE_YOUTUBE",
        confirmationSpeech: "Pausing playback, sir.",
      },
    };
  }

  if (lower.includes("resume music") || lower.includes("resume video") || lower.includes("unpause")) {
    return {
      text: "Resuming YouTube playback, sir.",
      realBrowserAction: {
        action: "RESUME_YOUTUBE",
        confirmationSpeech: "Resuming stream, sir.",
      },
    };
  }

  if (lower.includes("stop music") || lower.includes("stop video") || lower.includes("stop youtube") || lower === "stop") {
    return {
      text: "Halting media stream, sir.",
      realBrowserAction: {
        action: "STOP_YOUTUBE",
        confirmationSpeech: "Halting stream, sir.",
      },
    };
  }

  // 3. Universal Website & Navigation Resolver (Handles all 150+ sites, custom domains, dot com, dot io, urls, Google search)
  const resolvedWeb = resolveVoiceToWebsite(trimmed);
  if (resolvedWeb) {
    return {
      text: `Dispatching browser directive: ${resolvedWeb.confirmationSpeech}`,
      sources: [{ title: resolvedWeb.siteName, url: resolvedWeb.targetUrl }],
      realBrowserAction: {
        action: resolvedWeb.action,
        targetUrl: resolvedWeb.targetUrl,
        query: resolvedWeb.siteName,
        confirmationSpeech: resolvedWeb.confirmationSpeech,
      },
    };
  }

  // 4. Optic Vision & Realtime Object Detection Directives
  if (
    lower.includes("look at me") ||
    lower.includes("see me") ||
    lower.includes("can you see me") ||
    lower.includes("scan me") ||
    lower.includes("what do you see") ||
    lower.includes("open camera") ||
    lower.includes("turn on camera") ||
    lower.includes("check posture") ||
    lower.includes("check my posture") ||
    lower.includes("scan room") ||
    lower.includes("optic vision") ||
    lower.includes("detect objects") ||
    lower.includes("object detection") ||
    lower.includes("detect object") ||
    lower.includes("track objects") ||
    lower.includes("realtime detection") ||
    lower.includes("optical detection") ||
    lower.includes("track target")
  ) {
    return {
      text: "Activating optical sensors and real-time object detection matrix, sir. Bounding boxes and targeting reticles are live in your HUD.",
    };
  }

  // 5. Greetings and Identity
  if (
    lower.includes("hello") ||
    lower.includes("hi jarvis") ||
    lower.includes("hey jarvis") ||
    lower === "jarvis" ||
    lower.includes("what's up") ||
    lower.includes("sup")
  ) {
    return {
      text: "At your service, sir. Online and fully integrated with your browser. Say 'Open [website]' or 'Search [topic]' anytime.",
    };
  }

  if (lower.includes("who are you") || lower.includes("what can you do") || lower.includes("status")) {
    return {
      text: "I am J.A.R.V.I.S., your autonomous AI system. I can open any website (e.g. GitHub, Reddit, ChatGPT, Netflix, Amazon, custom .com/.io domains), stream YouTube audio, conduct deep multi-source research, and automate browser tasks.",
    };
  }

  // Default fallback
  return {
    text: `At your service, sir. I have processed "${trimmed}". My autonomous browser and media subsystems are active and standing by for your next directive.`,
  };
}
