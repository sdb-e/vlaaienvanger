import Phaser from 'phaser';
import { GARDEN, GATE, MEADOW, WORLD } from '@/config/gameConfig';
import { LPC_ROW, lpcFrame, spriteKey } from '@/config/assetManifest';
import type { VehicleTier } from '@/config/progression';

type Point = { x: number; y: number };
type Dir = 'N' | 'W' | 'S' | 'E';

/**
 * Ward onderweg: te voet met een emmertje (tier 0) of in een voertuig.
 * Rijdt in rechte lijnen; van/naar de moestuin via de poort.
 */
export class Vehicle extends Phaser.GameObjects.Container {
  private img: Phaser.GameObjects.Image;
  private ward: Phaser.GameObjects.Sprite;
  private emmer: Phaser.GameObjects.Image;
  private tierDef: VehicleTier;
  private dir: Dir = 'S';
  private waypoints: Point[] = [];
  private onArrive?: () => void;
  private moving = false;
  private bobT = 0;
  busy = false;
  speed = 135;

  constructor(scene: Phaser.Scene, x: number, y: number, tier: VehicleTier) {
    super(scene, x, y);
    this.tierDef = tier;
    this.img = scene.add.image(0, 0, 'vehicle-1');
    this.ward = scene.add.sprite(0, 0, spriteKey('ward', 'sit'), 0);
    this.emmer = scene.add.image(14, -2, 'emmer-lpc');
    this.add([this.ward, this.img, this.emmer]);
    scene.add.existing(this);
    this.setDepth(y);
    this.applyTier(tier);
  }

  setTier(tier: VehicleTier): void {
    this.tierDef = tier;
    this.applyTier(tier);
  }

  private applyTier(tier: VehicleTier): void {
    this.speed = tier.speed;
    this.setScale(1, 1);
    if (tier.mode === 'walk') {
      this.img.setVisible(false);
      this.emmer.setVisible(true);
      this.ward.setPosition(0, -16).setScale(1.15);
      this.setWalkIdle();
    } else {
      this.img.setVisible(true).setTexture(tier.texture).setScale(tier.scale);
      this.emmer.setVisible(false);
      this.ward.stop();
      this.ward.setTexture(spriteKey('ward', 'sit'));
      this.ward.setFrame(lpcFrame(this.scene, spriteKey('ward', 'sit'), LPC_ROW.E, 0));
      this.ward.setPosition(tier.seat.x, tier.seat.y).setScale(1.25);
    }
  }

  get vehicleImage(): Phaser.GameObjects.Image {
    return this.img;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  private setWalkIdle(): void {
    this.ward.stop();
    this.ward.setTexture(spriteKey('ward', 'walk'));
    this.ward.setFrame(lpcFrame(this.scene, spriteKey('ward', 'walk'), LPC_ROW[this.dir], 0));
  }

  private setDir(dx: number, dy: number): void {
    const newDir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N';
    if (this.tierDef.mode === 'walk') {
      this.dir = newDir;
      this.ward.play(`ward-walk-${newDir}`, true);
      // emmertje aan de hand, wisselt van kant
      const off = newDir === 'W' ? -15 : newDir === 'E' ? 15 : 13;
      this.emmer.setPosition(off, -4);
    } else {
      if (Math.abs(dx) > 2) this.setScale(dx < 0 ? -1 : 1, 1);
    }
  }

  driveTo(x: number, y: number, onArrive?: () => void): void {
    this.waypoints = route({ x: this.x, y: this.y }, { x, y });
    this.onArrive = onArrive;
    this.busy = true;
    this.moving = true;
  }

  stop(): void {
    this.waypoints = [];
    this.moving = false;
    this.busy = false;
    this.onArrive = undefined;
    if (this.tierDef.mode === 'walk') this.setWalkIdle();
  }

  update(delta: number): void {
    this.setDepth(this.y);
    if (!this.moving || !this.waypoints.length) return;

    const wp = this.waypoints[0];
    const dx = wp.x - this.x;
    const dy = wp.y - this.y;
    const d = Math.hypot(dx, dy);
    const step = (this.speed * delta) / 1000;

    this.setDir(dx, dy);

    if (d <= step) {
      this.setPosition(wp.x, wp.y);
      this.waypoints.shift();
      if (!this.waypoints.length) {
        this.moving = false;
        this.busy = false;
        if (this.tierDef.mode === 'walk') {
          this.setWalkIdle();
        } else {
          this.img.y = 0;
          this.ward.y = this.tierDef.seat.y;
        }
        const cb = this.onArrive;
        this.onArrive = undefined;
        cb?.();
      }
      return;
    }

    this.x += (dx / d) * step;
    this.y += (dy / d) * step;

    if (this.tierDef.mode === 'ride') {
      // hobbelen tijdens het rijden
      this.bobT += delta;
      this.img.y = Math.sin(this.bobT / 55) * 2;
      this.ward.y = this.tierDef.seat.y + Math.sin(this.bobT / 55 + 0.5) * 2;
    }
  }

  /** Wiebel bij het opscheppen van een vlaai. */
  wobble(): void {
    const target = this.tierDef.mode === 'walk' ? this.emmer : this.img;
    this.scene.tweens.add({
      targets: target,
      angle: { from: -6, to: 6 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => target.setAngle(0),
    });
  }
}

const inEast = (p: Point) => p.x > MEADOW.right;

function clampTarget(p: Point): Point {
  if (inEast(p)) {
    return {
      x: Phaser.Math.Clamp(p.x, MEADOW.right + 40, WORLD.w - 60),
      y: Phaser.Math.Clamp(p.y, GARDEN.top - 60, GARDEN.bottom + 40),
    };
  }
  return {
    x: Phaser.Math.Clamp(p.x, MEADOW.left + 40, MEADOW.right - 40),
    y: Phaser.Math.Clamp(p.y, MEADOW.top + 40, MEADOW.bottom - 40),
  };
}

/** Zelfde kant = rechtdoor; andere kant = via de poort. */
function route(from: Point, rawTo: Point): Point[] {
  const to = clampTarget(rawTo);
  if (inEast(from) === inEast(to)) return [to];
  const gateIn = { x: MEADOW.right - 50, y: GATE.cy };
  const gateOut = { x: MEADOW.right + 60, y: GATE.cy };
  return inEast(from) ? [gateOut, gateIn, to] : [gateIn, gateOut, to];
}
