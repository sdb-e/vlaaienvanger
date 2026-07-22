import Phaser from 'phaser';
import { generateAll } from '@/placeholder/PlaceholderTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateAll(this);
    this.scene.start('Preload');
  }
}
