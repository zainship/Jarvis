/**
 * J.A.R.V.I.S. 10 User Interfaces Matrix Modal
 * Interactive holographic switcher showing all 10 operational workstations/UIs
 * with category filtering, search, and live preview badges.
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Layers,
  Radio,
  Shield,
  Satellite,
  Heart,
  Box,
  ShieldAlert,
  Cpu,
  Calendar,
  Music,
  Flame,
  Search,
  Sparkles,
  CheckCircle2,
  Activity,
  Zap,
} from "lucide-react";
import { JARVIS_INTERFACES, JarvisInterfaceDefinition } from "../utils/interfacesRegistry";
import { JarvisInterfaceId } from "../types";
import { SoundFX } from "../utils/soundEffects";
import { themeManager, JarvisTheme } from "../utils/themeManager";

interface InterfaceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeInterface: JarvisInterfaceId;
  onSelectInterface: (id: JarvisInterfaceId) => void;
  onJarvisSpeak: (text: string) => void;
}

const getInterfaceIcon = (id: JarvisInterfaceId) => {
  switch (id) {
    case "core":
      return <Radio className="w-5 h-5" />;
    case "armor":
      return <Shield className="w-5 h-5" />;
    case "satellite":
      return <Satellite className="w-5 h-5" />;
    case "vitals":
      return <Heart className="w-5 h-5" />;
    case "schematics":
      return <Box className="w-5 h-5" />;
    case "security":
      return <ShieldAlert className="w-5 h-5" />;
    case "quantum":
      return <Cpu className="w-5 h-5" />;
    case "productivity":
      return <Calendar className="w-5 h-5" />;
    case "media":
      return <Music className="w-5 h-5" />;
    case "veronica":
      return <Flame className="w-5 h-5" />;
  }
};

export const InterfaceSelectorModal: React.FC<InterfaceSelectorModalProps> = ({
  isOpen,
  onClose,
  activeInterface,
  onSelectInterface,
  onJarvisSpeak,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [categoryFilter, setCategoryFilter] = useState<"all" | "command" | "tactical" | "science" | "operations">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const filteredInterfaces = JARVIS_INTERFACES.filter((iface) => {
    const matchesCat = categoryFilter === "all" || iface.category === categoryFilter;
    const matchesSearch =
      iface.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iface.codename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleSelect = (iface: JarvisInterfaceDefinition) => {
    SoundFX.playTargetClick();
    onSelectInterface(iface.id);
    onJarvisSpeak(`Switching holographic workstation to ${iface.name}, sir.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-[#080a10]/95 border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        style={{
          borderColor: currentTheme.primaryColor + "50",
          boxShadow: `0 0 50px ${currentTheme.primaryColor}20`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center border"
              style={{
                backgroundColor: currentTheme.primaryColor + "20",
                borderColor: currentTheme.primaryColor,
                color: currentTheme.primaryColor,
              }}
            >
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-sans flex items-center gap-2">
                10 J.A.R.V.I.S. Operational User Interfaces
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Switch between 10 dedicated Stark workstations, tactical radars, CAD labs, and biometrics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10">
            {(
              [
                { id: "all", label: "All 10 Interfaces" },
                { id: "command", label: "Command & Core" },
                { id: "tactical", label: "Tactical & Defense" },
                { id: "science", label: "Science & CAD" },
                { id: "operations", label: "Operations & Vitals" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  SoundFX.playTargetClick();
                  setCategoryFilter(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? "bg-white/15 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                style={{
                  color: categoryFilter === cat.id ? currentTheme.secondaryColor : undefined,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search interfaces..."
              className="w-full pl-9.5 pr-4 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 font-mono"
            />
          </div>
        </div>

        {/* 10 Interfaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInterfaces.map((iface, idx) => {
            const isSelected = activeInterface === iface.id;
            return (
              <div
                key={iface.id}
                onClick={() => handleSelect(iface)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative group ${
                  isSelected
                    ? "bg-white/10 shadow-xl"
                    : "bg-[#0b0e16]/80 hover:bg-white/5 border-white/10 hover:border-white/20"
                }`}
                style={{
                  borderColor: isSelected ? currentTheme.primaryColor : undefined,
                  boxShadow: isSelected
                    ? `0 0 25px ${currentTheme.primaryColor}30`
                    : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: currentTheme.primaryColor + "20",
                        borderColor: currentTheme.primaryColor + "50",
                        color: currentTheme.primaryColor,
                      }}
                    >
                      {getInterfaceIcon(iface.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">
                          UI #{idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-white font-sans">
                          {iface.name}
                        </h3>
                      </div>
                      <p className="text-[11px] font-mono" style={{ color: currentTheme.secondaryColor }}>
                        {iface.tagline}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border shrink-0"
                    style={{
                      backgroundColor: currentTheme.primaryColor + "15",
                      borderColor: currentTheme.primaryColor + "40",
                      color: currentTheme.secondaryColor,
                    }}
                  >
                    {iface.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {iface.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
                  <span>Voice: "Jarvis, switch to {iface.voiceKeywords[0]}"</span>
                  {isSelected && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE UI
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Tip: You can say "Jarvis, next interface" or "Jarvis, open [UI Name]" at any time.</span>
          <Sparkles className="w-4 h-4 text-sky-400" />
        </div>
      </div>
    </div>
  );
};
