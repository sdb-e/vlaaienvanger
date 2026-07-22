import Phaser from 'phaser';
import {
  CHARACTERS,
  LPC_CELL,
  LPC_ROW,
  lpcFrame,
  portraitKey,
  portraitUrl,
  spriteKey,
  spriteUrl,
  VOICE_DIR,
} from '@/config/assetManifest';
import { VoicePlayer, voiceClipFile, voiceClipKey } from '@/audio/VoicePlayer';
import { DECOR_IMAGES, FART_SOUNDS } from '@/config/decor';
import type { CharName, Giver } from '@/types';

const FONT = '"Comic Sans MS", "Trebuchet MS", sans-serif';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    const bar = this.add.graphics();
    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0xfff8e1);
      bar.fillRoundedRect(340, 340, 600 * value, 40, 14);
      bar.lineStyle(4, 0x8d6e63);
      bar.strokeRoundedRect(340, 340, 600, 40, 14);
    });

    for (const name of Object.keys(CHARACTERS) as CharName[]) {
      for (const anim of CHARACTERS[name].anims) {
        this.load.spritesheet(spriteKey(name, anim), spriteUrl(name, anim), {
          frameWidth: LPC_CELL,
          frameHeight: LPC_CELL,
        });
      }
      for (const expr of CHARACTERS[name].portraits) {
        this.load.image(portraitKey(name, expr), portraitUrl(name, expr));
      }
    }

    // LPC-koe (Daniel Eddeland, CC-BY 3.0 — zie CREDITS.md): 4 richtingen x 4 frames van 128px
    this.load.spritesheet('cow-walk', 'assets/vendor/cow_walk.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('cow-eat', 'assets/vendor/cow_eat.png', { frameWidth: 128, frameHeight: 128 });

    // decor (bomen, huisje, meer, kruiwagen — zie CREDITS.md)
    for (const [key, url] of Object.entries(DECOR_IMAGES)) {
      this.load.image(key, url);
    }
    // echte scheetgeluiden
    for (const [key, url] of Object.entries(FART_SOUNDS)) {
      this.load.audio(key, url);
    }
  }

  create(): void {
    this.createAnims();

    // optionele opgenomen stemclips: alleen laden wat index.json aankondigt
    fetch(`${VOICE_DIR}/index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((idx: { clips?: string[] } | null) => {
        if (idx?.clips?.length) {
          for (const key of idx.clips) {
            this.load.audio(voiceClipKey(key), `${VOICE_DIR}/${voiceClipFile(key)}`);
          }
          this.load.once('complete', () => this.showStart());
          this.load.start();
        } else {
          this.showStart();
        }
      })
      .catch(() => this.showStart());
  }

  private createAnims(): void {
    // koe: rijen N/W/S/E, 4 frames per rij
    for (const [dir, row] of Object.entries(LPC_ROW)) {
      this.anims.create({
        key: `cow-walk-${dir}`,
        frames: this.anims.generateFrameNumbers('cow-walk', { start: row * 4, end: row * 4 + 3 }),
        frameRate: 6,
        repeat: -1,
      });
      this.anims.create({
        key: `cow-eat-${dir}`,
        frames: this.anims.generateFrameNumbers('cow-eat', { start: row * 4, end: row * 4 + 3 }),
        frameRate: 3,
        repeat: -1,
        yoyo: true,
      });
    }

    // Ward te voet (emmer-fase): loopanimatie per richting, kolommen 1-8
    for (const [dir, row] of Object.entries(LPC_ROW)) {
      this.anims.create({
        key: `ward-walk-${dir}`,
        frames: this.anims.generateFrameNumbers(spriteKey('ward', 'walk'), {
          start: row * 9 + 1,
          end: row * 9 + 8,
        }),
        frameRate: 11,
        repeat: -1,
      });
    }

    // NPC's: 2-frames idle, naar het zuiden kijkend
    const givers: Giver[] = ['mama', 'eleanor', 'stephan'];
    for (const g of givers) {
      const key = spriteKey(g, 'idle');
      this.anims.create({
        key: `${g}-idle`,
        frames: this.anims.generateFrameNumbers(key, {
          frames: [lpcFrame(this, key, LPC_ROW.S, 0), lpcFrame(this, key, LPC_ROW.S, 1)],
        }),
        frameRate: 1.4,
        repeat: -1,
      });
    }
  }

  private showStart(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x5da944);
    this.add
      .text(640, 150, 'Vlaaienvanger', {
        fontFamily: FONT,
        fontSize: '96px',
        color: '#fff8e1',
        stroke: '#4e342e',
        strokeThickness: 12,
      })
      .setOrigin(0.5);

    const cow = this.add.image(640, 380, 'cow-walk', 8).setScale(2.2);
    this.tweens.add({
      targets: cow,
      y: '-=18',
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut',
    });

    const tik = this.add
      .text(640, 590, 'Tik om te spelen!', {
        fontFamily: FONT,
        fontSize: '54px',
        color: '#fff8e1',
        stroke: '#4e342e',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: tik,
      scale: { from: 1, to: 1.12 },
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(640, 700, 'Sprites: Liberated Pixel Cup (CC-BY-SA) · koe: Daniel Eddeland (CC-BY)', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#e8f5e9',
      })
      .setOrigin(0.5);

    // dé unlock-tik: audio, TTS en fullscreen moeten in dit gesture
    this.input.once('pointerdown', () => {
      const sm = this.sound as Phaser.Sound.WebAudioSoundManager;
      const ctx = sm.context as AudioContext | undefined;
      if (ctx && ctx.state === 'suspended') void ctx.resume();
      VoicePlayer.prime();
      try {
        if (!this.scale.isFullscreen) this.scale.startFullscreen();
      } catch {
        // fullscreen geweigerd — geen probleem
      }
      this.scene.start('Game');
    });
  }
}
