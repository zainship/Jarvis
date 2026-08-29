/**
 * J.A.R.V.I.S. 10 User Interfaces Registry
 * Comprehensive metadata, icons, categories, and voice triggers for all 10 HUD systems.
 */

import { JarvisInterfaceId, JarvisInterfaceMeta } from "../types";

export interface JarvisInterfaceDefinition extends JarvisInterfaceMeta {
  iconName: string;
  badge: string;
  description: string;
}

export const JARVIS_INTERFACES: JarvisInterfaceDefinition[] = [
  {
    id: "core",
    name: "Tactical Command Core",
    codename: "HUD-CORE-MK7",
    tagline: "Central Arc Reactor & Neural Voice Console",
    category: "command",
    badge: "MAIN DECK",
    iconName: "Radio",
    description: "Holographic Arc Reactor, 60fps audio waveform visualizer, neural chat stream, real-time search grounding.",
    voiceKeywords: ["core", "command", "main", "reactor", "arc reactor", "home", "central", "tactical core"],
  },
  {
    id: "armor",
    name: "Mark L Nanotech Visor & Armor Suite",
    codename: "STARK-ARMOR-MKL",
    tagline: "First-Person Helmet Visor & Complete Iron Man Suite",
    category: "tactical",
    badge: "MARK L • 50",
    iconName: "Shield",
    description: "First-person Mark L tactical helmet visor HUD, live optics/combat radar, complete suit anatomical nodes, and 6 nanotech weapon morphs.",
    voiceKeywords: ["armor", "suit", "armor diagnostics", "suit telemetry", "repulsor", "nanotech", "mark l", "mark 50", "nanotech visor", "visor", "iron man suite", "complete iron man suite", "helmet", "subsystems", "morphogenesis"],
  },
  {
    id: "satellite",
    name: "Orbital Recon & E.D.I.T.H. Defense",
    codename: "EDITH-LEO-RADAR",
    tagline: "Global Satellite Radar & Intercept Coordinates",
    category: "tactical",
    badge: "450 KM LEO",
    iconName: "Satellite",
    description: "Live 360° tactical radar sweep, GPS target tracking, E.D.I.T.H. drone swarm vectoring, and missile intercept simulations.",
    voiceKeywords: ["satellite", "edith", "radar", "recon", "orbital", "drone swarm", "intercept", "global radar"],
  },
  {
    id: "vitals",
    name: "Sub-Zero Cryo-Biometrics & Vitals",
    codename: "CRYO-BIO-TELEMETRY",
    tagline: "Live Cardio Oscilloscope & Neural Waves",
    category: "operations",
    badge: "BIOMETRICS",
    iconName: "Heart",
    description: "Real-time ECG heart oscilloscope, EEG alpha/beta brainwave tracker, blood SpO2, trauma scanner, and adrenaline cocktail injection.",
    voiceKeywords: ["vitals", "biometrics", "heart", "ecg", "cryo", "health", "medical", "pulse", "trauma scan"],
  },
  {
    id: "schematics",
    name: "Cleanroom Holographic CAD Lab",
    codename: "AUTODESK-STARK-3D",
    tagline: "Interactive 3D Wireframes & Alloy Stress",
    category: "science",
    badge: "CAD LAB",
    iconName: "Box",
    description: "Interactive 3D holographic wireframe canvas, component layer slicing, Titanium-Gold/Vibranium stress testing, and CAD export.",
    voiceKeywords: ["schematics", "cad", "3d", "wireframe", "blueprint", "hologram", "model", "engineering"],
  },
  {
    id: "security",
    name: "Surveillance Overwatch & Sentry",
    codename: "SENTRY-GUARD-PROT",
    tagline: "Optic Vision HUD & Acoustic Tripwires",
    category: "tactical",
    badge: "SENTRY GRID",
    iconName: "ShieldAlert",
    description: "Multi-feed optical surveillance, infrared thermal imaging, facial recognition, acoustic tripwires, and perimeter drone patrols.",
    voiceKeywords: ["security", "sentry", "surveillance", "overwatch", "guard", "camera", "tripwire", "thermal", "room guard"],
  },
  {
    id: "quantum",
    name: "Quantum Computing & Neural Lab",
    codename: "QUBIT-ARRAY-128",
    tagline: "Superconducting Qubits & Gemini Tuning",
    category: "science",
    badge: "128 QUBITS",
    iconName: "Cpu",
    description: "Superconducting qubit entanglement grid, coherence calibration, Gemini neural hyperparameter tuning, and live research dossiers.",
    voiceKeywords: ["quantum", "research", "qubits", "neural lab", "dossier", "science", "feynman", "deep research"],
  },
  {
    id: "productivity",
    name: "Stark Executive Workspace",
    codename: "EXECUTIVE-DECK-V4",
    tagline: "Missions, Timetable & Google Workspace",
    category: "operations",
    badge: "WORKSPACE",
    iconName: "Calendar",
    description: "Tony Stark's daily missions matrix, timetable scheduler, Gmail / Docs / Meet integrations, and flight journal.",
    voiceKeywords: ["productivity", "workspace", "calendar", "tasks", "itinerary", "missions", "schedule", "work"],
  },
  {
    id: "media",
    name: "Sonic Radar, Radio Scanner & Media",
    codename: "DOLBY-ATMOS-MEDIA",
    tagline: "YouTube Visualizer & RF Spectrum Intercept",
    category: "command",
    badge: "HIFI AUDIO",
    iconName: "Music",
    description: "Holographic YouTube player, 5-band audio graphic equalizer, multi-band RF radio frequency interceptor, and Stark Rock jukebox.",
    voiceKeywords: ["media", "radio", "music", "youtube", "sonic", "equalizer", "audio", "jukebox", "rock", "acdc"],
  },
  {
    id: "veronica",
    name: "Veronica Orbital Bay & Hulkbuster",
    codename: "MARK-XLIV-VERONICA",
    tagline: "Heavy Ordnance & House Party Protocol",
    category: "tactical",
    badge: "MARK XLIV",
    iconName: "Flame",
    description: "Orbital containment capsule (Veronica) trajectory simulator, Hulkbuster auto-assembly lock, EMP shockwave, and House Party Protocol.",
    voiceKeywords: ["veronica", "hulkbuster", "heavy ordnance", "mark 44", "house party", "emp", "emergency bay", "lockdown"],
  },
];
