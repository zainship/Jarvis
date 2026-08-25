import React from "react";
import {
  PenTool,
  RotateCcw,
  Trash2,
  Sparkles,
  Download,
  Hand,
  Eye,
  Sliders,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { HandTrackingData } from "../types";

export const AIR_DRAW_COLORS = [
  { name: "Arc Cyan", hex: "#38bdf8", ring: "ring-sky-400", shadow: "rgba(56, 189, 248, 0.6)" },
  { name: "Stark Gold", hex: "#fbbf24", ring: "ring-amber-400", shadow: "rgba(251, 191, 36, 0.6)" },
  { name: "Laser Red", hex: "#ef4444", ring: "ring-red-400", shadow: "rgba(239, 68, 68, 0.6)" },
  { name: "Quantum Emerald", hex: "#10b981", ring: "ring-emerald-400", shadow: "rgba(16, 185, 129, 0.6)" },
  { name: "Plasma Purple", hex: "#c084fc", ring: "ring-purple-400", shadow: "rgba(192, 132, 252, 0.6)" },
  { name: "Photon White", hex: "#ffffff", ring: "ring-white", shadow: "rgba(255, 255, 255, 0.6)" },
];

export const STROKE_WIDTHS = [
  { label: "Fine", width: 3, iconSize: "w-1 h-1" },
  { label: "Laser", width: 6, iconSize: "w-2 h-2" },
  { label: "Plasma", width: 12, iconSize: "w-3.5 h-3.5" },
];

interface AirCanvasControlsProps {
  isAirDrawActive: boolean;
  onToggleAirDraw: () => void;
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  drawMode: "laser" | "glow" | "sparkle";
  onChangeDrawMode: (mode: "laser" | "glow" | "sparkle") => void;
  onUndo: () => void;
  onClear: () => void;
  onAnalyzeSketch: () => void;
  onExportDrawing: () => void;
  isAnalyzing: boolean;
  strokeCount: number;
  handState: HandTrackingData | null;
  trackingMode: "all" | "hand_only";
  onToggleTrackingMode: (mode: "all" | "hand_only") => void;
}

export const AirCanvasControls: React.FC<AirCanvasControlsProps> = ({
  isAirDrawActive,
  onToggleAirDraw,
  selectedColor,
  onSelectColor,
  strokeWidth,
  onChangeStrokeWidth,
  drawMode,
  onChangeDrawMode,
  onUndo,
  onClear,
  onAnalyzeSketch,
  onExportDrawing,
  isAnalyzing,
  strokeCount,
  handState,
  trackingMode,
  onToggleTrackingMode,
}) => {
  return (
    <div className="w-full bg-[#0a0a0e]/90 backdrop-blur-md border border-cyan-500/25 rounded-lg p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Left: Mode Switcher (Hand Only Tracking vs All Optics) & Air Draw Main Toggle */}
      <div className="flex items-center gap-2">
        {/* Isolated Hand Tracking Only Selector */}
        <div className="flex items-center bg-black/50 p-0.5 rounded border border-white/10">
          <button
            onClick={() => onToggleTrackingMode("hand_only")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
              trackingMode === "hand_only"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Isolate tracking to your hand movement & gestures only"
          >
            <Hand className="w-3.5 h-3.5 text-cyan-400" />
            <span>HAND ONLY</span>
          </button>

          <button
            onClick={() => onToggleTrackingMode("all")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
              trackingMode === "all"
                ? "bg-slate-800 text-slate-200 border border-white/20 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Track all environment objects, facial biometric lock, and devices"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ALL OPTICS</span>
          </button>
        </div>

        {/* Primary Air-Draw Active Toggle Button */}
        <button
          onClick={onToggleAirDraw}
          className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all font-semibold ${
            isAirDrawActive
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)] animate-pulse"
              : "bg-black/60 text-slate-400 border-white/10 hover:border-cyan-500/40 hover:text-cyan-300"
          }`}
          title="Toggle Air-Draw Laser Canvas (Shortcut: Press 'D')"
        >
          <PenTool className={`w-3.5 h-3.5 ${isAirDrawActive ? "text-emerald-400" : "text-slate-400"}`} />
          <span>{isAirDrawActive ? "AIR-DRAW: ACTIVE" : "AIR-DRAW: STANDBY"}</span>
          <span className="text-[10px] px-1 py-0.2 bg-black/40 rounded border border-white/10 text-slate-300">
            [D]
          </span>
        </button>
      </div>

      {/* Center: Color Palette & Stroke Width */}
      <div className="flex items-center gap-3">
        {/* Colors */}
        <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded border border-white/10">
          <span className="text-[10px] text-slate-400 mr-1 uppercase">Beam:</span>
          {AIR_DRAW_COLORS.map((c) => {
            const isSelected = selectedColor === c.hex;
            return (
              <button
                key={c.hex}
                onClick={() => onSelectColor(c.hex)}
                className={`w-5 h-5 rounded-full border transition-all transform hover:scale-110 ${
                  isSelected ? `scale-110 border-white ring-2 ${c.ring}` : "border-white/20 opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: c.hex,
                  boxShadow: isSelected ? `0 0 10px ${c.shadow}` : "none",
                }}
                title={c.name}
              />
            );
          })}
        </div>

        {/* Thickness */}
        <div className="flex items-center gap-1 bg-black/50 px-1.5 py-1 rounded border border-white/10">
          {STROKE_WIDTHS.map((sw) => {
            const isSelected = strokeWidth === sw.width;
            return (
              <button
                key={sw.width}
                onClick={() => onChangeStrokeWidth(sw.width)}
                className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={`${sw.label} Stroke Width (${sw.width}px)`}
              >
                {sw.label}
              </button>
            );
          })}
        </div>

        {/* Draw FX Mode (Laser / Glow / Sparkle) */}
        <div className="flex items-center gap-1 bg-black/50 px-1.5 py-1 rounded border border-white/10">
          <button
            onClick={() => onChangeDrawMode("laser")}
            className={`px-2 py-0.5 rounded text-[10px] ${
              drawMode === "laser"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Laser
          </button>
          <button
            onClick={() => onChangeDrawMode("sparkle")}
            className={`px-2 py-0.5 rounded text-[10px] ${
              drawMode === "sparkle"
                ? "bg-purple-500/20 text-purple-300 border border-purple-400/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sparkle
          </button>
        </div>
      </div>

      {/* Right: Actions (Undo, Clear, AI Sketch Analysis, Download) & Live Hand Telemetry */}
      <div className="flex items-center gap-2">
        {/* Hand Tracking Telemetry Pill */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded border border-white/10 text-[11px]">
          {handState && handState.isDetected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-300 font-semibold">HAND LOCKED</span>
              <span className="text-slate-400 text-[9px]">
                [{handState.fingertip.x}, {handState.fingertip.y}]
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300/80">RAISE HAND IN VIEW</span>
            </>
          )}
        </div>

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={strokeCount === 0}
          className="p-1.5 bg-black/50 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-white/10 rounded transition-all"
          title="Undo Last Stroke"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Clear */}
        <button
          onClick={onClear}
          disabled={strokeCount === 0}
          className="p-1.5 bg-black/50 hover:bg-red-950/40 hover:text-red-300 disabled:opacity-40 text-slate-300 border border-white/10 rounded transition-all"
          title="Clear Entire Air Drawing"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* JARVIS AI Inspect Sketch */}
        <button
          onClick={onAnalyzeSketch}
          disabled={strokeCount === 0 || isAnalyzing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-sky-500/20 to-cyan-500/20 hover:from-sky-500/30 hover:to-cyan-500/30 border border-sky-400/40 text-sky-300 rounded shadow-md transition-all disabled:opacity-40"
          title="Ask JARVIS AI to inspect and interpret what you drew in the air!"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>{isAnalyzing ? "ANALYZING..." : "AI INSPECT"}</span>
        </button>

        {/* Export / Download Sketch */}
        <button
          onClick={onExportDrawing}
          disabled={strokeCount === 0}
          className="p-1.5 bg-black/50 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-white/10 rounded transition-all"
          title="Download Holographic Air Sketch PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
