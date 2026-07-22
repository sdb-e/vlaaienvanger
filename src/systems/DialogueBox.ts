import Phaser from 'phaser';
import { Ev } from '@/events';
import { DISPLAY_NAMES, portraitKey, resolveExpression } from '@/config/assetManifest';
import type { VoicePlayer } from '@/audio/VoicePlayer';
import type { DialogueLine } from '@/types';

const FONT = '"Comic Sans MS", "Trebuchet MS", sans-serif';
const W = 1150;
const H = 236;

/**
 * Stardew-stijl dialoogbalk: portret + naam + tekst (decoratie voor ouders)
 * en de echte payload voor Ward: stem, groot cijfer en icoontjes.
 * Tik = verder; auto-advance na de stem zodat een niet-lezer nooit vastzit.
 */
export class DialogueBox {
  open = false;
  private container: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private bigNum: Phaser.GameObjects.Text;
  private icons: Phaser.GameObjects.Image[] = [];
  private tapHint: Phaser.GameObjects.Text;
  private lines: DialogueLine[] = [];
  private idx = 0;
  private lineToken = 0;
  private advanceTimer?: Phaser.Time.TimerEvent;

  constructor(
    private scene: Phaser.Scene,
    private voice: VoicePlayer
  ) {
    this.container = scene.add.container(640, 720 - H / 2 - 14).setDepth(2000).setVisible(false);

    const bg = scene.add.graphics();
    bg.fillStyle(0xfff8e1, 0.97);
    bg.fillRoundedRect(-W / 2, -H / 2, W, H, 24);
    bg.lineStyle(6, 0x8d6e63);
    bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 24);

    this.portrait = scene.add.image(-W / 2 + 118, 0, '__DEFAULT').setScale(1.6);
    this.nameText = scene.add
      .text(-W / 2 + 118, -H / 2 + 12, '', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#5d4037',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    this.bodyText = scene.add
      .text(-W / 2 + 240, -H / 2 + 42, '', {
        fontFamily: FONT,
        fontSize: '38px',
        color: '#4e342e',
        wordWrap: { width: W - 480 },
      })
      .setOrigin(0, 0);
    this.bigNum = scene.add
      .text(W / 2 - 120, -14, '', {
        fontFamily: FONT,
        fontSize: '120px',
        color: '#e65100',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tapHint = scene.add
      .text(W / 2 - 42, H / 2 - 40, '▶', { fontFamily: FONT, fontSize: '34px', color: '#8d6e63' })
      .setOrigin(0.5);

    this.container.add([bg, this.portrait, this.nameText, this.bodyText, this.bigNum, this.tapHint]);

    scene.tweens.add({
      targets: this.tapHint,
      alpha: { from: 1, to: 0.25 },
      duration: 550,
      yoyo: true,
      repeat: -1,
    });
  }

  show(lines: DialogueLine[]): void {
    this.lines = lines;
    this.idx = 0;
    this.open = true;
    this.scene.registry.set('dialogOpen', true);
    this.container.setVisible(true);
    this.container.setY(720 + H);
    this.scene.tweens.add({
      targets: this.container,
      y: 720 - H / 2 - 14,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this.showLine();
  }

  private showLine(): void {
    const line = this.lines[this.idx];
    const token = ++this.lineToken;
    this.advanceTimer?.remove();

    const expr = resolveExpression(line.speaker, line.expression);
    let key = portraitKey(line.speaker, expr);
    if (!this.scene.textures.exists(key)) key = portraitKey(line.speaker, 'neutraal');
    if (this.scene.textures.exists(key)) this.portrait.setTexture(key).setVisible(true);
    else this.portrait.setVisible(false);

    this.nameText.setText(DISPLAY_NAMES[line.speaker]);
    this.bodyText.setText(line.text);
    this.bigNum.setText(line.bigNumber !== undefined ? String(line.bigNumber) : '');
    if (line.bigNumber !== undefined) {
      this.scene.tweens.add({
        targets: this.bigNum,
        scale: { from: 0.3, to: 1 },
        duration: 420,
        ease: 'Back.easeOut',
      });
    }

    this.icons.forEach((i) => i.destroy());
    this.icons = [];
    if (line.iconRow) {
      const n = Math.min(line.iconRow.count, 10);
      const tex = line.iconRow.icon === 'plant' ? 'plant-happy' : 'vlaai';
      for (let i = 0; i < n; i++) {
        const icon = this.scene.add
          .image(-W / 2 + 252 + i * 52, H / 2 - 46, tex)
          .setScale(0.8)
          .setAlpha(0);
        this.scene.tweens.add({
          targets: icon,
          alpha: 1,
          y: '-=6',
          duration: 200,
          delay: 120 + i * 130,
        });
        this.container.add(icon);
        this.icons.push(icon);
      }
    }

    void this.voice.say(line.voice ?? []).then(() => {
      if (token !== this.lineToken || !this.open) return;
      this.advanceTimer = this.scene.time.delayedCall(1400, () => this.advance());
    });
  }

  tapAdvance(): void {
    if (this.open) this.advance();
  }

  private advance(): void {
    this.advanceTimer?.remove();
    this.lineToken++;
    this.idx++;
    if (this.idx >= this.lines.length) this.hide();
    else this.showLine();
  }

  private hide(): void {
    this.open = false;
    this.container.setVisible(false);
    this.icons.forEach((i) => i.destroy());
    this.icons = [];
    // korte tik-guard zodat de sluit-tik het voertuig niet laat rijden
    this.scene.registry.set('dialogGuardUntil', this.scene.time.now + 300);
    this.scene.registry.set('dialogOpen', false);
    this.scene.game.events.emit(Ev.DialogueDone);
  }
}
