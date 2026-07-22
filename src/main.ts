import Phaser from 'phaser';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { GameScene } from '@/scenes/GameScene';
import { UIScene } from '@/scenes/UIScene';

declare global {
  interface Window {
    // let op: window.game is al het <div id="game"> element (named access),
    // dus de Phaser-instantie krijgt een eigen naam
    vvGame: Phaser.Game | undefined;
  }
}

// Vite kan deze module her-uitvoeren; ruim een oude instantie op
if (window.vvGame instanceof Phaser.Game) {
  window.vvGame.destroy(true);
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#5da944',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  render: {
    pixelArt: true,
    roundPixels: true,
  },
  // in dev doorlopen als het venster niet zichtbaar is (RAF wordt dan gethrottled)
  fps: import.meta.env.DEV ? { forceSetTimeOut: true, target: 60 } : undefined,
  scene: [BootScene, PreloadScene, GameScene, UIScene],
});

window.vvGame = game;

// iOS pauzeert de AudioContext bij het wegswitchen — hervatten bij terugkomst
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const sm = game.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = sm.context as AudioContext | undefined;
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }
});
