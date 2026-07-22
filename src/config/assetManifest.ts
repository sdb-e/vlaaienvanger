import type Phaser from 'phaser';
import type { CharName } from '@/types';

/**
 * De indirectielaag: geen game-code noemt ooit een bestandspad of ruwe
 * afmeting — alles loopt via dit manifest. Placeholder → echte assets
 * wisselen betekent alleen dit bestand aanpassen.
 */

export const LPC_CELL = 64;
/** Richting-rijen in de gecomposeerde LPC-sheets, van boven naar beneden. */
export const LPC_ROW = { N: 0, W: 1, S: 2, E: 3 } as const;

export interface CharacterAssets {
  anims: string[];
  portraits: string[];
}

export const CHARACTERS: Record<CharName, CharacterAssets> = {
  ward: {
    anims: ['idle', 'walk', 'jump', 'sit'],
    portraits: ['blij', 'boos', 'denkend', 'gek', 'neutraal', 'slaperig', 'verdrietig', 'verlegen', 'verrast'],
  },
  eleanor: {
    anims: ['idle', 'walk', 'jump', 'sit'],
    portraits: ['blij', 'boos', 'neutraal', 'slaperig', 'verdrietig', 'verlegen', 'verrast', 'verrast2', 'verward'],
  },
  mama: {
    anims: ['idle', 'walk', 'jump', 'run', 'sit'],
    portraits: ['boos', 'denkend', 'lach', 'neutraal', 'verdrietig', 'verrast'],
  },
  stephan: {
    anims: ['idle', 'walk', 'jump', 'run', 'sit'],
    portraits: ['bezorgd', 'blij', 'grijns', 'lach', 'neutraal', 'somber', 'verdrietig', 'verrast'],
  },
};

export const PORTRAIT_SIZE = 128;
export const VOICE_DIR = 'assets/audio/voice';

export const spriteUrl = (name: CharName, anim: string) => `assets/familie/sprites/${name}/${anim}.png`;
export const spriteKey = (name: CharName, anim: string) => `${name}-${anim}`;
export const portraitUrl = (name: CharName, expr: string) => `assets/familie/portraits/${name}/${expr}.png`;
export const portraitKey = (name: CharName, expr: string) => `portret-${name}-${expr}`;

/** Expressiesets verschillen per persoon (mama heeft `lach`, ward `blij`) — map naar het dichtstbijzijnde alternatief. */
const EXPRESSION_ALIASES: Record<string, string[]> = {
  blij: ['lach', 'grijns'],
  lach: ['blij', 'grijns'],
  denkend: ['bezorgd', 'verward', 'neutraal'],
  verrast: ['verrast2'],
};

export function resolveExpression(name: CharName, wanted: string): string {
  const list = CHARACTERS[name].portraits;
  if (list.includes(wanted)) return wanted;
  for (const alt of EXPRESSION_ALIASES[wanted] ?? []) {
    if (list.includes(alt)) return alt;
  }
  return 'neutraal';
}

export function lpcCols(scene: Phaser.Scene, key: string): number {
  const src = scene.textures.get(key).getSourceImage() as { width: number };
  return src.width / LPC_CELL;
}

/** Frame-index in een LPC-sheet, robuust voor elk kolomaantal per animatie. */
export function lpcFrame(scene: Phaser.Scene, key: string, row: number, col: number): number {
  return row * lpcCols(scene, key) + col;
}

/**
 * LPC-kindkleding bestaat vaak alleen voor `walk` — kinderen als staande NPC
 * gebruiken daarom het stilstand-frame van de walk-sheet i.p.v. de idle-sheet.
 */
export const NPC_IDLE_SHEET: Record<CharName, 'idle' | 'walk'> = {
  ward: 'walk',
  eleanor: 'walk',
  mama: 'idle',
  stephan: 'idle',
};

export const DISPLAY_NAMES: Record<CharName, string> = {
  ward: 'Ward',
  mama: 'Mama',
  stephan: 'Papa',
  eleanor: 'Eleanor',
};
