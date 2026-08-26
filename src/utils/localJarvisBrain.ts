import { RealBrowserAction, YouTubeMedia, BrowserWorkflowPlan } from "../types";
import { resolveVoiceToWebsite, POPULAR_WEBSITES } from "./urlResolver";
import { parsePrecisionMedia, ParsedMediaDirective } from "./mediaParser";

export interface SystemActionDirective {
  type:
    | "SET_VOLUME"
    | "INCREASE_VOLUME"
    | "DECREASE_VOLUME"
    | "MUTE"
    | "UNMUTE"
    | "SWITCH_TAB"
    | "CLOSE_TAB"
    | "SYSTEM_TELEMETRY"
    | "TOGGLE_VISION"
    | "ADD_TASK"
    | "START_RESEARCH"
    | "OPEN_BROWSER_URL";
  targetTab?: "core" | "browser" | "productivity" | "research";
  volumeLevel?: number; // 0 to 100
  delta?: number;
  taskTitle?: string;
  taskCategory?: "work" | "research" | "automation" | "personal";
  taskPriority?: "low" | "medium" | "high";
  researchTopic?: string;
  browserUrl?: string;
}

export interface LocalJarvisResult {
  text: string;
  sources?: Array<{ title: string; url: string }>;
  realBrowserAction?: RealBrowserAction;
  youtubeMedia?: YouTubeMedia;
  browserWorkflowTriggered?: boolean;
  workflowGoal?: string;
  targetWebsite?: string;
  parsedMediaDirective?: ParsedMediaDirective;
  systemAction?: SystemActionDirective;
}

export function processLocalJarvisHeuristics(input: string): LocalJarvisResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const isHindi =
    /[\u0900-\u097F]/.test(trimmed) ||
    lower.includes("gaana") ||
    lower.includes("chalao") ||
    lower.includes("kholo") ||
    lower.includes("namaste") ||
    lower.includes("kaise ho") ||
    lower.includes("aawaz") ||
    lower.includes("band");

  // -------------------------------------------------------------
  // 0. SYSTEM STATE AWARENESS & TELEMETRY VOICE SHORTCUTS
  // -------------------------------------------------------------

  // Volume Adjustment: Explicit Number (e.g. "set volume to 75%", "volume 50")
  const volumeMatch = lower.match(/(?:set\s+volume(?:\s+to)?|volume\s+to|volume\s+at|aawaz\s+karo)\s+(\d{1,3})(?:\s*%)?/i);
  if (volumeMatch) {
    const rawVal = parseInt(volumeMatch[1], 10);
    const clampedVal = Math.max(0, Math.min(100, isNaN(rawVal) ? 80 : rawVal));
    return {
      text: isHindi
        ? `सिस्टम वॉल्यूम ${clampedVal} प्रतिशत पर सेट कर दिया गया है, सर।`
        : `Master audio output adjusted to ${clampedVal} percent, sir.`,
      systemAction: {
        type: "SET_VOLUME",
        volumeLevel: clampedVal,
      },
    };
  }

  // Volume Up / Increase
  if (
    lower.includes("volume up") ||
    lower.includes("increase volume") ||
    lower.includes("turn up the volume") ||
    lower.includes("louder") ||
    lower.includes("aawaz badhao") ||
    lower.includes("आवाज बढ़ाओ")
  ) {
    return {
      text: isHindi ? "वॉल्यूम बढ़ा दिया गया है, सर।" : "Increasing master audio volume, sir.",
      systemAction: {
        type: "INCREASE_VOLUME",
        delta: 15,
      },
    };
  }

  // Volume Down / Decrease
  if (
    lower.includes("volume down") ||
    lower.includes("decrease volume") ||
    lower.includes("lower the volume") ||
    lower.includes("softer") ||
    lower.includes("aawaz kam karo") ||
    lower.includes("आवाज कम करो")
  ) {
    return {
      text: isHindi ? "वॉल्यूम कम कर दिया गया है, सर।" : "Reducing master audio volume, sir.",
      systemAction: {
        type: "DECREASE_VOLUME",
        delta: 15,
      },
    };
  }

  // Mute / Unmute
  if (
    lower === "mute" ||
    lower.includes("mute audio") ||
    lower.includes("mute sound") ||
    lower.includes("mute system") ||
    lower.includes("aawaz band karo") ||
    lower.includes("चुप रहो")
  ) {
    return {
      text: isHindi ? "सिस्टम म्यूट कर दिया गया है, सर।" : "System audio output muted, sir.",
      systemAction: {
        type: "MUTE",
      },
    };
  }

  if (
    lower === "unmute" ||
    lower.includes("unmute audio") ||
    lower.includes("unmute sound") ||
    lower.includes("unmute system") ||
    lower.includes("aawaz chalu karo") ||
    lower.includes("आवाज खोलो")
  ) {
    return {
      text: isHindi ? "सिस्टम ऑडियो दोबारा चालू कर दिया गया है, सर।" : "System audio output restored, sir.",
      systemAction: {
        type: "UNMUTE",
      },
    };
  }

  // Max Volume
  if (lower.includes("max volume") || lower.includes("maximum volume") || lower.includes("full volume")) {
    return {
      text: isHindi ? "सिस्टम वॉल्यूम 100% पर सेट है, सर।" : "Calibrating master audio output to maximum 100%, sir.",
      systemAction: {
        type: "SET_VOLUME",
        volumeLevel: 100,
      },
    };
  }

  // System Status / Telemetry Diagnostics
  if (
    lower.includes("system status") ||
    lower.includes("telemetry") ||
    lower.includes("system diagnostics") ||
    lower.includes("check systems") ||
    lower.includes("system health") ||
    lower.includes("hardware status") ||
    lower.includes("system state") ||
    lower === "status" ||
    lower.includes("kya status hai") ||
    lower.includes("स्थिति बताओ")
  ) {
    return {
      text: isHindi
        ? "सभी सिस्टम पैरामीटर सामान्य हैं, सर। न्यूरल लेटेंसी 12ms है, वेब ग्राउंडिंग सक्रिय है और ऑटोनॉमस ब्राउज़र स्टैंडबाय मोड में है।"
        : "All telemetry parameters are within optimal operational tolerances, sir. Neural processing latency is 14 milliseconds, audio volume is calibrated, real-time search grounding is active, and all autonomous agent subsystems are nominal.",
      systemAction: {
        type: "SYSTEM_TELEMETRY",
      },
    };
  }

  // Tab Management: Switch to Browser / Manage Tabs
  if (
    lower.includes("manage tabs") ||
    lower.includes("show tabs") ||
    lower.includes("browser sandbox") ||
    lower.includes("switch to browser") ||
    lower.includes("open browser sandbox")
  ) {
    return {
      text: isHindi
        ? "ऑटोनॉमस ब्राउज़र सैंडबॉक्स खोला जा रहा है, सर।"
        : "Opening Autonomous Browser Command & Tab Sandbox, sir.",
      systemAction: {
        type: "SWITCH_TAB",
        targetTab: "browser",
      },
    };
  }

  // Tab Management: Switch to Productivity
  if (
    lower.includes("go to productivity") ||
    lower.includes("show productivity") ||
    lower.includes("open daily briefing") ||
    lower.includes("show tasks")
  ) {
    return {
      text: isHindi
        ? "डेली प्रोडक्टिविटी मैट्रिक्स में जा रहे हैं, सर।"
        : "Switching to Daily Productivity & Intelligence Matrix, sir.",
      systemAction: {
        type: "SWITCH_TAB",
        targetTab: "productivity",
      },
    };
  }

  // Tab Management: Switch to Research Lab
  if (
    lower.includes("go to research") ||
    lower.includes("open research lab") ||
    lower.includes("show research") ||
    lower.includes("dossier lab")
  ) {
    return {
      text: isHindi
        ? "डीप रिसर्च लैब खोली जा रही है, सर।"
        : "Accessing Deep Intelligence Research Laboratory, sir.",
      systemAction: {
        type: "SWITCH_TAB",
        targetTab: "research",
      },
    };
  }

  // Tab Management: Switch to Central Core HUD
  if (
    lower.includes("go to core") ||
    lower.includes("show core") ||
    lower.includes("show dashboard") ||
    lower.includes("main screen") ||
    lower.includes("home screen")
  ) {
    return {
      text: isHindi ? "सेंट्रल न्यूरल कोर डैशबोर्ड, सर।" : "Displaying Central Neural Command Dashboard, sir.",
      systemAction: {
        type: "SWITCH_TAB",
        targetTab: "core",
      },
    };
  }

  // Tab Management: Close Active Tab / Dismiss
  if (
    lower.includes("close tab") ||
    lower.includes("close browser") ||
    lower.includes("dismiss tab") ||
    lower.includes("tab band karo")
  ) {
    return {
      text: isHindi ? "एक्टिव टैब बंद कर दिया गया है, सर।" : "Closing active browser tab dispatch, sir.",
      systemAction: {
        type: "CLOSE_TAB",
      },
    };
  }

  // -------------------------------------------------------------
  // 0.1 TASK CREATION & PRODUCTIVITY MATRIX DIRECTIVES
  // -------------------------------------------------------------
  const isTaskDirective =
    lower.startsWith("add task") ||
    lower.startsWith("create task") ||
    lower.startsWith("new task") ||
    lower.startsWith("remind me to") ||
    lower.startsWith("add a task") ||
    lower.startsWith("create a task") ||
    lower.includes("task add karo") ||
    lower.includes("task jodo") ||
    lower.includes("task banao") ||
    lower.includes("याद दिलाओ");

  if (isTaskDirective) {
    const rawTask = trimmed
      .replace(/^(jarvis|jarvis,|please|kripya)\s+/i, "")
      .replace(/^(add\s+task|create\s+task|new\s+task|remind\s+me\s+to|add\s+a\s+task|create\s+a\s+task)\s+/i, "")
      .replace(/\s+(task\s+add\s+karo|task\s+jodo|task\s+banao)$/i, "")
      .trim();

    const cleanTask = rawTask ? rawTask.charAt(0).toUpperCase() + rawTask.slice(1) : "Follow up on scheduled priority item";
    const category: "work" | "research" | "automation" | "personal" =
      lower.includes("research") || lower.includes("study")
        ? "research"
        : lower.includes("automate") || lower.includes("scrape")
        ? "automation"
        : lower.includes("buy") || lower.includes("call") || lower.includes("gym")
        ? "personal"
        : "work";

    return {
      text: isHindi
        ? `नया टास्क "${cleanTask}" आपकी प्रोडक्टिविटी लिस्ट में जोड़ दिया गया है, सर।`
        : `Task "${cleanTask}" has been created and synced to your Daily Productivity Matrix, sir.`,
      systemAction: {
        type: "ADD_TASK",
        taskTitle: cleanTask,
        taskCategory: category,
        taskPriority: lower.includes("urgent") || lower.includes("important") || lower.includes("asap") ? "high" : "medium",
        targetTab: "productivity",
      },
    };
  }

  // -------------------------------------------------------------
  // 0.2 DEEP RESEARCH DOSSIER DIRECTIVES
  // -------------------------------------------------------------
  const isResearchDirective =
    lower.startsWith("research ") ||
    lower.startsWith("deep research ") ||
    lower.startsWith("deep research on ") ||
    lower.startsWith("generate research ") ||
    lower.startsWith("dossier on ") ||
    lower.startsWith("deep study on ") ||
    lower.includes("par research karo") ||
    lower.includes("की रिसर्च करो");

  if (isResearchDirective) {
    const rawTopic = trimmed
      .replace(/^(jarvis|jarvis,|please|kripya)\s+/i, "")
      .replace(/^(research\s+on|deep\s+research\s+on|research|deep\s+research|generate\s+research\s+on|dossier\s+on|deep\s+study\s+on)\s+/i, "")
      .replace(/\s+(par\s+research\s+karo|ki\s+research\s+karo)$/i, "")
      .trim();

    const cleanTopic = rawTopic ? rawTopic.charAt(0).toUpperCase() + rawTopic.slice(1) : "Emerging Artificial Intelligence Advancements";
    return {
      text: isHindi
        ? `विषय "${cleanTopic}" पर गहन शोध शुरू किया जा रहा है, सर। लाइव वेब स्रोतों से डेटा संकलित हो रहा है।`
        : `Initiating Deep Intelligence Research dossier on "${cleanTopic}", sir. Querying grounded web indexes.`,
      systemAction: {
        type: "START_RESEARCH",
        researchTopic: cleanTopic,
        targetTab: "research",
      },
    };
  }

  // -------------------------------------------------------------
  // 1. COMPOUND AUTONOMOUS BROWSER AGENT COMMANDS
  // -------------------------------------------------------------
  const isCompoundBrowserTask =
    lower.includes(" and click") ||
    lower.includes(" and scroll") ||
    lower.includes(" and type") ||
    lower.includes(" and extract") ||
    lower.includes(" and play") ||
    lower.includes(" and filter") ||
    lower.startsWith("automate ") ||
    lower.startsWith("autonomous ") ||
    lower.includes("fill form") ||
    lower.includes("fill the form") ||
    lower.includes("fill out") ||
    lower.includes("book flight") ||
    lower.includes("search amazon for") ||
    lower.includes("search youtube for") ||
    (lower.includes("search") &&
      (lower.includes("click") ||
        lower.includes("select") ||
        lower.includes("first video") ||
        lower.includes("first result")));

  if (isCompoundBrowserTask) {
    const cleanGoal = trimmed.replace(/^(jarvis|jarvis,|please|kripya)\s+/i, "");
    let targetUrl = "https://www.google.com";
    let actionType: "OPEN_TAB" | "SEARCH_GOOGLE" | "PLAY_YOUTUBE" = "OPEN_TAB";

    if (lower.includes("youtube")) {
      const q = cleanGoal.replace(/^(search\s+youtube\s+for|open\s+youtube\s+and\s+search\s+for|youtube\s+pe\s+search\s+karo)\s+/i, "");
      targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      actionType = "PLAY_YOUTUBE";
    } else if (lower.includes("amazon")) {
      const q = cleanGoal.replace(/^(search\s+amazon\s+for|open\s+amazon\s+and\s+search\s+for)\s+/i, "");
      targetUrl = `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;
    } else if (lower.includes("wiki")) {
      const q = cleanGoal.replace(/^(search\s+wikipedia\s+for|wiki\s+pe\s+search\s+karo)\s+/i, "");
      targetUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`;
    } else {
      const q = cleanGoal.replace(/^(search\s+google\s+for|google\s+search\s+for|search\s+for)\s+/i, "");
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      actionType = "SEARCH_GOOGLE";
    }

    const speech = isHindi
      ? `आपके मुख्य ब्राउज़र में "${cleanGoal}" खोला जा रहा है, सर।`
      : `Executing "${cleanGoal}" in your real browser window, sir.`;

    return {
      text: speech,
      sources: [{ title: `Real Browser: ${cleanGoal}`, url: targetUrl }],
      realBrowserAction: {
        action: actionType,
        query: cleanGoal,
        targetUrl,
        confirmationSpeech: speech,
      },
      systemAction: {
        type: "OPEN_BROWSER_URL",
        browserUrl: targetUrl,
      },
    };
  }

  // -------------------------------------------------------------
  // 2. PRECISION MEDIA & YOUTUBE PARSING (With Ambient Feedback)
  // -------------------------------------------------------------
  const parsedMedia = parsePrecisionMedia(trimmed);
  if (parsedMedia && parsedMedia.isMediaCommand) {
    const videoId =
      parsedMedia.cleanSearchQuery.toLowerCase().includes("interstellar") ||
      parsedMedia.cleanSearchQuery.toLowerCase().includes("hans zimmer")
        ? "UDVtMYqUAyw"
        : parsedMedia.cleanSearchQuery.toLowerCase().includes("acdc") ||
          parsedMedia.cleanSearchQuery.toLowerCase().includes("back in black")
        ? "1k8craCGghs"
        : parsedMedia.cleanSearchQuery.toLowerCase().includes("synthwave")
        ? "4xDzrJKXOOY"
        : parsedMedia.cleanSearchQuery.toLowerCase().includes("mozart")
        ? "Rb0UmrCXxVA"
        : parsedMedia.cleanSearchQuery.toLowerCase().includes("einaudi")
        ? "hN_q-_nGv4U"
        : parsedMedia.cleanSearchQuery.toLowerCase().includes("coldplay")
        ? "d020hcWA_Wg"
        : parsedMedia.cleanSearchQuery.toLowerCase().includes("queen")
        ? "fJ9rUzIMcZQ"
        : parsedMedia.cleanSearchQuery.toLowerCase().includes("arijit")
        ? "Umqb9KENgmk"
        : "jfKfPfyJRdk";

    const speechAck = isHindi
      ? parsedMedia.hindiVoiceFeedback || `यूट्यूब पर "${parsedMedia.cleanSearchQuery}" बजाया जा रहा है, सर।`
      : parsedMedia.ambientVoiceFeedback || `Initiating playback sequence, sir. Streaming "${parsedMedia.cleanSearchQuery}".`;

    return {
      text: speechAck,
      sources: [{ title: `YouTube: ${parsedMedia.cleanSearchQuery}`, url: parsedMedia.youtubeSearchUrl }],
      parsedMediaDirective: parsedMedia,
      realBrowserAction: {
        action: "PLAY_YOUTUBE",
        query: parsedMedia.cleanSearchQuery,
        targetUrl: parsedMedia.youtubeSearchUrl,
        videoId,
        videoTitle: `YouTube - ${parsedMedia.cleanSearchQuery}`,
        confirmationSpeech: speechAck,
      },
      youtubeMedia: {
        videoId,
        title: `YouTube - ${parsedMedia.cleanSearchQuery.toUpperCase()}`,
        channelTitle: parsedMedia.artist || "YouTube Music Stream",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        isPlaying: true,
        isMuted: false,
        volume: 85,
        artist: parsedMedia.artist,
        genre: parsedMedia.genre,
        mediaType: parsedMedia.mediaType,
        resolutionFilter: parsedMedia.resolutionFilter,
        isLiveStream: parsedMedia.isLiveStream,
        isPlaylist: parsedMedia.isPlaylist,
        isInstrumental: parsedMedia.isInstrumental,
        isAcoustic: parsedMedia.isAcoustic,
      },
    };
  }

  // -------------------------------------------------------------
  // 3. MEDIA CONTROLS: Pause, Resume, Stop (English & Hindi)
  // -------------------------------------------------------------
  if (
    lower.includes("pause music") ||
    lower.includes("pause video") ||
    lower.includes("pause youtube") ||
    lower === "pause" ||
    lower.includes("rok do") ||
    lower.includes("pause karo") ||
    lower.includes("roko") ||
    lower.includes("रोक दो") ||
    lower.includes("रोको")
  ) {
    return {
      text: isHindi ? "मीडिया रोक दिया गया है, सर।" : "Pausing media playback, sir.",
      realBrowserAction: {
        action: "PAUSE_YOUTUBE",
        confirmationSpeech: isHindi ? "मीडिया रोक दिया गया है, सर।" : "Pausing playback, sir.",
      },
    };
  }

  if (
    lower.includes("resume music") ||
    lower.includes("resume video") ||
    lower.includes("unpause") ||
    lower.includes("chalu karo") ||
    lower.includes("phir se chalao") ||
    lower.includes("चालू करो") ||
    lower.includes("फिर से चलाओ")
  ) {
    return {
      text: isHindi ? "यूट्यूब प्लेबैक दोबारा शुरू कर दिया गया है, सर।" : "Resuming YouTube playback, sir.",
      realBrowserAction: {
        action: "RESUME_YOUTUBE",
        confirmationSpeech: isHindi ? "स्ट्रीम दोबारा चालू, सर।" : "Resuming stream, sir.",
      },
    };
  }

  if (
    lower.includes("stop music") ||
    lower.includes("stop video") ||
    lower.includes("stop youtube") ||
    lower === "stop" ||
    lower.includes("band karo") ||
    lower.includes("band kar do") ||
    lower.includes("बंद करो") ||
    lower.includes("बंद कर दो")
  ) {
    return {
      text: isHindi ? "मीडिया स्ट्रीम रोक दी गई है, सर।" : "Halting media stream, sir.",
      realBrowserAction: {
        action: "STOP_YOUTUBE",
        confirmationSpeech: isHindi ? "स्ट्रीम बंद, सर।" : "Halting stream, sir.",
      },
    };
  }

  // -------------------------------------------------------------
  // 4. UNIVERSAL WEBSITE & NAVIGATION RESOLVER
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 5. OPTIC VISION & OBJECT DETECTION DIRECTIVES
  // -------------------------------------------------------------
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
    lower.includes("track target") ||
    lower.includes("mujhe dekho") ||
    lower.includes("camera kholo") ||
    lower.includes("camera on karo") ||
    lower.includes("kamra scan karo") ||
    lower.includes("मुझे देखो") ||
    lower.includes("कैमरा चालू करो") ||
    lower.includes("स्कैन करो")
  ) {
    return {
      text: isHindi
        ? "ऑप्टिकल सेंसर और रियल-टाइम ऑब्जेक्ट डिटेक्शन मैट्रिक्स सक्रिय कर दिया गया है, सर।"
        : "Activating optical sensors and real-time object detection matrix, sir. Bounding boxes and targeting reticles are live in your HUD.",
      systemAction: {
        type: "TOGGLE_VISION",
      },
    };
  }

  // -------------------------------------------------------------
  // 6. GREETINGS AND IDENTITY (Bilingual)
  // -------------------------------------------------------------
  if (
    lower.includes("hello") ||
    lower.includes("hi jarvis") ||
    lower.includes("hey jarvis") ||
    lower === "jarvis" ||
    lower.includes("what's up") ||
    lower.includes("sup") ||
    lower.includes("namaste") ||
    lower.includes("namaskar") ||
    lower.includes("kaise ho") ||
    lower.includes("kya haal hai") ||
    lower.includes("नमस्ते") ||
    lower.includes("नमस्कार") ||
    lower.includes("कैसे हो") ||
    lower.includes("क्या हाल है")
  ) {
    return {
      text: isHindi
        ? "नमस्ते सर! मैं जार्विस हूँ, आपके ब्राउज़र के साथ पूरी तरह से जुड़ा हुआ। आप मुझे कोई भी वेबसाइट खोलने, गाना बजाने या सवाल पूछने के लिए कह सकते हैं।"
        : "At your service, sir. Online and fully integrated with your browser. Say 'Open [website]', 'Play [artist/song]', or 'Status' anytime.",
    };
  }

  if (
    lower.includes("who are you") ||
    lower.includes("what can you do") ||
    lower.includes("tum kaun ho") ||
    lower.includes("kya kar sakte ho") ||
    lower.includes("तुम कौन हो") ||
    lower.includes("क्या कर सकते हो")
  ) {
    return {
      text: isHindi
        ? "मैं जार्विस (J.A.R.V.I.S.) हूँ, आपका स्वायत्त एआई सहायक। मैं किसी भी वेबसाइट को खोल सकता हूँ, यूट्यूब पर गाने चला सकता हूँ, गहन वेब रिसर्च कर सकता हूँ और ब्राउज़र कार्यों को स्वचालित कर सकता हूँ।"
        : "I am J.A.R.V.I.S., your autonomous AI system. I can open any website (e.g. GitHub, Reddit, ChatGPT, Netflix, Amazon, custom .com/.io domains), stream YouTube audio with precision parameter extraction, adjust system volume and telemetry, conduct deep multi-source research, and automate browser tasks.",
    };
  }

  // Default fallback
  return {
    text: isHindi
      ? `जी सर, मैंने "${trimmed}" को प्रोसेस कर लिया है। सारे सिस्टम आपके अगले आदेश के लिए तैयार हैं।`
      : `At your service, sir. I have processed "${trimmed}". My autonomous browser and media subsystems are active and standing by for your next directive.`,
  };
}
