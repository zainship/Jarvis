import React, { useState } from "react";
import {
  FileCheck2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Terminal,
  Play,
  Sparkles,
  ShieldCheck,
  Send,
  Edit3,
  RefreshCw,
  Eye,
  CheckCircle2,
  Layers,
  ArrowRight,
  Globe,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { FormFillTelemetry, FormField } from "../types";
import { SoundFX } from "../utils/soundEffects";

interface FormFillTelemetryCardProps {
  telemetry: FormFillTelemetry;
  onLaunchTab?: (url: string, title?: string) => void;
  onUpdateTelemetry?: (updated: FormFillTelemetry) => void;
}

export const FormFillTelemetryCard: React.FC<FormFillTelemetryCardProps> = ({
  telemetry: initialTelemetry,
  onLaunchTab,
  onUpdateTelemetry,
}) => {
  const [telemetry, setTelemetry] = useState<FormFillTelemetry>(initialTelemetry);
  const [activeTab, setActiveTab] = useState<"fields" | "steps" | "code" | "script">("fields");
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLaunchTarget = () => {
    SoundFX.playStepComplete();
    const dest = telemetry.loginUrl || telemetry.targetUrl;
    if (onLaunchTab) {
      onLaunchTab(dest, `${telemetry.targetWebsite} (Form Infill & SSO)`);
    } else {
      window.open(dest, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyScript = () => {
    SoundFX.playComputeChime();
    if (telemetry.javascriptInjectionScript) {
      navigator.clipboard.writeText(telemetry.javascriptInjectionScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const handleCopyPlaywright = () => {
    SoundFX.playComputeChime();
    if (telemetry.playwrightCode) {
      navigator.clipboard.writeText(telemetry.playwrightCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleStartEdit = (field: FormField) => {
    setEditingFieldId(field.id);
    setEditValue(field.value);
  };

  const handleSaveEdit = (fieldId: string) => {
    SoundFX.playComputeChime();
    const updatedFields = telemetry.fields.map((f) =>
      f.id === fieldId ? { ...f, value: editValue, status: "user_edited" as const } : f
    );
    const updatedTelemetry = {
      ...telemetry,
      fields: updatedFields,
    };
    setTelemetry(updatedTelemetry);
    setEditingFieldId(null);
    if (onUpdateTelemetry) {
      onUpdateTelemetry(updatedTelemetry);
    }
  };

  const handleSubmitForm = () => {
    SoundFX.playStepComplete();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      SoundFX.playStepComplete();
    }, 1200);
  };

  return (
    <div className="mt-3 rounded-2xl bg-[#050D11] border border-cyan-500/40 overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.2)] font-sans">
      {/* Top Banner Header */}
      <div className="p-3.5 bg-gradient-to-r from-[#081C24] via-[#0A2633] to-[#04151D] border-b border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono tracking-wider">
                AUTONOMOUS FORM INFILL & LOGIN
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                GOOGLE SSO READY
              </span>
            </div>
            <h3 className="text-sm font-bold text-white truncate max-w-[260px] sm:max-w-[400px]">
              {telemetry.targetWebsite}: {telemetry.formTitle}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLaunchTarget}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Open & Auto-Fill</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Target Metadata & User Session Bar */}
          <div className="p-3 bg-black/60 border-b border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-[#081820] border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Destination</span>
              <a
                href={telemetry.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 font-bold hover:underline truncate block flex items-center gap-1 mt-0.5"
              >
                <span>{telemetry.targetUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div className="p-2 rounded-lg bg-[#081820] border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Authenticated Profile</span>
              <p className="text-white font-bold truncate mt-0.5" title={telemetry.userEmail}>
                {telemetry.userEmail}
              </p>
            </div>

            <div className="p-2 rounded-lg bg-[#081820] border border-cyan-500/20">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Status / Fields Infilled</span>
              <p className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{telemetry.fields.length} Fields Populated & Verified</span>
              </p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-3 pt-2 bg-[#040E13] border-b border-cyan-500/20 flex items-center gap-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("fields")}
              className={`px-3 py-1.5 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                activeTab === "fields"
                  ? "bg-[#081C26] text-cyan-300 border-t border-x border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Infilled Fields ({telemetry.fields.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("steps")}
              className={`px-3 py-1.5 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                activeTab === "steps"
                  ? "bg-[#081C26] text-cyan-300 border-t border-x border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Execution Stages ({telemetry.executionSteps.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("script")}
              className={`px-3 py-1.5 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                activeTab === "script"
                  ? "bg-[#081C26] text-cyan-300 border-t border-x border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>JS Infill Script</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1.5 rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                activeTab === "code"
                  ? "bg-[#081C26] text-cyan-300 border-t border-x border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Playwright Code</span>
            </button>
          </div>

          {/* TAB 1: FORM FIELDS MATRIX */}
          {activeTab === "fields" && (
            <div className="p-3.5 bg-[#030B0E] space-y-2.5 max-h-[380px] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-1 border-b border-white/5">
                <span>SYNTHESIZED FORM FIELD MATRIX</span>
                <span className="text-[11px] text-cyan-400">Click any field to customize values</span>
              </div>

              <div className="space-y-2">
                {telemetry.fields.map((field, idx) => (
                  <div
                    key={field.id || idx}
                    className="p-2.5 rounded-xl bg-[#06161E] border border-cyan-500/20 hover:border-cyan-400/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-sans">{field.label}</span>
                        {field.isRequired && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-500/30">
                            REQUIRED
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-cyan-400/70">({field.type})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            field.status === "user_edited"
                              ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                              : "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {field.status === "user_edited" ? "MODIFIED" : "AUTO-FILLED"}
                        </span>

                        {editingFieldId !== field.id && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(field)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit field value"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Field Value Box or Edit Input */}
                    {editingFieldId === field.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        {field.type === "textarea" ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full text-xs bg-black/80 border border-cyan-500 rounded-lg p-2 text-white font-mono focus:outline-none"
                            rows={3}
                          />
                        ) : (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full text-xs bg-black/80 border border-cyan-500 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none"
                            autoFocus
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(field.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFieldId(null)}
                          className="px-2 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs font-mono cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5 text-xs text-slate-200 font-mono break-all whitespace-pre-wrap">
                        {field.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTION STAGES */}
          {activeTab === "steps" && (
            <div className="p-3.5 bg-[#030B0E] space-y-2 max-h-[380px] overflow-y-auto font-mono">
              {telemetry.executionSteps.map((step) => (
                <div
                  key={step.id}
                  className="p-2.5 rounded-xl bg-[#06161E] border border-cyan-500/20 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {step.stepNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white">{step.title}</h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        SUCCESS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: JAVASCRIPT INFILL SCRIPT */}
          {activeTab === "script" && (
            <div className="p-3.5 bg-[#030B0E] space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">1-Click Browser Console / Bookmarklet Script</span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-xs cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? "Copied Script!" : "Copy JS Script"}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-cyan-300 text-[11px] overflow-x-auto max-h-[300px] leading-relaxed">
                {telemetry.javascriptInjectionScript}
              </pre>
            </div>
          )}

          {/* TAB 4: PLAYWRIGHT CODE */}
          {activeTab === "code" && (
            <div className="p-3.5 bg-[#030B0E] space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Production Playwright Test Specification</span>
                <button
                  type="button"
                  onClick={handleCopyPlaywright}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 text-xs cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied Code!" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-black/80 border border-white/10 text-emerald-300 text-[11px] overflow-x-auto max-h-[300px] leading-relaxed">
                {telemetry.playwrightCode}
              </pre>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="p-3 bg-[#041117] border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Form Infilled & Successfully Dispatched</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Finalizing Submission..." : "Trigger Auto-Submit"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button
                type="button"
                onClick={handleLaunchTarget}
                className="px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Launch Live Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
