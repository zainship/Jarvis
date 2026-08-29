/**
 * J.A.R.V.I.S. Interface 6: Surveillance Overwatch & Room Sentry Hub
 * Multi-camera optical surveillance matrix, simulated infrared thermal viewport,
 * acoustic tripwire detector, intruder logs, and sentry drone perimeter scheduler.
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Shield,
  Eye,
  Camera,
  Radio,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCw,
  Bell,
  Activity,
  Flame,
  Volume2,
} from "lucide-react";
import { RoomSentryGuardCard } from "../RoomSentryGuardCard";
import { VisionOpticsHUD } from "../VisionOpticsHUD";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";
import { opticVisionManager } from "../../utils/opticVisionManager";
import { roomSentryManager } from "../../utils/roomSentryManager";

interface SecurityEvent {
  id: string;
  time: string;
  location: string;
  severity: "LOW" | "ELEVATED" | "BREACH";
  details: string;
}

const SAMPLE_SECURITY_LOGS: SecurityEvent[] = [
  {
    id: "sec-1",
    time: "Just now",
    location: "Main Workshop Perimeter",
    severity: "LOW",
    details: "Acoustic audio tripwire active. Background ambient noise 34 dB.",
  },
  {
    id: "sec-2",
    time: "2 mins ago",
    location: "Penthouse Balcony Flight Deck",
    severity: "LOW",
    details: "Optical facial verification recognized Tony Stark. Access granted.",
  },
  {
    id: "sec-3",
    time: "14 mins ago",
    location: "Sub-level 3 Armor Vault",
    severity: "LOW",
    details: "Bio-lock sealed. Pressure and magnetic confinement nominal.",
  },
];

interface SecurityOverwatchInterfaceProps {
  onJarvisSpeak: (text: string) => void;
  onSendMessage?: (msg: string, isVoice?: boolean) => void;
}

export const SecurityOverwatchInterface: React.FC<SecurityOverwatchInterfaceProps> = ({
  onJarvisSpeak,
  onSendMessage,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [thermalModeActive, setThermalModeActive] = useState(false);
  const [logs, setLogs] = useState<SecurityEvent[]>(SAMPLE_SECURITY_LOGS);
  const [perimeterArmStatus, setPerimeterArmStatus] = useState<"ARMED" | "STANDBY">("ARMED");

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  const handleToggleThermal = () => {
    SoundFX.playTargetClick();
    const next = !thermalModeActive;
    setThermalModeActive(next);
    onJarvisSpeak(
      next
        ? "Switching optical feeds to high-gain infrared thermal spectrum, sir."
        : "Reverting surveillance cameras to standard visible light telemetry."
    );
  };

  const handlePerimeterArm = () => {
    SoundFX.playComputeChime();
    const next = perimeterArmStatus === "ARMED" ? "STANDBY" : "ARMED";
    setPerimeterArmStatus(next);
    if (next === "ARMED") {
      roomSentryManager.armSentry(3);
      onJarvisSpeak("Perimeter defense grid armed. Acoustic sensors and facial recognition cameras set to high-alert sentry mode.");
    } else {
      roomSentryManager.disarmSentry();
      onJarvisSpeak("Perimeter sentry disarmed. Standard workshop monitoring active.");
    }
  };

  return (
    <div
      id="jarvis-security-overwatch-interface"
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
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Surveillance Overwatch & Room Sentry Hub
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor:
                    perimeterArmStatus === "ARMED"
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(245, 158, 11, 0.2)",
                  borderColor:
                    perimeterArmStatus === "ARMED" ? "#10b981" : "#f59e0b",
                  color: perimeterArmStatus === "ARMED" ? "#34d399" : "#fbbf24",
                }}
              >
                GRID STATUS: {perimeterArmStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live Webcam Vision • Infrared Thermal Matrix • Acoustic Tripwires
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleThermal}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              thermalModeActive
                ? "bg-rose-500/20 border-rose-500 text-rose-300"
                : "bg-white/5 border-white/10 text-slate-300"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{thermalModeActive ? "Infrared Thermal: ON" : "Thermal Filter"}</span>
          </button>

          <button
            onClick={handlePerimeterArm}
            className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor + "30",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.secondaryColor,
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{perimeterArmStatus === "ARMED" ? "Disarm Sentry" : "Arm Sentry Grid"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Room Sentry Card + Vision Optics + Incident Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Room Sentry & Optic Vision (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <RoomSentryGuardCard onJarvisSpeak={onJarvisSpeak} />
          <VisionOpticsHUD
            onJarvisSpeak={onJarvisSpeak}
            onSendMessage={onSendMessage}
          />
        </div>

        {/* Right Column: Security Incident Feed & Drone Schedule (5 Cols) */}
        <div
          className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Live Intrusion & Sensor Logs
              </span>
              <Bell className="w-4 h-4 text-amber-400" />
            </div>

            <div className="flex flex-col gap-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white font-sans">{log.location}</span>
                    <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>

            {/* Sentry Drone Patrol Telemetry */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                Perimeter Sentry Drone Patrols
              </span>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Patrol Route Alpha: Active</span>
                <span className="text-emerald-400">SECTOR CLEAR</span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "100%", backgroundColor: currentTheme.primaryColor }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Voice: "Jarvis, monitor my room and keep an eye on it"</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
