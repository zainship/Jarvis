import React, { useState } from "react";
import {
  Mail,
  Inbox,
  Star,
  Trash2,
  Send,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  User,
  ShieldCheck,
  Search,
  Plus,
  X,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { GmailEmailItem, GmailInboxTelemetry } from "../types";
import {
  markGmailMessageAsRead,
  toggleGmailStar,
  trashGmailMessage,
  sendGmailMessage,
  fetchGmailInbox,
} from "../utils/gmailManager";
import { signInWithGoogle } from "../lib/firebase";

interface GmailInboxCardProps {
  telemetry: GmailInboxTelemetry;
  onRefresh?: (updated: GmailInboxTelemetry) => void;
  onLaunchTab?: (url: string, title?: string) => void;
}

export const GmailInboxCard: React.FC<GmailInboxCardProps> = ({
  telemetry: initialTelemetry,
  onRefresh,
  onLaunchTab,
}) => {
  const [telemetry, setTelemetry] = useState<GmailInboxTelemetry>(initialTelemetry);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "starred">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<GmailEmailItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // Compose State
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);

  // Trash Confirmation State
  const [emailToTrash, setEmailToTrash] = useState<GmailEmailItem | null>(null);

  // Refresh inbox
  const handleReload = async (query = "in:inbox") => {
    setIsLoading(true);
    try {
      const updated = await fetchGmailInbox(10, query);
      setTelemetry(updated);
      if (onRefresh) onRefresh(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login
  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      await handleReload();
    } catch (e) {
      console.error("Sign-in failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Star Toggle
  const handleToggleStar = async (email: GmailEmailItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !email.isStarred;
    const success = await toggleGmailStar(email.id, nextState);
    if (success) {
      setTelemetry((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === email.id ? { ...m, isStarred: nextState } : m
        ),
      }));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail((prev) => (prev ? { ...prev, isStarred: nextState } : null));
      }
    }
  };

  // Mark as Read
  const handleOpenEmail = async (email: GmailEmailItem) => {
    setSelectedEmail(email);
    if (email.isUnread) {
      markGmailMessageAsRead(email.id).catch(console.error);
      setTelemetry((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        messages: prev.messages.map((m) =>
          m.id === email.id ? { ...m, isUnread: false } : m
        ),
      }));
    }
  };

  // Trash Confirmation Execution
  const handleConfirmTrash = async () => {
    if (!emailToTrash) return;
    const emailId = emailToTrash.id;
    setEmailToTrash(null);
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }

    const ok = await trashGmailMessage(emailId);
    if (ok) {
      setTelemetry((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== emailId),
        totalMessages: Math.max(0, prev.totalMessages - 1),
      }));
    }
  };

  // Send Confirmation Execution
  const handleConfirmSend = async () => {
    setConfirmSendOpen(false);
    setIsSending(true);
    try {
      const res = await sendGmailMessage(composeTo, composeSubject, composeBody);
      if (res.success) {
        setIsComposing(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        handleReload();
      } else {
        alert(`Failed to send email: ${res.error || "Unknown error"}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Filter messages
  const filteredMessages = telemetry.messages.filter((msg) => {
    if (activeFilter === "unread" && !msg.isUnread) return false;
    if (activeFilter === "starred" && !msg.isStarred) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        msg.subject.toLowerCase().includes(q) ||
        msg.from.toLowerCase().includes(q) ||
        (msg.fromName && msg.fromName.toLowerCase().includes(q)) ||
        msg.snippet.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Auth Required Card
  if (telemetry.status === "auth_required") {
    return (
      <div className="mt-3 p-4 rounded-xl bg-[#060D1A] border border-cyan-500/30 space-y-3 shadow-[0_0_25px_rgba(6,182,212,0.15)] font-mono">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                GMAIL SECURE GATEWAY
              </h4>
              <p className="text-[10px] text-cyan-400">Google Workspace OAuth Required</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
            ACTION REQUIRED
          </span>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          JARVIS needs your authorized Google connection to scan your inbox, retrieve unread messages, and deliver live email briefings.
        </p>

        {/* Official Google Sign In Button */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs shadow-md transition-all cursor-pointer font-sans"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>{isLoading ? "Connecting Gateway..." : "Sign in with Google to Connect Gmail"}</span>
          </button>

          <button
            type="button"
            onClick={() => onLaunchTab?.("https://mail.google.com", "Gmail Web")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 font-mono text-xs border border-cyan-500/30 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Gmail.com</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-[#050B16] border border-cyan-500/30 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.18)] font-sans">
      {/* Header Bar */}
      <div className="p-3 bg-[#081224] border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono tracking-wider">
                GMAIL COMM-FEED
              </span>
              {telemetry.unreadCount > 0 ? (
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-cyan-500 text-black animate-pulse">
                  {telemetry.unreadCount} UNREAD
                </span>
              ) : (
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  ALL CAUGHT UP
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              User: <span className="text-cyan-300">{telemetry.userEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsComposing(true)}
            title="Compose Email"
            className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compose</span>
          </button>
          <button
            type="button"
            onClick={() => handleReload()}
            disabled={isLoading}
            title="Refresh Inbox"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => onLaunchTab?.("https://mail.google.com", "Gmail Official Portal")}
            title="Open Full Gmail Web Tab"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Control Strip & Filters */}
      <div className="p-2.5 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
              activeFilter === "all"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({telemetry.messages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
              activeFilter === "unread"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Unread ({telemetry.messages.filter((m) => m.isUnread).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("starred")}
            className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
              activeFilter === "starred"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Starred ({telemetry.messages.filter((m) => m.isStarred).length})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-xs bg-black/60 border border-white/10 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono"
          />
        </div>
      </div>

      {/* Messages Feed */}
      <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
        {filteredMessages.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs font-mono space-y-1">
            <Inbox className="w-6 h-6 mx-auto text-slate-600 mb-1" />
            <p>No messages matching current criteria.</p>
            <p className="text-[10px] text-slate-500">Your inbox channels are clear, sir.</p>
          </div>
        ) : (
          filteredMessages.map((email) => (
            <div
              key={email.id}
              onClick={() => handleOpenEmail(email)}
              className={`p-2.5 hover:bg-cyan-950/20 transition-colors cursor-pointer flex items-start gap-2.5 group ${
                email.isUnread ? "bg-cyan-950/10" : ""
              }`}
            >
              {/* Unread & Star */}
              <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
                {email.isUnread ? (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                )}
                <button
                  type="button"
                  onClick={(e) => handleToggleStar(email, e)}
                  className="text-slate-500 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      email.isStarred ? "fill-amber-400 text-amber-400" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Sender & Snippet */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs truncate ${
                      email.isUnread ? "font-bold text-white" : "font-medium text-slate-300"
                    }`}
                  >
                    {email.fromName || email.from}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {new Date(email.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <p
                  className={`text-xs truncate ${
                    email.isUnread ? "font-semibold text-cyan-200" : "text-slate-300"
                  }`}
                >
                  {email.subject}
                </p>

                <p className="text-[11px] text-slate-400 truncate leading-snug">
                  {email.snippet}
                </p>
              </div>

              {/* Action Buttons on Hover */}
              <div className="shrink-0 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  title="Move to trash"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmailToTrash(email);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Email Reader Modal/Overlay */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#070E1C] border border-cyan-500/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)]">
            {/* Modal Header */}
            <div className="p-4 bg-[#091529] border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate max-w-[400px]">
                    {selectedEmail.subject}
                  </h3>
                  <p className="text-[11px] font-mono text-cyan-400">
                    From: {selectedEmail.fromName} &lt;{selectedEmail.from}&gt;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onLaunchTab?.(
                      `https://mail.google.com/mail/u/0/#inbox/${selectedEmail.threadId || selectedEmail.id}`,
                      "Gmail Thread"
                    )
                  }
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-mono inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in Gmail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Email Metadata */}
            <div className="p-3 bg-black/40 border-b border-white/5 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(selectedEmail.date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposeTo(selectedEmail.from);
                    setComposeSubject(`Re: ${selectedEmail.subject}`);
                    setComposeBody(`\n\n--- On ${selectedEmail.date}, ${selectedEmail.from} wrote ---\n> ${selectedEmail.snippet}`);
                    setSelectedEmail(null);
                    setIsComposing(true);
                  }}
                  className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Reply</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailToTrash(selectedEmail)}
                  className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/30 text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-4 flex-1 overflow-y-auto font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500 selection:text-black">
              {selectedEmail.bodyText || selectedEmail.snippet}
            </div>
          </div>
        </div>
      )}

      {/* Trash Confirmation Dialog (MANDATORY User Confirmation for Destructive Action) */}
      {emailToTrash && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0C1222] border border-red-500/40 rounded-2xl p-4 space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.25)] font-mono">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">CONFIRM EMAIL DELETION</h3>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Are you sure you want to move this email from <strong className="text-white">{emailToTrash.fromName || emailToTrash.from}</strong> with subject <em className="text-cyan-300">"{emailToTrash.subject}"</em> to the Trash?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmailToTrash(null)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTrash}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Dialog */}
      {isComposing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#070F1E] border border-cyan-500/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] font-sans">
            <div className="p-3.5 bg-[#091529] border-b border-cyan-500/20 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2 text-cyan-400">
                <Send className="w-4 h-4" />
                <h3 className="text-xs font-bold text-white">COMPOSE GMAIL DISPATCH</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Recipient (To:)
                </label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Subject line..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Message Body
                </label>
                <textarea
                  rows={6}
                  placeholder="Type your message..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full p-3 text-xs bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!composeTo || !composeBody || isSending}
                  onClick={() => setConfirmSendOpen(true)}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review & Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Confirmation Dialog (MANDATORY User Confirmation for Sending Emails) */}
      {confirmSendOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0C1222] border border-cyan-500/40 rounded-2xl p-4 space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.25)] font-mono">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">CONFIRM GMAIL TRANSMISSION</h3>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-sans">
              <p>Are you sure you want to transmit this email from your account?</p>
              <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 space-y-1 font-mono text-[11px]">
                <p>To: <strong className="text-white">{composeTo}</strong></p>
                <p>Subject: <span className="text-cyan-300">{composeSubject || "(No Subject)"}</span></p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSendOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={isSending}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                {isSending ? "Transmitting..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
