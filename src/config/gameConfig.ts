/** Wereld- en tuning-constanten. Alle posities in wereldpixels. */
export const WORLD = { w: 1700, h: 1140 };

/** Meer onderaan de wereld. */
export const LAKE = { sandTop: 928, waterTop: 968 };

/** Zandweg langs de westkant. */
export const ROAD = { width: 76 };

/** Logische begrenzing van het weiland (koeien/vlaaien blijven hierbinnen). */
export const MEADOW = { left: 150, top: 170, right: 1110, bottom: 880 };

/** Poort in de oostkant van het hek. */
export const GATE = { yTop: 440, yBottom: 580, cy: 510 };

/** Moestuin, oostelijk van het weiland. */
export const GARDEN = { left: 1240, top: 300, right: 1660, bottom: 780 };

export const DELIVERY_SPOT = { x: 1300, y: 560 };

export const NPC_SPOTS: Record<'mama' | 'eleanor' | 'stephan', { x: number; y: number }> = {
  mama: { x: 1300, y: 288 },
  eleanor: { x: 1405, y: 283 },
  stephan: { x: 1515, y: 288 },
};

export const COW_COUNT = 5;

export const TUNING = {
  tapSnap: 120,
  plantTapRadius: 100,
  queueCap: 3,
  tapDebounceMs: 150,
  idleBetweenQuestsMs: 9500,
  firstQuestDelayMs: 5000,
  poopMinMs: 8000,
  poopMaxMs: 20000,
  urgentPoopMs: 3000,
  autoFeedMs: 4000,
  vlaaiHardCap: 10,
};
