import Phaser from 'phaser';
import type { EngineProfile } from '@/config/progression';

interface EngineDef {
  idle: number;
  drive: number;
  type: OscillatorType;
  /** pruttel-snelheid [stationair, rijdend] in Hz */
  putter: [number, number];
  vol: number;
  siren?: boolean;
}

const DEFS: Partial<Record<EngineProfile, EngineDef>> = {
  tractor: { idle: 46, drive: 80, type: 'sawtooth', putter: [11, 19], vol: 0.09 },
  truck: { idle: 40, drive: 68, type: 'sawtooth', putter: [9, 15], vol: 0.09 },
  race: { idle: 72, drive: 138, type: 'sawtooth', putter: [22, 42], vol: 0.08 },
  fire: { idle: 40, drive: 68, type: 'sawtooth', putter: [9, 15], vol: 0.09, siren: true },
};

/**
 * Doorlopend motorgeluid: stationair pruttelen, "vroem" bij het rijden.
 * De brandweerauto rijdt met tweetonige sirene.
 */
export class EngineSound {
  private profile: EngineProfile = 'none';
  private moving = false;
  private osc?: OscillatorNode;
  private gain?: GainNode;
  private putterLfo?: OscillatorNode;
  private putterGain?: GainNode;
  private sirenOsc?: OscillatorNode;
  private sirenGain?: GainNode;
  private sirenEvent?: Phaser.Time.TimerEvent;
  private sirenHigh = false;

  constructor(private scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  private get ctx(): AudioContext | null {
    const sm = this.scene.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = sm.context as AudioContext | undefined;
    if (!ctx || ctx.state === 'closed') return null;
    return ctx;
  }

  setProfile(profile: EngineProfile): void {
    if (profile === this.profile) return;
    this.teardown();
    this.profile = profile;
    if (profile !== 'none') this.build();
    this.apply(true);
  }

  setMoving(moving: boolean): void {
    if (moving === this.moving) return;
    this.moving = moving;
    this.apply(false);
  }

  private build(): void {
    const ctx = this.ctx;
    const def = DEFS[this.profile];
    if (!ctx || !def) return;

    this.osc = ctx.createOscillator();
    this.osc.type = def.type;
    this.osc.frequency.value = def.idle;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0.0001;

    // pruttel: amplitude-modulatie op de motortoon
    this.putterLfo = ctx.createOscillator();
    this.putterLfo.frequency.value = def.putter[0];
    this.putterGain = ctx.createGain();
    this.putterGain.gain.value = def.vol * 0.6;
    this.putterLfo.connect(this.putterGain);
    this.putterGain.connect(this.gain.gain);

    this.osc.connect(lp).connect(this.gain).connect(ctx.destination);
    this.osc.start();
    this.putterLfo.start();

    if (def.siren) {
      this.sirenOsc = ctx.createOscillator();
      this.sirenOsc.type = 'square';
      this.sirenOsc.frequency.value = 660;
      this.sirenGain = ctx.createGain();
      this.sirenGain.gain.value = 0.0001;
      const sirenLp = ctx.createBiquadFilter();
      sirenLp.type = 'lowpass';
      sirenLp.frequency.value = 2200;
      this.sirenOsc.connect(sirenLp).connect(this.sirenGain).connect(ctx.destination);
      this.sirenOsc.start();
      this.sirenEvent = this.scene.time.addEvent({
        delay: 380,
        loop: true,
        callback: () => {
          this.sirenHigh = !this.sirenHigh;
          const c = this.ctx;
          if (c && this.sirenOsc) {
            this.sirenOsc.frequency.setTargetAtTime(this.sirenHigh ? 880 : 660, c.currentTime, 0.03);
          }
        },
      });
    }
  }

  private apply(instant: boolean): void {
    const ctx = this.ctx;
    const def = DEFS[this.profile];
    if (!ctx || !def || !this.osc || !this.gain) return;
    const t = ctx.currentTime;
    const tc = instant ? 0.001 : 0.25;
    this.osc.frequency.setTargetAtTime(this.moving ? def.drive : def.idle, t, tc);
    this.gain.gain.setTargetAtTime(this.moving ? def.vol : def.vol * 0.55, t, tc);
    this.putterLfo?.frequency.setTargetAtTime(this.moving ? def.putter[1] : def.putter[0], t, tc);
    if (this.sirenGain) {
      this.sirenGain.gain.setTargetAtTime(this.moving ? 0.05 : 0.0001, t, 0.1);
    }
  }

  private teardown(): void {
    this.sirenEvent?.remove();
    this.sirenEvent = undefined;
    for (const node of [this.osc, this.putterLfo, this.sirenOsc]) {
      try {
        node?.stop();
        node?.disconnect();
      } catch {
        // al gestopt
      }
    }
    this.gain?.disconnect();
    this.putterGain?.disconnect();
    this.sirenGain?.disconnect();
    this.osc = this.gain = undefined as never;
    this.putterLfo = this.putterGain = undefined as never;
    this.sirenOsc = this.sirenGain = undefined as never;
    this.profile = 'none';
  }
}
