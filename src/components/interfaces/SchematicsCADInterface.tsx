/**
 * J.A.R.V.I.S. Interface 5: Cleanroom Holographic CAD & 3D Schematics Lab
 * Full 3D interactive wireframe models, component slicing, alloy stress simulation,
 * and high-contrast CAD blueprint viewer.
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Layers,
  Sparkles,
  Zap,
  Shield,
  RotateCw,
  Cpu,
  Download,
  Flame,
  FileCode,
} from "lucide-react";
import { Holographic3DSchematics } from "../Holographic3DSchematics";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";

interface SchematicsCADInterfaceProps {
  onJarvisSpeak: (text: string) => void;
}

export const SchematicsCADInterface: React.FC<SchematicsCADInterfaceProps> = ({
  onJarvisSpeak,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [selectedAlloy, setSelectedAlloy] = useState<"titanium_gold" | "vibranium_matrix" | "nanotech_graphene">("titanium_gold");
  const [stressTesting, setStressTesting] = useState(false);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  const handleTriggerStressTest = () => {
    SoundFX.playComputeChime();
    setStressTesting(true);
    onJarvisSpeak(`Simulating thermal stress test on ${selectedAlloy.replace("_", " ").toUpperCase()} alloy. Yield strength verified at 4.2 Gigapascals with zero structural fatigue.`);
    setTimeout(() => setStressTesting(false), 3000);
  };

  const handleExportCAD = () => {
    SoundFX.playTargetClick();
    onJarvisSpeak("Holographic 3D CAD schematic exported in high-precision DXF and STEP format, sir.");
  };

  return (
    <div
      id="jarvis-schematics-cad-interface"
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
            <Box className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Holographic 3D Schematics & CAD Lab
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: currentTheme.primaryColor + "20",
                  borderColor: currentTheme.primaryColor + "60",
                  color: currentTheme.secondaryColor,
                }}
              >
                AUTODESK STARK CAD • V12.8
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Interactive 3D Wireframe Canvas • Slicing Plane • Material Stress Analysis
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTriggerStressTest}
            disabled={stressTesting}
            className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor + "30",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.secondaryColor,
            }}
          >
            <Flame className={`w-3.5 h-3.5 ${stressTesting ? "animate-spin" : ""}`} />
            <span>{stressTesting ? "Running Stress Sim..." : "Alloy Stress Test"}</span>
          </button>

          <button
            onClick={handleExportCAD}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
            <span>Export CAD File</span>
          </button>
        </div>
      </div>

      {/* Primary Holographic 3D Engine */}
      <Holographic3DSchematics
        onJarvisSpeak={onJarvisSpeak}
        onModelSelected={(model) =>
          onJarvisSpeak(`Rendering holographic wireframe for ${model.name}, sir. Component hierarchy loaded.`)
        }
      />
    </div>
  );
};
