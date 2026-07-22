import Phaser from 'phaser';
import { MEADOW, TUNING } from '@/config/gameConfig';

export type CowState = 'graze' | 'wander' | 'poop' | 'startled';

const INSET = 60;
const DIRS = ['N', 'W', 'S', 'E'] as const;
type Dir = (typeof DIRS)[number];

export interface CowCallbacks {
  requestPoop(cow: Cow): boolean;
  spawnVlaai(x: number, y: number): void;
  fart(): void;
}

export class Cow extends Phaser.GameObjects.Sprite {
  cowState: CowState = 'graze';
  private stateTimer = 0;
  poopTimer: number;
  private target = new Phaser.Math.Vector2();
  private dir: Dir = 'S';
  private startleCooldown = 0;
  private speed: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private cb: CowCallbacks
  ) {
    super(scene, x, y, 'cow-walk', 0);
    scene.add.existing(this);
    // net wat dikker dan echt = grappiger
    this.setScale(0.95, 0.85);
    this.scaleX *= 1.12;
    this.speed = Phaser.Math.Between(28, 42);
    this.stateTimer = Phaser.Math.Between(1000, 5000);
    this.poopTimer = Phaser.Math.Between(TUNING.poopMinMs, TUNING.poopMaxMs);
    this.setDir('S');
    this.playAnim('eat');
  }

  private setDir(d: Dir): void {
    this.dir = d;
  }

  private playAnim(kind: 'walk' | 'eat'): void {
    this.play(`cow-${kind}-${this.dir}`, true);
  }

  /** Verkort de poeptimer als Ward op vlaaien wacht. */
  hurryPoop(): void {
    this.poopTimer = Math.min(this.poopTimer, TUNING.urgentPoopMs);
  }

  update(_time: number, delta: number, vehicle: { x: number; y: number }): void {
    this.setDepth(this.y);
    this.startleCooldown = Math.max(0, this.startleCooldown - delta);

    if (this.cowState === 'poop' || this.cowState === 'startled') return;

    // geschrokken hupje als het voertuig langsraast
    const dist = Phaser.Math.Distance.Between(this.x, this.y, vehicle.x, vehicle.y);
    if (dist < 85 && this.startleCooldown === 0) {
      this.startle();
      return;
    }

    this.poopTimer -= delta;
    if (this.poopTimer <= 0) {
      if (this.cb.requestPoop(this)) {
        this.startPoop();
        return;
      }
      this.poopTimer = Phaser.Math.Between(3000, 7000);
    }

    this.stateTimer -= delta;
    if (this.cowState === 'graze') {
      if (this.stateTimer <= 0) {
        this.cowState = 'wander';
        this.target.set(
          Phaser.Math.Between(MEADOW.left + INSET, MEADOW.right - INSET),
          Phaser.Math.Between(MEADOW.top + INSET, MEADOW.bottom - INSET)
        );
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        this.setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N');
        this.playAnim('walk');
      }
    } else if (this.cowState === 'wander') {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        this.cowState = 'graze';
        this.stateTimer = Phaser.Math.Between(2000, 6000);
        this.playAnim('eat');
      } else {
        const step = (this.speed * delta) / 1000;
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
      }
    }
  }

  private startle(): void {
    this.cowState = 'startled';
    this.startleCooldown = 4000;
    this.scene.tweens.add({
      targets: this,
      y: '-=22',
      duration: 130,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.cowState = 'graze';
        this.stateTimer = Phaser.Math.Between(500, 2000);
        this.playAnim('eat');
      },
    });
  }

  private startPoop(): void {
    this.cowState = 'poop';
    this.playAnim('eat');
    // twee vrolijke sprongetjes met squash & stretch, dan prrrt + vlaai
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        { y: '-=26', scaleY: this.scaleY * 1.12, duration: 150, yoyo: true, ease: 'Quad.easeOut' },
        { y: '-=26', scaleY: this.scaleY * 1.12, duration: 150, yoyo: true, ease: 'Quad.easeOut' },
      ],
      onComplete: () => {
        this.cb.fart();
        const behind = this.getBehind();
        this.cb.spawnVlaai(behind.x, behind.y);
        this.scene.tweens.add({
          targets: this,
          y: '-=14',
          duration: 110,
          yoyo: true,
          onComplete: () => {
            this.cowState = 'graze';
            this.stateTimer = Phaser.Math.Between(1500, 4000);
            this.poopTimer = Phaser.Math.Between(TUNING.poopMinMs, TUNING.poopMaxMs);
          },
        });
      },
    });
  }

  private getBehind(): { x: number; y: number } {
    const off = 55;
    switch (this.dir) {
      case 'E':
        return { x: this.x - off, y: this.y + 18 };
      case 'W':
        return { x: this.x + off, y: this.y + 18 };
      case 'N':
        return { x: this.x, y: this.y + off * 0.8 };
      default:
        return { x: this.x, y: this.y - off * 0.6 };
    }
  }
}
