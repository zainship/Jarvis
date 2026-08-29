/**
 * J.A.R.V.I.S. Room Sentry Intrusion Alarm & Autonomous Room Guard Card
 * Provides live optical room surveillance when the user steps away from computer,
 * displaying real-time motion energy levels, auto-armed countdown, active intruder snapshots,
 * and beeping alarm audio synthesizer controls.
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Camera,
  Eye,
  AlertTriangle,
  Radio,
  Clock,
  Trash2,
  Activity,
  UserX,
  Sliders,
  CheckCircle,
  Zap,
} from "lucide-react";
import { RoomSentryState, SentryIntrusionEvent } from "../types";
import { roomSentryManager } from "../utils/roomSentryManager";
import { opticVisionManager } from "../utils/opticVisionManager";
import { SoundFX } from "../utils/soundEffects";

interface RoomSentryCardProps {
  onTriggerAlarmSpeech?: (text: string) => void;
}

export const RoomSentryGuardCard: React.FC<RoomSentryCardProps> = ({ onTriggerAlarmSpeech }) => {
  const [sentryState, setSentryState] = useState<RoomSentryState>(roomSentryManager.getState());
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);

  // Subscribe to roomSentryManager updates
  useEffect(() => {
    const unsub = roomSentryManager.subscribe((st) => {
      setSentryState(st);
    });
    return () => unsub();
  }, []);

  // Bind live video stream when armed / patrolling
  useEffect(() => {
    if (liveVideoRef.current && (sentryState.armed || sentryState.status === "arming")) {
      const stream = opticVisionManager.getStream();
      if (stream && liveVideoRef.current.srcObject !== stream) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }
    }
  }, [sentryState.armed, sentryState.status]);

  const handleArmSentry = async () => {
    await roomSentryManager.armSentry(3);
  };

  const handleDisarmSentry = () => {
    roomSentryManager.disarmSentry();
  };

  const handleSilenceAlarm = () => {
    roomSentryManager.silenceAlarm();
  };

  const handleSimulateTest = () => {
    roomSentryManager.triggerIntrusionProtocol("Manual Sentry Test Intrusion Triggered");
  };

  const isIntruderAlarm = sentryState.status === "intrusion_detected";

  return (
    <div
      id="jarvis-room-sentry-card"
      className={`rounded-2xl border transition-all duration-300 relative overflow-hidden shadow-2xl p-4 sm:p-5 ${
        isIntruderAlarm
          ? "bg-rose-950/40 border-rose-500/80 shadow-[0_0_40px_rgba(244,63,94,0.35)] animate-pulse-subtle"
          : sentryState.armed
          ? "bg-[#080d14] border-sky-500/40 shadow-[0_0_30px_rgba(14,165,233,0.15)]"
          : "bg-[#0A0A0C] border-white/10"
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl border flex items-center justify-center ${
              isIntruderAlarm
                ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-bounce"
                : sentryState.armed
                ? "bg-sky-500/20 border-sky-400 text-sky-400"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            {isIntruderAlarm ? (
              <ShieldAlert className="w-5 h-5" />
            ) : sentryState.armed ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
                Stark Optic Sentry • Room Guard
              </h3>
              <span
                className={`font-mono text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ${
                  isIntruderAlarm
                    ? "bg-rose-500/30 text-rose-300 border-rose-400 animate-ping"
                    : sentryState.armed
                    ? "bg-sky-500/20 text-sky-300 border-sky-400/50"
                    : sentryState.status === "arming"
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/50"
                    : "bg-white/5 text-slate-400 border-white/10"
                }`}
              >
                {sentryState.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Autonomous Optic Eye surveillance when you leave your desk. Beeps if someone enters.
            </p>
          </div>
        </div>

        {/* Primary Action Button (Arm / Disarm / Silence) */}
        <div className="flex items-center gap-2">
          {isIntruderAlarm ? (
            <button
              onClick={handleSilenceAlarm}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/30 cursor-pointer transition-all active:scale-95"
            >
              <VolumeX className="w-4 h-4" />
              <span>Silence Beeping</span>
            </button>
          ) : null}

          {sentryState.armed || sentryState.status === "arming" ? (
            <button
              onClick={handleDisarmSentry}
              className="px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Disarm Sentry</span>
            </button>
          ) : (
            <button
              onClick={handleArmSentry}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/20 cursor-pointer transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Arm Sentry (Away Mode)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Sentry Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-start">
        {/* Left 7 Columns: Video Viewport & Live Motion Radar */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
            {sentryState.armed || isIntruderAlarm ? (
              <>
                <video
                  ref={liveVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Sentry HUD Optical Overlay */}
                <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center gap-1.5 bg-black/70 px-2 py-0.5 rounded border border-sky-500/30 text-sky-300 backdrop-blur-sm">
                      <Radio className="w-3 h-3 animate-pulse text-sky-400" />
                      <span>PERIMETER OPTIC RADAR • 60 FPS</span>
                    </div>

                    <div className="bg-black/70 px-2 py-0.5 rounded border border-white/10 text-slate-300">
                      MOTION SCORE: <strong className="text-white">{sentryState.motionScore}%</strong>
                    </div>
                  </div>

                  {/* Red Intruder Target Box if alarm active */}
                  {isIntruderAlarm && (
                    <motion.div
                      animate={{ scale: [1, 1.02, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="absolute inset-8 border-2 border-rose-500 rounded-lg flex items-center justify-center bg-rose-500/10 pointer-events-none"
                    >
                      <div className="bg-rose-600 text-white font-mono text-xs font-bold px-3 py-1 rounded shadow-lg uppercase tracking-wider">
                        ⚠️ INTRUSION DETECTED • BEEPING ACTIVE
                      </div>
                    </motion.div>
                  )}

                  {/* Bottom HUD Bar */}
                  <div className="flex items-center justify-between font-mono text-[10px] bg-black/75 p-2 rounded-lg border border-white/10 backdrop-blur-sm text-slate-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>STATUS: {isIntruderAlarm ? "ALARM TRIGGERED" : "WATCHING ROOM"}</span>
                    </div>
                    <div className="text-sky-400 font-bold">
                      {sentryState.beepingAlarmEnabled ? "AUDIO ALARM: ARMED" : "AUDIO ALARM: MUTED"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-3">
                <UserX className="w-12 h-12 text-slate-600 stroke-1" />
                <div>
                  <h4 className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Sentry Disarmed
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Click "Arm Sentry" before leaving your computer. JARVIS will use your camera to monitor the room and beep if anyone steps inside.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Trigger Buttons & Settings Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  roomSentryManager.updateSettings({
                    beepingAlarmEnabled: !sentryState.beepingAlarmEnabled,
                  })
                }
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                  sentryState.beepingAlarmEnabled
                    ? "bg-sky-500/20 border-sky-400/50 text-sky-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                {sentryState.beepingAlarmEnabled ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-sky-400" />
                    <span>Alarm Beeps ON</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>Alarm Beeps OFF</span>
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  roomSentryManager.updateSettings({
                    sensitivity:
                      sentryState.sensitivity === "tactical_ultra"
                        ? "low"
                        : sentryState.sensitivity === "low"
                        ? "medium"
                        : sentryState.sensitivity === "medium"
                        ? "high"
                        : "tactical_ultra",
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-sky-400" />
                <span>Sens: {sentryState.sensitivity.toUpperCase()}</span>
              </button>
            </div>

            <button
              onClick={handleSimulateTest}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-400/40 flex items-center gap-1 transition-all cursor-pointer"
              title="Simulate room intruder detection to test beeping"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Test Intrusion Alarm</span>
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Incident Log & Intruder Snapshots */}
        <div className="md:col-span-5 flex flex-col gap-2.5 bg-[#060608] p-3 rounded-xl border border-white/5 h-full">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Intruder Incident Log ({sentryState.history.length})
            </span>
            {sentryState.history.length > 0 && (
              <button
                onClick={() => roomSentryManager.clearHistory()}
                className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {sentryState.history.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-mono text-[11px]">
                No security incidents logged. Perimeter is secure.
              </div>
            ) : (
              sentryState.history.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2 rounded-lg bg-black/60 border border-rose-500/20 hover:border-rose-500/40 flex items-start gap-2 text-xs font-mono transition-all"
                >
                  {evt.capturedSnapshot ? (
                    <img
                      src={evt.capturedSnapshot}
                      alt="Intruder Snapshot"
                      onClick={() => setSelectedSnapshot(evt.capturedSnapshot || null)}
                      className="w-12 h-12 rounded object-cover border border-rose-500/40 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-rose-950/40 border border-rose-500/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400 font-bold text-[10px]">
                        [{evt.threatLevel}] INTRUDER
                      </span>
                      <span className="text-slate-500 text-[10px]">{evt.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] truncate mt-0.5">
                      {evt.details}
                    </p>
                    <span className="text-[9px] text-sky-400 mt-0.5">
                      Confidence: {evt.confidence}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Modal View */}
      <AnimatePresence>
        {selectedSnapshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSnapshot(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0e12] border border-rose-500/50 rounded-2xl p-4 max-w-lg w-full shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-sm font-bold text-rose-400 uppercase">
                  Captured Intruder Snapshot
                </h4>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <img
                src={selectedSnapshot}
                alt="Captured Snapshot"
                className="w-full rounded-xl border border-white/10"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
