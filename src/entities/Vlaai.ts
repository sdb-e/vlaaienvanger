import Phaser from 'phaser';

export class Vlaai extends Phaser.GameObjects.Image {
  reserved = false;
  private ring?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'vlaai');
    scene.add.existing(this);
    this.setDepth(y - 20);
    this.setScale(0);
    scene.tweens.add({ targets: this, scale: 1, duration: 250, ease: 'Back.easeOut' });
  }

  showRing(): void {
    if (this.ring) return;
    this.ring = this.scene.add.image(this.x, this.y, 'ring').setDepth(this.depth - 1);
    this.scene.tweens.add({
      targets: this.ring,
      scale: { from: 1.15, to: 0.95 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  hideRing(): void {
    this.ring?.destroy();
    this.ring = undefined;
  }

  destroy(fromScene?: boolean): void {
    this.hideRing();
    super.destroy(fromScene);
  }
}
