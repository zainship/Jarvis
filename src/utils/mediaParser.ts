// Universal Precision Media & Audio Parameter Parsing Engine for J.A.R.V.I.S.
// Deconstructs natural language media directives into structured parameters:
// Artist, Track Title, Genre, Media Type (live_stream, playlist, acoustic, instrumental, podcast, 4k),
// resolution filters, and synthesized ambient speech acknowledgments.

export type MediaTypeCategory =
  | "track"
  | "live_stream"
  | "playlist"
  | "acoustic"
  | "instrumental"
  | "official_video"
  | "podcast"
  | "remix"
  | "lofi_radio"
  | "orchestral"
  | "ambient";

export interface ParsedMediaDirective {
  isMediaCommand: boolean;
  rawInput: string;
  artist?: string;
  trackTitle?: string;
  genre?: string;
  mediaType: MediaTypeCategory;
  resolutionFilter?: "4K" | "1080p" | "Standard";
  isLiveStream: boolean;
  isPlaylist: boolean;
  isInstrumental: boolean;
  isAcoustic: boolean;
  cleanSearchQuery: string;
  youtubeSearchUrl: string;
  autonomousBrowserGoal: string;
  ambientVoiceFeedback: string;
  hindiVoiceFeedback?: string;
  suggestedPresetId?: string;
}

// Known artists and composers catalogue for high-accuracy entity extraction
const KNOWN_ARTISTS = [
  "Hans Zimmer",
  "Ramin Djawadi",
  "Ludovico Einaudi",
  "Max Richter",
  "John Williams",
  "Daft Punk",
  "Queen",
  "AC/DC",
  "Coldplay",
  "Pink Floyd",
  "Led Zeppelin",
  "The Weeknd",
  "Taylor Swift",
  "Ed Sheeran",
  "Billie Eilish",
  "Eminem",
  "Linkin Park",
  "Imagine Dragons",
  "Arijit Singh",
  "A. R. Rahman",
  "Kishore Kumar",
  "Lata Mangeshkar",
  "Atif Aslam",
  "Shreya Ghoshal",
  "Sonu Nigam",
  "AP Dhillon",
  "Diljit Dosanjh",
  "Coke Studio",
  "Lofi Girl",
  "ChilledCow",
  "Lex Fridman",
  "Joe Rogan",
  "Andrew Huberman",
];

// Genres mapping
const KNOWN_GENRES = [
  "synthwave",
  "lofi",
  "lo-fi",
  "hip hop",
  "classical",
  "jazz",
  "cyberpunk",
  "ambient",
  "rock",
  "metal",
  "electronic",
  "edm",
  "pop",
  "deep focus",
  "binaural",
  "soundtrack",
  "orchestral",
  "acoustic",
  "blues",
  "soul",
  "bollywood",
  "sufi",
  "ghazal",
  "indie",
];

/**
 * Extracts precision media parameters from user voice or text input
 */
export function parsePrecisionMedia(input: string): ParsedMediaDirective | null {
  if (!input || typeof input !== "string") return null;

  const raw = input.trim();
  const lower = raw.toLowerCase();

  // Strip leading wake words and filler greetings first so detection works consistently
  const strippedWake = lower
    .replace(/^(hey\s+jarvis|ok\s+jarvis|yo\s+jarvis|alright\s+jarvis|jarvis)\s*,?\s*/i, "")
    .replace(/^(please|can\s+you|could\s+you|would\s+you|kindly|kripya|bhai|yaar)\s+/i, "")
    .trim();

  const isHindi =
    /[\u0900-\u097F]/.test(raw) ||
    lower.includes("gaana") ||
    lower.includes("gana") ||
    lower.includes("chalao") ||
    lower.includes("bajao") ||
    lower.includes("lagao");

  // Determine if it is a media command on either full or stripped string
  const isMediaTrigger =
    strippedWake.startsWith("play ") ||
    strippedWake.startsWith("play") ||
    strippedWake.startsWith("stream ") ||
    strippedWake.startsWith("listen to ") ||
    strippedWake.startsWith("put on ") ||
    strippedWake.startsWith("cue up ") ||
    strippedWake.startsWith("start playing ") ||
    lower.includes("play on youtube") ||
    lower.includes("play song") ||
    lower.includes("play the song") ||
    lower.includes("play track") ||
    lower.includes("play music") ||
    lower.includes("play video") ||
    lower.includes("gaana chalao") ||
    lower.includes("gana chalao") ||
    lower.includes("gaana lagao") ||
    lower.includes("gana bajao") ||
    lower.includes("music chalao") ||
    lower.includes("kuch bajao") ||
    lower.includes("गाना चलाओ") ||
    lower.includes("गाना बजाओ") ||
    lower.includes("सॉन्ग चलाओ") ||
    /\bplay\s+[a-zA-Z0-9]/i.test(strippedWake);

  if (!isMediaTrigger) {
    return null;
  }

  // Strip commanding fillers and wrappers
  let target = strippedWake
    .replace(/^(play\s+me|play\s+for\s+me|play\s+some|play\s+a\s+specific\s+song|play\s+that\s+specific\s+song|play\s+specific\s+song|play\s+a\s+song\s+for\s+me|play\s+a\s+song|play|stream|listen\s+to|put\s+on|cue\s+up|start\s+playing)\s+/i, "")
    .replace(/^(the\s+)?(video\s+of|song\s+of|track\s+of|music\s+of)\s+/i, "")
    .replace(/^(the\s+)?(song|track|video|music)\s+/i, "")
    .replace(/^(gaana|gana|music|song)\s+(chalao|lagao|bajao|play karo)\s*/i, "")
    .replace(/\s+(in\s+one\s+tab|in\s+a\s+tab|in\s+1\s+tab|in\s+the\s+same\s+tab|in\s+that\s+tab|in\s+single\s+tab)$/i, "")
    .replace(/\s+(for\s+me|for\s+us|for\s+sir|mere\s+liye)$/i, "")
    .replace(/\s+(gaana|gana|music|song)\s+(chalao|lagao|bajao)$/i, "")
    .replace(/\s+(chalao|lagao|bajao|play karo)$/i, "")
    .replace(/\s+(song|track|music|video)$/i, "")
    .replace(/\s+in\s+my\s+browser$/i, "")
    .replace(/\s+in\s+(one|a|1|the\s+same)\s+tab$/i, "")
    .replace(/\s+on\s+youtube$/i, "")
    .replace(/\s+from\s+youtube$/i, "")
    .trim();

  // Additional secondary pass for trailing tab or 'for me' modifiers
  target = target
    .replace(/\s+(in\s+one\s+tab|in\s+a\s+tab|in\s+1\s+tab|in\s+the\s+same\s+tab|in\s+single\s+tab)$/i, "")
    .replace(/\s+(for\s+me|for\s+us|for\s+sir|mere\s+liye)$/i, "")
    .replace(/^(that\s+)?specific\s+song\s*/i, "")
    .replace(/^a\s+song\s*/i, "")
    .trim();

  // If user just said "play", "play a song for me", "play song", or empty
  if (
    !target ||
    target === "music" ||
    target === "something" ||
    target === "song" ||
    target === "a song" ||
    target === "specific song" ||
    target === "that specific song" ||
    target === "for me" ||
    target === "gaana" ||
    target === "gana"
  ) {
    target = "AC/DC Back in Black Iron Man Theme";
  }

  // Detect Resolution Filter
  let resolutionFilter: "4K" | "1080p" | "Standard" = "Standard";
  if (lower.includes("4k") || lower.includes("ultra hd") || lower.includes("2160p")) {
    resolutionFilter = "4K";
  } else if (lower.includes("1080p") || lower.includes("hd") || lower.includes("high def")) {
    resolutionFilter = "1080p";
  }

  // Detect Media Type
  let mediaType: MediaTypeCategory = "track";
  let isLiveStream = false;
  let isPlaylist = false;
  let isInstrumental = false;
  let isAcoustic = false;

  if (lower.includes("live stream") || lower.includes("live radio") || lower.includes("live concert") || lower.includes("live") || lower.includes("24/7")) {
    mediaType = "live_stream";
    isLiveStream = true;
  } else if (lower.includes("playlist") || lower.includes("album") || lower.includes("mix") || lower.includes("compilation") || lower.includes("collection")) {
    mediaType = "playlist";
    isPlaylist = true;
  } else if (lower.includes("acoustic") || lower.includes("unplugged")) {
    mediaType = "acoustic";
    isAcoustic = true;
  } else if (lower.includes("instrumental") || lower.includes("piano version") || lower.includes("orchestra") || lower.includes("orchestral") || lower.includes("soundtrack") || lower.includes("ost")) {
    mediaType = lower.includes("orchestra") ? "orchestral" : "instrumental";
    isInstrumental = true;
  } else if (lower.includes("podcast") || lower.includes("interview") || lower.includes("episode")) {
    mediaType = "podcast";
  } else if (lower.includes("remix") || lower.includes("remixed") || lower.includes("club mix")) {
    mediaType = "remix";
  } else if (lower.includes("lofi") || lower.includes("lo-fi") || lower.includes("chillhop")) {
    mediaType = "lofi_radio";
  } else if (lower.includes("ambient") || lower.includes("binaural") || lower.includes("deep focus") || lower.includes("sleep")) {
    mediaType = "ambient";
  } else if (lower.includes("official video") || lower.includes("music video") || lower.includes("mv")) {
    mediaType = "official_video";
  }

  // Extract Artist Name
  let detectedArtist: string | undefined = undefined;
  for (const artist of KNOWN_ARTISTS) {
    if (lower.includes(artist.toLowerCase())) {
      detectedArtist = artist;
      break;
    }
  }

  // Check pattern "by [Artist]"
  const byArtistMatch = target.match(/(?:by|from|artist)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:in|on|at|live|4k|hd|playlist)|$)/i);
  if (!detectedArtist && byArtistMatch && byArtistMatch[1].trim()) {
    detectedArtist = byArtistMatch[1].trim();
  }

  // Extract Genre
  let detectedGenre: string | undefined = undefined;
  for (const genre of KNOWN_GENRES) {
    if (lower.includes(genre)) {
      detectedGenre = genre.charAt(0).toUpperCase() + genre.slice(1);
      break;
    }
  }

  // Extract Track Title
  let detectedTrack: string | undefined = undefined;
  if (detectedArtist) {
    let cleanTrack = target
      .replace(new RegExp(`\\b${detectedArtist}\\b`, "gi"), "")
      .replace(/\bby\b/gi, "")
      .replace(/\s+(song|track|music|live|acoustic|4k|hd|playlist|album|official\s+video)\b/gi, "")
      .trim();
    if (cleanTrack && cleanTrack.length > 2) {
      detectedTrack = cleanTrack.charAt(0).toUpperCase() + cleanTrack.slice(1);
    }
  }

  // Construct Optimized YouTube Search Query
  const queryParts: string[] = [];
  if (detectedArtist) queryParts.push(detectedArtist);
  if (detectedTrack) queryParts.push(detectedTrack);
  else if (!detectedArtist) queryParts.push(target);

  if (isLiveStream && !queryParts.some((p) => p.toLowerCase().includes("live"))) queryParts.push("live stream");
  if (isAcoustic && !queryParts.some((p) => p.toLowerCase().includes("acoustic"))) queryParts.push("acoustic");
  if (isInstrumental && !queryParts.some((p) => p.toLowerCase().includes("instrumental") || p.toLowerCase().includes("soundtrack"))) queryParts.push("instrumental");
  if (isPlaylist && !queryParts.some((p) => p.toLowerCase().includes("playlist") || p.toLowerCase().includes("album"))) queryParts.push("playlist");
  if (resolutionFilter === "4K" && !queryParts.some((p) => p.toLowerCase().includes("4k"))) queryParts.push("4K");

  const cleanSearchQuery = queryParts.join(" ").trim() || target;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanSearchQuery)}`;

  // Formulate Refined Ambient Voice Feedback (Stark-OS refined tone)
  let ambientVoiceFeedback = "";
  let hindiVoiceFeedback = "";

  if (detectedArtist && detectedTrack) {
    ambientVoiceFeedback = `Initiating playback sequence, sir. Streaming "${detectedTrack}" by ${detectedArtist}${isLiveStream ? " live" : ""}.`;
    hindiVoiceFeedback = `जी सर, ${detectedArtist} का "${detectedTrack}" यूट्यूब मीडिया HUD में शुरू किया जा रहा है।`;
  } else if (detectedArtist) {
    ambientVoiceFeedback = `Initiating playback sequence, sir. Cueing up ${detectedArtist}${isPlaylist ? " full playlist" : isLiveStream ? " live stream" : " audio selection"}.`;
    hindiVoiceFeedback = `जी सर, ${detectedArtist} का संगीत यूट्यूब पर चालू किया जा रहा है।`;
  } else if (detectedGenre) {
    ambientVoiceFeedback = `Initiating playback sequence, sir. Engaging ${detectedGenre} acoustic stream.`;
    hindiVoiceFeedback = `जी सर, ${detectedGenre} संगीत स्ट्रीम लोड किया जा रहा है।`;
  } else {
    ambientVoiceFeedback = `Initiating playback sequence, sir. Streaming "${cleanSearchQuery}" in your neural media HUD.`;
    hindiVoiceFeedback = `जी सर, यूट्यूब पर "${cleanSearchQuery}" बजाया जा रहा है।`;
  }

  const autonomousBrowserGoal = `Navigate YouTube, search for "${cleanSearchQuery}", click primary video result, and initialize media telemetry.`;

  return {
    isMediaCommand: true,
    rawInput: input,
    artist: detectedArtist,
    trackTitle: detectedTrack,
    genre: detectedGenre,
    mediaType,
    resolutionFilter,
    isLiveStream,
    isPlaylist,
    isInstrumental,
    isAcoustic,
    cleanSearchQuery,
    youtubeSearchUrl,
    autonomousBrowserGoal,
    ambientVoiceFeedback,
    hindiVoiceFeedback,
  };
}
