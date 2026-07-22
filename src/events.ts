/** Game-brede events (via game.events) tussen GameScene en UIScene. */
export const Ev = {
  /** payload: DialogueLine[] */
  Dialogue: 'vv-dialogue',
  DialogueDone: 'vv-dialogue-done',
  /** payload: { count: number; target: number | null } */
  Counter: 'vv-counter',
  /** payload: { phase: Phase } */
  Phase: 'vv-phase',
  /** payload: { stars: number; gained: number } */
  Stars: 'vv-stars',
  /** payload: { tier: number } — speler kiest een vrijgespeeld voertuig */
  SelectVehicle: 'vv-select-vehicle',
  /** payload: { unlocked: number; selected: number } — picker verversen */
  TiersChanged: 'vv-tiers-changed',
} as const;
