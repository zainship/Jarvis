import React, { useState } from "react";
import {
  FileText,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Plus,
  RefreshCw,
  Clock,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Send,
  X,
} from "lucide-react";
import { GoogleDocTelemetry } from "../types";
import { createGoogleDoc, fetchRecentGoogleDocs } from "../utils/docsManager";
import { signInWithGoogle } from "../lib/firebase";

interface GoogleDocCardProps {
  telemetry: GoogleDocTelemetry;
  onRefresh?: (updated: GoogleDocTelemetry) => void;
  onLaunchTab?: (url: string, title?: string) => void;
  onCreateNew?: (title: string, topic?: string) => void;
}

export const GoogleDocCard: React.FC<GoogleDocCardProps> = ({
  telemetry: initialTelemetry,
  onRefresh,
  onLaunchTab,
  onCreateNew,
}) => {
  const [telemetry, setTelemetry] = useState<GoogleDocTelemetry>(initialTelemetry);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopyContent = () => {
    if (!telemetry.previewContent) return;
    navigator.clipboard.writeText(telemetry.previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDoc = (url?: string, title?: string) => {
    const targetUrl = url || telemetry.documentUrl || "https://docs.google.com";
    const docTitle = title || telemetry.title || "Google Document";
    if (onLaunchTab) {
      onLaunchTab(targetUrl, docTitle);
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      const updated = await fetchRecentGoogleDocs();
      setTelemetry(updated);
      if (onRefresh) onRefresh(updated);
    } catch (e) {
      console.error("Sign-in failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsLoading(true);
    setIsCreatingModal(false);

    try {
      const res = await createGoogleDoc(newTitle.trim(), newTopic.trim());
      setTelemetry(res);
      if (onRefresh) onRefresh(res);
      setNewTitle("");
      setNewTopic("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Required State Card
  if (telemetry.status === "auth_required") {
    return (
      <div className="mt-3 p-4 rounded-xl bg-[#060D1A] border border-blue-500/30 space-y-3 shadow-[0_0_25px_rgba(59,130,246,0.15)] font-mono">
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                GOOGLE DOCS WORKSPACE GATEWAY
              </h4>
              <p className="text-[10px] text-blue-400">Drive & Documents OAuth Required</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
            ACTION REQUIRED
          </span>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          JARVIS needs your authorized Google connection to create, format, and save live Google Documents directly to your Google Drive.
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
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{isLoading ? "Connecting Gateway..." : "Sign in with Google to Enable Docs"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDoc("https://docs.google.com", "Google Docs Home")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 font-mono text-xs border border-blue-500/30 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Docs.google.com</span>
          </button>
        </div>
      </div>
    );
  }

  // Recent Docs Library Mode
  if (telemetry.status === "listed" && telemetry.recentDocs) {
    const filteredDocs = telemetry.recentDocs.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="mt-3 rounded-xl bg-[#050C1A] border border-blue-500/30 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.15)] font-sans">
        <div className="p-3 bg-[#08152B] border-b border-blue-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono tracking-wider">
                  GOOGLE DOCS LIBRARY
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-blue-500 text-white">
                  {telemetry.recentDocs.length} DOCS
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">Google Drive Synchronized</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingModal(true)}
              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Doc</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                const updated = await fetchRecentGoogleDocs();
                setTelemetry(updated);
                setIsLoading(false);
              }}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => handleOpenDoc("https://docs.google.com", "Google Docs")}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="p-2.5 bg-black/40 border-b border-white/5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search Google Documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="max-h-[280px] overflow-y-auto divide-y divide-white/5">
          {filteredDocs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-mono">
              <BookOpen className="w-6 h-6 mx-auto text-slate-600 mb-1" />
              <p>No documents found matching query.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleOpenDoc(doc.webViewLink, doc.name)}
                className="p-2.5 hover:bg-blue-950/20 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">
                      Modified {doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString() : "Recently"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <span className="text-[11px] font-mono text-blue-400 flex items-center gap-1 group-hover:underline">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Newly Created Document HUD Card
  return (
    <div className="mt-3 rounded-xl bg-[#050C1B] border border-blue-500/40 overflow-hidden shadow-[0_0_35px_rgba(59,130,246,0.2)] font-sans">
      {/* Top Banner Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#081838] to-[#0A224D] border-b border-blue-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono tracking-wider">
                GOOGLE DOC CREATED
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                LIVE ON DRIVE
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-[320px] sm:max-w-[450px]">
              {telemetry.title}
            </h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenDoc()}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Google Docs</span>
          </button>
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="px-3.5 py-2 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{new Date(telemetry.lastModified || Date.now()).toLocaleTimeString()}</span>
          </span>
          {telemetry.wordCount ? (
            <span className="text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-500/20">
              {telemetry.wordCount} words
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyContent}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy Text"}</span>
          </button>
        </div>
      </div>

      {/* Formatted Document Preview Container */}
      {telemetry.previewContent && (
        <div className="p-3.5 bg-[#030712]/70 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-blue-400">
              <Sparkles className="w-3 h-3" />
              <span>Document Overview & Preview:</span>
            </span>
          </div>

          <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto selection:bg-blue-500 selection:text-white">
            {telemetry.previewContent}
          </div>
        </div>
      )}

      {/* Footer Call-to-action */}
      <div className="p-2.5 bg-[#071124] border-t border-blue-500/20 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 text-[11px] truncate">
          Direct URI:{" "}
          <span className="text-blue-400 underline cursor-pointer" onClick={() => handleOpenDoc()}>
            {telemetry.documentUrl || "docs.google.com"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => handleOpenDoc()}
          className="text-blue-300 hover:text-white text-xs inline-flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>Launch Editor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Doc Creation Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md bg-[#070F1E] border border-blue-500/40 rounded-2xl flex flex-col overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.25)] font-sans"
          >
            <div className="p-3.5 bg-[#091529] border-b border-blue-500/20 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2 text-blue-400">
                <FileText className="w-4 h-4" />
                <h3 className="text-xs font-bold text-white">NEW GOOGLE DOCUMENT</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono">
              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Architecture Plan"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Topic / Guidance for JARVIS
                </label>
                <textarea
                  rows={4}
                  placeholder="Briefly describe what JARVIS should research and compose..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full p-3 text-xs bg-black/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || isLoading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isLoading ? "Generating..." : "Generate Doc"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
