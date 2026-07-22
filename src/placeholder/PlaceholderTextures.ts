import Phaser from 'phaser';

/**
 * Procedurele placeholder-textures voor alles wat (nog) geen echte asset
 * heeft: vlaaien, voertuigen, plantjes, hek, UI-doodads. Vervangen =
 * alleen assetManifest/Preload aanpassen, keys blijven gelijk.
 */

function tex(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (g: Phaser.GameObjects.Graphics) => void
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function generateAll(scene: Phaser.Scene): void {
  // --- grastegel ---
  tex(scene, 'grass', 128, 128, (g) => {
    g.fillStyle(0x5da944);
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 126;
      const y = Math.random() * 126;
      g.fillStyle(Math.random() < 0.5 ? 0x4c9438 : 0x6fbf55);
      g.fillRect(x, y, 2, Math.random() < 0.3 ? 5 : 2);
    }
  });

  // --- koeienvlaai ---
  tex(scene, 'vlaai', 52, 36, (g) => {
    g.fillStyle(0x5d4025);
    g.fillEllipse(26, 27, 48, 16);
    g.fillStyle(0x6d4c2f);
    g.fillEllipse(26, 21, 38, 14);
    g.fillStyle(0x7d5a38);
    g.fillEllipse(24, 15, 26, 11);
    g.fillStyle(0x8a6540);
    g.fillEllipse(22, 11, 14, 7);
    g.fillStyle(0x52381f);
    g.fillCircle(34, 20, 2);
    g.fillCircle(18, 25, 2);
  });

  // --- doelring om aangetikte vlaai ---
  tex(scene, 'ring', 84, 84, (g) => {
    g.lineStyle(5, 0xffe14d, 0.95);
    g.strokeCircle(42, 42, 36);
  });

  // --- voertuigen (kijken naar rechts) ---
  tex(scene, 'vehicle-0', 104, 74, (g) => {
    // kruiwagen: handvatten, bak, één wiel
    g.fillStyle(0x795548);
    g.fillRect(4, 26, 34, 7);
    g.fillStyle(0x9e9e9e);
    g.fillPoints(
      [
        { x: 24, y: 20 },
        { x: 86, y: 20 },
        { x: 76, y: 50 },
        { x: 32, y: 50 },
      ],
      true
    );
    g.fillStyle(0x757575);
    g.fillPoints(
      [
        { x: 30, y: 24 },
        { x: 80, y: 24 },
        { x: 73, y: 46 },
        { x: 36, y: 46 },
      ],
      true
    );
    g.fillStyle(0x263238);
    g.fillCircle(66, 60, 12);
    g.fillStyle(0x90a4ae);
    g.fillCircle(66, 60, 5);
  });

  tex(scene, 'vehicle-1', 116, 84, (g) => {
    // rood trekkertje
    g.fillStyle(0x37474f);
    g.fillRect(36, 4, 7, 20);
    g.fillStyle(0xd32f2f);
    g.fillRoundedRect(24, 24, 66, 26, 6);
    g.fillStyle(0xb71c1c);
    g.fillRoundedRect(62, 8, 26, 22, 4);
    g.fillStyle(0xb3e5fc);
    g.fillRect(66, 12, 18, 12);
    g.fillStyle(0x263238);
    g.fillCircle(42, 62, 19);
    g.fillCircle(92, 66, 12);
    g.fillStyle(0xfbc02d);
    g.fillCircle(42, 62, 8);
    g.fillCircle(92, 66, 5);
  });

  tex(scene, 'vehicle-2', 128, 92, (g) => {
    // grote groene trekker
    g.fillStyle(0x37474f);
    g.fillRect(40, 2, 8, 24);
    g.fillStyle(0x2e7d32);
    g.fillRoundedRect(24, 26, 78, 30, 7);
    g.fillStyle(0xffa000);
    g.fillRect(24, 40, 78, 6);
    g.fillStyle(0x1b5e20);
    g.fillRoundedRect(68, 6, 30, 26, 5);
    g.fillStyle(0xb3e5fc);
    g.fillRect(72, 10, 22, 15);
    g.fillStyle(0x263238);
    g.fillCircle(46, 68, 22);
    g.fillCircle(102, 72, 14);
    g.fillStyle(0xfbc02d);
    g.fillCircle(46, 68, 9);
    g.fillCircle(102, 72, 6);
  });

  // --- plantjes ---
  tex(scene, 'plant-sad', 56, 76, (g) => {
    g.fillStyle(0x6d4c2f);
    g.fillEllipse(28, 68, 34, 12);
    g.lineStyle(5, 0x9e9d24);
    g.beginPath();
    g.moveTo(28, 66);
    g.lineTo(30, 46);
    g.lineTo(38, 38);
    g.lineTo(44, 48);
    g.strokePath();
    g.fillStyle(0xa8b878);
    g.fillEllipse(22, 52, 14, 8);
    g.fillEllipse(36, 42, 12, 7);
    g.fillStyle(0xc5ba82);
    g.fillCircle(45, 50, 7);
  });

  tex(scene, 'plant-happy', 56, 76, (g) => {
    g.fillStyle(0x6d4c2f);
    g.fillEllipse(28, 68, 34, 12);
    g.lineStyle(5, 0x33691e);
    g.beginPath();
    g.moveTo(28, 66);
    g.lineTo(28, 30);
    g.strokePath();
    g.fillStyle(0x66bb6a);
    g.fillEllipse(17, 48, 18, 9);
    g.fillEllipse(39, 42, 18, 9);
    g.fillEllipse(20, 34, 14, 8);
    g.fillStyle(0xe53935);
    g.fillCircle(29, 22, 11);
    g.fillStyle(0xff8a80);
    g.fillCircle(25, 18, 3);
    g.fillStyle(0x33691e);
    g.fillRect(27, 9, 4, 6);
  });

  // --- poepberg (te-veel-gag) ---
  tex(scene, 'poop-pile', 92, 68, (g) => {
    g.fillStyle(0x5d4025);
    g.fillEllipse(46, 56, 84, 22);
    g.fillStyle(0x6d4c2f);
    g.fillEllipse(46, 42, 62, 24);
    g.fillStyle(0x7d5a38);
    g.fillEllipse(44, 28, 40, 18);
    g.fillStyle(0x8a6540);
    g.fillEllipse(42, 17, 20, 12);
    // vliegjes
    g.fillStyle(0x263238);
    g.fillCircle(14, 12, 3);
    g.fillCircle(76, 8, 3);
    g.fillCircle(86, 26, 2);
  });

  // --- pijl naar de poort ---
  tex(scene, 'arrow', 76, 58, (g) => {
    g.fillStyle(0xffe14d);
    g.fillPoints(
      [
        { x: 4, y: 18 },
        { x: 42, y: 18 },
        { x: 42, y: 4 },
        { x: 72, y: 29 },
        { x: 42, y: 54 },
        { x: 42, y: 40 },
        { x: 4, y: 40 },
      ],
      true
    );
    g.lineStyle(3, 0xc79a00);
    g.strokePoints(
      [
        { x: 4, y: 18 },
        { x: 42, y: 18 },
        { x: 42, y: 4 },
        { x: 72, y: 29 },
        { x: 42, y: 54 },
        { x: 42, y: 40 },
        { x: 4, y: 40 },
      ],
      true
    );
  });

  // --- ster ---
  tex(scene, 'star', 48, 48, (g) => {
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 22 : 9.5;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push({ x: 24 + r * Math.cos(a), y: 24 + r * Math.sin(a) });
    }
    g.fillStyle(0xffd740);
    g.fillPoints(pts, true);
    g.lineStyle(3, 0xffab00);
    g.strokePoints(pts, true);
  });

  // --- confetti-snipper ---
  tex(scene, 'confetti', 8, 8, (g) => {
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 8, 8);
  });
}
