import { GoogleDocTelemetry } from "../types";
import { getAccessToken, auth } from "../lib/firebase";

/**
 * Detects if a user input is asking to create, make, view, or manage Google Docs
 */
export function isGoogleDocIntent(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim();

  // Pattern matches
  const createPatterns = [
    /create (a )?(new )?(google )?doc/i,
    /make (a )?(new )?(google )?doc/i,
    /write (a )?(new )?(google )?doc/i,
    /generate (a )?(new )?(google )?doc/i,
    /draft (a )?(new )?(google )?doc/i,
    /build (a )?(new )?(google )?doc/i,
    /create (a )?(new )?document/i,
    /make (a )?(new )?document/i,
    /write (a )?(new )?document/i,
    /generate (a )?(new )?document/i,
    /draft (a )?(new )?document/i,
    /google doc/i,
    /google document/i,
    /new doc for/i,
    /make doc/i,
    /create doc/i,
    /open (my )?(google )?docs/i,
    /show (my )?(google )?docs/i,
    /list (my )?(google )?docs/i,
    /my (google )?documents/i,
    /check (my )?(google )?docs/i,
  ];

  return createPatterns.some((pattern) => pattern.test(clean));
}

/**
 * Parses user input to extract document intent, title, topic, and custom prompt
 */
export function parseGoogleDocIntent(text: string): {
  type: "create" | "list" | "open";
  topic: string;
  title: string;
  instructions: string;
} {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Check if listing / viewing
  if (
    lower.includes("list my docs") ||
    lower.includes("show my docs") ||
    lower.includes("show my documents") ||
    lower.includes("recent docs") ||
    lower.includes("recent documents") ||
    lower.includes("check my docs") ||
    lower.includes("my documents")
  ) {
    return {
      type: "list",
      topic: "",
      title: "Recent Google Docs",
      instructions: "",
    };
  }

  // Extract topic from phrases like:
  // "make a document for me on Project Starfall"
  // "create a google doc about AI agents"
  // "write a document for me regarding quarterly goals"
  // "create doc named Stark Industries Q3 Plan"
  let topic = "";
  let title = "";

  // Regular expression extraction
  const topicExtractors = [
    /(?:create|make|write|generate|draft|build)\s+(?:a\s+)?(?:new\s+)?(?:google\s+)?(?:doc|document)\s+(?:for\s+me\s+)?(?:about|on|regarding|for|titled|named)\s+([^.,!?]+)/i,
    /(?:create|make|write|generate|draft|build)\s+(?:me\s+)?(?:a\s+)?(?:new\s+)?(?:google\s+)?(?:doc|document)\s*[:\-]\s*([^.,!?]+)/i,
    /(?:doc|document)\s+(?:about|on|regarding|for|titled|named)\s+([^.,!?]+)/i,
    /(?:create|make)\s+(?:a\s+)?(?:google\s+)?(?:doc|document)\s+(.+)/i,
  ];

  for (const regex of topicExtractors) {
    const match = clean.match(regex);
    if (match && match[1]) {
      topic = match[1].trim();
      break;
    }
  }

  if (!topic) {
    // If user simply said "make a document for me" or "create a google doc"
    topic = "Executive Intelligence Briefing";
  }

  // Sanitize and format title
  title = formatDocumentTitle(topic);

  return {
    type: "create",
    topic,
    title,
    instructions: clean,
  };
}

/**
 * Formats a raw topic string into a neat, Title-Cased Google Doc name
 */
function formatDocumentTitle(raw: string): string {
  if (!raw) return "JARVIS Intelligence Briefing";
  const cleaned = raw.replace(/^(on|about|regarding|for|named|titled)\s+/i, "").trim();
  if (!cleaned) return "JARVIS Intelligence Briefing";

  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Creates a real Google Document using the Google Docs REST API
 */
export async function createGoogleDoc(
  title: string,
  topic?: string,
  instructions?: string,
  explicitContent?: string
): Promise<GoogleDocTelemetry> {
  const token = await getAccessToken();

  if (!token) {
    return {
      documentId: "",
      title: title || "New Google Document",
      documentUrl: "https://docs.google.com",
      status: "auth_required",
      errorMessage: "Google Workspace authorization is required to create documents in Google Drive.",
      summaryScript: "I require your Google Workspace authorization to create Google Docs in your Drive, sir.",
    };
  }

  try {
    // 1. Generate rich document content
    let documentBody = explicitContent;
    let spokenSummary = `I have generated the Google Document "${title}" in your Google Drive, Commander.`;

    if (!documentBody) {
      try {
        const response = await fetch("/api/jarvis/generate-doc-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic || title,
            title,
            instructions,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.documentText) {
            documentBody = data.documentText;
            if (data.title) title = data.title;
            if (data.summary) spokenSummary = data.summary;
          }
        }
      } catch (err) {
        console.warn("AI generation failed, falling back to local generator", err);
      }
    }

    if (!documentBody) {
      documentBody = generateLocalDocBody(title, topic || title);
    }

    // 2. Call Google Docs API to create the blank document
    const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      if (createRes.status === 401 || createRes.status === 403) {
        return {
          documentId: "",
          title,
          documentUrl: "https://docs.google.com",
          status: "auth_required",
          errorMessage: `Google Workspace access error (${createRes.status}): ${errText}`,
        };
      }
      throw new Error(`Google Docs API Error (${createRes.status}): ${errText}`);
    }

    const docData = await createRes.json();
    const documentId = docData.documentId;
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // 3. Populate Document Content via batchUpdate
    if (documentBody && documentId) {
      const updateRes = await fetch(
        `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: {
                    index: 1,
                  },
                  text: documentBody,
                },
              },
            ],
          }),
        }
      );

      if (!updateRes.ok) {
        console.warn("Could not batch update doc text:", await updateRes.text());
      }
    }

    const wordCount = documentBody.split(/\s+/).filter(Boolean).length;
    const previewContent = documentBody.slice(0, 320) + (documentBody.length > 320 ? "..." : "");

    return {
      documentId,
      title,
      documentUrl,
      status: "created",
      summaryScript: spokenSummary,
      previewContent,
      wordCount,
      lastModified: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Failed to create Google Doc:", error);
    return {
      documentId: "",
      title,
      documentUrl: "https://docs.google.com",
      status: "error",
      errorMessage: error?.message || "Failed to create Google Document.",
      summaryScript: `I encountered an issue generating your Google Document: ${error?.message || "Unknown error"}`,
    };
  }
}

/**
 * Lists the user's recent Google Docs from Google Drive API
 */
export async function fetchRecentGoogleDocs(pageSize: number = 8): Promise<GoogleDocTelemetry> {
  const token = await getAccessToken();

  if (!token) {
    return {
      documentId: "",
      title: "Google Docs Library",
      documentUrl: "https://docs.google.com",
      status: "auth_required",
      errorMessage: "Google Workspace authorization is required to access your Google Drive documents.",
      summaryScript: "Please authorize your Google account so I can retrieve your Google Docs library.",
    };
  }

  try {
    const q = "mimeType='application/vnd.google-apps.document' and trashed=false";
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        q
      )}&orderBy=modifiedTime desc&pageSize=${pageSize}&fields=files(id,name,modifiedTime,webViewLink,thumbnailLink,iconLink)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 401 || res.status === 403) {
        return {
          documentId: "",
          title: "Google Docs Library",
          documentUrl: "https://docs.google.com",
          status: "auth_required",
          errorMessage: `Authorization expired: ${errText}`,
        };
      }
      throw new Error(`Drive API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const files = data.files || [];

    const recentDocs = files.map((f: any) => ({
      id: f.id,
      name: f.name || "Untitled Document",
      modifiedTime: f.modifiedTime,
      webViewLink: f.webViewLink || `https://docs.google.com/document/d/${f.id}/edit`,
      thumbnailLink: f.thumbnailLink,
    }));

    return {
      documentId: recentDocs[0]?.id || "",
      title: "Google Docs Library",
      documentUrl: "https://docs.google.com",
      status: "listed",
      recentDocs,
      summaryScript: `I retrieved ${recentDocs.length} Google Documents from your Drive, Commander.`,
    };
  } catch (error: any) {
    console.error("Error fetching Google Docs:", error);
    return {
      documentId: "",
      title: "Google Docs Library",
      documentUrl: "https://docs.google.com",
      status: "error",
      errorMessage: error?.message || "Failed to retrieve documents.",
      summaryScript: "An error occurred while fetching your Google Docs library.",
    };
  }
}

/**
 * Generates structured local document text fallback
 */
function generateLocalDocBody(title: string, topic: string): string {
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "full" });

  return `${title.toUpperCase()}
Prepared by: JARVIS Autonomous AI Operating System
Date: ${dateStr}
Security Clearance: Authorized Workspace User

============================================================
1. EXECUTIVE SUMMARY
============================================================
This document compiles the research synthesis and strategic action framework regarding ${topic}. The analysis outlines key objectives, structural paradigms, execution timelines, and risk mitigation strategies to maximize operational throughput.

============================================================
2. CORE OBJECTIVES & DELIVERABLES
============================================================
• Synthesize all relevant data points and architectural guidelines for ${topic}.
• Establish scalable, high-velocity workflows with built-in validation mechanisms.
• Formulate clear, actionable milestones for immediate implementation.

============================================================
3. STRATEGIC ANALYSIS & KEY FINDINGS
============================================================
• High-Impact Leverage Points: Implementing streamlined automation and clear documentation drastically reduces cognitive overhead and error rates.
• Robust Integration: Seamless handoffs across distributed systems ensure operational stability and data continuity.
• Quality Control: Iterative review loops ensure continuous alignment with primary project requirements.

============================================================
4. IMPLEMENTATION ROADMAP
============================================================
Phase 1: Baseline Architecture & Workspace Scaffolding
Phase 2: Core Execution & Data Ingestion
Phase 3: Quality Assurance & Optimization Review
Phase 4: Final Sign-off & Production Deployment

============================================================
5. CONCLUSION & ACTION ITEMS
============================================================
All prerequisite milestones have been initialized. You can edit this live document directly or command JARVIS to append additional analysis.
`;
}
