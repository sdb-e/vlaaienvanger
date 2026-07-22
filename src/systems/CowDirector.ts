import Phaser from 'phaser';
import { COW_COUNT, MEADOW, TUNING } from '@/config/gameConfig';
import { Cow } from '@/entities/Cow';
import { Vlaai } from '@/entities/Vlaai';
import type { SfxSynth } from '@/audio/SfxSynth';

export interface QuestNeed {
  target: number;
  collected: number;
}

/** Beheert de koeien en het vlaaienbudget op het veld. */
export class CowDirector {
  cows: Cow[] = [];
  vlaaien: Vlaai[] = [];

  constructor(
    private scene: Phaser.Scene,
    private sfx: SfxSynth,
    private getQuestNeed: () => QuestNeed | null
  ) {
    const cb = {
      requestPoop: (cow: Cow) => this.requestPoop(cow),
      spawnVlaai: (x: number, y: number) => this.spawnVlaai(x, y),
      fart: () => this.sfx.fart(),
    };
    for (let i = 0; i < COW_COUNT; i++) {
      const x = Phaser.Math.Between(MEADOW.left + 120, MEADOW.right - 120);
      const y = Phaser.Math.Between(MEADOW.top + 100, MEADOW.bottom - 100);
      this.cows.push(new Cow(this.scene, x, y, cb));
    }
  }

  private fieldCap(): number {
    const need = this.getQuestNeed();
    const soft = need ? Math.max(need.target + 2, 5) : 6;
    return Math.min(soft, TUNING.vlaaiHardCap);
  }

  private requestPoop(_cow: Cow): boolean {
    return this.vlaaien.length < this.fieldCap();
  }

  private spawnVlaai(x: number, y: number): void {
    const vx = Phaser.Math.Clamp(x, MEADOW.left + 50, MEADOW.right - 50);
    const vy = Phaser.Math.Clamp(y, MEADOW.top + 50, MEADOW.bottom - 50);
    this.vlaaien.push(new Vlaai(this.scene, vx, vy));
  }

  removeVlaai(v: Vlaai): void {
    this.vlaaien = this.vlaaien.filter((x) => x !== v);
  }

  nearestVlaai(x: number, y: number, maxDist: number): Vlaai | null {
    let best: Vlaai | null = null;
    let bestD = maxDist;
    for (const v of this.vlaaien) {
      if (!v.active || v.reserved) continue;
      const d = Phaser.Math.Distance.Between(x, y, v.x, v.y);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    return best;
  }

  update(time: number, delta: number, vehicle: { x: number; y: number }): void {
    for (const cow of this.cows) cow.update(time, delta, vehicle);

    // garantie: Ward hoeft nooit lang op een vlaai te wachten
    const need = this.getQuestNeed();
    if (need && this.vlaaien.length + need.collected < need.target) {
      let soonest: Cow | null = null;
      for (const cow of this.cows) {
        if (!soonest || cow.poopTimer < soonest.poopTimer) soonest = cow;
      }
      soonest?.hurryPoop();
    }
  }

  /** Alle koeien lachen (te-veel-gag). */
  laugh(): void {
    this.sfx.lachkoor();
    this.cows.forEach((cow, i) => {
      this.scene.tweens.add({
        targets: cow,
        y: '-=18',
        duration: 140,
        yoyo: true,
        repeat: 3,
        delay: i * 90,
        ease: 'Quad.easeOut',
      });
    });
  }
}
