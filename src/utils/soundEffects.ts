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
}
