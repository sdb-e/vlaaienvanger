/**
 * Decor-assets (uit LPC-packs gesneden, zie CREDITS.md) en hun plek in de
 * wereld. Bestanden staan in public/assets/vendor/decor/.
 */

export const DECOR_IMAGES: Record<string, string> = {
  'huisje-hout': 'assets/vendor/decor/huisje-hout.png',
  'huisje-riet': 'assets/vendor/decor/huisje-riet.png',
  silo: 'assets/vendor/decor/silo.png',
  boot: 'assets/vendor/decor/boot.png',
  steiger: 'assets/vendor/decor/steiger.png',
  'riet-groot': 'assets/vendor/decor/riet-groot.png',
  'riet-klein': 'assets/vendor/decor/riet-klein.png',
  water: 'assets/vendor/decor/water.png',
  zand: 'assets/vendor/decor/zand.png',
  'boom-rond': 'assets/vendor/decor/boom-rond.png',
  'boom-den': 'assets/vendor/decor/boom-den.png',
  'boom-groot': 'assets/vendor/decor/boom-groot.png',
  'boom-bol': 'assets/vendor/decor/boom-bol.png',
  'kruiwagen-lpc': 'assets/vendor/decor/kruiwagen-lpc.png',
  'trekker-rood': 'assets/vendor/decor/trekker-rood.png',
  'trekker-groen': 'assets/vendor/decor/trekker-groen.png',
  'emmer-lpc': 'assets/vendor/decor/emmer-lpc.png',
  waterlelies: 'assets/vendor/decor/waterlelies.png',
};

/** Echte scheetgeluiden (CC0/CC-BY, zie CREDITS.md). */
export const FART_SOUNDS: Record<string, string> = {
  'scheet-1': 'assets/audio/sfx/scheet-1.mp3',
  'scheet-2': 'assets/audio/sfx/scheet-2.wav',
  'scheet-3': 'assets/audio/sfx/scheet-3.wav',
};

/** Vaste plekken (x = midden, y = voet van het object). */
export const DECOR_SPOTS = {
  huisje: { x: 1370, y: 245 },
  silo: { x: 1548, y: 238 },
  steiger: { x: 420, y: 1050 },
  boot: { x: 980, y: 1058 },
};
