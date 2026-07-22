import Phaser from 'phaser';

export class Plant extends Phaser.GameObjects.Image {
  hungry = true;
  private pile?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'plant-sad');
    scene.add.existing(this);
    this.setDepth(y);
    this.setScale(0);
    scene.tweens.add({ targets: this, scale: 1, duration: 300, ease: 'Back.easeOut' });
    // zachtjes sip wiegen
    scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  feed(): void {
    this.hungry = false;
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
    this.setTexture('plant-happy');
    this.scene.tweens.add({
      targets: this,
      scaleX: { from: 1.25, to: 1 },
      scaleY: { from: 0.75, to: 1 },
      duration: 350,
      ease: 'Elastic.easeOut',
    });
  }

  /** Te-weinig-uitkomst: nog verdrietiger hangen. */
  droopHarder(): void {
    this.scene.tweens.add({
      targets: this,
      angle: 10,
      scaleY: 0.9,
      duration: 500,
      ease: 'Sine.easeOut',
    });
  }

  /** Te-veel-gag: bedolven onder de poep. */
  bury(): void {
    this.hungry = false;
    this.scene.tweens.killTweensOf(this);
    this.pile = this.scene.add.image(this.x, this.y + 6, 'poop-pile').setDepth(this.depth + 1).setScale(0);
    this.scene.tweens.add({
      targets: this.pile,
      scale: 1.15,
      duration: 320,
      ease: 'Back.easeOut',
    });
  }

  destroy(fromScene?: boolean): void {
    this.pile?.destroy();
    super.destroy(fromScene);
  }
}
