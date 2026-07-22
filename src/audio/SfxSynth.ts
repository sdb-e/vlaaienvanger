import Phaser from 'phaser';

/**
 * Procedurele geluidjes via Web Audio: scheetjes, plops, jingles.
 * Placeholder tot er echte (CC0-)geluiden inkomen — maar de scheetjes
 * zijn stiekem best goed.
 */
export class SfxSynth {
  private noise?: AudioBuffer;

  constructor(private scene: Phaser.Scene) {}

  private get ctx(): AudioContext | null {
    const sm = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = sm.context as AudioContext | undefined;
    if (!ctx || ctx.state === 'closed') return null;
    return ctx;
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      const len = ctx.sampleRate;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noise;
  }

  /** Het kerngeluid van dit spel: echte sample als die geladen is, anders synth. */
  fart(delay = 0): void {
    const sampleKeys = ['scheet-1', 'scheet-2', 'scheet-3'].filter((k) =>
      this.scene.cache.audio.exists(k)
    );
    if (sampleKeys.length) {
      const key = Phaser.Utils.Array.GetRandom(sampleKeys);
      const play = () =>
        this.scene.sound.play(key, { rate: 0.85 + Math.random() * 0.4, volume: 0.8 });
      if (delay > 0) this.scene.time.delayedCall(delay * 1000, play);
      else play();
      return;
    }
    this.fartSynth(delay);
  }

  private fartSynth(delay = 0): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const dur = 0.35 + Math.random() * 0.3;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3.5;
    bp.frequency.setValueAtTime(110 + Math.random() * 90, t);
    bp.frequency.exponentialRampToValueAtTime(55, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.85, t + 0.02);
    g.gain.setValueAtTime(0.85, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    // proest-wobble
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(30, t);
    lfo.frequency.linearRampToValueAtTime(9, t + dur);
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);

    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
    lfo.start(t);
    lfo.stop(t + dur);
  }

  private tone(
    freq: number,
    dur: number,
    opts: { type?: OscillatorType; delay?: number; slideTo?: number; vol?: number } = {}
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.35, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** Fallback-telpiepje: toonhoogte stijgt met het getal. */
  beep(n = 1): void {
    this.tone(320 + n * 55, 0.18, { type: 'sine', vol: 0.4 });
  }

  plop(pitch = 1): void {
    this.tone(400 * pitch, 0.13, { slideTo: 85, vol: 0.45 });
  }

  pop(): void {
    this.tone(900, 0.07, { slideTo: 1400, vol: 0.25 });
  }

  jingle(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, 0.16, { type: 'square', delay: i * 0.13, vol: 0.18 }));
  }

  sadWhistle(): void {
    this.tone(700, 0.7, { slideTo: 240, vol: 0.3 });
  }

  moo(delay = 0, pitch = 1): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const dur = 0.65;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145 * pitch, t);
    osc.frequency.linearRampToValueAtTime(95 * pitch, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(lp).connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  honk(): void {
    this.tone(225, 0.15, { type: 'square', vol: 0.3 });
    this.tone(225, 0.2, { type: 'square', delay: 0.22, vol: 0.3 });
  }

  /**
   * Wauwel-gebrabbel voor pratende NPC's (Shovel Knight-stijl): korte
   * pseudo-lettergrepen met per-personage toonhoogte. Geeft de duur terug.
   */
  babble(profile: { base: number; type: OscillatorType }, syllables: number, question = false): number {
    const ctx = this.ctx;
    if (!ctx) return syllables * 0.14;
    let t = ctx.currentTime + 0.02;
    const start = t;
    for (let i = 0; i < syllables; i++) {
      const dur = 0.07 + Math.random() * 0.08;
      const isLast = i === syllables - 1;
      const freq = profile.base * (0.82 + Math.random() * 0.45);
      const osc = ctx.createOscillator();
      osc.type = profile.type;
      osc.frequency.setValueAtTime(freq, t);
      // toonloop per lettergreep: vraagje omhoog aan het eind, anders licht omlaag
      const target = isLast && question ? freq * 1.5 : freq * (0.88 + Math.random() * 0.18);
      osc.frequency.exponentialRampToValueAtTime(target, t + dur);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = profile.base * 8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(lp).connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur + 0.02 + Math.random() * 0.05;
      // af en toe een mini-pauze (woordgrens)
      if (Math.random() < 0.25) t += 0.06;
    }
    return t - start;
  }

  /** Koeien lachen Ward uit (vriendelijk): loeitjes + schetenkoor. */
  lachkoor(): void {
    this.moo(0, 1.15);
    this.moo(0.3, 0.95);
    this.moo(0.55, 1.25);
    this.fart(0.15);
    this.fart(0.5);
    this.fart(0.8);
  }
}
