/**
 * J.A.R.V.I.S. Mark L (Mark 50) Nanotech Visor & Complete Iron Man Suit System
 * First-person tactical helmet HUD, nanotech morphogenesis bay,
 * full-body suit anatomy nodes, weapons test, and flight avionics.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Zap,
  Flame,
  Activity,
  Crosshair,
  Maximize2,
  Minimize2,
  Camera,
  Eye,
  Sliders,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Power,
  Volume2,
  Layers,
  Compass,
  Wind,
  Target,
  Sword,
  Hammer,
  Feather,
  Box,
} from "lucide-react";
import { SoundFX } from "../utils/soundEffects";
import { themeManager, JarvisTheme } from "../utils/themeManager";

export interface MarkLWeaponMorph {
  id: string;
  name: string;
  codename: string;
  nanitesRequired: number; // e.g. 15,000,000
  location: "Right Arm" | "Left Arm" | "Back / Dorsal" | "Shoulders" | "Boots / Legs" | "Chest";
  active: boolean;
  description: string;
  icon: "sword" | "shield" | "hammer" | "wings" | "missiles" | "clamps";
}

const INITIAL_MORPHS: MarkLWeaponMorph[] = [
  {
    id: "energy_blade",
    name: "Nano-Energy Blade",
    codename: "MK-L / BLADE-01",
    nanitesRequired: 12_000_000,
    location: "Right Arm",
    active: false,
    description: "Ionized high-frequency plasma cutting blade formed from right forearm nanite mesh.",
    icon: "sword",
  },
  {
    id: "nano_shield",
    name: "Hexagonal Nano-Shield",
    codename: "MK-L / AEGIS-02",
    nanitesRequired: 25_000_000,
    location: "Left Arm",
    active: false,
    description: "Vibranium-reinforced kinetic energy deflection barrier with shockwave dissipation.",
    icon: "shield",
  },
  {
    id: "battering_rams",
    name: "Dual Battering Rams",
    codename: "MK-L / IMPACT-03",
    nanitesRequired: 30_000_000,
    location: "Left Arm",
    active: false,
    description: "Heavy mass-amplified kinetic hammers for maximum concussive blunt impact.",
    icon: "hammer",
  },
  {
    id: "dorsal_wings",
    name: "Dorsal Flight Wings / Stabilizers",
    codename: "MK-L / AERO-04",
    nanitesRequired: 20_000_000,
    location: "Back / Dorsal",
    active: true,
    description: "Multi-vectored aerodynamic wings and power siphons for hypersonic high-G agility.",
    icon: "wings",
  },
  {
    id: "micro_missiles",
    name: "Shoulder Micro-Missile Silos",
    codename: "MK-L / SWARM-05",
    nanitesRequired: 15_000_000,
    location: "Shoulders",
    active: false,
    description: "Rapid-fire miniature kinetic penetrators with AI trajectory auto-guidance.",
    icon: "missiles",
  },
  {
    id: "foot_clamps",
    name: "Foot Ground-Clamps & Megathruster",
    codename: "MK-L / CLAMP-06",
    nanitesRequired: 18_000_000,
    location: "Boots / Legs",
    active: false,
    description: "Magnetic terrain lock anchors and combined dual-boot megathruster configuration.",
    icon: "clamps",
  },
];

interface SuitBodyNode {
  id: string;
  name: string;
  area: string;
  status: "nominal" | "calibrating" | "warning";
  integrity: number;
  temperature: number;
  power: number;
  description: string;
}

const SUIT_BODY_NODES: SuitBodyNode[] = [
  {
    id: "helmet_visor",
    name: "Mark L Nanotech Helmet & Visor",
    area: "Cranial",
    status: "nominal",
    integrity: 99.4,
    temperature: 38,
    power: 85,
    description: "12K Augmented Reality tactical optical display with neural impulse tracking.",
  },
  {
    id: "rt_core",
    name: "Chest RT Core & Unibeam Matrix",
    area: "Thoracic",
    status: "nominal",
    integrity: 100,
    temperature: 340,
    power: 100,
    description: "Vibranium-Palladium micro-fusion core supplying continuous zero-point energy.",
  },
  {
    id: "right_gauntlet",
    name: "Right Repulsor Gauntlet",
    area: "Right Arm",
    status: "nominal",
    integrity: 97.2,
    temperature: 110,
    power: 90,
    description: "Multi-phase ionized particle beam collimator with morphing energy blade rail.",
  },
  {
    id: "left_gauntlet",
    name: "Left Repulsor Gauntlet & Aegis Shield",
    area: "Left Arm",
    status: "nominal",
    integrity: 96.8,
    temperature: 108,
    power: 90,
    description: "Concussive plasma emitter and deployable hexagonal nano-barrier housing.",
  },
  {
    id: "dorsal_assembly",
    name: "Dorsal Flight Wings & Siphons",
    area: "Dorsal / Back",
    status: "nominal",
    integrity: 98.9,
    temperature: 75,
    power: 80,
    description: "Aerodynamic control surfaces and external electrical power harvest conduits.",
  },
  {
    id: "shoulder_pods",
    name: "Shoulder Micro-Missile Pods",
    area: "Shoulders",
    status: "nominal",
    integrity: 99.0,
    temperature: 52,
    power: 70,
    description: "Concealed 32-round micro-kinetic penetrator launch bays.",
  },
  {
    id: "spine_kinetic",
    name: "Nanotech Spine & Kinetic Mesh",
    area: "Spinal Axis",
    status: "nominal",
    integrity: 98.1,
    temperature: 64,
    power: 75,
    description: "Flexible shape-memory kinetic distribution column absorbing 98% G-force shocks.",
  },
  {
    id: "boot_thrusters",
    name: "Hypersonic Dual Boot Thrusters",
    area: "Lower Limbs",
    status: "nominal",
    integrity: 97.5,
    temperature: 460,
    power: 95,
    description: "Gimbaled zero-point plasma thrusters delivering Mach 5.8 atmospheric propulsion.",
  },
];

interface MarkLNanotechVisorHUDProps {
  onJarvisSpeak: (text: string) => void;
  isFullscreenDefault?: boolean;
}

export const MarkLNanotechVisorHUD: React.FC<MarkLNanotechVisorHUDProps> = ({
  onJarvisSpeak,
  isFullscreenDefault = false,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [viewMode, setViewMode] = useState<"visor_hud" | "suit_schematic" | "morphogenesis">("visor_hud");
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenDefault);

  // Visor Optics / Camera feed states
  const [cameraActive, setCameraActive] = useState(false);
  const [visionFilter, setVisionFilter] = useState<"standard" | "thermal" | "night_vision" | "wireframe">("standard");
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 5 | 10>(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Flight HUD Simulated Telemetry
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [altitude, setAltitude] = useState(32450);
  const [machSpeed, setMachSpeed] = useState(3.4);
  const [gForce, setGForce] = useState(2.8);
  const [throttle, setThrottle] = useState(65);

  // Simulated Combat Targets in Visor HUD
  const [targets, setTargets] = useState([
    { id: "T-01", name: "Hostile Drone Alpha", x: 62, y: 38, distance: 1420, locked: true, health: 100 },
    { id: "T-02", name: "Ballistic Projectile", x: 35, y: 55, distance: 3850, locked: false, health: 100 },
    { id: "T-03", name: "Airborne Bogey Delta", x: 78, y: 65, distance: 5120, locked: false, health: 100 },
  ]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("T-01");

  // Weapons Blast Animations
  const [repulsorFiring, setRepulsorFiring] = useState(false);
  const [unibeamFiring, setUnibeamFiring] = useState(false);
  const [missileFiring, setMissileFiring] = useState(false);
  const [shieldActiveInVisor, setShieldActiveInVisor] = useState(false);

  // Nanotech Stockpile
  const TOTAL_NANITES = 120_000_000;
  const [morphs, setMorphs] = useState<MarkLWeaponMorph[]>(INITIAL_MORPHS);
  const [selectedNode, setSelectedNode] = useState<SuitBodyNode>(SUIT_BODY_NODES[0]);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  // Gyro & Altitude slight dynamic fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setAltitude((prev) => +(prev + (Math.random() - 0.48) * 45).toFixed(0));
      setPitch((prev) => +((Math.random() - 0.5) * 6).toFixed(1));
      setRoll((prev) => +((Math.random() - 0.5) * 4).toFixed(1));
      setGForce((prev) => +(2.8 + (Math.random() - 0.5) * 0.4).toFixed(1));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Camera cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Camera toggle handler
  const handleToggleCamera = async () => {
    SoundFX.playTargetClick();
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      onJarvisSpeak("Optics camera feed disconnected. Switching to synthetic terrain HUD simulation.");
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
        onJarvisSpeak("Helmet optics connected to live optical sensor. Augmented Mark L HUD engaged, sir.");
      } catch (e) {
        console.warn("Camera access denied or unavailable:", e);
        onJarvisSpeak("Unable to access optical sensor. Defaulting to synthetic HUD simulation.");
      }
    }
  };

  // Calculate allocated nanites
  const allocatedNanites = morphs
    .filter((m) => m.active)
    .reduce((acc, m) => acc + m.nanitesRequired, 0);
  const freeNanites = TOTAL_NANITES - allocatedNanites;
  const nanitePercentage = ((freeNanites / TOTAL_NANITES) * 100).toFixed(1);

  // Morph toggle
  const handleToggleMorph = (id: string) => {
    SoundFX.playNaniteMorph();
    const targetMorph = morphs.find((m) => m.id === id);
    if (targetMorph) {
      const nextState = !targetMorph.active;
      if (nextState) {
        onJarvisSpeak(
          `Deploying ${targetMorph.name}, sir. Reallocating ${(targetMorph.nanitesRequired / 1_000_000).toFixed(0)} million nanites to ${targetMorph.location}.`
        );
      } else {
        onJarvisSpeak(`Retracting ${targetMorph.name}. Nanites recalled to primary storage mesh.`);
      }
    }
    setMorphs((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  // Weapon fire handlers
  const handleFireRepulsor = () => {
    SoundFX.playRepulsorBlast();
    setRepulsorFiring(true);
    setTimeout(() => setRepulsorFiring(false), 450);
    onJarvisSpeak("Repulsor blast discharged. 100% target kinetic transfer achieved.");
  };

  const handleFireUnibeam = () => {
    SoundFX.playUnibeamBurst();
    setUnibeamFiring(true);
    setTimeout(() => setUnibeamFiring(false), 900);
    onJarvisSpeak("Unibeam maximum output discharged. Heat dissipation sinks engaged.");
  };

  const handleFireMissiles = () => {
    SoundFX.playLockOnTone();
    setMissileFiring(true);
    setTimeout(() => setMissileFiring(false), 800);
    onJarvisSpeak("Micro-missile swarm launched. Tracking targets on ballistic vectors.");
  };

  const handleToggleShieldInVisor = () => {
    SoundFX.playShieldDeploy();
    const next = !shieldActiveInVisor;
    setShieldActiveInVisor(next);
    if (next) {
      onJarvisSpeak("Deploying nanotech hexagonal shield. Kinetic absorption at maximum.");
    } else {
      onJarvisSpeak("Retracting shield. Power rerouted to repulsor channels.");
    }
  };

  const handleLockTarget = (targetId: string) => {
    SoundFX.playLockOnTone();
    setSelectedTargetId(targetId);
    setTargets((prev) =>
      prev.map((t) => ({ ...t, locked: t.id === targetId }))
    );
    const t = targets.find((x) => x.id === targetId);
    if (t) {
      onJarvisSpeak(`Target locked: ${t.name} at ${t.distance} meters.`);
    }
  };

  return (
    <div
      id="mark-l-nanotech-suite-container"
      className={`w-full transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#030407] p-2 sm:p-4 overflow-y-auto"
          : "max-w-7xl mx-auto flex flex-col gap-6"
      }`}
    >
      {/* Control Banner & Mode Switcher */}
      <div
        className="p-4 sm:p-5 rounded-3xl border bg-[#080a10]/90 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4"
        style={{ borderColor: currentTheme.primaryColor + "40" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{
              backgroundColor: currentTheme.primaryColor + "25",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.primaryColor,
            }}
          >
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Mark L Nanotech Visor & Complete Iron Man Suite
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: currentTheme.primaryColor + "20",
                  borderColor: currentTheme.primaryColor + "60",
                  color: currentTheme.secondaryColor,
                }}
              >
                MARK 50 • NANOTECH
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              First-Person Helmet Visor • {(freeNanites / 1_000_000).toFixed(0)}M / 120M Nanites Active • Weapons Morphogenesis
            </p>
          </div>
        </div>

        {/* View Mode Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-black/50 border border-white/10">
            <button
              onClick={() => {
                SoundFX.playTargetClick();
                setViewMode("visor_hud");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "visor_hud"
                  ? "bg-white/15 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              style={{
                color: viewMode === "visor_hud" ? currentTheme.secondaryColor : undefined,
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visor HUD</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playTargetClick();
                setViewMode("morphogenesis");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "morphogenesis"
                  ? "bg-white/15 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              style={{
                color: viewMode === "morphogenesis" ? currentTheme.secondaryColor : undefined,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nanotech Morph ({morphs.filter((m) => m.active).length}/6)</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playTargetClick();
                setViewMode("suit_schematic");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "suit_schematic"
                  ? "bg-white/15 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              style={{
                color: viewMode === "suit_schematic" ? currentTheme.secondaryColor : undefined,
              }}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Suit Anatomy</span>
            </button>
          </div>

          <button
            onClick={() => {
              SoundFX.playTargetClick();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Visor"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VIEW 1: First-Person Mark L Nanotech Visor HUD Mode */}
      {viewMode === "visor_hud" && (
        <div className="flex flex-col gap-4">
          {/* Top Visor Optics Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleToggleCamera}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  cameraActive
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{cameraActive ? "Live Optics: Active" : "Connect Helmet Camera"}</span>
              </button>

              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
                {(["standard", "thermal", "night_vision", "wireframe"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      SoundFX.playTargetClick();
                      setVisionFilter(filter);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition-all cursor-pointer ${
                      visionFilter === filter
                        ? "bg-white/20 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {filter.replace("_", " ")}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
                {([1, 2, 5, 10] as const).map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      SoundFX.playTargetClick();
                      setZoomLevel(z);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                      zoomLevel === z
                        ? "bg-sky-500/30 text-sky-300 font-bold border border-sky-500/50"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {z}X
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Weapon Trigger Buttons in Visor */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleFireRepulsor}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/60 text-sky-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Fire Repulsor</span>
              </button>

              <button
                onClick={handleFireUnibeam}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/60 text-rose-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Unibeam (100%)</span>
              </button>

              <button
                onClick={handleFireMissiles}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Micro-Missiles</span>
              </button>

              <button
                onClick={handleToggleShieldInVisor}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  shieldActiveInVisor
                    ? "bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{shieldActiveInVisor ? "Shield Armed" : "Deploy Shield"}</span>
              </button>
            </div>
          </div>

          {/* MAIN VISOR HUD CANVAS */}
          <div
            className="relative w-full aspect-[16/9] min-h-[460px] max-h-[75vh] rounded-3xl overflow-hidden border bg-[#020408] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex items-center justify-center select-none"
            style={{
              borderColor: currentTheme.primaryColor + "50",
              boxShadow: `0 0 40px ${currentTheme.primaryColor}20`,
            }}
          >
            {/* Background Feed: Video Camera or Synthetic High-Altitude Flight Sky */}
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                  visionFilter === "thermal"
                    ? "filter hue-rotate-90 contrast-200 saturate-200"
                    : visionFilter === "night_vision"
                    ? "filter brightness-125 contrast-150 sepia hue-rotate-70"
                    : visionFilter === "wireframe"
                    ? "filter invert contrast-200"
                    : ""
                }`}
                style={{ transform: `scale(${zoomLevel})` }}
              />
            ) : (
              <div
                className={`absolute inset-0 w-full h-full overflow-hidden transition-all duration-300 ${
                  visionFilter === "thermal"
                    ? "filter hue-rotate-90 contrast-200 saturate-200"
                    : visionFilter === "night_vision"
                    ? "filter brightness-125 contrast-150 sepia hue-rotate-70"
                    : visionFilter === "wireframe"
                    ? "filter invert contrast-200"
                    : ""
                }`}
                style={{
                  background:
                    "radial-gradient(ellipse at center, #0a192f 0%, #030712 70%, #000000 100%)",
                }}
              >
                {/* Simulated Hypersonic Speed Stars / Clouds */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />
              </div>
            )}

            {/* Repulsor Blasting Flash Effect */}
            {repulsorFiring && (
              <div className="absolute inset-0 z-30 bg-sky-400/40 backdrop-blur-xs animate-ping duration-150 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-white shadow-[0_0_120px_#38bdf8] animate-pulse" />
              </div>
            )}

            {/* Unibeam Mega Plasma Burst Effect */}
            {unibeamFiring && (
              <div className="absolute inset-0 z-30 bg-rose-500/50 backdrop-blur-xs animate-pulse pointer-events-none flex items-center justify-center">
                <div className="w-full h-32 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_150px_#f43f5e]" />
              </div>
            )}

            {/* Shield Barrier Hex Grid Overlay */}
            {shieldActiveInVisor && (
              <div className="absolute inset-0 z-20 pointer-events-none border-4 border-emerald-400/60 rounded-3xl bg-emerald-500/10 backdrop-blur-[1px] shadow-[inset_0_0_60px_rgba(16,185,129,0.3)] animate-pulse flex items-center justify-center">
                <div className="text-emerald-300 font-mono text-xs tracking-widest uppercase bg-black/60 px-4 py-1.5 rounded-full border border-emerald-400/40">
                  🛡️ VIBRANIUM NANOTECH SHIELD ACTIVE • 100% DEFLECTION
                </div>
              </div>
            )}

            {/* AUTHENTIC MARK L VISOR TACTICAL HUD OVERLAY */}
            <div className="absolute inset-0 z-20 pointer-events-none p-6 sm:p-8 flex flex-col justify-between">
              {/* Top Visor Header Telemetry */}
              <div className="flex items-start justify-between">
                {/* Left Telemetry Box */}
                <div className="flex flex-col gap-1 font-mono text-[11px] text-sky-400/90 bg-black/40 p-3 rounded-2xl border border-sky-500/30 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-white tracking-wider">MARK L OPTICS</span>
                  </div>
                  <span>ALT: {altitude} FT (MSL)</span>
                  <span>AIRSPEED: MACH {machSpeed}</span>
                  <span>G-FORCE: {gForce} G</span>
                  <span>PRESSURE: 1.01 ATM</span>
                </div>

                {/* Center Heading Compass */}
                <div className="flex flex-col items-center gap-1 font-mono text-sky-400">
                  <div className="flex items-center gap-4 bg-black/50 px-6 py-1.5 rounded-full border border-sky-500/40 backdrop-blur-md text-xs font-bold">
                    <span className="text-slate-400">W</span>
                    <span className="text-white text-sm">345° NW</span>
                    <span className="text-slate-400">N</span>
                  </div>
                  <span className="text-[10px] text-slate-400">TARGET ACQUISITION MATRIX</span>
                </div>

                {/* Right Telemetry Box */}
                <div className="flex flex-col items-end gap-1 font-mono text-[11px] text-sky-400/90 bg-black/40 p-3 rounded-2xl border border-sky-500/30 backdrop-blur-md text-right">
                  <span className="font-bold text-white tracking-wider">RT CORE POWER</span>
                  <span className="text-emerald-400 font-bold">99.8% STABLE</span>
                  <span>TEMP: 342°C</span>
                  <span style={{ color: currentTheme.secondaryColor }}>
                    NANITES: {(freeNanites / 1_000_000).toFixed(0)}M FREE
                  </span>
                  <span>ZOOM: {zoomLevel}X</span>
                </div>
              </div>

              {/* Center Artificial Horizon & Target Reticles */}
              <div className="relative flex-1 flex items-center justify-center">
                {/* Left Speed Ribbon Altimeter */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 font-mono text-[10px] text-sky-400/80 bg-black/30 p-2 rounded-xl border border-sky-500/20">
                  <span className="text-slate-400 uppercase text-[8px]">MACH</span>
                  <span className="text-xs font-bold text-white">M {machSpeed}</span>
                  <div className="w-8 h-24 bg-sky-950/40 rounded-sm relative overflow-hidden border border-sky-500/30">
                    <div
                      className="absolute bottom-0 w-full bg-sky-500/60 transition-all duration-300"
                      style={{ height: `${(machSpeed / 5.8) * 100}%` }}
                    />
                  </div>
                  <span>5.8 MAX</span>
                </div>

                {/* Right Altitude Ribbon Altimeter */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 font-mono text-[10px] text-sky-400/80 bg-black/30 p-2 rounded-xl border border-sky-500/20">
                  <span className="text-slate-400 uppercase text-[8px]">ALT FT</span>
                  <span className="text-xs font-bold text-white">{altitude}</span>
                  <div className="w-8 h-24 bg-sky-950/40 rounded-sm relative overflow-hidden border border-sky-500/30">
                    <div
                      className="absolute bottom-0 w-full bg-emerald-500/60 transition-all duration-300"
                      style={{ height: `${(altitude / 65000) * 100}%` }}
                    />
                  </div>
                  <span>65K MAX</span>
                </div>

                {/* Central Targeting Reticle & Pitch Horizon Ladder */}
                <div
                  className="relative w-64 h-64 rounded-full border border-sky-500/30 flex items-center justify-center transition-transform duration-300"
                  style={{
                    transform: `rotate(${roll}deg) translateY(${pitch * 2}px)`,
                  }}
                >
                  {/* Outer Reticle Ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-sky-400/40 animate-spin [animation-duration:30s]" />
                  
                  {/* Crosshairs */}
                  <div className="w-full h-px bg-sky-400/30" />
                  <div className="h-full w-px bg-sky-400/30 absolute" />

                  {/* Inner Target Ring */}
                  <div className="w-20 h-20 rounded-full border-2 border-sky-400/80 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-sky-400/80 animate-ping" />
                  </div>

                  {/* Pitch Horizon Ladder Lines */}
                  <div className="absolute -top-12 w-28 h-px bg-sky-400/50 flex justify-between text-[8px] font-mono text-sky-300">
                    <span>+10°</span>
                    <span>+10°</span>
                  </div>
                  <div className="absolute -bottom-12 w-28 h-px bg-sky-400/50 flex justify-between text-[8px] font-mono text-sky-300">
                    <span>-10°</span>
                    <span>-10°</span>
                  </div>
                </div>

                {/* Interactive Simulated Targets in 3D Space */}
                {targets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleLockTarget(t.id)}
                    className="absolute pointer-events-auto cursor-pointer flex flex-col items-center transition-all duration-300 group"
                    style={{ left: `${t.x}%`, top: `${t.y}%` }}
                  >
                    <div
                      className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center transition-all ${
                        t.locked
                          ? "border-rose-500 bg-rose-500/20 shadow-[0_0_20px_#f43f5e] animate-pulse"
                          : "border-amber-400/60 bg-black/40 hover:border-amber-300"
                      }`}
                    >
                      <Crosshair
                        className={`w-5 h-5 ${t.locked ? "text-rose-400" : "text-amber-400"}`}
                      />
                    </div>
                    <div className="mt-1 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[9px] font-mono text-white text-center whitespace-nowrap">
                      <span>{t.name}</span>
                      <span className="block text-slate-400">{t.distance}m</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Visor Subsystem & Weapon Readiness Strip */}
              <div className="flex items-end justify-between border-t border-sky-500/20 pt-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col font-mono text-[10px] text-slate-300">
                    <span className="text-slate-500 uppercase text-[8px]">MORPH SUITE</span>
                    <span className="text-emerald-400 font-bold">
                      {morphs.filter((m) => m.active).length} OF 6 ACTIVE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-black/60 border border-sky-500/30 text-[10px] font-mono text-sky-400">
                    TARGET: {selectedTargetId} LOCKED
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                  <span>VOICE TRIGGER: "JARVIS, FIRE REPULSOR"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Complete Nanotech Weapons Morphogenesis Bay */}
      {viewMode === "morphogenesis" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Nanite Reservoir & Allocation Overview (5 Cols) */}
          <div
            className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-6"
            style={{ borderColor: currentTheme.primaryColor + "30" }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
                  <h3 className="text-base font-bold text-white font-sans">
                    Nanite Stockpile Reservoir
                  </h3>
                </div>
                <span
                  className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: currentTheme.primaryColor + "20",
                    color: currentTheme.secondaryColor,
                  }}
                >
                  {nanitePercentage}% AVAILABLE
                </span>
              </div>

              {/* Big Particle Counter Card */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                  Active Particle Count
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-white tracking-tight">
                    {freeNanites.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-slate-400">/ 120,000,000</span>
                </div>

                {/* Fluid Nanite Progress Bar */}
                <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-700 shadow-md"
                    style={{
                      width: `${nanitePercentage}%`,
                      backgroundColor: currentTheme.primaryColor,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Allocated: {allocatedNanites.toLocaleString()}</span>
                  <span>Available: {freeNanites.toLocaleString()}</span>
                </div>
              </div>

              {/* Nanite Shifting Flow Map */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex flex-col gap-2">
                <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                  Current Nanite Distribution
                </span>
                <div className="flex flex-col gap-1.5 text-xs font-mono">
                  {morphs.filter((m) => m.active).length === 0 ? (
                    <span className="text-slate-500 italic">
                      All nanites condensed inside primary chest RT housing.
                    </span>
                  ) : (
                    morphs
                      .filter((m) => m.active)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5"
                        >
                          <span className="text-white">{m.name}</span>
                          <span className="text-emerald-400 font-bold">
                            {(m.nanitesRequired / 1_000_000).toFixed(0)}M • {m.location}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Rebuild Button */}
            <button
              onClick={() => {
                SoundFX.playComputeChime();
                setMorphs((prev) => prev.map((m) => ({ ...m, active: false })));
                onJarvisSpeak("Recalling all deployed nanite morphs. Stockpile restored to 100% reserve capacity.");
              }}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Recall All Nanites to Core</span>
            </button>
          </div>

          {/* Right: 6 Deployable Nanotech Morphogenesis Modules (7 Cols) */}
          <div
            className="lg:col-span-7 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col gap-4"
            style={{ borderColor: currentTheme.primaryColor + "30" }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Mark L Morphogenesis Arsenal
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Click any module to equip / morph in real-time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {morphs.map((morph) => {
                return (
                  <div
                    key={morph.id}
                    onClick={() => handleToggleMorph(morph.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      morph.active
                        ? "bg-white/10 shadow-xl border-sky-400/80 scale-[1.01]"
                        : "bg-[#0b0e16]/70 hover:bg-white/5 border-white/5 hover:border-white/15"
                    }`}
                    style={{
                      borderColor: morph.active ? currentTheme.primaryColor : undefined,
                      boxShadow: morph.active
                        ? `0 0 20px ${currentTheme.primaryColor}30`
                        : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center border"
                          style={{
                            backgroundColor: morph.active
                              ? currentTheme.primaryColor + "30"
                              : "rgba(255,255,255,0.05)",
                            borderColor: morph.active
                              ? currentTheme.primaryColor
                              : "rgba(255,255,255,0.1)",
                            color: morph.active ? currentTheme.secondaryColor : "#94a3b8",
                          }}
                        >
                          {morph.icon === "sword" && <Sword className="w-4 h-4" />}
                          {morph.icon === "shield" && <Shield className="w-4 h-4" />}
                          {morph.icon === "hammer" && <Hammer className="w-4 h-4" />}
                          {morph.icon === "wings" && <Feather className="w-4 h-4" />}
                          {morph.icon === "missiles" && <Target className="w-4 h-4" />}
                          {morph.icon === "clamps" && <Box className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans">
                            {morph.name}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            {morph.codename}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          morph.active
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-slate-500"
                        }`}
                      >
                        {morph.active ? "EQUIPPED" : "STOWED"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {morph.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] font-mono text-slate-400">
                      <span>Cost: {(morph.nanitesRequired / 1_000_000).toFixed(0)}M Nanites</span>
                      <span className="text-sky-400 font-bold">{morph.location}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Complete Iron Man Suit Anatomy & Node Telemetry */}
      {viewMode === "suit_schematic" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Full Body Suit Anatomy Node Selector (7 Cols) */}
          <div
            className="lg:col-span-7 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col gap-4"
            style={{ borderColor: currentTheme.primaryColor + "30" }}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Mark L Full Suit Anatomical Nodes
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Click any armor section to inspect telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUIT_BODY_NODES.map((node) => {
                const isSelected = selectedNode.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      SoundFX.playTargetClick();
                      setSelectedNode(node);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-white/10 shadow-xl border-sky-400 scale-[1.01]"
                        : "bg-[#0b0e16]/60 hover:bg-white/5 border-white/5 hover:border-white/15"
                    }`}
                    style={{
                      borderColor: isSelected ? currentTheme.primaryColor : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-sans truncate">
                        {node.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {node.integrity}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${node.integrity}%`,
                          backgroundColor: currentTheme.primaryColor,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Area: {node.area}</span>
                      <span>Power: {node.power}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Node Deep Telemetry & Diagnostics (5 Cols) */}
          <div
            className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5"
            style={{ borderColor: currentTheme.primaryColor + "30" }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Node Telemetry Diagnostics
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    backgroundColor: currentTheme.primaryColor + "25",
                    color: currentTheme.secondaryColor,
                  }}
                >
                  {selectedNode.area}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3">
                <h3 className="text-base font-bold text-white font-sans">
                  {selectedNode.name}
                </h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {selectedNode.description}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Integrity</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {selectedNode.integrity}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Thermal Load</span>
                    <span className="text-lg font-mono font-bold text-amber-400">
                      {selectedNode.temperature} °C
                    </span>
                  </div>
                </div>
              </div>

              {/* Power Routing Slider */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                    Power Routing
                  </span>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: currentTheme.secondaryColor }}
                  >
                    {selectedNode.power}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="120"
                  value={selectedNode.power}
                  onChange={(e) => {
                    const newPow = Number(e.target.value);
                    setSelectedNode((prev) => ({ ...prev, power: newPow }));
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  style={{ accentColor: currentTheme.primaryColor }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Voice: "Jarvis, run diagnostics on {selectedNode.area}"</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
