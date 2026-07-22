import Phaser from 'phaser';
import { Ev } from '@/events';
import { TUNING } from '@/config/gameConfig';
import { exactLines, offerLines, teveelLines, teweinigLines, upgradeLines } from '@/config/questLines';
import { tierForStars, type VehicleTier } from '@/config/progression';
import { SaveGame } from '@/systems/SaveGame';
import { nextTarget } from '@/systems/DifficultyRamp';
import type { DeliveryOutcome, DialogueLine, Giver, Phase, Quest, SaveData } from '@/types';

const GIVERS: Giver[] = ['mama', 'eleanor', 'stephan'];

/** Wat de QuestManager van de GameScene nodig heeft. */
export interface QuestHost {
  spawnPlants(n: number): void;
  clearGarden(): void;
  setGiver(giver: Giver | null): void;
  playUpgrade(tier: VehicleTier, onDone: () => void): void;
}

export class QuestManager {
  quest: Quest | null = null;
  phase: Phase = 'IDLE';
  freeCount = 0;
  save: SaveData;
  private lastTarget = 0;
  private awaiting: 'offer' | 'result' | 'teweinig' | 'upgrade' | null = null;
  private nextId = 1;

  constructor(
    private gameScene: Phaser.Scene,
    private host: QuestHost
  ) {
    this.save = SaveGame.load();
    const g = this.gameScene.game.events;
    g.on(Ev.DialogueDone, this.onDialogueDone, this);
    this.gameScene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      g.off(Ev.DialogueDone, this.onDialogueDone, this);
    });
    this.gameScene.time.delayedCall(TUNING.firstQuestDelayMs, () => this.startQuest());
  }

  private emit(event: string, payload: unknown): void {
    this.gameScene.game.events.emit(event, payload);
  }

  private setPhase(phase: Phase): void {
    this.phase = phase;
    this.emit(Ev.Phase, { phase });
  }

  private emitStars(gained: number): void {
    this.emit(Ev.Stars, { stars: this.save.stars, gained });
  }

  emitCounter(): void {
    if (this.quest && this.phase !== 'IDLE') {
      this.emit(Ev.Counter, { count: this.quest.collected, target: this.quest.targetCount });
    } else {
      this.emit(Ev.Counter, { count: this.freeCount, target: null });
    }
  }

  private showDialogue(lines: DialogueLine[]): void {
    this.emit(Ev.Dialogue, lines);
  }

  private startQuest(): void {
    if (this.quest) return;
    const target = nextTarget(this.save.questsCompleted, this.lastTarget);
    this.lastTarget = target;
    this.quest = {
      id: this.nextId++,
      giver: GIVERS[this.save.questsCompleted % GIVERS.length],
      targetCount: target,
      collected: 0,
      delivered: 0,
    };
    this.freeCount = 0;
    this.host.spawnPlants(target);
    this.host.setGiver(this.quest.giver);
    this.setPhase('OFFERING');
    this.awaiting = 'offer';
    this.showDialogue(offerLines(this.quest));
  }

  private onDialogueDone(): void {
    const was = this.awaiting;
    this.awaiting = null;
    switch (was) {
      case 'offer':
      case 'teweinig':
        this.setPhase('COLLECTING');
        this.emitCounter();
        break;
      case 'result':
        this.afterResult();
        break;
      case 'upgrade':
        this.backToIdle();
        break;
    }
  }

  /** Aangeroepen bij elke opgeschepte vlaai; geeft het telwoord-getal terug. */
  collectOne(): number {
    if (this.quest && (this.phase === 'COLLECTING' || this.phase === 'RETURNING')) {
      this.quest.collected++;
      this.emitCounter();
      if (this.quest.collected >= this.quest.targetCount && this.phase === 'COLLECTING') {
        this.setPhase('RETURNING');
      }
      return this.quest.collected;
    }
    this.freeCount++;
    this.emitCounter();
    return this.freeCount;
  }

  canStartDelivery(): boolean {
    return (
      !!this.quest &&
      (this.phase === 'COLLECTING' || this.phase === 'RETURNING') &&
      this.quest.collected > 0
    );
  }

  onDeliveryStart(): void {
    this.setPhase('DELIVERING');
  }

  onDeliveryDone(outcome: DeliveryOutcome, remainingHungry: number): void {
    if (!this.quest) return;
    this.setPhase('RESULT');

    if (outcome === 'teweinig') {
      this.quest.targetCount = remainingHungry;
      this.quest.collected = 0;
      this.quest.delivered = 0;
      this.awaiting = 'teweinig';
      this.showDialogue(teweinigLines(this.quest.giver, remainingHungry));
      return;
    }

    const gained = outcome === 'exact' ? 2 : 1;
    this.save.stars += gained;
    this.save.questsCompleted++;
    this.save.highestTarget = Math.max(this.save.highestTarget, this.quest.targetCount);
    SaveGame.save(this.save);
    this.emitStars(gained);
    this.awaiting = 'result';
    this.showDialogue(outcome === 'exact' ? exactLines(this.quest) : teveelLines(this.quest));
  }

  private afterResult(): void {
    this.host.clearGarden();
    this.host.setGiver(null);
    this.quest = null;

    const tier = tierForStars(this.save.stars);
    if (tier.tier > this.save.vehicleTier) {
      this.save.vehicleTier = tier.tier;
      this.save.selectedTier = tier.tier;
      SaveGame.save(this.save);
      this.emit(Ev.TiersChanged, { unlocked: tier.tier, selected: tier.tier });
      this.awaiting = 'upgrade';
      this.host.playUpgrade(tier, () => this.showDialogue(upgradeLines(tier.name)));
    } else {
      this.backToIdle();
    }
  }

  private backToIdle(): void {
    this.setPhase('IDLE');
    this.freeCount = 0;
    this.emitCounter();
    this.gameScene.time.delayedCall(TUNING.idleBetweenQuestsMs, () => this.startQuest());
  }
}
