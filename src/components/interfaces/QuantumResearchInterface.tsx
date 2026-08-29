/**
 * J.A.R.V.I.S. Interface 7: Quantum Computing & Deep Neural Lab
 * Qubit entanglement matrix, Gemini AI neural hyperparameters,
 * prompt optimizer, live research dossier engine, and code sandbox.
 */

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Sparkles,
  Zap,
  Sliders,
  RotateCw,
  Search,
  BookOpen,
  Code,
  Activity,
  Layers,
} from "lucide-react";
import { ResearchLab } from "../ResearchLab";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";

interface QuantumResearchInterfaceProps {
  onJarvisSpeak: (text: string) => void;
  initialTopic?: string | null;
}

export const QuantumResearchInterface: React.FC<QuantumResearchInterfaceProps> = ({
  onJarvisSpeak,
  initialTopic,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [qubitsActive, setQubitsActive] = useState(128);
  const [coherenceTimeUs, setCoherenceTimeUs] = useState(480);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);
  const [quantumCalibrating, setQuantumCalibrating] = useState(false);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  const handleCalibrateQuantum = () => {
    SoundFX.playComputeChime();
    setQuantumCalibrating(true);
    onJarvisSpeak("Superconducting qubit array calibrated. Coherence threshold locked at 99.98% fidelity across 128 entangled logic gates.");
    setTimeout(() => setQuantumCalibrating(false), 2500);
  };

  return (
    <div
      id="jarvis-quantum-research-interface"
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
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Quantum Computing & Deep Neural Lab
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: currentTheme.primaryColor + "20",
                  borderColor: currentTheme.primaryColor + "60",
                  color: currentTheme.secondaryColor,
                }}
              >
                128 QUBIT ARRAY • COHERENT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Superconducting Quantum Cores • Real-time Internet Grounded Synthesis • Neural Tuning
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCalibrateQuantum}
            disabled={quantumCalibrating}
            className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor + "30",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.secondaryColor,
            }}
          >
            <Zap className={`w-3.5 h-3.5 ${quantumCalibrating ? "animate-spin" : ""}`} />
            <span>{quantumCalibrating ? "Calibrating Gates..." : "Calibrate Qubits"}</span>
          </button>
        </div>
      </div>

      {/* Main Research Engine */}
      <ResearchLab
        onJarvisSpeak={onJarvisSpeak}
        initialTopic={initialTopic}
      />
    </div>
  );
};
