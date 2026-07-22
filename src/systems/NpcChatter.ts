import Phaser from 'phaser';
import { AMBIENT_CHATS, BABBLE_PROFILES, type ChatLine } from '@/config/chats';
import { WORLD } from '@/config/gameConfig';
import { Ev } from '@/events';
import type { Npc } from '@/entities/Npc';
import type { SfxSynth } from '@/audio/SfxSynth';
import type { Giver } from '@/types';

const FONT = '"Comic Sans MS", "Trebuchet MS", sans-serif';

/**
 * Ambient-gesprekjes tussen de NPC's: spraakbubbels in de wereld met
 * wauwel-gebrabbel per personage (papa laag, Eleanor hoog).
 */
export class NpcChatter {
  private nextIn: number;
  private busy = false;
  private lastChat = -1;

  constructor(
    private scene: Phaser.Scene,
    private npcs: Map<Giver, Npc>,
    private sfx: SfxSynth
  ) {
    this.nextIn = Phaser.Math.Between(4000, 9000);
    // na elk quest-dialoog (Ward staat dan meestal bij de familie) snel een praatje
    const onDialogueDone = () => {
      this.nextIn = Math.min(this.nextIn, 2200);
    };
    scene.game.events.on(Ev.DialogueDone, onDialogueDone);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.game.events.off(Ev.DialogueDone, onDialogueDone);
    });
  }

  /** Staat minstens één NPC (ruim) in beeld? Anders kletst niemand — Ward moet het kunnen zien. */
  private npcsInView(): boolean {
    const view = this.scene.cameras.main.worldView;
    const margin = 220;
    for (const npc of this.npcs.values()) {
      if (
        npc.x > view.left - margin &&
        npc.x < view.right + margin &&
        npc.y > view.top - margin &&
        npc.y < view.bottom + margin
      ) {
        return true;
      }
    }
    return false;
  }

  update(delta: number): void {
    if (this.busy || this.scene.registry.get('dialogOpen')) return;
    if (!this.npcsInView()) return; // timer loopt alleen als je bij de familie bent
    this.nextIn -= delta;
    if (this.nextIn <= 0) {
      this.startRandomChat();
    }
  }

  private startRandomChat(): void {
    let idx = Phaser.Math.Between(0, AMBIENT_CHATS.length - 1);
    if (idx === this.lastChat) idx = (idx + 1) % AMBIENT_CHATS.length;
    this.lastChat = idx;
    this.busy = true;
    this.playLines(AMBIENT_CHATS[idx], 0);
  }

  private playLines(lines: ChatLine[], i: number): void {
    if (i >= lines.length) {
      this.busy = false;
      this.nextIn = Phaser.Math.Between(14000, 26000);
      return;
    }
    // stoppen als het echte quest-dialoog opengaat
    if (this.scene.registry.get('dialogOpen')) {
      this.busy = false;
      this.nextIn = Phaser.Math.Between(15000, 25000);
      return;
    }
    const line = lines[i];
    const npc = this.npcs.get(line.speaker);
    if (!npc) {
      this.playLines(lines, i + 1);
      return;
    }

    const syllables = Phaser.Math.Clamp(Math.round(line.text.length / 4), 3, 12);
    this.sfx.babble(BABBLE_PROFILES[line.speaker], syllables, line.text.trim().endsWith('?'));
    const dur = 1100 + line.text.length * 45;
    this.showBubble(npc, line.text, dur);
    // spreker huppelt even mee
    this.scene.tweens.add({
      targets: npc,
      y: '-=6',
      duration: 120,
      yoyo: true,
      repeat: 1,
    });
    this.scene.time.delayedCall(dur + 250, () => this.playLines(lines, i + 1));
  }

  private showBubble(npc: Npc, text: string, dur: number): void {
    const txt = this.scene.add
      .text(0, 0, text, {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#4e342e',
        wordWrap: { width: 240 },
        align: 'center',
      })
      .setOrigin(0.5);
    const w = txt.width + 28;
    const h = txt.height + 20;
    const g = this.scene.add.graphics();
    g.fillStyle(0xffffff, 0.96);
    g.lineStyle(3, 0x8d6e63);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    // staartje naar de spreker
    g.fillTriangle(-8, h / 2 - 1, 8, h / 2 - 1, 0, h / 2 + 12);
    g.lineBetween(-8, h / 2, 0, h / 2 + 12);
    g.lineBetween(8, h / 2, 0, h / 2 + 12);

    const bubble = this.scene.add
      .container(npc.x, npc.y - 78, [g, txt])
      .setDepth(90000)
      .setScale(0);
    // binnen de wereld houden
    const half = w / 2;
    bubble.x = Phaser.Math.Clamp(bubble.x, half + 8, WORLD.w - half - 8);

    this.scene.tweens.add({
      targets: bubble,
      scale: 1,
      duration: 220,
      ease: 'Back.easeOut',
    });
    this.scene.time.delayedCall(dur, () => {
      this.scene.tweens.add({
        targets: bubble,
        scale: 0,
        alpha: 0,
        duration: 160,
        onComplete: () => bubble.destroy(),
      });
    });
  }
}
