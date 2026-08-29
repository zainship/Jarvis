/**
 * J.A.R.V.I.S. Theme Library & Holographic UI Customizer
 * Displays 20 distinct Stark UI themes with live color previews,
 * armor archetypes, instant apply controls, and voice hints.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Palette,
  Check,
  Sparkles,
  Shuffle,
  ChevronRight,
  X,
  Search,
  Zap,
  Shield,
  Compass,
  Cpu,
  Layers,
} from "lucide-react";
import { themeManager, JARVIS_THEMES, JarvisTheme } from "../utils/themeManager";
import { SoundFX } from "../utils/soundEffects";

interface ThemeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeChanged?: (theme: JarvisTheme) => void;
}

export const ThemeLibraryModal: React.FC<ThemeLibraryModalProps> = ({
  isOpen,
  onClose,
  onThemeChanged,
}) => {
  const [activeTheme, setActiveTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [selectedFilter, setSelectedFilter] = useState<"all" | "armor" | "tactical" | "cosmic" | "prototype">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = themeManager.subscribe((theme) => {
      setActiveTheme(theme);
      if (onThemeChanged) onThemeChanged(theme);
    });
    return () => unsub();
  }, [onThemeChanged]);

  if (!isOpen) return null;

  const handleSelectTheme = (theme: JarvisTheme) => {
    themeManager.setTheme(theme.id);
  };

  const handleRandomTheme = () => {
    const themes = themeManager.getAllThemes();
    const otherThemes = themes.filter((t) => t.id !== activeTheme.id);
    const randomTheme = otherThemes[Math.floor(Math.random() * otherThemes.length)];
    if (randomTheme) {
      themeManager.setTheme(randomTheme.id);
    }
  };

  const handleCycleNext = () => {
    themeManager.cycleNextTheme();
  };

  const filteredThemes = JARVIS_THEMES.filter((t) => {
    const matchesCategory = selectedFilter === "all" || t.category === selectedFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.suitArchetype.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (cat: "all" | "armor" | "tactical" | "cosmic" | "prototype") => {
    if (cat === "all") return JARVIS_THEMES.length;
    return JARVIS_THEMES.filter((t) => t.category === cat).length;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl bg-[#090b10] border rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
          style={{ borderColor: activeTheme.primaryColor + "55" }}
        >
          {/* Top Holographic Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/10 bg-[#06080d]/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300"
                style={{
                  backgroundColor: activeTheme.primaryColor + "22",
                  borderColor: activeTheme.primaryColor,
                  borderWidth: 1,
                }}
              >
                <Palette className="w-6 h-6" style={{ color: activeTheme.primaryColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-serif italic text-white font-bold tracking-tight">
                    J.A.R.V.I.S. Theme Matrix
                  </h2>
                  <span
                    className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border tracking-wider"
                    style={{
                      backgroundColor: activeTheme.primaryColor + "20",
                      borderColor: activeTheme.primaryColor + "60",
                      color: activeTheme.secondaryColor,
                    }}
                  >
                    20 Unique Holographic UIs
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Select your preferred Stark HUD aesthetic or simply ask: <span className="text-slate-200 font-mono">"Jarvis, change theme to [Theme Name]"</span>
                </p>
              </div>
            </div>

            {/* Top Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRandomTheme}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Pick a random theme"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Surprise Me</span>
              </button>

              <button
                onClick={handleCycleNext}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Cycle to next UI theme"
              >
                <Layers className="w-3.5 h-3.5" style={{ color: activeTheme.secondaryColor }} />
                <span>Next UI</span>
              </button>

              <button
                onClick={() => {
                  SoundFX.playTargetClick();
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-black/40 border-b border-white/5 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "all", label: "All 20 UIs" },
                  { key: "armor", label: "Armor & Combat" },
                  { key: "tactical", label: "Tactical Recon" },
                  { key: "cosmic", label: "Cosmic & Astral" },
                  { key: "prototype", label: "Prototypes & CAD" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    SoundFX.playTargetClick();
                    setSelectedFilter(key);
                  }}
                  className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[11px] transition-all cursor-pointer ${
                    selectedFilter === key
                      ? "text-white font-bold shadow-sm"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  }`}
                  style={{
                    backgroundColor: selectedFilter === key ? activeTheme.primaryColor + "33" : "transparent",
                    borderColor: selectedFilter === key ? activeTheme.primaryColor : "transparent",
                    borderWidth: 1,
                  }}
                >
                  {label} ({getCategoryCount(key)})
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter 20 themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono w-40 sm:w-48"
              />
            </div>
          </div>

          {/* Theme Cards Grid - 20 Distinct Themes */}
          <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 flex-1">
            {filteredThemes.map((theme, idx) => {
              const isCurrent = activeTheme.id === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between gap-3 overflow-hidden ${
                    isCurrent
                      ? "shadow-[0_0_30px_rgba(0,0,0,0.8)] scale-[1.01]"
                      : "bg-[#0c0e14] hover:bg-[#10141d] border-white/10 hover:border-white/20"
                  }`}
                  style={{
                    backgroundColor: isCurrent ? theme.cardBg : undefined,
                    borderColor: isCurrent ? theme.primaryColor : undefined,
                    boxShadow: isCurrent ? `0 0 25px ${theme.primaryColor}35` : undefined,
                  }}
                >
                  {/* Glowing Edge Accent on Hover/Active */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 transition-all duration-300"
                    style={{
                      background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.accentColor})`,
                      opacity: isCurrent ? 1 : 0.4,
                    }}
                  />

                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: theme.primaryColor + "25",
                          color: theme.primaryColor,
                          border: `1px solid ${theme.primaryColor}55`,
                        }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm font-sans tracking-tight">
                            {theme.name}
                          </h3>
                          {isCurrent && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1"
                              style={{
                                backgroundColor: theme.primaryColor + "30",
                                color: theme.primaryColor,
                                border: `1px solid ${theme.primaryColor}`,
                              }}
                            >
                              <Check className="w-2.5 h-2.5" /> ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mt-0.5">
                          {theme.codename}
                        </span>
                      </div>
                    </div>

                    {/* Suit Archetype Badge */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 shrink-0">
                      {theme.suitArchetype}
                    </span>
                  </div>

                  {/* Theme Description */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 font-sans">
                    {theme.description}
                  </p>

                  {/* Palette Swatches & Apply Trigger */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                    {/* 4 Swatch Circles */}
                    <div className="flex items-center gap-1.5">
                      {theme.previewSwatches.map((colorHex, sIdx) => (
                        <div
                          key={sIdx}
                          className="w-5 h-5 rounded-full border border-black/50 shadow-inner"
                          style={{ backgroundColor: colorHex }}
                          title={`Color ${sIdx + 1}: ${colorHex}`}
                        />
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTheme(theme);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isCurrent
                          ? "text-black shadow-md"
                          : "bg-white/5 hover:bg-white/10 text-slate-300 group-hover:text-white"
                      }`}
                      style={{
                        backgroundColor: isCurrent ? theme.primaryColor : undefined,
                      }}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <span>Apply</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Voice Command Guide */}
          <div className="p-4 bg-[#050608] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>
                Voice Trigger: Say <span className="text-sky-400 font-bold">"Jarvis, change theme to [Theme Name]"</span> (e.g. Midas, Igor, Shotgun, Heartbreaker, Bones, Disco, Nightclub, Edith)
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
            >
              Close Matrix
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
