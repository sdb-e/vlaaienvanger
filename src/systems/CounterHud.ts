import Phaser from 'phaser';

const FONT = '"Comic Sans MS", "Trebuchet MS", sans-serif';

/**
 * Teller rechtsboven: groot cijfer + rij vlaai-slotjes die vullen.
 * Dubbele codering — het cijfer om te leren, de icoontjes om te snappen.
 */
export class CounterHud {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private icons: Phaser.GameObjects.Image[] = [];
  private lastCount = 0;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(1270, 14).setDepth(1000);
    this.bg = scene.add.graphics();
    this.text = scene.add
      .text(0, 8, '0', { fontFamily: FONT, fontSize: '52px', color: '#4e342e', fontStyle: 'bold' })
      .setOrigin(1, 0);
    this.container.add([this.bg, this.text]);
    this.set(0, null);
  }

  set(count: number, target: number | null): void {
    const label = target === null ? `${count}` : `${count} / ${target}`;
    this.text.setText(label);
    const tooMany = target !== null && count > target;
    this.text.setColor(tooMany ? '#8d4e12' : '#4e342e');

    const w = Math.max(this.text.width + 44, target ? target * 26 + 44 : 0);
    const h = target ? 116 : 84;
    this.bg.clear();
    this.bg.fillStyle(0xfff8e1, 0.92);
    this.bg.fillRoundedRect(-w, 0, w, h, 18);
    this.bg.lineStyle(4, 0x8d6e63);
    this.bg.strokeRoundedRect(-w, 0, w, h, 18);
    this.text.setX(-22);

    // slot-icoontjes
    this.icons.forEach((i) => i.destroy());
    this.icons = [];
    if (target !== null) {
      const shown = Math.max(target, count);
      for (let i = 0; i < Math.min(shown, 12); i++) {
        const icon = this.scene.add
          .image(-w + 24 + i * 24, 88, 'vlaai')
          .setScale(0.42)
          .setAlpha(i < count ? 1 : 0.25);
        if (i >= target) {
          // overflow wiebelt — zichtbaar maar gek, niet alarmerend
          this.scene.tweens.add({
            targets: icon,
            angle: { from: -18, to: 18 },
            duration: 260,
            yoyo: true,
            repeat: -1,
          });
        }
        this.container.add(icon);
        this.icons.push(icon);
      }
    }

    // pop-effect bij nieuwe telling
    if (count > this.lastCount) {
      this.scene.tweens.add({
        targets: this.text,
        scale: { from: 1.45, to: 1 },
        duration: 260,
        ease: 'Back.easeOut',
      });
    }
    this.lastCount = count;
  }
}
