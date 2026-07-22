import Phaser from 'phaser';
import { DELIVERY_SPOT, GARDEN, TUNING } from '@/config/gameConfig';
import type { Plant } from '@/entities/Plant';
import type { Vehicle } from '@/entities/Vehicle';
import type { SfxSynth } from '@/audio/SfxSynth';
import type { VoicePlayer } from '@/audio/VoicePlayer';
import type { QuestManager } from '@/systems/QuestManager';

/**
 * De één-op-één-uitdeelscene in de moestuin: elk plantje precies één vlaai,
 * hardop meegeteld. Hier gebeurt het echte leren tellen.
 */
export class DeliveryDirector {
  active = false;
  private plants: Plant[] = [];
  private vehicle!: Vehicle;
  private flying = false;
  private lastAction = 0;
  private autoEvent?: Phaser.Time.TimerEvent;
  private onLaugh: () => void = () => {};

  constructor(
    private scene: Phaser.Scene,
    private sfx: SfxSynth,
    private voice: VoicePlayer,
    private qm: QuestManager
  ) {}

  setLaughCallback(cb: () => void): void {
    this.onLaugh = cb;
  }

  start(plants: Plant[], vehicle: Vehicle): void {
    if (this.active) return;
    this.active = true;
    this.plants = plants;
    this.vehicle = vehicle;
    this.qm.onDeliveryStart();

    vehicle.stop();
    vehicle.driveTo(DELIVERY_SPOT.x, DELIVERY_SPOT.y);

    const cam = this.scene.cameras.main;
    cam.stopFollow();
    cam.pan((GARDEN.left + GARDEN.right) / 2, (GARDEN.top + GARDEN.bottom) / 2 - 30, 700, 'Sine.easeInOut');

    this.lastAction = this.scene.time.now;
    this.autoEvent = this.scene.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => this.tick(),
    });
  }

  /** Auto-feed als Ward even niet tikt — het spel mag nooit vastlopen. */
  private tick(): void {
    if (!this.active || this.flying) return;
    if (this.scene.time.now - this.lastAction >= TUNING.autoFeedMs) {
      const p = this.plants.find((pl) => pl.hungry);
      if (p) this.feed(p);
    }
  }

  /** Tik-afhandeling; retourneert true als de tik verbruikt is. */
  tryTapPlant(wx: number, wy: number): boolean {
    if (!this.active) return false;
    if (this.flying) return true;
    let best: Plant | null = null;
    let bestD = TUNING.plantTapRadius;
    for (const p of this.plants) {
      if (!p.hungry) continue;
      const d = Phaser.Math.Distance.Between(wx, wy, p.x, p.y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best) this.feed(best);
    return true;
  }

  private feed(plant: Plant): void {
    const quest = this.qm.quest;
    if (!quest || this.flying || quest.collected <= 0) return;
    this.flying = true;
    this.lastAction = this.scene.time.now;
    quest.collected--;

    this.flyVlaai(this.vehicle.x, this.vehicle.y - 25, plant.x, plant.y - 10, () => {
      plant.feed();
      quest.delivered++;
      this.sfx.plop();
      void this.voice.say([`num.${quest.delivered}`]);
      this.flying = false;
      this.checkFinish();
    });
  }

  private flyVlaai(fromX: number, fromY: number, toX: number, toY: number, cb: () => void): void {
    const img = this.scene.add.image(fromX, fromY, 'vlaai').setDepth(99999);
    const peak = Math.min(fromY, toY) - 130;
    const tw = { t: 0 };
    this.scene.tweens.add({
      targets: tw,
      t: 1,
      duration: 550,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const t = tw.t;
        img.setPosition(
          Phaser.Math.Linear(fromX, toX, t),
          (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * peak + t * t * toY
        );
        img.setAngle(t * 360);
      },
      onComplete: () => {
        img.destroy();
        cb();
      },
    });
  }

  private checkFinish(): void {
    const quest = this.qm.quest;
    if (!quest) return;
    const hungry = this.plants.filter((p) => p.hungry).length;

    if (hungry === 0 && quest.collected === 0) {
      this.sfx.jingle();
      this.finish('exact', 0);
    } else if (hungry === 0 && quest.collected > 0) {
      this.dumpExtras();
    } else if (hungry > 0 && quest.collected === 0) {
      this.plants.filter((p) => p.hungry).forEach((p) => p.droopHarder());
      this.sfx.sadWhistle();
      this.scene.time.delayedCall(700, () => this.finish('teweinig', hungry));
    }
    // beide > 0: wachten op de volgende tik
  }

  /** Te-veel-gag: restjes op het laatste plantje kieperen, koeien lachen. */
  private dumpExtras(): void {
    const quest = this.qm.quest;
    if (!quest) return;
    const last = this.plants[this.plants.length - 1];
    let pitch = 1;

    const step = (): void => {
      if (quest.collected <= 0) {
        last.bury();
        this.onLaugh();
        this.scene.time.delayedCall(1300, () => this.finish('teveel', 0));
        return;
      }
      quest.collected--;
      pitch += 0.18;
      this.flyVlaai(this.vehicle.x, this.vehicle.y - 25, last.x, last.y, () => {
        this.sfx.plop(pitch);
        step();
      });
    };
    step();
  }

  private finish(outcome: 'exact' | 'teveel' | 'teweinig', remaining: number): void {
    this.active = false;
    this.autoEvent?.remove();
    this.autoEvent = undefined;
    const cam = this.scene.cameras.main;
    cam.startFollow(this.vehicle, true, 0.06, 0.06);
    this.qm.onDeliveryDone(outcome, remaining);
  }
}
