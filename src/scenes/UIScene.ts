import Phaser from 'phaser';
import { Ev } from '@/events';
import { CounterHud } from '@/systems/CounterHud';
import { DialogueBox } from '@/systems/DialogueBox';
import { VehiclePicker } from '@/systems/VehiclePicker';
import type { SfxSynth } from '@/audio/SfxSynth';
import type { VoicePlayer } from '@/audio/VoicePlayer';
import type { DialogueLine } from '@/types';

const FONT = '"Comic Sans MS", "Trebuchet MS", sans-serif';

export class UIScene extends Phaser.Scene {
  private hud!: CounterHud;
  private dialogue!: DialogueBox;
  private starText!: Phaser.GameObjects.Text;
  private sfx!: SfxSynth;

  constructor() {
    super('UI');
  }

  create(): void {
    const voice = this.registry.get('voice') as VoicePlayer;
    this.sfx = this.registry.get('sfx') as SfxSynth;

    this.hud = new CounterHud(this);
    this.dialogue = new DialogueBox(this, voice);
    new VehiclePicker(this);

    this.add.image(38, 40, 'star').setDepth(1000);
    this.starText = this.add
      .text(70, 20, String(this.registry.get('stars-init') ?? 0), {
        fontFamily: FONT,
        fontSize: '44px',
        color: '#fff8e1',
        stroke: '#4e342e',
        strokeThickness: 8,
      })
      .setDepth(1000);

    const onCounter = ({ count, target }: { count: number; target: number | null }) =>
      this.hud.set(count, target);
    const onDialogue = (lines: DialogueLine[]) => this.dialogue.show(lines);
    const onStars = ({ stars, gained }: { stars: number; gained: number }) =>
      this.onStars(stars, gained);

    this.game.events.on(Ev.Counter, onCounter);
    this.game.events.on(Ev.Dialogue, onDialogue);
    this.game.events.on(Ev.Stars, onStars);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Ev.Counter, onCounter);
      this.game.events.off(Ev.Dialogue, onDialogue);
      this.game.events.off(Ev.Stars, onStars);
    });

    this.input.on('pointerdown', () => {
      if (this.dialogue.open) this.dialogue.tapAdvance();
    });
  }

  private onStars(stars: number, gained: number): void {
    if (gained <= 0) {
      this.starText.setText(String(stars));
      return;
    }
    // sterren vliegen één voor één naar de teller
    for (let i = 0; i < gained; i++) {
      const star = this.add.image(640, 320, 'star').setDepth(3000).setScale(2);
      const isLast = i === gained - 1;
      this.tweens.add({
        targets: star,
        x: 38,
        y: 40,
        scale: 1,
        delay: 300 + i * 350,
        duration: 600,
        ease: 'Quad.easeIn',
        onComplete: () => {
          star.destroy();
          this.sfx.pop();
          // laatste ster zet de echte eindstand, tussenstappen tellen op
          this.starText.setText(
            isLast ? String(stars) : String(parseInt(this.starText.text, 10) + 1)
          );
          this.tweens.add({
            targets: this.starText,
            scale: { from: 1.5, to: 1 },
            duration: 220,
          });
        },
      });
    }
  }
}
