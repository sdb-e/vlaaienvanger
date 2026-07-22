export type EngineProfile = 'none' | 'tractor' | 'truck' | 'race' | 'fire';

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
  engine: EngineProfile;
}

/** Steeds gekkere voertuigen — tot en met de brandweerauto met sirene. */
export const TIERS: VehicleTier[] = [
  { tier: 0, name: 'emmertje', starsRequired: 0, speed: 135, mode: 'walk', texture: 'emmer-lpc', scale: 1, seat: { x: 0, y: 0 }, engine: 'none' },
  { tier: 1, name: 'kruiwagen', starsRequired: 6, speed: 215, mode: 'ride', texture: 'kruiwagen-lpc', scale: 1.6, seat: { x: -6, y: -38 }, engine: 'none' },
  { tier: 2, name: 'trekkertje', starsRequired: 14, speed: 295, mode: 'ride', texture: 'trekker-rood', scale: 1, seat: { x: -4, y: -42 }, engine: 'tractor' },
  { tier: 3, name: 'supersnelle trekker', starsRequired: 25, speed: 375, mode: 'ride', texture: 'trekker-groen', scale: 1.3, seat: { x: -6, y: -50 }, engine: 'tractor' },
  { tier: 4, name: 'raceauto', starsRequired: 40, speed: 445, mode: 'ride', texture: 'raceauto', scale: 1, seat: { x: -8, y: -24 }, engine: 'race' },
  { tier: 5, name: 'hotdogkar', starsRequired: 55, speed: 480, mode: 'ride', texture: 'hotdogkar', scale: 0.85, seat: { x: 36, y: -56 }, engine: 'truck' },
  { tier: 6, name: 'brandweerauto', starsRequired: 70, speed: 520, mode: 'ride', texture: 'brandweer', scale: 1.1, seat: { x: 26, y: -52 }, engine: 'fire' },
];

export function tierForStars(stars: number): VehicleTier {
  let best = TIERS[0];
  for (const t of TIERS) {
    if (stars >= t.starsRequired) best = t;
  }
  return best;
}
