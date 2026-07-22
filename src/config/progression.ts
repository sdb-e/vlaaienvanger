export interface VehicleTier {
  tier: number;
  name: string;
  starsRequired: number;
  speed: number;
  /** 'walk': Ward loopt zelf (met emmertje); 'ride': Ward zit in het voertuig. */
  mode: 'walk' | 'ride';
  texture: string;
  scale: number;
  seat: { x: number; y: number };
}

export const TIERS: VehicleTier[] = [
  { tier: 0, name: 'emmertje', starsRequired: 0, speed: 135, mode: 'walk', texture: 'emmer-lpc', scale: 1, seat: { x: 0, y: 0 } },
  { tier: 1, name: 'kruiwagen', starsRequired: 6, speed: 215, mode: 'ride', texture: 'kruiwagen-lpc', scale: 1.6, seat: { x: -6, y: -38 } },
  { tier: 2, name: 'trekkertje', starsRequired: 14, speed: 295, mode: 'ride', texture: 'trekker-rood', scale: 1, seat: { x: -4, y: -42 } },
  { tier: 3, name: 'supersnelle trekker', starsRequired: 25, speed: 375, mode: 'ride', texture: 'trekker-groen', scale: 1.3, seat: { x: -6, y: -50 } },
];

export function tierForStars(stars: number): VehicleTier {
  let best = TIERS[0];
  for (const t of TIERS) {
    if (stars >= t.starsRequired) best = t;
  }
  return best;
}
