/**
 * J.A.R.V.I.S. Multi-Theme UI Engine & Theme Library Subsystem
 * 
 * Provides 20 distinct, customized Stark Holographic & Tactical UI Themes.
 * Supports real-time theme switching, hands-free voice command reconfiguration,
 * persistent storage, and dynamic CSS custom property injection.
 */

import { SoundFX } from "./soundEffects";

export interface JarvisTheme {
  id: string;
  name: string;
  codename: string;
  suitArchetype: string;
  category: "armor" | "tactical" | "cosmic" | "prototype";
  description: string;
  primaryColor: string; // Hex
  secondaryColor: string; // Hex
  accentColor: string; // Hex
  glowColor: string; // Hex
  bgCanvas: string; // Hex
  cardBg: string; // Hex
  cardBorder: string; // Hex / rgba
  textAccent: string; // Hex
  ambientGlow: string; // CSS radial-gradient
  previewSwatches: [string, string, string, string]; // [primary, secondary, accent, bg]
  voiceKeywords: string[];
}

export const JARVIS_THEMES: JarvisTheme[] = [
  {
    id: "stark_classic",
    name: "Stark Classic Arc",
    codename: "MARK VI • DEFAULT",
    suitArchetype: "Iconic Holographic Arc Core",
    category: "tactical",
    description: "The signature Stark cyan holographic HUD with electric particle glow and deep obsidian contrast.",
    primaryColor: "#0ea5e9", // sky-500
    secondaryColor: "#38bdf8", // sky-400
    accentColor: "#06b6d4", // cyan-500
    glowColor: "rgba(14, 165, 233, 0.4)",
    bgCanvas: "#050506",
    cardBg: "#0A0A0C",
    cardBorder: "rgba(14, 165, 233, 0.25)",
    textAccent: "#38bdf8",
    ambientGlow: "radial-gradient(circle at top, rgba(14,165,233,0.12), transparent 70%)",
    previewSwatches: ["#0ea5e9", "#38bdf8", "#06b6d4", "#050506"],
    voiceKeywords: ["classic", "default", "blue", "cyan", "arc", "stark classic", "mark 6", "mark vi"],
  },
  {
    id: "mark42_gold",
    name: "Mark 42 Bleeding Edge",
    codename: "MARK XLII • PRODIGAL",
    suitArchetype: "Prehensile Titanium Gold & Crimson",
    category: "armor",
    description: "Rich titanium gold HUD vectors paired with deep crimson armor hues and high-energy amber arc glow.",
    primaryColor: "#f59e0b", // amber-500
    secondaryColor: "#fbbf24", // amber-400
    accentColor: "#f43f5e", // rose-500
    glowColor: "rgba(245, 158, 11, 0.45)",
    bgCanvas: "#080504",
    cardBg: "#110b08",
    cardBorder: "rgba(245, 158, 11, 0.3)",
    textAccent: "#fbbf24",
    ambientGlow: "radial-gradient(circle at top, rgba(245,158,11,0.14), rgba(244,63,94,0.06), transparent 70%)",
    previewSwatches: ["#f59e0b", "#fbbf24", "#f43f5e", "#080504"],
    voiceKeywords: ["mark 42", "mark 43", "gold", "crimson", "bleeding edge", "iron man", "red and gold", "amber"],
  },
  {
    id: "stealth_recon",
    name: "Stealth Recon Ops",
    codename: "MARK XV • SNEAKY",
    suitArchetype: "Obsidian Black-Ops Matrix",
    category: "tactical",
    description: "Military-grade tactical stealth matrix with night-vision phosphor emerald accents and matte carbon textures.",
    primaryColor: "#10b981", // emerald-500
    secondaryColor: "#34d399", // emerald-400
    accentColor: "#059669", // emerald-600
    glowColor: "rgba(16, 185, 129, 0.4)",
    bgCanvas: "#030705",
    cardBg: "#08100c",
    cardBorder: "rgba(16, 185, 129, 0.25)",
    textAccent: "#34d399",
    ambientGlow: "radial-gradient(circle at top, rgba(16,185,129,0.12), transparent 70%)",
    previewSwatches: ["#10b981", "#34d399", "#059669", "#030705"],
    voiceKeywords: ["stealth", "recon", "green", "emerald", "matrix", "shadow ops", "sneaky", "night vision"],
  },
  {
    id: "hulkbuster_amber",
    name: "Hulkbuster Heavy Ordnance",
    codename: "MARK XLIV • BUSTER",
    suitArchetype: "Heavy Industrial Armor Frame",
    category: "armor",
    description: "High-torque industrial armor telemetry with hazard orange warnings, heavy reinforced borders, and flame plasma.",
    primaryColor: "#f97316", // orange-500
    secondaryColor: "#fb923c", // orange-400
    accentColor: "#ea580c", // orange-600
    glowColor: "rgba(249, 115, 22, 0.45)",
    bgCanvas: "#0a0604",
    cardBg: "#140c08",
    cardBorder: "rgba(249, 115, 22, 0.3)",
    textAccent: "#fb923c",
    ambientGlow: "radial-gradient(circle at top, rgba(249,115,22,0.15), transparent 70%)",
    previewSwatches: ["#f97316", "#fb923c", "#ea580c", "#0a0604"],
    voiceKeywords: ["hulkbuster", "buster", "orange", "heavy", "industrial", "hazard", "ordnance", "veronica"],
  },
  {
    id: "valkyrie_violet",
    name: "Valkyrie Cosmic Bifrost",
    codename: "MARK L • ASTRAL",
    suitArchetype: "Asgardian Quantum Relic Matrix",
    category: "cosmic",
    description: "Cosmic Amethyst and deep astral violet vectors with ethereal lilac shimmer inspired by celestial technology.",
    primaryColor: "#8b5cf6", // violet-500
    secondaryColor: "#a78bfa", // violet-400
    accentColor: "#c084fc", // purple-400
    glowColor: "rgba(139, 92, 246, 0.4)",
    bgCanvas: "#06040a",
    cardBg: "#0d0914",
    cardBorder: "rgba(139, 92, 246, 0.3)",
    textAccent: "#a78bfa",
    ambientGlow: "radial-gradient(circle at top, rgba(139,92,246,0.15), rgba(192,132,252,0.06), transparent 70%)",
    previewSwatches: ["#8b5cf6", "#a78bfa", "#c084fc", "#06040a"],
    voiceKeywords: ["valkyrie", "violet", "purple", "bifrost", "cosmic", "amethyst", "astral", "nebula violet"],
  },
  {
    id: "silver_centurion",
    name: "Silver Centurion",
    codename: "MARK XXXIII • CHROME",
    suitArchetype: "Polished Platinum & Glacial Ice",
    category: "armor",
    description: "Ultra-sleek polished brushed platinum chrome accented with cryogenic glacial ice-blue holographic lines.",
    primaryColor: "#38bdf8", // sky-400
    secondaryColor: "#e2e8f0", // slate-200
    accentColor: "#94a3b8", // slate-400
    glowColor: "rgba(56, 189, 248, 0.35)",
    bgCanvas: "#06080b",
    cardBg: "#0c1117",
    cardBorder: "rgba(226, 232, 240, 0.25)",
    textAccent: "#e2e8f0",
    ambientGlow: "radial-gradient(circle at top, rgba(56,189,248,0.1), rgba(226,232,240,0.08), transparent 70%)",
    previewSwatches: ["#e2e8f0", "#38bdf8", "#94a3b8", "#06080b"],
    voiceKeywords: ["silver", "centurion", "chrome", "platinum", "glacier", "ice", "white chrome", "mark 33"],
  },
  {
    id: "friday_ruby",
    name: "F.R.I.D.A.Y. AI Protocol",
    codename: "F.R.I.D.A.Y. • V2",
    suitArchetype: "Tactical Ruby Laser Matrix",
    category: "tactical",
    description: "The vibrant crimson and ruby laser UI of Tony Stark's secondary Irish-accented tactical AI system.",
    primaryColor: "#f43f5e", // rose-500
    secondaryColor: "#fb7185", // rose-400
    accentColor: "#e11d48", // rose-600
    glowColor: "rgba(244, 63, 94, 0.4)",
    bgCanvas: "#080305",
    cardBg: "#12070a",
    cardBorder: "rgba(244, 63, 94, 0.3)",
    textAccent: "#fb7185",
    ambientGlow: "radial-gradient(circle at top, rgba(244,63,94,0.14), transparent 70%)",
    previewSwatches: ["#f43f5e", "#fb7185", "#e11d48", "#080305"],
    voiceKeywords: ["friday", "ruby", "red", "rose", "friday ai", "crimson ruby", "laser"],
  },
  {
    id: "deep_space",
    name: "Deep Space Starboost",
    codename: "MARK XXXIX • STARBOOST",
    suitArchetype: "Sub-Orbital Oceanic Space Matrix",
    category: "cosmic",
    description: "Deep oceanic teal and stellar cyan vectors engineered for sub-orbital vacuum and deep space telemetry.",
    primaryColor: "#14b8a6", // teal-500
    secondaryColor: "#2dd4bf", // teal-400
    accentColor: "#06b6d4", // cyan-500
    glowColor: "rgba(20, 184, 166, 0.4)",
    bgCanvas: "#03080a",
    cardBg: "#071216",
    cardBorder: "rgba(20, 184, 166, 0.25)",
    textAccent: "#2dd4bf",
    ambientGlow: "radial-gradient(circle at top, rgba(20,184,166,0.12), rgba(6,182,212,0.06), transparent 70%)",
    previewSwatches: ["#14b8a6", "#2dd4bf", "#06b6d4", "#03080a"],
    voiceKeywords: ["space", "deep space", "starboost", "teal", "oceanic", "nebula", "vacuum", "orbital"],
  },
  {
    id: "whiteout_tactical",
    name: "Cleanroom Blueprint",
    codename: "STARK LAB • CAD BLUEPRINT",
    suitArchetype: "High-Contrast CAD Blueprint",
    category: "prototype",
    description: "Sharp architectural CAD schematic styling with high-contrast arctic white lines and cobalt blueprint grids.",
    primaryColor: "#3b82f6", // blue-500
    secondaryColor: "#60a5fa", // blue-400
    accentColor: "#93c5fd", // blue-300
    glowColor: "rgba(59, 130, 246, 0.35)",
    bgCanvas: "#04060c",
    cardBg: "#080e1a",
    cardBorder: "rgba(59, 130, 246, 0.3)",
    textAccent: "#93c5fd",
    ambientGlow: "radial-gradient(circle at top, rgba(59,130,246,0.15), transparent 70%)",
    previewSwatches: ["#3b82f6", "#60a5fa", "#93c5fd", "#04060c"],
    voiceKeywords: ["blueprint", "whiteout", "cleanroom", "cad", "schematic", "architect", "lab blueprint", "cobalt"],
  },
  {
    id: "quantum_matrix",
    name: "Quantum Microverse",
    codename: "MARK LXXXV • NANO",
    suitArchetype: "Subatomic Particle Accelerator",
    category: "cosmic",
    description: "Hyper-dense subatomic matrix glowing with vibrant acid lime plasma and high-frequency cybernetic yellow.",
    primaryColor: "#84cc16", // lime-500
    secondaryColor: "#a3e635", // lime-400
    accentColor: "#eab308", // yellow-500
    glowColor: "rgba(132, 204, 22, 0.4)",
    bgCanvas: "#050802",
    cardBg: "#0b1205",
    cardBorder: "rgba(132, 204, 22, 0.28)",
    textAccent: "#a3e635",
    ambientGlow: "radial-gradient(circle at top, rgba(132,204,22,0.14), rgba(234,179,8,0.06), transparent 70%)",
    previewSwatches: ["#84cc16", "#a3e635", "#eab308", "#050802"],
    voiceKeywords: ["quantum", "microverse", "lime", "nano", "acid green", "plasma", "antman", "subatomic"],
  },
  {
    id: "midas_sovereign",
    name: "Midas 24K Sovereign",
    codename: "MARK XXI • MIDAS",
    suitArchetype: "High-Altitude Sovereign Gold",
    category: "armor",
    description: "Pure radiant 24-karat solid sovereign gold HUD with warm sunfire amber rings and gilded luxury telemetry.",
    primaryColor: "#eab308", // yellow-500
    secondaryColor: "#fde047", // yellow-300
    accentColor: "#ca8a04", // yellow-600
    glowColor: "rgba(234, 179, 8, 0.45)",
    bgCanvas: "#080702",
    cardBg: "#121005",
    cardBorder: "rgba(234, 179, 8, 0.35)",
    textAccent: "#fde047",
    ambientGlow: "radial-gradient(circle at top, rgba(234,179,8,0.16), transparent 70%)",
    previewSwatches: ["#eab308", "#fde047", "#ca8a04", "#080702"],
    voiceKeywords: ["midas", "24k", "sovereign gold", "pure gold", "mark 21", "yellow", "gold standard"],
  },
  {
    id: "heartbreaker_hyper",
    name: "Heartbreaker Artillery",
    codename: "MARK XVII • ARTILLERY",
    suitArchetype: "Oversized RT Core Resonator",
    category: "armor",
    description: "Vibrant hyper-voltage electric cyan-mint HUD powered by an amplified oversized chest repulsor RT core.",
    primaryColor: "#06b6d4", // cyan-500
    secondaryColor: "#67e8f9", // cyan-300
    accentColor: "#0284c7", // sky-600
    glowColor: "rgba(6, 182, 212, 0.45)",
    bgCanvas: "#020709",
    cardBg: "#061217",
    cardBorder: "rgba(6, 182, 212, 0.3)",
    textAccent: "#67e8f9",
    ambientGlow: "radial-gradient(circle at top, rgba(6,182,212,0.15), rgba(2,132,199,0.08), transparent 70%)",
    previewSwatches: ["#06b6d4", "#67e8f9", "#0284c7", "#020709"],
    voiceKeywords: ["heartbreaker", "artillery", "rt core", "cyan mint", "mark 17", "hyper voltage"],
  },
  {
    id: "shotgun_rapid",
    name: "Shotgun Mach 5",
    codename: "MARK XL • VELOCITY",
    suitArchetype: "Hyper-Velocity Kinetic Interceptor",
    category: "tactical",
    description: "Mach 5 aerodynamic HUD with cool gunmetal slate, supersonic sonic-boom vectors, and steel blue crosshairs.",
    primaryColor: "#64748b", // slate-500
    secondaryColor: "#94a3b8", // slate-400
    accentColor: "#38bdf8", // sky-400
    glowColor: "rgba(100, 116, 139, 0.35)",
    bgCanvas: "#050608",
    cardBg: "#0c0e12",
    cardBorder: "rgba(148, 163, 184, 0.22)",
    textAccent: "#cbd5e1",
    ambientGlow: "radial-gradient(circle at top, rgba(56,189,248,0.08), rgba(100,116,139,0.1), transparent 70%)",
    previewSwatches: ["#64748b", "#94a3b8", "#38bdf8", "#050608"],
    voiceKeywords: ["shotgun", "mach 5", "sonic", "velocity", "gunmetal", "mark 40", "interceptor", "speed"],
  },
  {
    id: "igor_hydraulic",
    name: "Igor Heavy Hydraulic",
    codename: "MARK XXXVIII • IGOR",
    suitArchetype: "Industrial Structural Lifting Rig",
    category: "armor",
    description: "High-load industrial cobalt blue and hazard stripes designed for catastrophic structural load-bearing.",
    primaryColor: "#2563eb", // blue-600
    secondaryColor: "#60a5fa", // blue-400
    accentColor: "#facc15", // yellow-400 (hazard accent)
    glowColor: "rgba(37, 99, 235, 0.45)",
    bgCanvas: "#03060f",
    cardBg: "#070d1e",
    cardBorder: "rgba(37, 99, 235, 0.35)",
    textAccent: "#60a5fa",
    ambientGlow: "radial-gradient(circle at top, rgba(37,99,235,0.16), rgba(250,204,21,0.04), transparent 70%)",
    previewSwatches: ["#2563eb", "#60a5fa", "#facc15", "#03060f"],
    voiceKeywords: ["igor", "hydraulic", "lifting", "industrial blue", "mark 38", "heavy lifter", "blue armor"],
  },
  {
    id: "bones_exoskeleton",
    name: "Bones High-Speed Exoskeleton",
    codename: "MARK XLI • BONES",
    suitArchetype: "Modular Segmented Exoskeleton",
    category: "tactical",
    description: "Matte black carbon fiber weave intersected with piercing solar neon copper vectors and segmented telemetry.",
    primaryColor: "#d97706", // amber-600
    secondaryColor: "#f59e0b", // amber-500
    accentColor: "#78716c", // stone-500
    glowColor: "rgba(217, 119, 6, 0.4)",
    bgCanvas: "#070605",
    cardBg: "#0e0c0a",
    cardBorder: "rgba(217, 119, 6, 0.28)",
    textAccent: "#fbbf24",
    ambientGlow: "radial-gradient(circle at top, rgba(217,119,6,0.12), transparent 70%)",
    previewSwatches: ["#d97706", "#f59e0b", "#78716c", "#070605"],
    voiceKeywords: ["bones", "exoskeleton", "carbon", "segmented", "mark 41", "copper", "black and copper"],
  },
  {
    id: "disco_chameleon",
    name: "Disco Prismatic Camo",
    codename: "MARK XXVII • DISCO",
    suitArchetype: "Adaptive Active Camouflage",
    category: "cosmic",
    description: "Prismatic color-shifting spectrum blending neon magenta, electric turquoise, and chromatic aberration.",
    primaryColor: "#d946ef", // fuchsia-500
    secondaryColor: "#06b6d4", // cyan-500
    accentColor: "#a855f7", // purple-500
    glowColor: "rgba(217, 70, 239, 0.4)",
    bgCanvas: "#080309",
    cardBg: "#110714",
    cardBorder: "rgba(217, 70, 239, 0.3)",
    textAccent: "#f0abfc",
    ambientGlow: "radial-gradient(circle at top, rgba(217,70,239,0.14), rgba(6,182,212,0.08), transparent 70%)",
    previewSwatches: ["#d946ef", "#06b6d4", "#a855f7", "#080309"],
    voiceKeywords: ["disco", "chameleon", "prismatic", "camo", "rainbow", "fuchsia", "cyberpunk", "mark 27"],
  },
  {
    id: "nightclub_shadow",
    name: "Nightclub Tactical Shadow",
    codename: "MARK XVI • NIGHTCLUB",
    suitArchetype: "Midnight Infiltration & Stealth",
    category: "tactical",
    description: "Ultra-dark midnight purple canvas with neon laser pink HUD rings optimized for cloaked night assassinations.",
    primaryColor: "#ec4899", // pink-500
    secondaryColor: "#f472b6", // pink-400
    accentColor: "#701a75", // fuchsia-900
    glowColor: "rgba(236, 72, 153, 0.4)",
    bgCanvas: "#060205",
    cardBg: "#0f050d",
    cardBorder: "rgba(236, 72, 153, 0.28)",
    textAccent: "#f472b6",
    ambientGlow: "radial-gradient(circle at top, rgba(236,72,153,0.12), transparent 70%)",
    previewSwatches: ["#ec4899", "#f472b6", "#701a75", "#060205"],
    voiceKeywords: ["nightclub", "pink", "neon pink", "midnight", "mark 16", "stealth pink", "shadow ops"],
  },
  {
    id: "red_snapper_hazard",
    name: "Red Snapper Disaster Ops",
    codename: "MARK XXXV • HAZARD",
    suitArchetype: "Disaster Rescue & Hazardous Relief",
    category: "prototype",
    description: "High-visibility disaster-relief hazard yellow HUD with emergency distress crimson beacons and rugged frames.",
    primaryColor: "#e11d48", // rose-600
    secondaryColor: "#facc15", // yellow-400
    accentColor: "#ea580c", // orange-600
    glowColor: "rgba(225, 29, 72, 0.42)",
    bgCanvas: "#090303",
    cardBg: "#140606",
    cardBorder: "rgba(225, 29, 72, 0.3)",
    textAccent: "#fde047",
    ambientGlow: "radial-gradient(circle at top, rgba(225,29,72,0.14), rgba(250,204,21,0.06), transparent 70%)",
    previewSwatches: ["#e11d48", "#facc15", "#ea580c", "#090303"],
    voiceKeywords: ["red snapper", "snapper", "disaster", "hazard rescue", "emergency", "mark 35", "rescue"],
  },
  {
    id: "prototype_aluminum",
    name: "Mark II Raw Prototype",
    codename: "MARK II • PROTOTYPE",
    suitArchetype: "Raw Brushed Aircraft Aluminum",
    category: "prototype",
    description: "Riveted bare-metal aircraft aluminum panels with minimalist polar-blue diagnostic readouts.",
    primaryColor: "#94a3b8", // slate-400
    secondaryColor: "#e2e8f0", // slate-200
    accentColor: "#38bdf8", // sky-400
    glowColor: "rgba(148, 163, 184, 0.35)",
    bgCanvas: "#07080a",
    cardBg: "#0e1116",
    cardBorder: "rgba(226, 232, 240, 0.2)",
    textAccent: "#f1f5f9",
    ambientGlow: "radial-gradient(circle at top, rgba(226,232,240,0.1), rgba(56,189,248,0.06), transparent 70%)",
    previewSwatches: ["#94a3b8", "#e2e8f0", "#38bdf8", "#07080a"],
    voiceKeywords: ["prototype", "mark 2", "mark ii", "aluminum", "aircraft", "raw metal", "silver prototype"],
  },
  {
    id: "edith_augmented",
    name: "E.D.I.T.H. Augmented Satellite",
    codename: "E.D.I.T.H. • ORBITAL",
    suitArchetype: "Orbital Tactical Defense Grid",
    category: "cosmic",
    description: "Next-generation augmented eyewear HUD featuring holographic cerulean grids and orbital defense targeting.",
    primaryColor: "#0284c7", // sky-600
    secondaryColor: "#38bdf8", // sky-400
    accentColor: "#f59e0b", // amber-500 (target lock)
    glowColor: "rgba(2, 132, 199, 0.45)",
    bgCanvas: "#020509",
    cardBg: "#050b14",
    cardBorder: "rgba(2, 132, 199, 0.3)",
    textAccent: "#38bdf8",
    ambientGlow: "radial-gradient(circle at top, rgba(2,132,199,0.15), rgba(245,158,11,0.05), transparent 70%)",
    previewSwatches: ["#0284c7", "#38bdf8", "#f59e0b", "#020509"],
    voiceKeywords: ["edith", "glasses", "augmented", "satellite", "orbital grid", "target lock", "even dead im the hero"],
  },
];

type ThemeChangeListener = (theme: JarvisTheme) => void;

class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: JarvisTheme = JARVIS_THEMES[0];
  private listeners: Set<ThemeChangeListener> = new Set();

  private constructor() {
    this.loadInitialTheme();
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  private loadInitialTheme() {
    try {
      const savedId = localStorage.getItem("jarvis_active_theme_id");
      if (savedId) {
        const found = JARVIS_THEMES.find((t) => t.id === savedId);
        if (found) {
          this.currentTheme = found;
        }
      }
    } catch (e) {
      console.warn("Theme storage load notice:", e);
    }
    this.applyCSSVariables(this.currentTheme);
  }

  public subscribe(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.currentTheme);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getTheme(): JarvisTheme {
    return this.currentTheme;
  }

  public getAllThemes(): JarvisTheme[] {
    return [...JARVIS_THEMES];
  }

  public setTheme(themeIdOrName: string): boolean {
    const target = JARVIS_THEMES.find(
      (t) =>
        t.id.toLowerCase() === themeIdOrName.toLowerCase() ||
        t.name.toLowerCase() === themeIdOrName.toLowerCase() ||
        t.codename.toLowerCase().includes(themeIdOrName.toLowerCase())
    );

    if (!target) return false;

    this.currentTheme = target;
    try {
      localStorage.setItem("jarvis_active_theme_id", target.id);
    } catch (e) {}

    this.applyCSSVariables(target);
    SoundFX.playComputeChime();

    this.listeners.forEach((fn) => {
      try {
        fn(target);
      } catch (e) {}
    });

    return true;
  }

  public cycleNextTheme(): JarvisTheme {
    const currentIndex = JARVIS_THEMES.findIndex((t) => t.id === this.currentTheme.id);
    const nextIndex = (currentIndex + 1) % JARVIS_THEMES.length;
    const nextTheme = JARVIS_THEMES[nextIndex];
    this.setTheme(nextTheme.id);
    return nextTheme;
  }

  /**
   * Identifies matching theme from natural voice transcripts
   */
  public findThemeByVoiceQuery(query: string): JarvisTheme | null {
    const lower = query.toLowerCase();

    for (const theme of JARVIS_THEMES) {
      for (const kw of theme.voiceKeywords) {
        if (lower.includes(kw)) {
          return theme;
        }
      }
      if (lower.includes(theme.name.toLowerCase()) || lower.includes(theme.id.toLowerCase())) {
        return theme;
      }
    }

    return null;
  }

  /**
   * Applies CSS Custom Variables to the document root
   */
  private applyCSSVariables(theme: JarvisTheme) {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.primaryColor);
    root.style.setProperty("--theme-secondary", theme.secondaryColor);
    root.style.setProperty("--theme-accent", theme.accentColor);
    root.style.setProperty("--theme-glow", theme.glowColor);
    root.style.setProperty("--theme-bg", theme.bgCanvas);
    root.style.setProperty("--theme-card-bg", theme.cardBg);
    root.style.setProperty("--theme-card-border", theme.cardBorder);
    root.style.setProperty("--theme-text-accent", theme.textAccent);

    // Also update body background
    document.body.style.backgroundColor = theme.bgCanvas;
  }
}

export const themeManager = ThemeManager.getInstance();
