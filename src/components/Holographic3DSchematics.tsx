import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Layers,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Zap,
  Shield,
  Activity,
  Hand,
  Volume2,
  Info,
  Radio,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { SoundFX } from "../utils/soundEffects";
import { HandTrackingData } from "../types";

export interface SchematicModel {
  id: "arc_reactor" | "iron_helmet" | "quantum_tesseract" | "orbital_satellite";
  name: string;
  codename: string;
  description: string;
  category: string;
  powerOutput: string;
  status: string;
  temperature: string;
  components: Array<{
    id: string;
    name: string;
    specs: string;
    offset: [number, number, number]; // Exploded vector [dx, dy, dz]
  }>;
}

export const SCHEMATICS_CATALOG: SchematicModel[] = [
  {
    id: "arc_reactor",
    name: "Arc Reactor Core Mk-85",
    codename: "NEW-ELEMENT-SYNTH-85",
    description: "Vibranium-Palladium isotope micro-fusion core generating zero-point magnetic plasma.",
    category: "POWER SYSTEM",
    powerOutput: "12.4 GW / SEC",
    status: "OPTIMAL (99.8%)",
    temperature: "3,420 K",
    components: [
      { id: "core_ring", name: "Palladium-Isotope Core", specs: "12.4 GW Output | Superheated", offset: [0, 0, 0] },
      { id: "mag_coils", name: "Toroidal Magnetic Coils (x10)", specs: "1.2 Tesla Flux Stabilization", offset: [0, 0, 60] },
      { id: "outer_casing", name: "Vibranium Confinement Ring", specs: "Cryogenic Cooling Shield", offset: [0, 0, -60] },
      { id: "vent_ports", name: "Thermal Exhaust Vents", specs: "Plasma Heat Dissipation", offset: [70, 0, 0] },
    ],
  },
  {
    id: "iron_helmet",
    name: "Mark L Nanotech Visor",
    codename: "NANOTECH-MK-50-OPTICS",
    description: "Neural-link holographic HUD helmet assembly with quantum optic sensors and telepathic link.",
    category: "NEURAL AVIONICS",
    powerOutput: "850 MW",
    status: "ONLINE",
    temperature: "310 K",
    components: [
      { id: "visor_faceplate", name: "Gold-Titanium Faceplate", specs: "Vibranium-Reinforced Nanoweave", offset: [0, 0, 70] },
      { id: "optic_hud", name: "Retinal HUD Projector Grid", specs: "8K Polarized Holographic Array", offset: [0, 20, 30] },
      { id: "cranial_shell", name: "Cranial Armor Matrix", specs: "Kinetic Shock Absorption Layer", offset: [0, -30, -50] },
      { id: "jaw_repulsor", name: "Jawline Filtration & Vents", specs: "Atmospheric & CBRN Filter", offset: [0, -60, 40] },
    ],
  },
  {
    id: "quantum_tesseract",
    name: "4D Quantum Tesseract",
    codename: "HYPERDIMENSIONAL-CUBE",
    description: "Multidimensional energy matrix warping space-time coordinates across 4 physical dimensions.",
    category: "SPATIAL ENGINE",
    powerOutput: "SINGULARITY LEVEL",
    status: "CONTAINMENT ACTIVE",
    temperature: "0.04 K (Near Absolute Zero)",
    components: [
      { id: "inner_cube", name: "Hypercube Sub-Core", specs: "4D Zero-Point Energy Node", offset: [0, 0, 0] },
      { id: "outer_manifold", name: "Quantum Barrier Manifold", specs: "Dimensional Phase-Lock Grid", offset: [40, 40, 40] },
      { id: "flux_vertices", name: "8-Vertex Energy Beams", specs: "Spacetime Metric Stabilizers", offset: [-40, -40, -40] },
    ],
  },
  {
    id: "orbital_satellite",
    name: "Veronica Orbital Platform",
    codename: "STARK-SATELLITE-ARRAY",
    description: "Low-Earth orbit defense transceiver deploying Mark XLIV orbital drop pods and satellite telemetry.",
    category: "ORBITAL DEFENSE",
    powerOutput: "4.2 GW (Solar Array)",
    status: "ORBIT: 420 KM",
    temperature: "180 K",
    components: [
      { id: "sat_body", name: "Telemetry Command Hub", specs: "Quantum Encryption Link", offset: [0, 0, 0] },
      { id: "solar_wings", name: "Dual Photovoltaic Arrays", specs: "High-Efficiency Silicon Cells", offset: [80, 0, 0] },
      { id: "orbital_radar", name: "Deep-Space Radar Dish", specs: "Multi-Spectrum Lidar Sweep", offset: [0, -70, 0] },
      { id: "drop_bay", name: "Hulkbuster Deployment Bay", specs: "Magnetic Launch Rail", offset: [0, 60, 0] },
    ],
  },
];

interface Holographic3DSchematicsProps {
  handData?: HandTrackingData | null;
  onJarvisSpeak: (text: string) => void;
}

export const Holographic3DSchematics: React.FC<Holographic3DSchematicsProps> = ({
  handData,
  onJarvisSpeak,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [hologramColor, setHologramColor] = useState<string>("#38bdf8"); // Arc Cyan

  // Rotation Euler Angles (in radians)
  const rotationRef = useRef<{ x: number; y: number; z: number }>({ x: 0.3, y: 0.4, z: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Explode animation progress lerp (0 to 1)
  const explodeProgressRef = useRef<number>(0);

  const currentModel = SCHEMATICS_CATALOG[selectedModelIdx];

  // Select Model helper with JARVIS Voice feedback
  const handleSelectModel = useCallback(
    (idx: number) => {
      setSelectedModelIdx(idx);
      setSelectedComponentId(null);
      SoundFX.playComputeChime();
      const model = SCHEMATICS_CATALOG[idx];
      onJarvisSpeak(`Accessing holographic schematic for ${model.name}. Systems nominal.`);
    },
    [onJarvisSpeak]
  );

  // Toggle Exploded View
  const handleToggleExplode = useCallback(() => {
    SoundFX.playTargetClick();
    setIsExploded((prev) => {
      const next = !prev;
      onJarvisSpeak(
        next
          ? "Exploded component analysis initiated. All subsystems decoupled in 3D space."
          : "Subsystems reassembled to default operational state."
      );
      return next;
    });
  }, [onJarvisSpeak]);

  // Handle Hand Tracking influence on 3D Hologram
  useEffect(() => {
    if (!handData || !handData.isDetected) return;

    // Use hand centroid displacement to tilt/rotate hologram in real-time
    const normX = (handData.centroid.x - 500) / 500; // -1 to 1
    const normY = (handData.centroid.y - 500) / 500; // -1 to 1

    rotationRef.current.y += normX * 0.04;
    rotationRef.current.x += normY * 0.03;

    // Detect pinch gesture for zoom
    if (handData.gesture === "pinch") {
      setZoomLevel((prev) => Math.min(2.5, Math.max(0.6, prev + (normY < 0 ? 0.03 : -0.03))));
    }

    // Detect fist gesture for exploded view toggle
    if (handData.gesture === "fist" && !isExploded) {
      setIsExploded(true);
      onJarvisSpeak("Gesture lock detected: Exploded component view active.");
    }
  }, [handData, isExploded, onJarvisSpeak]);

  // Primary 60 FPS 3D Vector Rendering Engine
  useEffect(() => {
    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Responsive size sync
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Lerp exploded view transition
      const targetExplode = isExploded ? 1.0 : 0.0;
      explodeProgressRef.current += (targetExplode - explodeProgressRef.current) * 0.1;

      // Auto-rotation when not manually dragging
      if (isAutoRotate && !isDraggingRef.current) {
        rotationRef.current.y += 0.8 * rotationSpeed * delta;
        rotationRef.current.x += 0.3 * rotationSpeed * delta;
      }

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const rz = rotationRef.current.z;

      // 3D Matrix Rotation Helper
      const project3D = (x: number, y: number, z: number): { x: number; y: number; z: number; scale: number } => {
        // Rotate Y
        let x1 = x * Math.cos(ry) + z * Math.sin(ry);
        let y1 = y;
        let z1 = -x * Math.sin(ry) + z * Math.cos(ry);

        // Rotate X
        let x2 = x1;
        let y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
        let z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);

        // Rotate Z
        let x3 = x2 * Math.cos(rz) - y2 * Math.sin(rz);
        let y3 = x2 * Math.sin(rz) + y2 * Math.cos(rz);
        let z3 = z2;

        // Perspective projection
        const fov = 450;
        const distance = 400;
        const scale = (fov / (distance + z3)) * zoomLevel;

        return {
          x: cx + x3 * scale,
          y: cy + y3 * scale,
          z: z3,
          scale,
        };
      };

      // -------------------------------------------------------------
      // DRAW 3D BACKGROUND HOLOGRAPHIC GRID & RINGS
      // -------------------------------------------------------------
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 1;

      // Circular floor grid
      for (let r = 50; r <= 220; r += 45) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.15) {
          const pt = project3D(Math.cos(a) * r, 120, Math.sin(a) * r);
          if (a === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Rotating Compass Coordinates in 3D
      const compassP1 = project3D(-240, 120, 0);
      const compassP2 = project3D(240, 120, 0);
      const compassP3 = project3D(0, 120, -240);
      const compassP4 = project3D(0, 120, 240);

      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(compassP1.x, compassP1.y);
      ctx.lineTo(compassP2.x, compassP2.y);
      ctx.moveTo(compassP3.x, compassP3.y);
      ctx.lineTo(compassP4.x, compassP4.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // -------------------------------------------------------------
      // RENDER SELECTED 3D SCHEMATIC MODEL
      // -------------------------------------------------------------
      const exp = explodeProgressRef.current;
      const model = SCHEMATICS_CATALOG[selectedModelIdx];

      ctx.save();
      ctx.strokeStyle = hologramColor;
      ctx.shadowColor = hologramColor;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.5;

      // Helper function to draw 3D connected lines
      const drawLine3D = (p1: [number, number, number], p2: [number, number, number], color?: string, width: number = 1.5) => {
        const proj1 = project3D(p1[0], p1[1], p1[2]);
        const proj2 = project3D(p2[0], p2[1], p2[2]);

        ctx.save();
        if (color) {
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
        }
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(proj1.x, proj1.y);
        ctx.lineTo(proj2.x, proj2.y);
        ctx.stroke();
        ctx.restore();
      };

      // Helper function to draw 3D Circle
      const drawCircle3D = (
        center: [number, number, number],
        radius: number,
        plane: "xy" | "xz" | "yz" = "xz",
        segments: number = 24,
        color?: string
      ) => {
        ctx.save();
        if (color) {
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
        }
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          let x = center[0];
          let y = center[1];
          let z = center[2];

          if (plane === "xz") {
            x += Math.cos(angle) * radius;
            z += Math.sin(angle) * radius;
          } else if (plane === "xy") {
            x += Math.cos(angle) * radius;
            y += Math.sin(angle) * radius;
          } else {
            y += Math.cos(angle) * radius;
            z += Math.sin(angle) * radius;
          }

          const proj = project3D(x, y, z);
          if (i === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      };

      // MODEL 1: ARC REACTOR MK-85
      if (model.id === "arc_reactor") {
        const c1Off = exp * 60;
        const c2Off = exp * -60;

        // Core Ring
        drawCircle3D([0, 0, 0], 35, "xy", 28, "#ffffff");
        drawCircle3D([0, 0, 0], 25, "xy", 24, hologramColor);

        // Core Center Node
        const coreCenter = project3D(0, 0, 0);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(coreCenter.x, coreCenter.y, 4 * coreCenter.scale, 0, Math.PI * 2);
        ctx.fill();

        // 10 Magnetic Coils Array along perimeter
        const numCoils = 10;
        for (let i = 0; i < numCoils; i++) {
          const a = (i / numCoils) * Math.PI * 2;
          const rInner = 42;
          const rOuter = 80;

          const xIn = Math.cos(a) * rInner;
          const yIn = Math.sin(a) * rInner;
          const xOut = Math.cos(a) * rOuter;
          const yOut = Math.sin(a) * rOuter;

          drawLine3D([xIn, yIn, c1Off], [xOut, yOut, c1Off], hologramColor, 2);

          // Coil box cross-connectors
          const nextA = ((i + 0.5) / numCoils) * Math.PI * 2;
          const nextX = Math.cos(nextA) * rOuter;
          const nextY = Math.sin(nextA) * rOuter;
          drawLine3D([xOut, yOut, c1Off], [nextX, nextY, c1Off], "rgba(255,255,255,0.7)", 1);
        }

        // Outer Confinement Rings
        drawCircle3D([0, 0, c2Off], 90, "xy", 36, hologramColor);
        drawCircle3D([0, 0, c2Off], 105, "xy", 36, "rgba(56, 189, 248, 0.4)");

        // Exploded Vector connectors
        if (exp > 0.05) {
          ctx.setLineDash([3, 3]);
          drawLine3D([0, 0, -60], [0, 0, 60], "rgba(56, 189, 248, 0.4)", 1);
          ctx.setLineDash([]);
        }
      }

      // MODEL 2: MARK L NANOTECH HELMET
      else if (model.id === "iron_helmet") {
        const fOff = exp * 70;
        const bOff = exp * -50;

        // Front Faceplate Wireframe (Hexagonal & Angular Jaw)
        const helmetVerts: [number, number, number][] = [
          // Forehead
          [-40, -70, 40 + fOff],
          [40, -70, 40 + fOff],
          [65, -30, 45 + fOff],
          // Temples
          [75, 10, 40 + fOff],
          // Jawline
          [45, 75, 50 + fOff],
          [0, 85, 55 + fOff],
          [-45, 75, 50 + fOff],
          [-75, 10, 40 + fOff],
          [-65, -30, 45 + fOff],
        ];

        // Draw Faceplate Outline
        for (let i = 0; i < helmetVerts.length; i++) {
          const nextIdx = (i + 1) % helmetVerts.length;
          drawLine3D(helmetVerts[i], helmetVerts[nextIdx], hologramColor, 2);
        }

        // Glowing HUD Eye Visors
        const leftEye1: [number, number, number] = [-45, -10, 48 + fOff];
        const leftEye2: [number, number, number] = [-15, -10, 52 + fOff];
        const leftEye3: [number, number, number] = [-20, -5, 50 + fOff];
        const leftEye4: [number, number, number] = [-42, -5, 47 + fOff];

        const rightEye1: [number, number, number] = [15, -10, 52 + fOff];
        const rightEye2: [number, number, number] = [45, -10, 48 + fOff];
        const rightEye3: [number, number, number] = [42, -5, 47 + fOff];
        const rightEye4: [number, number, number] = [20, -5, 50 + fOff];

        drawLine3D(leftEye1, leftEye2, "#ffffff", 2.5);
        drawLine3D(leftEye2, leftEye3, "#ffffff", 2.5);
        drawLine3D(leftEye3, leftEye4, "#ffffff", 2.5);
        drawLine3D(leftEye4, leftEye1, "#ffffff", 2.5);

        drawLine3D(rightEye1, rightEye2, "#ffffff", 2.5);
        drawLine3D(rightEye2, rightEye3, "#ffffff", 2.5);
        drawLine3D(rightEye3, rightEye4, "#ffffff", 2.5);
        drawLine3D(rightEye4, rightEye1, "#ffffff", 2.5);

        // Rear Cranium Shell
        const craniumVerts: [number, number, number][] = [
          [-50, -80, -40 + bOff],
          [50, -80, -40 + bOff],
          [75, -20, -50 + bOff],
          [60, 50, -40 + bOff],
          [-60, 50, -40 + bOff],
          [-75, -20, -50 + bOff],
        ];
        for (let i = 0; i < craniumVerts.length; i++) {
          const nextIdx = (i + 1) % craniumVerts.length;
          drawLine3D(craniumVerts[i], craniumVerts[nextIdx], "rgba(56, 189, 248, 0.6)", 1.2);
        }
      }

      // MODEL 3: 4D QUANTUM TESSERACT HYPERCUBE
      else if (model.id === "quantum_tesseract") {
        const sOuter = 85;
        const sInner = 40 + exp * 25;

        // Outer 3D Cube Vertices
        const outV: [number, number, number][] = [
          [-sOuter, -sOuter, -sOuter],
          [sOuter, -sOuter, -sOuter],
          [sOuter, sOuter, -sOuter],
          [-sOuter, sOuter, -sOuter],
          [-sOuter, -sOuter, sOuter],
          [sOuter, -sOuter, sOuter],
          [sOuter, sOuter, sOuter],
          [-sOuter, sOuter, sOuter],
        ];

        // Inner 3D Cube Vertices (Hypercube core)
        const inV: [number, number, number][] = [
          [-sInner, -sInner, -sInner],
          [sInner, -sInner, -sInner],
          [sInner, sInner, -sInner],
          [-sInner, sInner, -sInner],
          [-sInner, -sInner, sInner],
          [sInner, -sInner, sInner],
          [sInner, sInner, sInner],
          [-sInner, sInner, sInner],
        ];

        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0], // Outer front
          [4, 5], [5, 6], [6, 7], [7, 4], // Outer back
          [0, 4], [1, 5], [2, 6], [3, 7], // Outer connect
        ];

        // Draw Outer Cube
        edges.forEach(([i, j]) => drawLine3D(outV[i], outV[j], hologramColor, 1.8));

        // Draw Inner Core Cube
        edges.forEach(([i, j]) => drawLine3D(inV[i], inV[j], "#ffffff", 2));

        // Draw 4D Hyper-Dimensional Connecting Beams (Vertex to Vertex)
        for (let i = 0; i < 8; i++) {
          drawLine3D(outV[i], inV[i], "rgba(56, 189, 248, 0.8)", 1.2);
        }
      }

      // MODEL 4: VERONICA ORBITAL SATELLITE
      else if (model.id === "orbital_satellite") {
        const wingOff = exp * 60;

        // Central Satellite Body (Octagonal Cylinder)
        drawCircle3D([0, 0, 0], 35, "xy", 8, hologramColor);
        drawCircle3D([0, 0, -50], 35, "xy", 8, "rgba(56, 189, 248, 0.5)");
        drawCircle3D([0, 0, 50], 35, "xy", 8, "rgba(56, 189, 248, 0.5)");

        // Deployable Solar Panels (Left and Right)
        const leftWing: [number, number, number][] = [
          [-50 - wingOff, -25, 0],
          [-140 - wingOff, -25, 0],
          [-140 - wingOff, 25, 0],
          [-50 - wingOff, 25, 0],
        ];
        const rightWing: [number, number, number][] = [
          [50 + wingOff, -25, 0],
          [140 + wingOff, -25, 0],
          [140 + wingOff, 25, 0],
          [50 + wingOff, 25, 0],
        ];

        for (let i = 0; i < 4; i++) {
          drawLine3D(leftWing[i], leftWing[(i + 1) % 4], "#38bdf8", 1.8);
          drawLine3D(rightWing[i], rightWing[(i + 1) % 4], "#38bdf8", 1.8);
        }

        // Solar Grid Lines
        drawLine3D([-80 - wingOff, -25, 0], [-80 - wingOff, 25, 0], "rgba(255,255,255,0.6)", 1);
        drawLine3D([-110 - wingOff, -25, 0], [-110 - wingOff, 25, 0], "rgba(255,255,255,0.6)", 1);
        drawLine3D([80 + wingOff, -25, 0], [80 + wingOff, 25, 0], "rgba(255,255,255,0.6)", 1);
        drawLine3D([110 + wingOff, -25, 0], [110 + wingOff, 25, 0], "rgba(255,255,255,0.6)", 1);

        // Orbital Radar Dish
        drawCircle3D([0, -60 - wingOff, 0], 30, "xz", 18, "#ffffff");
        drawLine3D([0, -35, 0], [0, -60 - wingOff, 0], hologramColor, 2);
      }

      ctx.restore();

      // Loop
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    selectedModelIdx,
    isExploded,
    isAutoRotate,
    rotationSpeed,
    zoomLevel,
    hologramColor,
  ]);

  // Pointer drag controls for manual orbit
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.y += dx * 0.008;
    rotationRef.current.x += dy * 0.008;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoomLevel((prev) => Math.min(2.5, Math.max(0.5, prev - e.deltaY * 0.0015)));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050507] text-slate-200 font-mono text-xs overflow-hidden">
      {/* Top Model Selector Ribbon */}
      <div className="p-2.5 bg-[#08080b] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
          {SCHEMATICS_CATALOG.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => handleSelectModel(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 shrink-0 ${
                selectedModelIdx === idx
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        {/* Hologram Color Palette */}
        <div className="flex items-center gap-1.5">
          {[
            { color: "#38bdf8", name: "Arc Cyan" },
            { color: "#fbbf24", name: "Stark Gold" },
            { color: "#f43f5e", name: "Crimson Laser" },
            { color: "#34d399", name: "Quantum Emerald" },
            { color: "#a855f7", name: "Plasma Violet" },
          ].map((c) => (
            <button
              key={c.color}
              onClick={() => {
                SoundFX.playTargetClick();
                setHologramColor(c.color);
              }}
              title={c.name}
              className={`w-4 h-4 rounded-full border transition-transform ${
                hologramColor === c.color ? "scale-125 border-white shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>
      </div>

      {/* Main Interactive 3D Canvas Stage */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        <div
          ref={containerRef}
          className="flex-1 relative bg-black flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing min-h-[300px]"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onWheel={handleWheel}
            className="w-full h-full"
          />

          {/* Floating 3D Telemetry Overlay HUD */}
          <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1.5">
            <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold text-cyan-300">{currentModel.name}</span>
              <span className="text-[10px] text-slate-500">[{currentModel.codename}]</span>
            </div>

            <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[10px] text-slate-400">
              <span>OUTPUT: </span>
              <span className="text-emerald-400 font-bold">{currentModel.powerOutput}</span>
              <span className="mx-1 text-slate-600">|</span>
              <span>TEMP: </span>
              <span className="text-amber-400 font-semibold">{currentModel.temperature}</span>
            </div>
          </div>

          {/* Hand Tracking Spatial Status Badge */}
          <div className="absolute bottom-3 left-3 pointer-events-none z-10 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-slate-300 flex items-center gap-2">
            <Hand className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>
              {handData?.isDetected
                ? `SPATIAL GESTURE: ${handData.gesture.toUpperCase()} | PINCH TO ZOOM`
                : "MOVE HAND OR DRAG MOUSE TO ROTATE HOLOGRAM"}
            </span>
          </div>

          {/* Quick HUD Canvas Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
            <button
              onClick={handleToggleExplode}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-[11px] ${
                isExploded
                  ? "bg-cyan-500/30 text-cyan-200 border-cyan-500/50 shadow-md font-bold"
                  : "bg-white/5 text-slate-300 hover:text-white border-white/5"
              }`}
              title="Toggle Exploded Component Disassembly"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExploded ? "ASSEMBLE" : "EXPLODE"}</span>
            </button>

            <button
              onClick={() => setIsAutoRotate((prev) => !prev)}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1 text-[11px] ${
                isAutoRotate
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                  : "bg-white/5 text-slate-400 border-white/5"
              }`}
              title="Toggle Auto-Orbit Rotation"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">ORBIT</span>
            </button>

            <button
              onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.2))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.2))}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Engineering Telemetry & Component Inspection Sidebar */}
        <div className="w-full md:w-80 bg-[#08080b] border-t md:border-t-0 md:border-l border-white/10 p-3.5 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>SUBSYSTEM MATRIX</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {currentModel.status}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {currentModel.description}
          </p>

          {/* Subsystem Component List */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              COMPONENT SCHEMATICS ({currentModel.components.length})
            </span>

            {currentModel.components.map((comp) => (
              <div
                key={comp.id}
                onClick={() => {
                  SoundFX.playTargetClick();
                  setSelectedComponentId(comp.id);
                  onJarvisSpeak(`Isolated component telemetry for ${comp.name}: ${comp.specs}`);
                }}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  selectedComponentId === comp.id
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-md"
                    : "bg-[#0b0b10] hover:bg-[#101016] border-white/5 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{comp.name}</span>
                  <Activity className="w-3 h-3 text-cyan-400 opacity-60" />
                </div>
                <p className="text-[11px] text-slate-400 font-sans">{comp.specs}</p>
              </div>
            ))}
          </div>

          {/* Voice Prompt Action */}
          <div className="mt-auto pt-3 border-t border-white/5">
            <button
              onClick={() => {
                onJarvisSpeak(
                  `Diagnostic report for ${currentModel.name}. Running at ${currentModel.powerOutput} with temperature nominal at ${currentModel.temperature}. All ${currentModel.components.length} subsystems synchronized.`
                );
              }}
              className="w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>DIAGNOSTIC VOICE BRIEF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
