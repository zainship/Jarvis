import { GmailEmailItem, GmailInboxTelemetry } from "../types";
import { getAccessToken, auth } from "../lib/firebase";

/**
 * Decodes standard or base64url encoded strings safely
 */
function decodeBase64Url(base64Url: string): string {
  try {
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (e) {
    try {
      return atob(base64Url.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return "";
    }
  }
}

/**
 * Extracts the body text and HTML from a Gmail message payload
 */
function extractBody(payload: any): { text: string; html: string } {
  let text = "";
  let html = "";

  if (!payload) return { text, html };

  if (payload.body && payload.body.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") {
      html = decoded;
    } else {
      text = decoded;
    }
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) {
        text += (text ? "\n" : "") + decodeBase64Url(part.body.data);
      } else if (part.mimeType === "text/html" && part.body && part.body.data) {
        html += (html ? "\n" : "") + decodeBase64Url(part.body.data);
      } else if (part.parts) {
        const nested = extractBody(part);
        if (nested.text) text += (text ? "\n" : "") + nested.text;
        if (nested.html) html += (html ? "\n" : "") + nested.html;
      }
    }
  }

  return { text, html };
}

/**
 * Parses email headers into structured information
 */
function parseHeaders(headers: Array<{ name: string; value: string }>) {
  let subject = "(No Subject)";
  let from = "Unknown Sender";
  let fromName = "";
  let to = "";
  let date = new Date().toISOString();

  if (!headers) return { subject, from, fromName, to, date };

  for (const h of headers) {
    const name = h.name.toLowerCase();
    if (name === "subject") subject = h.value || "(No Subject)";
    if (name === "from") {
      from = h.value || "";
      // Extract "Name <email@domain.com>"
      const match = from.match(/^(.*?)\s*<(.+?)>$/);
      if (match) {
        fromName = match[1].replace(/^["']|["']$/g, "").trim();
        from = match[2].trim();
      } else {
        fromName = from.split("@")[0];
      }
    }
    if (name === "to") to = h.value || "";
    if (name === "date") date = h.value || date;
  }

  return { subject, from, fromName, to, date };
}

/**
 * Fetches and parses messages from Gmail
 */
export async function fetchGmailInbox(
  maxResults = 8,
  customQuery = "in:inbox"
): Promise<GmailInboxTelemetry> {
  const token = await getAccessToken();
  const userEmail = auth.currentUser?.email || "zaim98269@gmail.com";

  if (!token) {
    return {
      userEmail,
      unreadCount: 0,
      totalMessages: 0,
      messages: [],
      lastChecked: new Date().toISOString(),
      status: "auth_required",
      errorMessage: "Google Workspace authentication required. Please sign in with Google to grant Gmail access.",
    };
  }

  try {
    // 1. List messages
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(customQuery)}`;
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (listRes.status === 401 || listRes.status === 403) {
      return {
        userEmail,
        unreadCount: 0,
        totalMessages: 0,
        messages: [],
        lastChecked: new Date().toISOString(),
        status: "auth_required",
        errorMessage: "Gmail access token expired or lacking permission. Please re-authenticate.",
      };
    }

    if (!listRes.ok) {
      const errText = await listRes.text();
      throw new Error(`Gmail API error: ${listRes.status} ${errText}`);
    }

    const listData = await listRes.json();
    const rawList: Array<{ id: string; threadId: string }> = listData.messages || [];

    if (rawList.length === 0) {
      return {
        userEmail,
        unreadCount: 0,
        totalMessages: 0,
        messages: [],
        lastChecked: new Date().toISOString(),
        status: "success",
        summaryScript: `Inbox check complete for ${userEmail}. You have zero matching messages in this view, Commander.`,
      };
    }

    // 2. Fetch details for each message in parallel
    const emailPromises = rawList.slice(0, maxResults).map(async (item) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!msgRes.ok) return null;
        const msgData = await msgRes.json();

        const headers = msgData.payload?.headers || [];
        const { subject, from, fromName, to, date } = parseHeaders(headers);
        const { text, html } = extractBody(msgData.payload);
        const labelIds = msgData.labelIds || [];
        const isUnread = labelIds.includes("UNREAD");
        const isStarred = labelIds.includes("STARRED");

        const parsedItem: GmailEmailItem = {
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet || "",
          subject,
          from,
          fromName: fromName || from,
          to,
          date,
          isUnread,
          isStarred,
          labelIds,
          bodyText: text || msgData.snippet || "",
          bodyHtml: html || undefined,
        };
        return parsedItem;
      } catch (err) {
        console.warn(`Failed to parse email ${item.id}:`, err);
        return null;
      }
    });

    const parsedMessages = (await Promise.all(emailPromises)).filter(
      (m): m is GmailEmailItem => m !== null
    );

    const unreadCount = parsedMessages.filter((m) => m.isUnread).length;

    // Generate natural Jarvis spoken briefing
    let briefing = "";
    if (unreadCount > 0) {
      const topSenders = parsedMessages
        .filter((m) => m.isUnread)
        .slice(0, 3)
        .map((m) => m.fromName || m.from)
        .join(", ");
      briefing = `Checking your Gmail inbox now, Commander. You have ${unreadCount} unread message${
        unreadCount > 1 ? "s" : ""
      } requiring your attention, including correspondence from ${topSenders}. Full inbox telemetry is active on your HUD.`;
    } else {
      briefing = `I have scanned your Gmail inbox, Commander. All ${parsedMessages.length} recent messages are marked as read. Your communication channels are nominal.`;
    }

    return {
      userEmail,
      unreadCount,
      totalMessages: parsedMessages.length,
      messages: parsedMessages,
      lastChecked: new Date().toISOString(),
      status: "success",
      summaryScript: briefing,
    };
  } catch (error: any) {
    console.error("fetchGmailInbox error:", error);
    return {
      userEmail,
      unreadCount: 0,
      totalMessages: 0,
      messages: [],
      lastChecked: new Date().toISOString(),
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Failed to load Gmail messages.",
    };
  }
}

/**
 * Marks an email as read
 */
export async function markGmailMessageAsRead(messageId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          removeLabelIds: ["UNREAD"],
        }),
      }
    );
    return res.ok;
  } catch (e) {
    console.error("Failed to mark email read:", e);
    return false;
  }
}

/**
 * Toggles Star on an email
 */
export async function toggleGmailStar(messageId: string, shouldStar: boolean): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          shouldStar
            ? { addLabelIds: ["STARRED"] }
            : { removeLabelIds: ["STARRED"] }
        ),
      }
    );
    return res.ok;
  } catch (e) {
    console.error("Failed to toggle star:", e);
    return false;
  }
}

/**
 * Moves message to Trash (Requires Confirmation per Workspace Guidelines)
 */
export async function trashGmailMessage(messageId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.ok;
  } catch (e) {
    console.error("Failed to trash email:", e);
    return false;
  }
}

/**
 * Sends an email via Gmail API (Requires user confirmation before sending)
 */
export async function sendGmailMessage(
  to: string,
  subject: string,
  bodyText: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Authentication required to send emails." };
  }

  try {
    const fromEmail = auth.currentUser?.email || "me";
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const messageParts = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      bodyText,
    ];
    const message = messageParts.join("\r\n");

    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send email." };
  }
}

/**
 * Determines if a voice/text prompt is asking to check Gmail/emails
 */
export function isGmailCheckIntent(rawText: string): boolean {
  if (!rawText) return false;
  const lower = rawText.toLowerCase().trim();

  const patterns = [
    /check\s+(my\s+)?(gmail|email|emails|mail|inbox)/i,
    /read\s+(my\s+)?(gmail|email|emails|mail|inbox)/i,
    /show\s+(my\s+)?(gmail|email|emails|mail|inbox)/i,
    /open\s+(my\s+)?(gmail|email|emails|mail|inbox)/i,
    /any\s+(new\s+)?(emails?|messages?|mail)/i,
    /unread\s+(emails?|messages?|mail|inbox)/i,
    /get\s+(my\s+)?(emails?|mail|inbox)/i,
    /email\s+check/i,
    /gmail\s+check/i,
    /mere\s+(email|emails|gmail|inbox)\s+(check|dekh|kholo)/i,
    /email\s+(kholo|padho|check\s+karo)/i,
    /gmail\s+(kholo|check\s+karo|par\s+kya\s+hai)/i,
  ];

  return patterns.some((p) => p.test(lower));
}
