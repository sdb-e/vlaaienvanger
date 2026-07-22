import Phaser from 'phaser';

/** Eerste opdrachten zijn gegarandeerd makkelijk (vroeg succes). */
const FIRST_QUESTS = [2, 3, 3];

export function nextTarget(questsCompleted: number, lastTarget: number): number {
  if (questsCompleted < FIRST_QUESTS.length) return FIRST_QUESTS[questsCompleted];

  const maxT = Phaser.Math.Clamp(3 + Math.floor(questsCompleted / 2), 3, 10);
  const minT = Math.max(1, maxT - 2);
  let target = Phaser.Math.Between(minT, maxT);
  let guard = 0;
  while (target === lastTarget && guard++ < 8) {
    target = Phaser.Math.Between(minT, maxT);
  }
  return target;
}
