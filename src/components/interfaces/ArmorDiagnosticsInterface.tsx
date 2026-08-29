/**
 * J.A.R.V.I.S. Interface 2: Armor Diagnostics & Suit Telemetry Matrix
 * Full suit subsystem telemetry, power distribution sliders, thermal heatmaps,
 * thruster calibration, kinetic dampening, and weapons status.
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  Zap,
  Flame,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Power,
  Crosshair,
  Gauge,
  Radio,
  Lock,
  Unlock,
  Volume2,
  Eye,
  Sparkles,
  Layers,
  Compass,
  AlertOctagon,
  Bell,
  BellRing,
  Snowflake,
  Wrench,
  XCircle,
  ThermometerSnowflake,
} from "lucide-react";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";
import { MarkLNanotechVisorHUD } from "../MarkLNanotechVisorHUD";

export interface DiagnosticAlert {
  id: string;
  type: "heat_critical" | "low_power" | "integrity_breach" | "core_overload" | "emp_warning";
  severity: "critical" | "warning" | "advisory";
  subsystemId: string;
  subsystemName: string;
  title: string;
  message: string;
  metric: string;
  timestamp: string;
  acknowledged?: boolean;
}

interface SuitSubsystem {
  id: string;
  name: string;
  category: "power" | "defense" | "propulsion" | "optics" | "weapons";
  integrity: number; // 0-100%
  powerAllocated: number; // 0-100%
  temperature: number; // in Celsius
  status: "nominal" | "calibrating" | "warning" | "overloaded";
  description: string;
}

const INITIAL_SUBSYSTEMS: SuitSubsystem[] = [
  {
    id: "rt_core",
    name: "Chest RT Core Micro-Fusion",
    category: "power",
    integrity: 99.4,
    powerAllocated: 100,
    temperature: 342,
    status: "nominal",
    description: "Vibranium-Palladium isotope zero-point plasma generator.",
  },
  {
    id: "helmet_hud",
    name: "Nanotech Augmented Visor",
    category: "optics",
    integrity: 98.7,
    powerAllocated: 85,
    temperature: 42,
    status: "nominal",
    description: "60 FPS 12K holographic tactical overlay with threat telemetry.",
  },
  {
    id: "repulsor_right",
    name: "Right Repulsor Gauntlet",
    category: "weapons",
    integrity: 96.2,
    powerAllocated: 90,
    temperature: 118,
    status: "nominal",
    description: "Multi-vector ionized muon particle beam projector.",
  },
  {
    id: "repulsor_left",
    name: "Left Repulsor Gauntlet",
    category: "weapons",
    integrity: 95.8,
    powerAllocated: 90,
    temperature: 114,
    status: "nominal",
    description: "Concussive plasma emitter with focused beam collimator.",
  },
  {
    id: "boot_thrusters",
    name: "Dual Boot Vector Thrusters",
    category: "propulsion",
    integrity: 97.9,
    powerAllocated: 95,
    temperature: 480,
    status: "nominal",
    description: "Mach 3.2 hypersonic dual plasma thrusters with gimbal stabilization.",
  },
  {
    id: "kinetic_plating",
    name: "Gold-Titanium Armor Nanites",
    category: "defense",
    integrity: 94.1,
    powerAllocated: 75,
    temperature: 68,
    status: "nominal",
    description: "Dynamic shape-memory kinetic energy absorption plating.",
  },
  {
    id: "stabilizer_flaps",
    name: "Dorsal Aerodynamic Flaps",
    category: "propulsion",
    integrity: 99.1,
    powerAllocated: 60,
    temperature: 55,
    status: "nominal",
    description: "High-G air brake flaps for atmospheric maneuverability.",
  },
  {
    id: "unibeam_lens",
    name: "Chest Unibeam Aperture",
    category: "weapons",
    integrity: 100,
    powerAllocated: 100,
    temperature: 210,
    status: "nominal",
    description: "Direct-core continuous laser unibeam focusing matrix.",
  },
];

interface ArmorDiagnosticsInterfaceProps {
  onJarvisSpeak: (text: string) => void;
}

export const ArmorDiagnosticsInterface: React.FC<ArmorDiagnosticsInterfaceProps> = ({
  onJarvisSpeak,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [activeDeck, setActiveDeck] = useState<"mark_l_suite" | "subsystems_matrix">("mark_l_suite");
  const [subsystems, setSubsystems] = useState<SuitSubsystem[]>(INITIAL_SUBSYSTEMS);
  const [selectedSubsystem, setSelectedSubsystem] = useState<SuitSubsystem>(INITIAL_SUBSYSTEMS[0]);
  const [flightMode, setFlightMode] = useState<"hover" | "supersonic" | "orbital" | "combat">("combat");
  const [weaponsArmed, setWeaponsArmed] = useState(true);
  const [nanoRegenActive, setNanoRegenActive] = useState(false);
  const [overchargeState, setOverchargeState] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [simulationActive, setSimulationActive] = useState<string | null>(null);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  // Periodic subtle telemetry fluctuation for authentic HUD realism
  useEffect(() => {
    const timer = setInterval(() => {
      setSubsystems((prev) =>
        prev.map((sub) => {
          const delta = (Math.random() - 0.5) * 0.4;
          const newIntegrity = Math.min(100, Math.max(70, +(sub.integrity + delta).toFixed(1)));
          return { ...sub, integrity: newIntegrity };
        })
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Compute live diagnostic alerts
  const activeAlerts = useMemo(() => {
    const alerts: DiagnosticAlert[] = [];

    // 1. Check Boot Thrusters and all modules for thermal overload
    subsystems.forEach((sub) => {
      if (sub.temperature >= 450) {
        alerts.push({
          id: `heat_${sub.id}`,
          type: "heat_critical",
          severity: "critical",
          subsystemId: sub.id,
          subsystemName: sub.name,
          title: `THERMAL RUNAWAY EXCEEDED (${sub.temperature}°C)`,
          message: `${sub.name} is operating at dangerous thermal levels exceeding 450°C. Siphon heat dissipation recommended immediately.`,
          metric: `${sub.temperature} °C`,
          timestamp: "LIVE TELEMETRY",
        });
      } else if (sub.temperature >= 350 && sub.id !== "boot_thrusters") {
        alerts.push({
          id: `heat_${sub.id}`,
          type: "heat_critical",
          severity: "warning",
          subsystemId: sub.id,
          subsystemName: sub.name,
          title: `ELEVATED TEMPERATURE ALERT (${sub.temperature}°C)`,
          message: `Thermal dissipation warning on ${sub.name}. Monitor radiator bypass.`,
          metric: `${sub.temperature} °C`,
          timestamp: "LIVE TELEMETRY",
        });
      }

      // 2. Check for severe low power allocation
      if (sub.powerAllocated < 25) {
        alerts.push({
          id: `power_${sub.id}`,
          type: "low_power",
          severity: "critical",
          subsystemId: sub.id,
          subsystemName: sub.name,
          title: `CRITICAL POWER DEFICIT (${sub.powerAllocated}%)`,
          message: `${sub.name} power allocation has fallen below safe operational threshold (25%). Potential brownout imminent.`,
          metric: `${sub.powerAllocated}% POWER`,
          timestamp: "LIVE TELEMETRY",
        });
      }

      // 3. Check for structural breach / low integrity
      if (sub.integrity < 88) {
        alerts.push({
          id: `integ_${sub.id}`,
          type: "integrity_breach",
          severity: "critical",
          subsystemId: sub.id,
          subsystemName: sub.name,
          title: `STRUCTURAL BREACH DETECTED (${sub.integrity}%)`,
          message: `Kinetic nanite mesh compromised on ${sub.name}. Deploy nanite patch to prevent localized hull rupture.`,
          metric: `${sub.integrity}% INTEGRITY`,
          timestamp: "LIVE TELEMETRY",
        });
      }
    });

    // 4. Overcharge caution
    if (overchargeState) {
      alerts.push({
        id: "core_overcharge_alert",
        type: "core_overload",
        severity: "warning",
        subsystemId: "rt_core",
        subsystemName: "Chest RT Core Micro-Fusion",
        title: "RT CORE 125% OVERCHARGE ACTIVE",
        message: "Micro-fusion reactor is pushed beyond rated tolerance. Weapon output +25%, thermal buildup accelerating.",
        metric: "125% OVERCHARGE",
        timestamp: "MANUAL OVERRIDE",
      });
    }

    return alerts.filter((a) => !dismissedAlertIds.includes(a.id));
  }, [subsystems, overchargeState, dismissedAlertIds]);

  const handlePowerChange = (id: string, newPower: number) => {
    SoundFX.playTargetClick();
    setSubsystems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, powerAllocated: newPower } : s))
    );
    if (selectedSubsystem.id === id) {
      setSelectedSubsystem((prev) => ({ ...prev, powerAllocated: newPower }));
    }
  };

  const handleRunFullDiagnostics = () => {
    SoundFX.playComputeChime();
    const msg = `Running full armor diagnostic sweep, sir. All Mark 85 gold-titanium alloys, repulsor channels, and micro-fusion reactors analyzed. ${activeAlerts.length > 0 ? `${activeAlerts.length} diagnostic warnings require attention.` : "All systems nominal."}`;
    onJarvisSpeak(msg);
  };

  const handleToggleWeapons = () => {
    SoundFX.playTargetClick();
    const next = !weaponsArmed;
    setWeaponsArmed(next);
    const msg = next
      ? "Repulsor gauntlets and micro-missile silos armed and locked on target, sir."
      : "Weapons systems safeties engaged. Power rerouted to auxiliary shields.";
    onJarvisSpeak(msg);
  };

  const handleTriggerNanoRegen = () => {
    SoundFX.playComputeChime();
    setNanoRegenActive(true);
    setSubsystems((prev) =>
      prev.map((s) => ({ ...s, integrity: 100, status: "nominal" }))
    );
    setDismissedAlertIds([]);
    onJarvisSpeak("Deploying nanite tissue rebuild protocol. Armor plating and damaged nodes restored to 100% molecular integrity.");
    setTimeout(() => setNanoRegenActive(false), 2500);
  };

  const handleToggleOvercharge = () => {
    SoundFX.playTargetClick();
    const next = !overchargeState;
    setOverchargeState(next);
    if (next) {
      setSubsystems((prev) =>
        prev.map((s) => ({ ...s, powerAllocated: 125, status: "overloaded" }))
      );
      onJarvisSpeak("Warning: RT Core overcharged to 125% capacity. Max firepower unlocked, sir.");
    } else {
      setSubsystems((prev) =>
        prev.map((s) => ({ ...s, powerAllocated: 100, status: "nominal" }))
      );
      onJarvisSpeak("RT Core power levels normalized to standard 100% output.");
    }
  };

  // Quick Action: Auto-Cool a thermal alert
  const handleAutoCoolSubsystem = (subsystemId: string) => {
    SoundFX.playShieldDeploy();
    setSubsystems((prev) =>
      prev.map((s) => (s.id === subsystemId ? { ...s, temperature: 95 } : s))
    );
    const sub = subsystems.find((s) => s.id === subsystemId);
    onJarvisSpeak(`Cryo-siphon coolant dispersed across ${sub?.name || "subsystem"}. Temperature normalized to safe threshold.`);
  };

  // Quick Action: Emergency Power Reroute
  const handleEmergencyPowerRestore = (subsystemId: string) => {
    SoundFX.playTargetClick();
    setSubsystems((prev) =>
      prev.map((s) => (s.id === subsystemId ? { ...s, powerAllocated: 90 } : s))
    );
    const sub = subsystems.find((s) => s.id === subsystemId);
    onJarvisSpeak(`Emergency bus rerouted to ${sub?.name || "subsystem"}. Power restored to 90%.`);
  };

  // Quick Action: Nanite Patch
  const handleNanitePatch = (subsystemId: string) => {
    SoundFX.playNaniteMorph();
    setSubsystems((prev) =>
      prev.map((s) => (s.id === subsystemId ? { ...s, integrity: 100 } : s))
    );
    const sub = subsystems.find((s) => s.id === subsystemId);
    onJarvisSpeak(`Nanite repair matrix applied to ${sub?.name || "subsystem"}. Mesh integrity restored.`);
  };

  // Quick Action: Dismiss
  const handleDismissAlert = (alertId: string) => {
    SoundFX.playTargetClick();
    setDismissedAlertIds((prev) => [...prev, alertId]);
  };

  // Simulation Triggers for testing
  const handleSimulateThermalSpike = () => {
    SoundFX.playLockOnTone();
    setSimulationActive("thermal");
    setDismissedAlertIds((prev) => prev.filter((id) => !id.includes("heat")));
    setSubsystems((prev) =>
      prev.map((s) =>
        s.id === "boot_thrusters"
          ? { ...s, temperature: 620 }
          : s.id === "rt_core"
          ? { ...s, temperature: 485 }
          : s
      )
    );
    onJarvisSpeak("Warning, sir: Thermal runaway simulation initiated on Boot Thrusters and RT Core at 620 degrees.");
  };

  const handleSimulatePowerDrop = () => {
    SoundFX.playLockOnTone();
    setSimulationActive("power");
    setDismissedAlertIds((prev) => prev.filter((id) => !id.includes("power")));
    setSubsystems((prev) =>
      prev.map((s) =>
        s.id === "helmet_hud"
          ? { ...s, powerAllocated: 15 }
          : s.id === "kinetic_plating"
          ? { ...s, powerAllocated: 10 }
          : s
      )
    );
    onJarvisSpeak("Warning: EMP brownout simulated. Augmented Visor and Kinetic Plating dropped below 20% power.");
  };

  const handleSimulateHullBreach = () => {
    SoundFX.playLockOnTone();
    setSimulationActive("breach");
    setDismissedAlertIds((prev) => prev.filter((id) => !id.includes("integ")));
    setSubsystems((prev) =>
      prev.map((s) =>
        s.id === "kinetic_plating"
          ? { ...s, integrity: 68.4 }
          : s.id === "repulsor_left"
          ? { ...s, integrity: 72.1 }
          : s
      )
    );
    onJarvisSpeak("Warning: Heavy kinetic impact simulation triggered. Hull plating compromised at 68% integrity.");
  };

  const handleResetSimulations = () => {
    SoundFX.playComputeChime();
    setSimulationActive(null);
    setDismissedAlertIds([]);
    setSubsystems(INITIAL_SUBSYSTEMS);
    setOverchargeState(false);
    onJarvisSpeak("All diagnostic simulation parameters purged. Telemetry reset to baseline nominal status.");
  };

  const totalIntegrity = (
    subsystems.reduce((acc, s) => acc + s.integrity, 0) / subsystems.length
  ).toFixed(1);

  return (
    <div
      id="jarvis-armor-diagnostics-interface"
      className="w-full max-w-7xl mx-auto flex flex-col gap-6"
    >
      {/* ========================================================================= */}
      {/* PULSING DIAGNOSTIC NOTIFICATION SYSTEM & CRITICAL SYSTEM WARNINGS BAR     */}
      {/* ========================================================================= */}
      {activeAlerts.length > 0 && (
        <div
          id="critical-diagnostic-warnings-panel"
          className="w-full rounded-3xl p-5 sm:p-6 border bg-gradient-to-r from-rose-950/80 via-black/90 to-amber-950/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(244,63,94,0.35)] flex flex-col gap-4 animate-pulse transition-all duration-300"
          style={{
            borderColor: activeAlerts.some((a) => a.severity === "critical")
              ? "rgba(244, 63, 94, 0.8)"
              : "rgba(245, 158, 11, 0.8)",
          }}
        >
          {/* Top Alert Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-500/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_20px_#f43f5e] animate-bounce">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide font-sans flex items-center gap-2">
                    <span>DIAGNOSTIC SYSTEM WARNING:</span>
                    <span className="text-rose-400 font-mono">
                      {activeAlerts.length} CRITICAL {activeAlerts.length === 1 ? "ANOMALY" : "ANOMALIES"}
                    </span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-500/80 text-[10px] font-mono font-bold text-rose-300 uppercase tracking-widest animate-ping">
                    ACTIVE PULSE
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 font-mono mt-0.5">
                  Automated Armor Telemetry Sentry • Real-time Fail-Safe Monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerNanoRegen}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_#f43f5e]"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Execute Universal Nanite Fix</span>
              </button>
            </div>
          </div>

          {/* List of Active Warning Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border backdrop-blur-md flex flex-col justify-between gap-3 transition-all ${
                  alert.severity === "critical"
                    ? "bg-rose-950/40 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                    : "bg-amber-950/40 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {alert.type === "heat_critical" && (
                        <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                      )}
                      {alert.type === "low_power" && (
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                      )}
                      {alert.type === "integrity_breach" && (
                        <Shield className="w-4 h-4 text-rose-400 animate-pulse" />
                      )}
                      {alert.type === "core_overload" && (
                        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                      )}
                      <span className="text-xs font-bold text-white font-sans">
                        {alert.title}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                        alert.severity === "critical"
                          ? "bg-rose-500/20 border-rose-500 text-rose-300"
                          : "bg-amber-500/20 border-amber-500 text-amber-300"
                      }`}
                    >
                      {alert.metric}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                {/* Micro Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs font-mono">
                  <span className="text-[10px] text-slate-400">
                    Target: <strong className="text-white">{alert.subsystemName}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {alert.type === "heat_critical" && (
                      <button
                        onClick={() => handleAutoCoolSubsystem(alert.subsystemId)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 border border-sky-400/50 text-sky-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Snowflake className="w-3 h-3" />
                        <span>Cryo-Cool</span>
                      </button>
                    )}

                    {alert.type === "low_power" && (
                      <button
                        onClick={() => handleEmergencyPowerRestore(alert.subsystemId)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Reroute 90%</span>
                      </button>
                    )}

                    {alert.type === "integrity_breach" && (
                      <button
                        onClick={() => handleNanitePatch(alert.subsystemId)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Patch Mesh</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer transition-all"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Deck Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#080a10]/80 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              SoundFX.playTargetClick();
              setActiveDeck("mark_l_suite");
              onJarvisSpeak("Mark L Nanotech Visor HUD and complete suit interface engaged.");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeDeck === "mark_l_suite"
                ? "bg-white/15 text-white shadow-lg border"
                : "text-slate-400 hover:text-white"
            }`}
            style={{
              borderColor: activeDeck === "mark_l_suite" ? currentTheme.primaryColor : "transparent",
              color: activeDeck === "mark_l_suite" ? currentTheme.secondaryColor : undefined,
            }}
          >
            <Eye className="w-4 h-4" />
            <span>Mark L Nanotech Visor & Suite</span>
          </button>

          <button
            onClick={() => {
              SoundFX.playTargetClick();
              setActiveDeck("subsystems_matrix");
              onJarvisSpeak("Switching to Subsystems Telemetry and Zero-Point Power Matrix.");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeDeck === "subsystems_matrix"
                ? "bg-white/15 text-white shadow-lg border"
                : "text-slate-400 hover:text-white"
            }`}
            style={{
              borderColor: activeDeck === "subsystems_matrix" ? currentTheme.primaryColor : "transparent",
              color: activeDeck === "subsystems_matrix" ? currentTheme.secondaryColor : undefined,
            }}
          >
            <Sliders className="w-4 h-4" />
            <span>Subsystems Telemetry Matrix</span>
          </button>
        </div>

        {/* Action Controls & Simulation Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <span className="text-[9px] font-mono text-slate-400 px-2 uppercase font-bold">Simulate:</span>
            <button
              onClick={handleSimulateThermalSpike}
              className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30 cursor-pointer transition-all"
              title="Simulate 620°C Thermal Runaway on Thrusters"
            >
              🔥 Heat Spike
            </button>
            <button
              onClick={handleSimulatePowerDrop}
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30 cursor-pointer transition-all"
              title="Simulate Power Drop on Visor & Plating"
            >
              ⚡ Power Drop
            </button>
            <button
              onClick={handleSimulateHullBreach}
              className="px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-mono font-bold border border-purple-500/30 cursor-pointer transition-all"
              title="Simulate Kinetic Hull Breach"
            >
              🛡️ Breach
            </button>
            {simulationActive && (
              <button
                onClick={handleResetSimulations}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 cursor-pointer transition-all"
              >
                Reset
              </button>
            )}
          </div>

          <button
            onClick={handleRunFullDiagnostics}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
            <span>Full Sweep</span>
          </button>

          <button
            onClick={handleTriggerNanoRegen}
            disabled={nanoRegenActive}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor + "30",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.secondaryColor,
            }}
          >
            <Zap className={`w-3.5 h-3.5 ${nanoRegenActive ? "animate-spin" : ""}`} />
            <span>{nanoRegenActive ? "Rebuilding..." : "Nanite Repair"}</span>
          </button>
        </div>
      </div>

      {/* RENDER DECK 1: MARK L NANOTECH VISOR & COMPLETE IRON MAN SUITE */}
      {activeDeck === "mark_l_suite" && (
        <MarkLNanotechVisorHUD onJarvisSpeak={onJarvisSpeak} />
      )}

      {/* RENDER DECK 2: SUBSYSTEMS & ZERO-POINT POWER MATRIX */}
      {activeDeck === "subsystems_matrix" && (
        <>
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
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                    Subsystems Load & Power Routing
                  </h2>
                  <span
                    className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                    style={{
                      backgroundColor: currentTheme.primaryColor + "20",
                      borderColor: currentTheme.primaryColor + "60",
                      color: currentTheme.secondaryColor,
                    }}
                  >
                    MARK LXXXV • NOMINAL
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Zero-Point Power Routing • Nanotech Mesh Integrity: {totalIntegrity}% • Real-Time Load Balancer
                </p>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleToggleWeapons}
                className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  weaponsArmed
                    ? "bg-rose-500/20 border-rose-500 text-rose-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>{weaponsArmed ? "Weapons Armed" : "Safeties On"}</span>
              </button>

              <button
                onClick={handleToggleOvercharge}
                className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  overchargeState
                    ? "bg-amber-500/25 border-amber-500 text-amber-300 animate-pulse"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{overchargeState ? "125% Overcharge" : "Normal Load"}</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Workstation Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Visual Suit Schematic & Subsystem Selector (7 Cols) */}
            <div
              className="lg:col-span-7 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col gap-4"
              style={{ borderColor: currentTheme.primaryColor + "30" }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Suit Subsystems & Nanotech Nodes
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Click any module to inspect telemetry
                </span>
              </div>

              {/* Subsystems List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subsystems.map((sub) => {
                  const isSelected = selectedSubsystem.id === sub.id;
                  const hasCriticalHeat = sub.temperature >= 450;
                  const hasLowPower = sub.powerAllocated < 25;
                  const hasBreach = sub.integrity < 88;
                  const hasWarning = hasCriticalHeat || hasLowPower || hasBreach;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        SoundFX.playTargetClick();
                        setSelectedSubsystem(sub);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        hasWarning
                          ? "border-rose-500 bg-rose-950/20 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                          : isSelected
                          ? "bg-white/10 shadow-lg scale-[1.01]"
                          : "bg-[#0b0e16]/60 hover:bg-white/5 border-white/5 hover:border-white/15"
                      }`}
                      style={{
                        borderColor: hasWarning
                          ? "#f43f5e"
                          : isSelected
                          ? currentTheme.primaryColor
                          : undefined,
                        boxShadow: isSelected ? `0 0 15px ${currentTheme.primaryColor}30` : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 truncate">
                          {hasWarning && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                          )}
                          <span className="text-xs font-bold text-white font-sans truncate">
                            {sub.name}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              sub.integrity > 95
                                ? "rgba(16, 185, 129, 0.2)"
                                : sub.integrity >= 88
                                ? "rgba(245, 158, 11, 0.2)"
                                : "rgba(244, 63, 94, 0.3)",
                            color:
                              sub.integrity > 95
                                ? "#34d399"
                                : sub.integrity >= 88
                                ? "#fbbf24"
                                : "#f43f5e",
                          }}
                        >
                          {sub.integrity}%
                        </span>
                      </div>

                      {/* Micro Progress Bar */}
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${sub.integrity}%`,
                            backgroundColor: hasWarning ? "#f43f5e" : currentTheme.primaryColor,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className={sub.powerAllocated < 25 ? "text-amber-400 font-bold" : ""}>
                          Power: {sub.powerAllocated}%
                        </span>
                        <span className={sub.temperature >= 450 ? "text-rose-400 font-bold animate-pulse" : ""}>
                          Temp: {sub.temperature}°C
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Flight Mode Matrix */}
              <div className="mt-3 p-4 rounded-2xl bg-black/30 border border-white/10 flex flex-col gap-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Flight Avionics & Attitude Control
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: "hover", label: "Hover Stabilize", speed: "0-100 Knots" },
                      { id: "supersonic", label: "Supersonic Mach 2", speed: "Mach 2.4" },
                      { id: "orbital", label: "Orbital Escape", speed: "Mach 8.5" },
                      { id: "combat", label: "Combat Evasive", speed: "Dynamic G-Vector" },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        SoundFX.playTargetClick();
                        setFlightMode(mode.id);
                        onJarvisSpeak(`Flight avionics calibrated to ${mode.label} profile.`);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        flightMode === mode.id
                          ? "bg-white/10 font-bold"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-400"
                      }`}
                      style={{
                        borderColor: flightMode === mode.id ? currentTheme.primaryColor : undefined,
                        color: flightMode === mode.id ? currentTheme.secondaryColor : undefined,
                      }}
                    >
                      <span className="text-xs font-sans font-bold">{mode.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{mode.speed}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Selected Subsystem Deep Telemetry & Power Balancer (5 Cols) */}
            <div
              className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5"
              style={{ borderColor: currentTheme.primaryColor + "30" }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Module Telemetry
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                    style={{
                      backgroundColor: currentTheme.primaryColor + "25",
                      color: currentTheme.secondaryColor,
                    }}
                  >
                    {selectedSubsystem.category}
                  </span>
                </div>

                {/* Selected Module Card */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3">
                  <h3 className="text-base font-bold text-white font-sans">
                    {selectedSubsystem.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    {selectedSubsystem.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Integrity</span>
                      <span className={`text-base font-mono font-bold ${selectedSubsystem.integrity < 88 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                        {selectedSubsystem.integrity}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Thermal Load</span>
                      <span className={`text-base font-mono font-bold ${selectedSubsystem.temperature >= 450 ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
                        {selectedSubsystem.temperature} °C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Power Routing Slider */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                      Power Allocation
                    </span>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: currentTheme.secondaryColor }}
                    >
                      {selectedSubsystem.powerAllocated}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={overchargeState ? 150 : 100}
                    value={selectedSubsystem.powerAllocated}
                    onChange={(e) =>
                      handlePowerChange(selectedSubsystem.id, Number(e.target.value))
                    }
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    style={{ accentColor: currentTheme.primaryColor }}
                  />

                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>0% Safe Idle</span>
                    <span>50% Low</span>
                    <span>100% Full Load</span>
                    {overchargeState && <span className="text-amber-400">150% Overcharge</span>}
                  </div>
                </div>
              </div>

              {/* Quick Vocal Trigger Hint */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Say: "Jarvis, reroute 100% power to repulsors"</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

