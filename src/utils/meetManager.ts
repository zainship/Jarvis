import { GoogleMeetTelemetry } from "../types";
import { getAccessToken } from "../lib/firebase";

/**
 * Checks if user input is asking to create, launch, schedule, or join a Google Meet
 */
export function isGoogleMeetIntent(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim();

  const meetPatterns = [
    /google meet/i,
    /start (a )?(new )?(video )?(call|meeting|meet)/i,
    /create (a )?(new )?(video )?(call|meeting|meet)/i,
    /make (a )?(new )?(video )?(call|meeting|meet)/i,
    /schedule (a )?(new )?(video )?(call|meeting|meet)/i,
    /launch (a )?(new )?(google )?meet/i,
    /open (google )?meet/i,
    /join (the )?(google )?meet/i,
    /instant meet/i,
    /instant meeting/i,
    /video conference/i,
    /meet link/i,
    /meet\.google\.com/i,
    /start meeting/i,
  ];

  return meetPatterns.some((p) => p.test(clean));
}

/**
 * Parses user input to extract topic, custom instructions, or meeting code
 */
export function parseGoogleMeetIntent(text: string): {
  type: "create" | "join" | "open";
  topic: string;
  meetingCode?: string;
} {
  const clean = text.trim();

  // Check if joining with a specific code e.g. "join meet abc-defg-hij"
  const codeMatch = clean.match(/[a-z]{3}-[a-z]{4}-[a-z]{3}/i);
  if (codeMatch && clean.toLowerCase().includes("join")) {
    return {
      type: "join",
      topic: "Google Meet Conference",
      meetingCode: codeMatch[0].toLowerCase(),
    };
  }

  // Extract topic from "start a meet for Project Atlas" or "create a meeting about Q3 Review"
  let topic = "";
  const topicExtractors = [
    /(?:start|create|make|launch|schedule)\s+(?:a\s+)?(?:new\s+)?(?:google\s+)?(?:meet|meeting|video call|conference)\s+(?:for|about|regarding|titled|named)\s+([^.,!?]+)/i,
    /(?:meet|meeting)\s+(?:for|about|regarding|titled|named)\s+([^.,!?]+)/i,
  ];

  for (const regex of topicExtractors) {
    const match = clean.match(regex);
    if (match && match[1]) {
      topic = match[1].trim();
      break;
    }
  }

  if (!topic) {
    topic = "Command Tactical Briefing";
  }

  // Format topic nicely
  topic = topic
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return {
    type: "create",
    topic,
  };
}

/**
 * Creates a real Google Meet Space using Google Meet REST API v2
 */
export async function createGoogleMeetSpace(topic?: string): Promise<GoogleMeetTelemetry> {
  const token = await getAccessToken();
  const meetingTopic = topic || "Tactical Briefing";

  if (!token) {
    return {
      status: "auth_required",
      meetingUri: "https://meet.google.com/new",
      meetingCode: "pending-auth",
      topic: meetingTopic,
      errorMessage: "Google Workspace Meet authorization is required to create conference spaces.",
      summaryScript: "I require Google Workspace authorization to launch an authorized Google Meet conference for you, Commander. Please authenticate via the HUD card.",
    };
  }

  try {
    // Call Google Meet v2 API to create a new space
    const response = await fetch("https://meet.googleapis.com/v2/spaces", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 401 || response.status === 403) {
        return {
          status: "auth_required",
          meetingUri: "https://meet.google.com/new",
          meetingCode: "pending-auth",
          topic: meetingTopic,
          errorMessage: `Google Meet authorization required (${response.status}): ${errText}`,
          summaryScript: "Google Meet permissions are required to establish your conference space, Commander.",
        };
      }
      throw new Error(`Google Meet API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const meetingUri = data.meetingUri || `https://meet.google.com/${data.meetingCode || "new"}`;
    const meetingCode = data.meetingCode || (meetingUri.split("/").pop() || "active-room");
    const spaceId = data.name || `spaces/${meetingCode}`;

    // Save to local recent history
    saveMeetingToHistory({
      name: spaceId,
      meetingUri,
      meetingCode,
      createTime: new Date().toISOString(),
      activeConference: true,
    });

    return {
      status: "created",
      spaceId,
      meetingUri,
      meetingCode,
      topic: meetingTopic,
      createdAt: new Date().toISOString(),
      summaryScript: `Google Meet room established for ${meetingTopic}. Your conference link is ${meetingCode}. Video and audio uplink is standing by, sir.`,
    };
  } catch (error: any) {
    console.error("Meet Space Creation failed, fallback to instant URL:", error);
    
    // Graceful fallback to https://meet.google.com/new
    return {
      status: "created",
      meetingUri: "https://meet.google.com/new",
      meetingCode: "instant-link",
      topic: meetingTopic,
      createdAt: new Date().toISOString(),
      summaryScript: `I have initialized an instant Google Meet room for ${meetingTopic}, sir. Click Join Call to establish your uplink.`,
    };
  }
}

/**
 * Local cache of recently created meetings
 */
const RECENT_MEETINGS_KEY = "jarvis_recent_google_meets";

export function getRecentMeetings(): Array<{
  name: string;
  meetingUri: string;
  meetingCode: string;
  createTime?: string;
  activeConference?: boolean;
}> {
  try {
    const raw = localStorage.getItem(RECENT_MEETINGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMeetingToHistory(meeting: {
  name: string;
  meetingUri: string;
  meetingCode: string;
  createTime?: string;
  activeConference?: boolean;
}) {
  try {
    const current = getRecentMeetings();
    const filtered = current.filter((m) => m.meetingCode !== meeting.meetingCode);
    const updated = [meeting, ...filtered].slice(0, 10);
    localStorage.setItem(RECENT_MEETINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not cache meeting:", e);
  }
}
