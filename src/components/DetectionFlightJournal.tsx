import React, { useState } from "react";
import {
  FileText,
  Search,
  Trash2,
  Download,
  CheckCircle2,
  Hand,
  PenTool,
  Target,
  Sparkles,
  Filter,
  Eye,
  UserCheck,
  Laptop,
  Clock,
} from "lucide-react";
import { DetectionLogEntry } from "../types";

interface DetectionFlightJournalProps {
  logs: DetectionLogEntry[];
  onClearLogs: () => void;
  onSelectLog?: (log: DetectionLogEntry) => void;
}

export const DetectionFlightJournal: React.FC<DetectionFlightJournalProps> = ({
  logs,
  onClearLogs,
  onSelectLog,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || log.type === selectedType;
    return matchesSearch && matchesType;
  });

  const exportLogsAsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `jarvis_detection_flight_journal_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getTypeIcon = (type: DetectionLogEntry["type"]) => {
    switch (type) {
      case "hand_tracking":
        return <Hand className="w-3.5 h-3.5 text-cyan-400" />;
      case "air_sketch":
        return <PenTool className="w-3.5 h-3.5 text-emerald-400" />;
      case "face":
        return <UserCheck className="w-3.5 h-3.5 text-sky-400" />;
      case "scan":
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case "manual_lock":
        return <Target className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Eye className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: DetectionLogEntry["type"]) => {
    switch (type) {
      case "hand_tracking":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "air_sketch":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "face":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "scan":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "manual_lock":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050507] text-slate-200 font-mono text-xs overflow-hidden">
      {/* Top Filter and Search Bar */}
      <div className="p-3 border-b border-white/10 bg-[#08080b] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search detection journal logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-black/60 border border-white/10 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/10 text-[10px]">
            {["all", "hand_tracking", "air_sketch", "object", "face", "scan"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2 py-0.5 rounded uppercase transition-all ${
                  selectedType === t
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogsAsJson}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-300 border border-white/10 rounded-lg transition-all"
            title="Export flight journal JSON"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/20 hover:bg-red-900/40 disabled:opacity-40 text-red-300 border border-red-500/20 rounded-lg transition-all"
            title="Purge all detection logs"
          >
            <Trash2 className="w-3 h-3" />
            <span>PURGE</span>
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <FileText className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
            <p className="text-sm font-semibold text-slate-400">No telemetry log entries recorded</p>
            <p className="text-[11px] max-w-sm mt-1">
              Every hand gesture, air drawing, and object locked by the optical matrix will be cataloged here.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              onClick={() => onSelectLog && onSelectLog(log)}
              className="p-2.5 bg-[#0a0a0e] hover:bg-[#0f0f15] border border-white/5 hover:border-cyan-500/30 rounded-lg transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-black/50 border border-white/10 group-hover:border-cyan-500/40 shrink-0">
                  {getTypeIcon(log.type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {log.label}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-mono ${getTypeBadge(log.type)}`}>
                      {log.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      CONF: <span className="text-emerald-400 font-semibold">{log.confidence}%</span>
                    </span>
                  </div>

                  {log.details && (
                    <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5 font-sans">
                      {log.details}
                    </p>
                  )}

                  {log.coordinates && (
                    <span className="text-[9px] text-slate-500 font-mono">
                      COORD: {log.coordinates}
                    </span>
                  )}
                </div>
              </div>

              {/* Timestamp & Sketch Preview if present */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {log.sketchDataUrl && (
                  <img
                    src={log.sketchDataUrl}
                    alt="Air sketch thumbnail"
                    className="w-10 h-8 object-cover rounded border border-cyan-500/40 bg-black"
                  />
                )}
                <div className="text-right text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-[#08080a] border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
        <span>LOGGED ENTRIES: {logs.length}</span>
        <span className="text-cyan-400/80">JARVIS FLIGHT RECORDER ONLINE</span>
      </div>
    </div>
  );
};
