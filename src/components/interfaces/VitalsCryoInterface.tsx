/**
 * J.A.R.V.I.S. Interface 4: Sub-Zero Cryo-Biometrics & Vitals Lab
 * Real-time physiological telemetry, animated ECG heart waveform oscilloscope,
 * EEG brainwave rhythms, SpO2 levels, metabolic burn rate, and trauma scanning.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Activity,
  Zap,
  Thermometer,
  Shield,
  RotateCw,
  AlertCircle,
  Stethoscope,
  Smile,
  Flame,
  Brain,
  Droplet,
} from "lucide-react";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";

interface VitalsCryoInterfaceProps {
  onJarvisSpeak: (text: string) => void;
}

export const VitalsCryoInterface: React.FC<VitalsCryoInterfaceProps> = ({
  onJarvisSpeak,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [heartRate, setHeartRate] = useState(72);
  const [bloodPressure, setBloodPressure] = useState("120 / 78");
  const [oxygenSpO2, setOxygenSpO2] = useState(99.2);
  const [bodyTemp, setBodyTemp] = useState(36.8);
  const [adrenalineLevel, setAdrenalineLevel] = useState(14); // 0 - 100
  const [stressLevel, setStressLevel] = useState<"RELAXED" | "ELEVATED" | "COMBAT_ALERT">("RELAXED");
  const [cryoStasisActive, setCryoStasisActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  // Real-time animated ECG Heart Rate Oscilloscope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let points: number[] = new Array(canvas.width).fill(canvas.height / 2);
    let step = 0;
    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw faint oscilloscope grid lines
      ctx.strokeStyle = currentTheme.primaryColor + "15";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Generate ECG spike cycle (P-Q-R-S-T wave)
      step = (step + 1) % 60;
      let nextY = canvas.height / 2;

      if (step === 20) nextY -= 8; // P wave
      else if (step === 25) nextY += 6; // Q wave
      else if (step === 28) nextY -= 48; // R spike
      else if (step === 31) nextY += 22; // S drop
      else if (step === 40) nextY -= 14; // T wave

      points.shift();
      points.push(nextY);

      // Draw glowing ECG line
      ctx.strokeStyle = currentTheme.secondaryColor;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = currentTheme.primaryColor;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(i, points[i]);
        else ctx.lineTo(i, points[i]);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [currentTheme]);

  const handleTriggerAdrenalineStim = () => {
    SoundFX.playComputeChime();
    setHeartRate(135);
    setAdrenalineLevel(88);
    setStressLevel("COMBAT_ALERT");
    onJarvisSpeak("Adrenaline stimulation cocktail administered. Heart rate elevated to 135 BPM. Neural reflexes peaked at 400% baseline.");
    setTimeout(() => {
      setHeartRate(74);
      setAdrenalineLevel(18);
      setStressLevel("RELAXED");
    }, 4500);
  };

  const handleRunTraumaScan = () => {
    SoundFX.playTargetClick();
    onJarvisSpeak("Full biometric body scan completed. Zero fractures, zero tissue trauma. Blood oxygenation at 99.2% optimal saturation, sir.");
  };

  const handleToggleCryo = () => {
    SoundFX.playTargetClick();
    const next = !cryoStasisActive;
    setCryoStasisActive(next);
    if (next) {
      setBodyTemp(12.4);
      setHeartRate(32);
      onJarvisSpeak("Cryo-stabilization sequence engaged. Cellular metabolic rate reduced to 15%. Standing by in stasis mode.");
    } else {
      setBodyTemp(36.8);
      setHeartRate(72);
      onJarvisSpeak("Cryo-stasis disengaged. Body temperature safely brought back to 36.8°C.");
    }
  };

  return (
    <div
      id="jarvis-vitals-cryo-interface"
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
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Sub-Zero Cryo-Biometrics & Vitals Lab
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: currentTheme.primaryColor + "20",
                  borderColor: currentTheme.primaryColor + "60",
                  color: currentTheme.secondaryColor,
                }}
              >
                PILOT VITALS • OPTIMAL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live ECG Oscilloscope • EEG Neural Brainwave Waves • SpO2 Oxygenation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunTraumaScan}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
            <span>Trauma Scan</span>
          </button>

          <button
            onClick={handleTriggerAdrenalineStim}
            className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor + "30",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.secondaryColor,
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Adrenaline Surge</span>
          </button>

          <button
            onClick={handleToggleCryo}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              cryoStasisActive
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>{cryoStasisActive ? "Cryo-Stasis Engaged" : "Normal Metabolism"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ECG Oscilloscope Screen (7 Cols) */}
        <div
          className="lg:col-span-7 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col gap-4"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Live Cardio Oscilloscope (Lead II)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-400">
                {heartRate} BPM
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                STATUS: {stressLevel}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#030508] p-3 rounded-2xl border border-white/10 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={520}
              height={180}
              className="w-full h-44 rounded-xl"
            />
          </div>

          {/* Biometrics 4-Box Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase">Heart Rate</span>
                <Heart className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-lg font-mono font-bold text-white">
                {heartRate} <span className="text-xs text-slate-500">BPM</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase">Blood SpO2</span>
                <Droplet className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span className="text-lg font-mono font-bold text-white">
                {oxygenSpO2}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase">Blood Pressure</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-lg font-mono font-bold text-white">
                {bloodPressure}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase">Body Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-lg font-mono font-bold text-white">
                {bodyTemp}°C
              </span>
            </div>
          </div>
        </div>

        {/* Neural EEG & Adrenaline Index (5 Cols) */}
        <div
          className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Neural EEG & Adrenal Telemetry
              </span>
              <Brain className="w-4 h-4 text-purple-400" />
            </div>

            {/* Neural Brainwave Rhythm Bar */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold uppercase">Alpha / Beta Wave Ratio</span>
                <span className="text-purple-400 font-bold">14.8 Hz (Flow State)</span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: "75%", backgroundColor: "#a855f7" }}
                />
              </div>
            </div>

            {/* Adrenaline Index Gauge */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold uppercase">Adrenaline Concentration</span>
                <span
                  className="font-bold"
                  style={{
                    color: adrenalineLevel > 50 ? "#f87171" : currentTheme.secondaryColor,
                  }}
                >
                  {adrenalineLevel}% Index
                </span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${adrenalineLevel}%`,
                    backgroundColor: adrenalineLevel > 50 ? "#ef4444" : currentTheme.primaryColor,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Voice: "Jarvis, check my vital signs"</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
