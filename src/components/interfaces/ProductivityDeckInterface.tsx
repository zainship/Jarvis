/**
 * J.A.R.V.I.S. Interface 8: Stark Executive Workspace & Productivity Deck
 * Daily mission timetable, task management, Google Workspace bridges
 * (Gmail, Docs, Meet, Calendar), flight journal, and productivity streak analytics.
 */

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Mail,
  FileText,
  Video,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react";
import { DailyProductivity } from "../DailyProductivity";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";

interface ProductivityDeckInterfaceProps {
  onJarvisSpeak: (text: string) => void;
  onNavigateToResearch?: (topic: string) => void;
  pendingNewTask?: {
    title: string;
    category?: "work" | "research" | "automation" | "personal";
    priority?: "low" | "medium" | "high";
  } | null;
}

export const ProductivityDeckInterface: React.FC<ProductivityDeckInterfaceProps> = ({
  onJarvisSpeak,
  onNavigateToResearch,
  pendingNewTask,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  return (
    <div
      id="jarvis-productivity-deck-interface"
      className="w-full max-w-7xl mx-auto flex flex-col gap-6"
    >
      {/* Top Header Banner */}
      <div
        className="p-5 sm:p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: currentTheme.primaryColor + "40" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{
              backgroundColor: currentTheme.primaryColor + "20",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.primaryColor,
            }}
          >
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Stark Executive Workspace & Productivity
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: currentTheme.primaryColor + "20",
                  borderColor: currentTheme.primaryColor + "60",
                  color: currentTheme.secondaryColor,
                }}
              >
                WORKSPACE ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Mission Scheduling • Google Workspace Integrations • Flight Journaling
            </p>
          </div>
        </div>
      </div>

      {/* Main Productivity Engine */}
      <DailyProductivity
        onJarvisSpeak={onJarvisSpeak}
        onNavigateToResearch={onNavigateToResearch}
        pendingNewTask={pendingNewTask}
      />
    </div>
  );
};
