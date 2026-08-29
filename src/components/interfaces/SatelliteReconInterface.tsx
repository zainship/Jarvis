/**
 * J.A.R.V.I.S. Interface 3: Orbital Satellite Recon & E.D.I.T.H. Defense Grid
 * Interactive global radar, orbital altitude tracking, GPS target coordinates,
 * drone swarm positioning, missile intercept simulation, and defense grid telemetry.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  Radio,
  Crosshair,
  Satellite,
  ShieldAlert,
  Zap,
  RotateCw,
  Compass,
  MapPin,
  Lock,
  Layers,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";

interface TargetVector {
  id: string;
  name: string;
  lat: number;
  lng: number;
  altitude: string;
  threatLevel: "LOW" | "ELEVATED" | "CRITICAL";
  type: "DRONE_SWARM" | "UNKNOWN_VESSEL" | "SATELLITE_ORBIT" | "GROUND_STATION";
  distanceKm: number;
}

const SAMPLE_TARGETS: TargetVector[] = [
  {
    id: "tg-1",
    name: "Stark Tower Manhattan Array",
    lat: 40.7128,
    lng: -74.006,
    altitude: "420m AGL",
    threatLevel: "LOW",
    type: "GROUND_STATION",
    distanceKm: 12,
  },
  {
    id: "tg-2",
    name: "Sub-Orbital Drone Swarm (E.D.I.T.H.)",
    lat: 34.0522,
    lng: -118.2437,
    altitude: "18,400m MSL",
    threatLevel: "LOW",
    type: "DRONE_SWARM",
    distanceKm: 340,
  },
  {
    id: "tg-3",
    name: "Unidentified High-Mach Incursion",
    lat: 51.5074,
    lng: -0.1278,
    altitude: "32,000m MSL",
    threatLevel: "CRITICAL",
    type: "UNKNOWN_VESSEL",
    distanceKm: 2150,
  },
  {
    id: "tg-4",
    name: "Orbital Recon Satellite Mk-IV",
    lat: 35.6762,
    lng: 139.6503,
    altitude: "450 km LEO",
    threatLevel: "LOW",
    type: "SATELLITE_ORBIT",
    distanceKm: 6800,
  },
];

interface SatelliteReconInterfaceProps {
  onJarvisSpeak: (text: string) => void;
}

export const SatelliteReconInterface: React.FC<SatelliteReconInterfaceProps> = ({
  onJarvisSpeak,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [targets, setTargets] = useState<TargetVector[]>(SAMPLE_TARGETS);
  const [selectedTarget, setSelectedTarget] = useState<TargetVector>(SAMPLE_TARGETS[0]);
  const [isScanning, setIsScanning] = useState(true);
  const [interceptActive, setInterceptActive] = useState(false);
  const [satelliteGridLocked, setSatelliteGridLocked] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  // Animated Radar Canvas Sweep
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 15;

      // Draw concentric radar rings
      ctx.strokeStyle = currentTheme.primaryColor + "35";
      ctx.lineWidth = 1;
      for (let r = radius / 4; r <= radius; r += radius / 4) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Radar rotating sweep wedge
      const sweepGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      sweepGradient.addColorStop(0, currentTheme.primaryColor + "00");
      sweepGradient.addColorStop(1, currentTheme.primaryColor + "40");

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle - 0.5, angle);
      ctx.closePath();
      ctx.fillStyle = sweepGradient;
      ctx.fill();
      ctx.restore();

      // Draw target blips
      targets.forEach((tg, idx) => {
        const blipAngle = (idx * (Math.PI / 2)) + (tg.lat / 90);
        const blipDist = (radius * 0.3) + ((idx % 3) * (radius * 0.25));
        const bx = centerX + Math.cos(blipAngle) * blipDist;
        const by = centerY + Math.sin(blipAngle) * blipDist;

        ctx.fillStyle =
          tg.threatLevel === "CRITICAL"
            ? "#ef4444"
            : tg.threatLevel === "ELEVATED"
            ? "#f59e0b"
            : currentTheme.secondaryColor;

        ctx.beginPath();
        ctx.arc(bx, by, tg.id === selectedTarget.id ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();

        if (tg.id === selectedTarget.id) {
          ctx.strokeStyle = currentTheme.primaryColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(bx, by, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      angle += 0.03;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentTheme, targets, selectedTarget]);

  const handleTriggerSweep = () => {
    SoundFX.playComputeChime();
    setIsScanning(true);
    onJarvisSpeak("Orbital satellite reconnaissance sweep initiated. Locking on 4 active telemetry signatures across global sectors.");
  };

  const handleSimulateIntercept = () => {
    SoundFX.playTargetClick();
    setInterceptActive(true);
    onJarvisSpeak(`E.D.I.T.H. orbital defense drones queued for intercept on ${selectedTarget.name}. Kinetic trajectory calculated.`);
    setTimeout(() => setInterceptActive(false), 3000);
  };

  return (
    <div
      id="jarvis-satellite-recon-interface"
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
            <Satellite className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Orbital Recon & E.D.I.T.H. Defense Grid
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: currentTheme.primaryColor + "20",
                  borderColor: currentTheme.primaryColor + "60",
                  color: currentTheme.secondaryColor,
                }}
              >
                ORBITAL LEO • 450 KM
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live Satellite Telemetry • Drone Swarm Intercept • GPS Target Locking
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTriggerSweep}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
            <span>Rescan Grid</span>
          </button>

          <button
            onClick={handleSimulateIntercept}
            disabled={interceptActive}
            className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor + "30",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.secondaryColor,
            }}
          >
            <Crosshair className={`w-3.5 h-3.5 ${interceptActive ? "animate-spin" : ""}`} />
            <span>{interceptActive ? "Locking Trajectory..." : "Execute Intercept"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Radar Canvas + Target Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Screen (7 Cols) */}
        <div
          className="lg:col-span-7 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Live 360° Tactical Radar Screen
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SWEEP ACTIVE
            </span>
          </div>

          <div className="relative flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10"
              style={{ backgroundColor: "#04060a" }}
            />
          </div>

          {/* Quick Target Chips */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {targets.map((tg) => (
              <button
                key={tg.id}
                onClick={() => {
                  SoundFX.playTargetClick();
                  setSelectedTarget(tg);
                }}
                className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                  selectedTarget.id === tg.id
                    ? "bg-white/10 font-bold"
                    : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                }`}
                style={{
                  borderColor: selectedTarget.id === tg.id ? currentTheme.primaryColor : undefined,
                }}
              >
                <span className="text-[11px] font-sans font-bold truncate">{tg.name}</span>
                <span
                  className="text-[9px] font-mono font-bold"
                  style={{
                    color:
                      tg.threatLevel === "CRITICAL"
                        ? "#f87171"
                        : tg.threatLevel === "ELEVATED"
                        ? "#fbbf24"
                        : "#34d399",
                  }}
                >
                  {tg.threatLevel} THREAT
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Target Intel & Defense Controls (5 Cols) */}
        <div
          className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Target Telemetry Brief
              </span>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                style={{
                  backgroundColor: currentTheme.primaryColor + "25",
                  color: currentTheme.secondaryColor,
                }}
              >
                {selectedTarget.type}
              </span>
            </div>

            {/* Target Spec Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3">
              <h3 className="text-base font-bold text-white font-sans">
                {selectedTarget.name}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-500 block">LAT / LNG</span>
                  <span className="text-slate-200">
                    {selectedTarget.lat.toFixed(4)}°, {selectedTarget.lng.toFixed(4)}°
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-500 block">ALTITUDE</span>
                  <span className="text-slate-200">{selectedTarget.altitude}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-500 block">DISTANCE</span>
                  <span className="text-slate-200">{selectedTarget.distanceKm} KM</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[9px] text-slate-500 block">THREAT LEVEL</span>
                  <span
                    className="font-bold"
                    style={{
                      color:
                        selectedTarget.threatLevel === "CRITICAL"
                          ? "#f87171"
                          : selectedTarget.threatLevel === "ELEVATED"
                          ? "#fbbf24"
                          : "#34d399",
                    }}
                  >
                    {selectedTarget.threatLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Drone Swarm Deployment Telemetry */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                E.D.I.T.H. Satellite Drone Network
              </span>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Active Drones: 32 / 32</span>
                <span className="text-emerald-400">SYNCED (100%)</span>
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
            <span>Voice: "Jarvis, track orbital satellite position"</span>
            <Globe className="w-4 h-4 text-sky-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
