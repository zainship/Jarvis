/**
 * J.A.R.V.I.S. Interface 10: Veronica Orbital Deployment & Emergency Bay
 * Orbital containment capsule (Veronica) trajectory simulator, Hulkbuster armor
 * auto-assembly sequence, EMP wave discharge test, and House Party Protocol.
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Flame,
  Zap,
  Radio,
  RotateCw,
  AlertTriangle,
  Lock,
  Unlock,
  Crosshair,
  Layers,
  Power,
  Volume2,
} from "lucide-react";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";

interface ArmorPod {
  id: string;
  name: string;
  codename: string;
  status: "ORBITAL_READY" | "DEPLOYING" | "DOCKED";
  structuralWeight: string;
}

const HULKBUSTER_PARTS: ArmorPod[] = [
  { id: "part-1", name: "Heavy Hydraulic Torso Frame", codename: "VERONICA-TORSO-A1", status: "ORBITAL_READY", structuralWeight: "14.2 Tons" },
  { id: "part-2", name: "Reinforced Left Gauntlet & Jackhammer", codename: "VERONICA-LARM-B2", status: "ORBITAL_READY", structuralWeight: "6.8 Tons" },
  { id: "part-3", name: "Reinforced Right Gauntlet & Arc Emitter", codename: "VERONICA-RARM-B3", status: "ORBITAL_READY", structuralWeight: "6.8 Tons" },
  { id: "part-4", name: "Dual Magnetic Locking Leg Struts", codename: "VERONICA-LEGS-C1", status: "ORBITAL_READY", structuralWeight: "18.5 Tons" },
];

interface VeronicaDeploymentInterfaceProps {
  onJarvisSpeak: (text: string) => void;
}

export const VeronicaDeploymentInterface: React.FC<VeronicaDeploymentInterfaceProps> = ({
  onJarvisSpeak,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [isDeployingVeronica, setIsDeployingVeronica] = useState(false);
  const [housePartyActive, setHousePartyActive] = useState(false);
  const [empPulseActive, setEmpPulseActive] = useState(false);
  const [orbitalAltitudeKm, setOrbitalAltitudeKm] = useState(420);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  const handleDeployVeronica = () => {
    SoundFX.playComputeChime();
    setIsDeployingVeronica(true);
    onJarvisSpeak("Deploying Veronica orbital containment capsule. Hulkbuster heavy armor sequence initiating atmospheric re-entry.");
    setTimeout(() => {
      setIsDeployingVeronica(false);
      onJarvisSpeak("Veronica pod docked. Hulkbuster armor envelope locked onto Mark 85 frame.");
    }, 4000);
  };

  const handleHousePartyProtocol = () => {
    SoundFX.playTargetClick();
    const next = !housePartyActive;
    setHousePartyActive(next);
    if (next) {
      onJarvisSpeak("House Party Protocol activated, sir. Scrambling all 35 autonomous Iron Legion suits to your coordinates.");
    } else {
      onJarvisSpeak("House Party Protocol cancelled. Suits returning to subterranean vault holding patterns.");
    }
  };

  const handleTriggerEmp = () => {
    SoundFX.playComputeChime();
    setEmpPulseActive(true);
    onJarvisSpeak("Warning: High-intensity localized EMP shockwave discharged. All external kinetic electronics neutralized.");
    setTimeout(() => setEmpPulseActive(false), 2500);
  };

  return (
    <div
      id="jarvis-veronica-deployment-interface"
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
            <ShieldAlert className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Veronica Orbital Deployment & Emergency Bay
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: "rgba(249, 115, 22, 0.2)",
                  borderColor: "#f97316",
                  color: "#fb923c",
                }}
              >
                HEAVY ORDNANCE • MARK XLIV
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Orbital Containment Pod • Hulkbuster Locking • EMP Wave Discharge
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDeployVeronica}
            disabled={isDeployingVeronica}
            className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: "rgba(249, 115, 22, 0.3)",
              borderColor: "#f97316",
              color: "#ffedd5",
            }}
          >
            <Crosshair className={`w-3.5 h-3.5 ${isDeployingVeronica ? "animate-spin" : ""}`} />
            <span>{isDeployingVeronica ? "Re-entry Trajectory Active..." : "Deploy Veronica"}</span>
          </button>

          <button
            onClick={handleTriggerEmp}
            disabled={empPulseActive}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${empPulseActive ? "animate-pulse" : ""}`} />
            <span>{empPulseActive ? "Discharging EMP..." : "Discharge EMP"}</span>
          </button>

          <button
            onClick={handleHousePartyProtocol}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              housePartyActive
                ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse"
                : "bg-white/5 border-white/10 text-slate-300"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{housePartyActive ? "House Party Active (35 Suits)" : "House Party Protocol"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Hulkbuster Pod Components + Orbital Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pod Components (7 Cols) */}
        <div
          className="lg:col-span-7 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col gap-4"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Veronica Sub-Assembly Pod Modules
            </span>
            <span className="text-[10px] font-mono text-orange-400">
              ORBIT: {orbitalAltitudeKm} KM
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {HULKBUSTER_PARTS.map((part) => (
              <div
                key={part.id}
                className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-sans">{part.name}</h4>
                    <p className="text-[10px] font-mono text-slate-400">{part.codename}</p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {part.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {part.structuralWeight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Override & Containment Matrix (5 Cols) */}
        <div
          className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Orbital Defense Telemetry
              </span>
              <Radio className="w-4 h-4 text-orange-400" />
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white font-sans">
                Orbital Cage Deployment Coordinates
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-500 block">SATELLITE STATUS</span>
                  <span className="text-emerald-400">GEO-STATIONARY</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-500 block">RE-ENTRY TIME</span>
                  <span className="text-slate-200">14.2 SECONDS</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                Emergency Containment Envelope
              </span>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Electrified arc-barrier ring deployed around hostile target to prevent collateral destruction.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Voice: "Jarvis, deploy Veronica"</span>
            <Crosshair className="w-4 h-4 text-orange-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
