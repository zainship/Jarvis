/**
 * J.A.R.V.I.S. Interface 9: Global Sonic Radar, Radio Scanner & Media Hub
 * Holographic YouTube media player, multi-band radio frequency scanner (SW, HF, VHF, UHF),
 * 5-band audio equalizer, encrypted signal interceptor, and Stark Classic Rock jukebox.
 */

import React, { useState, useEffect } from "react";
import {
  Radio,
  Music,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  Search,
  Activity,
  Disc,
  Headphones,
  Signal,
} from "lucide-react";
import { YouTubeMediaHUD } from "../YouTubeMediaHUD";
import { YouTubeMedia } from "../../types";
import { SoundFX } from "../../utils/soundEffects";
import { themeManager, JarvisTheme } from "../../utils/themeManager";

interface RadioChannel {
  id: string;
  freq: string;
  band: "SW" | "HF" | "VHF" | "UHF";
  name: string;
  status: "LOCKED" | "SCANNING" | "ENCRYPTED";
  signalStrength: number; // 0-100
}

const SAMPLE_RADIO_CHANNELS: RadioChannel[] = [
  {
    id: "rad-1",
    freq: "14.225 MHz",
    band: "HF",
    name: "Stark Inter-Facility Comms Relay",
    status: "LOCKED",
    signalStrength: 98,
  },
  {
    id: "rad-2",
    freq: "121.500 MHz",
    band: "VHF",
    name: "Aviation Emergency Guard Channel",
    status: "LOCKED",
    signalStrength: 92,
  },
  {
    id: "rad-3",
    freq: "433.920 MHz",
    band: "UHF",
    name: "Sub-Orbital Satellite Downlink",
    status: "ENCRYPTED",
    signalStrength: 85,
  },
  {
    id: "rad-4",
    freq: "7.150 MHz",
    band: "SW",
    name: "Global Shortwave Weather Matrix",
    status: "LOCKED",
    signalStrength: 76,
  },
];

const STARK_SOUNDTRACKS = [
  { id: "trk-1", title: "Back In Black", artist: "AC/DC", genre: "Classic Rock", duration: "4:15", query: "AC/DC Back In Black" },
  { id: "trk-2", title: "Shoot to Thrill", artist: "AC/DC", genre: "Classic Rock", duration: "5:17", query: "AC/DC Shoot to Thrill Iron Man" },
  { id: "trk-3", title: "Highway to Hell", artist: "AC/DC", genre: "Classic Rock", duration: "3:28", query: "AC/DC Highway to Hell" },
  { id: "trk-4", title: "Driving With The Top Down", artist: "Ramin Djawadi", genre: "Cinematic OST", duration: "3:10", query: "Iron Man Driving With The Top Down" },
];

interface MediaSignalsInterfaceProps {
  onJarvisSpeak: (text: string) => void;
  activeYouTubeMedia: YouTubeMedia | null;
  onCloseYouTubeMedia: () => void;
  onPlayYouTubeTrack?: (query: string) => void;
}

export const MediaSignalsInterface: React.FC<MediaSignalsInterfaceProps> = ({
  onJarvisSpeak,
  activeYouTubeMedia,
  onCloseYouTubeMedia,
  onPlayYouTubeTrack,
}) => {
  const [currentTheme, setCurrentTheme] = useState<JarvisTheme>(themeManager.getTheme());
  const [channels, setChannels] = useState<RadioChannel[]>(SAMPLE_RADIO_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<RadioChannel>(SAMPLE_RADIO_CHANNELS[0]);
  const [eqBands, setEqBands] = useState([6, 3, 0, 4, 7]); // 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
  const [isScanningFreqs, setIsScanningFreqs] = useState(false);

  useEffect(() => {
    const unsub = themeManager.subscribe((t) => setCurrentTheme(t));
    return () => unsub();
  }, []);

  const handleScanFrequencies = () => {
    SoundFX.playComputeChime();
    setIsScanningFreqs(true);
    onJarvisSpeak("Scanning high-frequency global radio spectrum. 4 secure RF carriers intercepted and locked.");
    setTimeout(() => setIsScanningFreqs(false), 2000);
  };

  const handlePlayStarkTrack = (track: typeof STARK_SOUNDTRACKS[0]) => {
    SoundFX.playTargetClick();
    onJarvisSpeak(`Queuing ${track.title} by ${track.artist} on holographic soundstage, sir.`);
    if (onPlayYouTubeTrack) {
      onPlayYouTubeTrack(track.query);
    }
  };

  const handleEqChange = (idx: number, val: number) => {
    const next = [...eqBands];
    next[idx] = val;
    setEqBands(next);
  };

  return (
    <div
      id="jarvis-media-signals-interface"
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
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-sans tracking-tight">
                Sonic Radar, Radio Scanner & Media Hub
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border"
                style={{
                  backgroundColor: currentTheme.primaryColor + "20",
                  borderColor: currentTheme.primaryColor + "60",
                  color: currentTheme.secondaryColor,
                }}
              >
                HIFI DOLBY ATMOS • LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Holographic YouTube Visualizer • Multi-Band RF Scanner • 5-Band Audio EQ
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleScanFrequencies}
            disabled={isScanningFreqs}
            className="px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor + "30",
              borderColor: currentTheme.primaryColor,
              color: currentTheme.secondaryColor,
            }}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isScanningFreqs ? "animate-spin" : ""}`} />
            <span>{isScanningFreqs ? "Sweeping Bands..." : "Scan RF Bands"}</span>
          </button>
        </div>
      </div>

      {/* YouTube Media HUD (if active) */}
      {activeYouTubeMedia && (
        <YouTubeMediaHUD
          media={activeYouTubeMedia}
          onClose={onCloseYouTubeMedia}
          onJarvisSpeak={onJarvisSpeak}
        />
      )}

      {/* Main Grid: Radio Scanner & EQ + Tony's Jukebox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radio Scanner (7 Cols) */}
        <div
          className="lg:col-span-7 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col gap-4"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              RF Intercept & Radio Channels
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Signal className="w-3.5 h-3.5" />
              CARRIER LOCKED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {channels.map((chan) => {
              const isSelected = selectedChannel.id === chan.id;
              return (
                <div
                  key={chan.id}
                  onClick={() => {
                    SoundFX.playTargetClick();
                    setSelectedChannel(chan);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-white/10 shadow-lg"
                      : "bg-[#0b0e16]/60 hover:bg-white/5 border-white/5"
                  }`}
                  style={{
                    borderColor: isSelected ? currentTheme.primaryColor : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-sans truncate">
                      {chan.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-sky-400">
                      {chan.freq}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>BAND: {chan.band}</span>
                    <span
                      className="font-bold"
                      style={{
                        color: chan.status === "LOCKED" ? "#34d399" : "#fbbf24",
                      }}
                    >
                      {chan.status} ({chan.signalStrength}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 5-Band Audio Graphic Equalizer */}
          <div className="mt-3 p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Acoustic 5-Band Equalizer (DSP)
              </span>
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="grid grid-cols-5 gap-3 pt-2">
              {["60 Hz", "250 Hz", "1 kHz", "4 kHz", "16 kHz"].map((bandName, idx) => (
                <div key={bandName} className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {eqBands[idx] > 0 ? `+${eqBands[idx]}` : eqBands[idx]} dB
                  </span>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={eqBands[idx]}
                    onChange={(e) => handleEqChange(idx, Number(e.target.value))}
                    className="h-24 w-2 bg-slate-800 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                    style={{ accentColor: currentTheme.primaryColor }}
                  />
                  <span className="text-[9px] font-mono text-slate-500">{bandName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tony Stark's Jukebox (5 Cols) */}
        <div
          className="lg:col-span-5 p-6 rounded-3xl border bg-[#080a10]/85 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5"
          style={{ borderColor: currentTheme.primaryColor + "30" }}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Stark Soundstage Jukebox
              </span>
              <Disc className="w-4 h-4 text-rose-400 animate-spin" />
            </div>

            <div className="flex flex-col gap-2.5">
              {STARK_SOUNDTRACKS.map((trk) => (
                <div
                  key={trk.id}
                  onClick={() => handlePlayStarkTrack(trk)}
                  className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: currentTheme.primaryColor + "20",
                        borderColor: currentTheme.primaryColor + "50",
                        color: currentTheme.secondaryColor,
                      }}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-sans">{trk.title}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{trk.artist} • {trk.genre}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{trk.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Voice: "Jarvis, play some AC/DC on YouTube"</span>
            <Music className="w-4 h-4 text-sky-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
