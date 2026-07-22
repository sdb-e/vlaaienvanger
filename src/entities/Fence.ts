import Phaser from 'phaser';
import { GATE, MEADOW } from '@/config/gameConfig';

/**
 * Tekent het gejitterde hek rond het weiland met een poort in de oostkant.
 * Visueel organisch; de logische begrenzing blijft de MEADOW-rechthoek.
 * Noord/west/oost gaan in een "achter"-graphics (lage depth), de zuidkant
 * in een "voor"-graphics zodat die vóór de koeien rendert.
 */
export function drawFence(scene: Phaser.Scene): void {
  const back = scene.add.graphics().setDepth(20);
  const front = scene.add.graphics().setDepth(100000);

  const drawEdge = (
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    skip?: (t: number, x: number, y: number) => boolean
  ) => {
    const len = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const steps = Math.round(len / 48);
    const posts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Phaser.Math.Linear(x1, x2, t) + Phaser.Math.Between(-5, 5);
      const y = Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-5, 5);
      if (skip && skip(t, x, y)) {
        posts.push({ x: NaN, y: NaN });
        continue;
      }
      posts.push({ x, y });
    }
    // rails tussen opeenvolgende palen
    for (let i = 0; i < posts.length - 1; i++) {
      const a = posts[i];
      const b = posts[i + 1];
      if (isNaN(a.x) || isNaN(b.x)) continue;
      g.lineStyle(5, 0x795548);
      g.lineBetween(a.x, a.y - 26, b.x, b.y - 26);
      g.lineBetween(a.x, a.y - 13, b.x, b.y - 13);
    }
    // palen er bovenop
    for (const p of posts) {
      if (isNaN(p.x)) continue;
      g.fillStyle(0x8d6e63);
      g.fillRect(p.x - 4, p.y - 36, 8, 38);
      g.fillStyle(0x6d4c41);
      g.fillRect(p.x - 4, p.y - 36, 8, 5);
    }
  };

  const { left, top, right, bottom } = MEADOW;
  drawEdge(back, left, top, right, top);
  drawEdge(back, left, top, left, bottom);
  drawEdge(back, right, top, right, bottom, (_t, _x, y) => y > GATE.yTop && y < GATE.yBottom);
  drawEdge(front, left, bottom, right, bottom);

  // dikkere poortpalen met vlaggetje
  for (const gy of [GATE.yTop, GATE.yBottom]) {
    back.fillStyle(0x6d4c41);
    back.fillRect(right - 6, gy - 46, 12, 48);
    back.fillStyle(0xffe14d);
    back.fillTriangle(right + 6, gy - 44, right + 6, gy - 30, right + 26, gy - 37);
  }
}
