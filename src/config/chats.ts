import type { Giver } from '@/types';

export interface ChatLine {
  speaker: Giver;
  text: string;
}

/**
 * Ambient-kletspraatjes tussen de NPC's. Ward hoort wauwel-gebrabbel
 * (per personage een eigen stem); de tekst is voorleesvoer voor ouders.
 */
export const AMBIENT_CHATS: ChatLine[][] = [
  [
    { speaker: 'stephan', text: 'Waarom poepen die koeien zo veel?' },
    { speaker: 'mama', text: 'Omdat jij ze pannenkoeken voert!' },
    { speaker: 'stephan', text: 'Hihi. Oeps.' },
  ],
  [
    { speaker: 'eleanor', text: 'Papa, jouw scheten klinken net als de koeien!' },
    { speaker: 'stephan', text: 'Dank je. Jarenlange training.' },
    { speaker: 'mama', text: 'STEPHAN!' },
  ],
  [
    { speaker: 'mama', text: 'Wat ruik ik toch?' },
    { speaker: 'stephan', text: 'De koeien!' },
    { speaker: 'eleanor', text: 'Nee hoor, dat was papa.' },
  ],
  [
    { speaker: 'eleanor', text: 'Ward is de beste vlaaienvanger van de wereld!' },
    { speaker: 'mama', text: 'Zeker weten!' },
  ],
  [
    { speaker: 'stephan', text: 'Wat zegt een koe tegen een vlaai?' },
    { speaker: 'stephan', text: 'Tot ziens, drol!' },
    { speaker: 'eleanor', text: 'Hihihi!' },
    { speaker: 'mama', text: 'Die was slecht, schat.' },
  ],
  [
    { speaker: 'stephan', text: 'Ik ruik... prrrt... pardon.' },
    { speaker: 'mama', text: 'Dat was jij zelf!' },
    { speaker: 'eleanor', text: 'PAPA!' },
  ],
  [
    { speaker: 'mama', text: 'Kijk Ward eens hard werken!' },
    { speaker: 'stephan', text: 'Net zijn papa.' },
    { speaker: 'mama', text: 'Hmmm...' },
  ],
];

/** Stemprofiel per personage voor het wauwel-gebrabbel. */
export const BABBLE_PROFILES: Record<string, { base: number; type: OscillatorType }> = {
  stephan: { base: 92, type: 'sawtooth' },
  mama: { base: 185, type: 'sawtooth' },
  eleanor: { base: 320, type: 'square' },
  ward: { base: 360, type: 'square' },
};
