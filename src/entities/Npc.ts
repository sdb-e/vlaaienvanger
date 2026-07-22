import Phaser from 'phaser';
import { LPC_ROW, lpcFrame, NPC_IDLE_SHEET, spriteKey } from '@/config/assetManifest';
import type { Giver } from '@/types';

export class Npc extends Phaser.GameObjects.Sprite {
  private bounceTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    public giver: Giver
  ) {
    super(scene, x, y, spriteKey(giver, NPC_IDLE_SHEET[giver]), 0);
    scene.add.existing(this);
    this.setDepth(y);
    this.setScale(1.4);
    if (NPC_IDLE_SHEET[giver] === 'idle') {
      this.play(`${giver}-idle`);
    } else {
      // kind: statisch stilstand-frame uit de walk-sheet (kolom 0, zuid)
      this.setFrame(lpcFrame(scene, spriteKey(giver, 'walk'), LPC_ROW.S, 0));
    }
  }

  /** Stuiteren als deze NPC een opdracht heeft. */
  setActiveGiver(active: boolean): void {
    this.bounceTween?.remove();
    this.bounceTween = undefined;
    if (active) {
      this.bounceTween = this.scene.tweens.add({
        targets: this,
        y: this.y - 14,
        duration: 320,
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeOut',
      });
    }
  }
}
