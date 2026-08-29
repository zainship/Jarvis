/**
 * Web Audio API Sci-Fi Sound Effects Synthesizer for JARVIS
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export class SoundFX {
  private static enabled = true;
  private static masterVolume = 0.8;

  public static setEnabled(state: boolean) {
    SoundFX.enabled = state;
  }

  public static isEnabled() {
    return SoundFX.enabled;
  }

  public static setMasterVolume(level: number) {
    SoundFX.masterVolume = Math.max(0, Math.min(1, level));
  }

  public static getMasterVolume(): number {
    return SoundFX.masterVolume;
  }

  /**
   * Futuristic activation ping when JARVIS wakes or starts listening
   */
  public static playWakePing() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      // Primary tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12); // A6

      gain1.gain.setValueAtTime(0.12 * vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      // Harmony overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1320, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.18);

      gain2.gain.setValueAtTime(0.08 * vol, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.04);
      osc2.stop(now + 0.3);
    } catch (e) {
      console.warn("AudioContext playback prevented:", e);
    }
  }

  /**
   * Sound when user stops speaking or JARVIS starts computing
   */
  public static playComputeChime() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(0.1 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /**
   * Laser click / Target lock sound during browser automation
   */
  public static playTargetClick() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.08 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  /**
   * Subtle keystroke sound for human-like typing simulation
   */
  public static playKeystroke() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const randomPitch = 1200 + Math.random() * 400;
      osc.frequency.setValueAtTime(randomPitch, now);

      gain.gain.setValueAtTime(0.04 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  /**
   * Step completion / data extracted futuristic chirp
   */
  public static playStepComplete() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const freqs = [659.25, 880, 1046.5]; // E5, A5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.08 * vol, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    } catch (e) {}
  }

  /**
   * Workflow completed or mission accomplished triumph chord
   */
  public static playWorkflowSuccess() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.09 * vol, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.4);
      });
    } catch (e) {}
  }

  /**
   * Room Intrusion / Sentry Warning Alarm Beep
   */
  public static playIntruderBeep() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      // High-pitched tactical pulsing beep (Stark Sentry Alarm)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.12);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.24);

      gain.gain.setValueAtTime(0.25 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  /**
   * Continuous Tactical Warning Siren pulse
   */
  public static playSentrySiren() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);

      gain.gain.setValueAtTime(0.2 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  /**
   * Sci-Fi Stark Acoustic Activation Chime when a hand clap is detected
   */
  public static playClapWakeChime() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      // Pulse 1: Resonant crystal ping (1046Hz - C6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1046.5, now);
      osc1.frequency.exponentialRampToValueAtTime(2093.0, now + 0.08);

      gain1.gain.setValueAtTime(0.2 * vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Pulse 2: Harmonic shimmer (1568Hz - G6 to 3136Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1568, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(3136, now + 0.18);

      gain2.gain.setValueAtTime(0.15 * vol, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.4);
    } catch (e) {}
  }

  /**
   * High-energy Iron Man Repulsor Blast sound
   */
  public static playRepulsorBlast() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      // Charge up surge
      const oscCharge = ctx.createOscillator();
      const gainCharge = ctx.createGain();
      oscCharge.type = "sine";
      oscCharge.frequency.setValueAtTime(400, now);
      oscCharge.frequency.exponentialRampToValueAtTime(3200, now + 0.08);

      gainCharge.gain.setValueAtTime(0.12 * vol, now);
      gainCharge.gain.linearRampToValueAtTime(0.25 * vol, now + 0.08);
      gainCharge.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      oscCharge.connect(gainCharge);
      gainCharge.connect(ctx.destination);
      oscCharge.start(now);
      oscCharge.stop(now + 0.1);

      // Main concussive blast pulse
      const oscBlast = ctx.createOscillator();
      const gainBlast = ctx.createGain();
      oscBlast.type = "sawtooth";
      oscBlast.frequency.setValueAtTime(600, now + 0.07);
      oscBlast.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gainBlast.gain.setValueAtTime(0.3 * vol, now + 0.07);
      gainBlast.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      oscBlast.connect(gainBlast);
      gainBlast.connect(ctx.destination);
      oscBlast.start(now + 0.07);
      oscBlast.stop(now + 0.4);
    } catch (e) {}
  }

  /**
   * Massive Chest Unibeam Laser Burst sound
   */
  public static playUnibeamBurst() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      // Heavy resonant hum
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(850, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.7);

      gain.gain.setValueAtTime(0.35 * vol, now);
      gain.gain.linearRampToValueAtTime(0.4 * vol, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
  }

  /**
   * Nanite Morphogenesis Crystallization & Fluid shifting sound
   */
  public static playNaniteMorph() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const freqs = [1800, 2400, 3200, 2800, 3600];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.04 + 0.08);

        gain.gain.setValueAtTime(0.06 * vol, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.12);
      });
    } catch (e) {}
  }

  /**
   * Tactical Missile / Repulsor Target Lock-On Tone
   */
  public static playLockOnTone() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      [0, 0.08, 0.16].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(2800, now + delay);

        gain.gain.setValueAtTime(0.12 * vol, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.04);
      });
    } catch (e) {}
  }

  /**
   * Energy Shield / Kinetic Barrier Deployment Chime
   */
  public static playShieldDeploy() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      gain.gain.setValueAtTime(0.18 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  /**
   * Supersonic Boom & Mach Acceleration Rush
   */
  public static playMachSonicBoom() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      gain.gain.setValueAtTime(0.35 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  /**
   * Voice Interception / Barge-In Instant Cut Chime
   */
  public static playInterceptionChime() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      // Quick dual blip cutting through audio
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(1440, now);
      osc1.frequency.exponentialRampToValueAtTime(1920, now + 0.06);

      gain1.gain.setValueAtTime(0.14 * vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(2400, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(3600, now + 0.15);

      gain2.gain.setValueAtTime(0.12 * vol, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.22);
    } catch (e) {}
  }

  /**
   * Noise Gate Threshold Auto-Calibration Tone
   */
  public static playNoiseGateCalibrated() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(1560, now + 0.35);

      gain.gain.setValueAtTime(0.15 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  /**
   * Futuristic Microphone Armed Confirmation Tone
   */
  public static playMicArmed() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(660, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gain1.gain.setValueAtTime(0.14 * vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(990, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(1980, now + 0.14);

      gain2.gain.setValueAtTime(0.09 * vol, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.22);
    } catch (e) {}
  }

  /**
   * Futuristic Microphone Muted Soft Descending Tone
   */
  public static playMicMuted() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(960, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.16);

      gain.gain.setValueAtTime(0.12 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  /**
   * Frequency Lock Tone when Speech Recognition Locks onto User's Voice
   */
  public static playFrequencyLock() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.06);

      gain.gain.setValueAtTime(0.08 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  /**
   * Tactical Telemetry Comms Burst Tone
   */
  public static playCommsBurst() {
    if (!SoundFX.enabled || SoundFX.masterVolume <= 0) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const vol = SoundFX.masterVolume;

      [0, 0.03, 0.06].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(2200 + idx * 400, now + delay);

        gain.gain.setValueAtTime(0.07 * vol, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.04);
      });
    } catch (e) {}
  }
}


