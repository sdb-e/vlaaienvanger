import type { DialogueLine, Giver, Quest } from '@/types';

export function offerLines(quest: Quest): DialogueLine[] {
  const n = quest.targetCount;
  return [
    {
      speaker: quest.giver,
      expression: 'blij',
      text: 'Hoi Ward! Mijn plantjes hebben honger!',
      voice: ['frase.honger'],
    },
    {
      speaker: quest.giver,
      expression: 'lach',
      text: `Haal ${n} koeienvlaai${n === 1 ? '' : 'en'}!`,
      voice: ['frase.haal', `num.${n}`, 'frase.vlaaien'],
      bigNumber: n,
      iconRow: { icon: 'vlaai', count: n },
    },
  ];
}

export function exactLines(quest: Quest): DialogueLine[] {
  const n = quest.delivered;
  return [
    {
      speaker: quest.giver,
      expression: 'lach',
      text: `Precies ${n}! Goed zo, Ward!`,
      voice: ['frase.precies', `num.${n}`, 'frase.goedzo'],
      bigNumber: n,
    },
  ];
}

export function teveelLines(quest: Quest): DialogueLine[] {
  return [
    {
      speaker: quest.giver,
      expression: 'verrast',
      text: 'Oeps! Dat waren er te veel!',
      voice: ['frase.teveel'],
    },
  ];
}

export function teweinigLines(giver: Giver, remaining: number): DialogueLine[] {
  return [
    {
      speaker: giver,
      expression: 'denkend',
      text: `We hebben er nog ${remaining} nodig!`,
      voice: ['frase.nog', `num.${remaining}`, 'frase.vlaaien'],
      bigNumber: remaining,
      iconRow: { icon: 'vlaai', count: remaining },
    },
  ];
}

export function upgradeLines(tierName: string): DialogueLine[] {
  return [
    {
      speaker: 'stephan',
      expression: 'lach',
      text: `Wauw Ward! Een ${tierName}!`,
      voice: ['frase.nieuwekar'],
    },
  ];
}
