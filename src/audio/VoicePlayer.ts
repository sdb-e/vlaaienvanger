import Phaser from 'phaser';
import type { SfxSynth } from '@/audio/SfxSynth';

/**
 * Nederlandse stem met fallback-keten per key:
 *   1. opgenomen clip (public/assets/audio/voice/<key met - i.p.v. .>.mp3, via index.json)
 *   2. Web Speech API met een nl-stem (iets hogere pitch = grappig)
 *   3. piepje (toonhoogte stijgt met het getal)
 *
 * De key-tabel hieronder is meteen het opnamescript voor papa.
 */

const NUM_WORDS = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien'];

const PHRASES: Record<string, string> = {
  'frase.honger': 'Hoi Ward! Mijn plantjes hebben honger!',
  'frase.haal': 'Haal',
  'frase.vlaaien': 'koeienvlaaien',
  'frase.goedzo': 'Goed zo, Ward!',
  'frase.precies': 'Precies',
  'frase.teveel': 'Oeps! Dat waren er te veel!',
  'frase.teweinig': 'Dat zijn er nog niet genoeg.',
  'frase.nog': 'We hebben er nog',
  'frase.nieuwekar': 'Wauw! Een nieuwe kar!',
};

export function voiceText(key: string): string {
  if (key.startsWith('num.')) {
    const n = parseInt(key.slice(4), 10);
    return NUM_WORDS[n] ?? String(n);
  }
  return PHRASES[key] ?? '';
}

/** Alle keys, voor het opnamescript en de clip-loader. */
export function allVoiceKeys(): string[] {
  const nums = NUM_WORDS.slice(1).map((_, i) => `num.${i + 1}`);
  return [...nums, ...Object.keys(PHRASES)];
}

export const voiceClipKey = (key: string) => `voice.${key}`;
export const voiceClipFile = (key: string) => `${key.replace(/\./g, '-')}.mp3`;

export class VoicePlayer {
  private token = 0;
  private dutchVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  constructor(
    private scene: Phaser.Scene,
    private sfx: SfxSynth
  ) {
    this.pickVoice();
    if ('speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', () => this.pickVoice());
    }
  }

  private pickVoice(): void {
    if (!('speechSynthesis' in window)) return;
    const voices = speechSynthesis.getVoices();
    if (voices.length) this.voicesLoaded = true;
    this.dutchVoice = voices.find((v) => v.lang.toLowerCase().startsWith('nl')) ?? null;
  }

  /** Zeg een reeks keys. interrupt=true kapt lopende spraak af (voor snel tellen). */
  async say(keys: string[], opts: { interrupt?: boolean } = {}): Promise<void> {
    if (!keys.length) return;
    const token = ++this.token;
    if ((opts.interrupt ?? true) && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }

    let i = 0;
    while (i < keys.length) {
      if (this.token !== token) return;
      const key = keys[i];
      if (this.scene.cache.audio.exists(voiceClipKey(key))) {
        await this.playClip(voiceClipKey(key));
        i++;
      } else {
        // voeg opeenvolgende niet-clip keys samen tot één vloeiende zin
        const parts: string[] = [];
        const numsInRun: number[] = [];
        while (i < keys.length && !this.scene.cache.audio.exists(voiceClipKey(keys[i]))) {
          parts.push(voiceText(keys[i]));
          if (keys[i].startsWith('num.')) numsInRun.push(parseInt(keys[i].slice(4), 10));
          i++;
        }
        const ok = await this.tts(parts.join(' '), token);
        if (!ok) {
          this.sfx.beep(numsInRun[0] ?? 1);
          await this.wait(220);
        }
      }
    }
  }

  private playClip(clipKey: string): Promise<void> {
    return new Promise((resolve) => {
      const snd = this.scene.sound.add(clipKey);
      snd.once('complete', () => {
        snd.destroy();
        resolve();
      });
      snd.once('stop', () => {
        snd.destroy();
        resolve();
      });
      snd.play();
    });
  }

  private tts(text: string, token: number): Promise<boolean> {
    if (!('speechSynthesis' in window) || !text.trim()) return Promise.resolve(false);
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'nl-NL';
      if (this.dutchVoice) u.voice = this.dutchVoice;
      u.rate = 0.95;
      u.pitch = 1.35; // net wat hoger = grappiger
      u.volume = 1;

      let done = false;
      const finish = (ok: boolean) => {
        if (!done) {
          done = true;
          resolve(ok && this.token === token);
        }
      };
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      // vangnet: sommige browsers vuren onend niet betrouwbaar
      const words = text.split(/\s+/).length;
      setTimeout(() => finish(true), Math.max(2500, words * 450));

      speechSynthesis.speak(u);
    });
  }

  /** Moet in de eerste user-gesture: TTS "voorverwarmen" op iOS. */
  static prime(): void {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => this.scene.time.delayedCall(ms, r));
  }
}
