import Phaser from 'phaser';
import { Ev } from '@/events';
import { TIERS } from '@/config/progression';

const BTN = 54;
const GAP = 8;
const X = 42;
const TOP = 110;

/**
 * Kolom knoppen links: wisselen tussen vrijgespeelde voertuigen.
 * Groot raakvlak, gekozen voertuig krijgt een gele ring.
 */
export class VehiclePicker {
  private container: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(1500);

    const initial = scene.registry.get('tiers') as { unlocked: number; selected: number } | undefined;
    this.rebuild(initial?.unlocked ?? 0, initial?.selected ?? 0);

    const onChange = ({ unlocked, selected }: { unlocked: number; selected: number }) =>
      this.rebuild(unlocked, selected);
    scene.game.events.on(Ev.TiersChanged, onChange);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.game.events.off(Ev.TiersChanged, onChange);
    });
  }

  private rebuild(unlocked: number, selected: number): void {
    this.container.removeAll(true);
    if (unlocked <= 0) return; // nog niks te kiezen met alleen het emmertje

    for (let t = 0; t <= Math.min(unlocked, TIERS.length - 1); t++) {
      const y = TOP + t * (BTN + GAP);
      const isSel = t === selected;

      const bg = this.scene.add.graphics();
      bg.fillStyle(isSel ? 0xfff3c4 : 0xfff8e1, isSel ? 0.98 : 0.82);
      bg.fillRoundedRect(X - BTN / 2, y - BTN / 2, BTN, BTN, 14);
      bg.lineStyle(isSel ? 5 : 3, isSel ? 0xffb300 : 0x8d6e63);
      bg.strokeRoundedRect(X - BTN / 2, y - BTN / 2, BTN, BTN, 14);

      const icon = this.scene.add.image(X, y, TIERS[t].texture);
      const fit = (BTN - 14) / Math.max(icon.width, icon.height);
      icon.setScale(Math.min(fit, 2));

      // ruim raakvlak voor kleine vingers
      const hit = this.scene.add
        .zone(X, y, BTN + 14, BTN + GAP)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        if (this.scene.registry.get('dialogOpen')) return;
        this.scene.game.events.emit(Ev.SelectVehicle, { tier: t });
      });

      this.container.add([bg, icon, hit]);
    }
  }
}
