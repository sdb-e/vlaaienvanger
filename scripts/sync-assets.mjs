// Kopieert de benodigde familie-assets (LPC sprites + portretten) naar public/assets/familie/.
// Kopiëren i.p.v. linken zodat de build self-contained is en de tablet de bibliotheek niet nodig heeft.
import { cpSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LIB = 'C:/Dev/familie-assets';
const DEST = join(ROOT, 'public', 'assets', 'familie');

const CHARACTERS = ['ward', 'stephan', 'mama', 'eleanor'];

if (!existsSync(LIB)) {
  console.error(`Bibliotheek niet gevonden: ${LIB}`);
  process.exit(1);
}

let copied = 0;

for (const name of CHARACTERS) {
  const spriteDir = join(LIB, 'sprites', 'composed', name);
  if (existsSync(spriteDir)) {
    for (const file of readdirSync(spriteDir).filter((f) => f.endsWith('.png'))) {
      const to = join(DEST, 'sprites', name, file);
      mkdirSync(dirname(to), { recursive: true });
      cpSync(join(spriteDir, file), to);
      copied++;
    }
  }
  const portraitDir = join(LIB, 'portraits', name);
  if (existsSync(portraitDir)) {
    for (const file of readdirSync(portraitDir).filter(
      (f) => f.endsWith('.png') && f !== 'sheet.png'
    )) {
      const to = join(DEST, 'portraits', name, file);
      mkdirSync(dirname(to), { recursive: true });
      cpSync(join(portraitDir, file), to);
      copied++;
    }
  }
}

console.log(`${copied} bestanden gekopieerd naar ${DEST}`);
