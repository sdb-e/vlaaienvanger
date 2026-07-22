import type { SaveData } from '@/types';

const KEY = 'vlaaienvanger.save.v1';

const FRESH: SaveData = {
  version: 1,
  stars: 0,
  questsCompleted: 0,
  vehicleTier: 0,
  highestTarget: 0,
};

export const SaveGame = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...FRESH };
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return { ...FRESH };
      return { ...FRESH, ...data };
    } catch {
      return { ...FRESH };
    }
  },

  save(data: SaveData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // opslag vol of geblokkeerd — spel werkt gewoon door zonder persistentie
    }
  },
};
