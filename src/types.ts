export type CharName = 'ward' | 'mama' | 'stephan' | 'eleanor';
export type Giver = Exclude<CharName, 'ward'>;

export type Phase =
  | 'IDLE'
  | 'OFFERING'
  | 'COLLECTING'
  | 'RETURNING'
  | 'DELIVERING'
  | 'RESULT';

export interface DialogueLine {
  speaker: CharName;
  expression: string;
  text: string;
  /** VoicePlayer-keys, bv. ['frase.haal', 'num.4', 'frase.vlaaien'] */
  voice?: string[];
  /** Groot cijfer naast het portret — de echte payload voor een niet-lezer */
  bigNumber?: number;
  iconRow?: { icon: 'vlaai' | 'plant'; count: number };
}

export interface Quest {
  id: number;
  giver: Giver;
  targetCount: number;
  collected: number;
  delivered: number;
}

export type DeliveryOutcome = 'exact' | 'teveel' | 'teweinig';

export interface SaveData {
  version: 1;
  stars: number;
  questsCompleted: number;
  /** hoogste vrijgespeelde tier */
  vehicleTier: number;
  /** door de speler gekozen voertuig (≤ vehicleTier) */
  selectedTier: number;
  highestTarget: number;
}
