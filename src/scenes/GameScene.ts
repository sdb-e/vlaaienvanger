import Phaser from 'phaser';
import { Ev } from '@/events';
import { GARDEN, GATE, LAKE, MEADOW, NPC_SPOTS, ROAD, TUNING, WORLD } from '@/config/gameConfig';
import { DECOR_SPOTS } from '@/config/decor';
import { NpcChatter } from '@/systems/NpcChatter';
import { TIERS, type VehicleTier } from '@/config/progression';
import { SfxSynth } from '@/audio/SfxSynth';
import { VoicePlayer } from '@/audio/VoicePlayer';
import { EngineSound } from '@/audio/EngineSound';
import { SaveGame } from '@/systems/SaveGame';
import { drawFence } from '@/entities/Fence';
import { Npc } from '@/entities/Npc';
import { Plant } from '@/entities/Plant';
import { Vehicle } from '@/entities/Vehicle';
import { Vlaai } from '@/entities/Vlaai';
import { CowDirector } from '@/systems/CowDirector';
import { DeliveryDirector } from '@/systems/DeliveryDirector';
import { QuestManager } from '@/systems/QuestManager';
import type { Giver, Phase } from '@/types';

export class GameScene extends Phaser.Scene {
  private vehicle!: Vehicle;
  private cowDirector!: CowDirector;
  private qm!: QuestManager;
  private delivery!: DeliveryDirector;
  private sfx!: SfxSynth;
  private voice!: VoicePlayer;
  private plants: Plant[] = [];
  private npcs = new Map<Giver, Npc>();
  private arrow!: Phaser.GameObjects.Image;
  private queue: Vlaai[] = [];
  private currentTarget: Vlaai | null = null;
  private scooping = false;
  private lastTap = 0;
  private water!: Phaser.GameObjects.TileSprite;
  private chatter!: NpcChatter;
  private engine!: EngineSound;

  constructor() {
    super('Game');
  }

  create(): void {
    this.buildWorld();

    this.sfx = new SfxSynth(this);
    this.voice = new VoicePlayer(this, this.sfx);
    this.registry.set('sfx', this.sfx);
    this.registry.set('voice', this.voice);

    this.qm = new QuestManager(this, {
      spawnPlants: (n) => this.spawnPlants(n),
      clearGarden: () => this.clearGarden(),
      setGiver: (g) => this.setGiver(g),
      playUpgrade: (tier, onDone) => this.playUpgrade(tier, onDone),
    });
    this.registry.set('stars-init', this.qm.save.stars);

    this.cowDirector = new CowDirector(this, this.sfx, () => {
      if (this.qm.quest && (this.qm.phase === 'COLLECTING' || this.qm.phase === 'RETURNING')) {
        return { target: this.qm.quest.targetCount, collected: this.qm.quest.collected };
      }
      return null;
    });

    const selected = Phaser.Math.Clamp(
      this.qm.save.selectedTier ?? this.qm.save.vehicleTier,
      0,
      this.qm.save.vehicleTier
    );
    const tier = TIERS[selected] ?? TIERS[0];
    this.vehicle = new Vehicle(this, 600, 540, tier);
    this.engine = new EngineSound(this);
    this.engine.setProfile(tier.engine);
    this.registry.set('tiers', { unlocked: this.qm.save.vehicleTier, selected });

    const onSelect = ({ tier: t }: { tier: number }) => this.selectVehicle(t);
    this.game.events.on(Ev.SelectVehicle, onSelect);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Ev.SelectVehicle, onSelect);
    });

    this.delivery = new DeliveryDirector(this, this.sfx, this.voice, this.qm);
    this.delivery.setLaughCallback(() => this.cowDirector.laugh());

    for (const g of Object.keys(NPC_SPOTS) as Giver[]) {
      this.npcs.set(g, new Npc(this, NPC_SPOTS[g].x, NPC_SPOTS[g].y, g));
    }
    this.chatter = new NpcChatter(this, this.npcs, this.sfx);

    this.arrow = this.add
      .image(MEADOW.right + 60, GATE.cy - 90, 'arrow')
      .setDepth(9999)
      .setVisible(false);
    this.tweens.add({
      targets: this.arrow,
      x: '+=26',
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.w, WORLD.h);
    cam.startFollow(this.vehicle, true, 0.08, 0.08);

    const onPhase = ({ phase }: { phase: Phase }) => this.onPhase(phase);
    this.game.events.on(Ev.Phase, onPhase);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Ev.Phase, onPhase);
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));

    this.scene.launch('UI');
  }

  private buildWorld(): void {
    this.add.tileSprite(0, 0, WORLD.w, WORLD.h, 'grass').setOrigin(0).setDepth(0);

    // zandweg langs de westkant, met karrensporen
    this.add.tileSprite(0, 0, ROAD.width, LAKE.sandTop, 'zand').setOrigin(0).setDepth(1);
    const tracks = this.add.graphics().setDepth(2);
    tracks.fillStyle(0x9c8052, 0.55);
    for (let y = 6; y < LAKE.sandTop - 20; y += 34) {
      tracks.fillRect(20, y, 7, 20);
      tracks.fillRect(50, y, 7, 20);
    }

    // meer onderaan: strandje + water met riet, steiger, bootje en lelies
    this.add
      .tileSprite(0, LAKE.sandTop, WORLD.w, LAKE.waterTop - LAKE.sandTop, 'zand')
      .setOrigin(0)
      .setDepth(3);
    this.water = this.add
      .tileSprite(0, LAKE.waterTop, WORLD.w, WORLD.h - LAKE.waterTop, 'water')
      .setOrigin(0)
      .setDepth(4);
    this.add.image(DECOR_SPOTS.steiger.x, DECOR_SPOTS.steiger.y, 'steiger').setAngle(90).setScale(1.25).setDepth(6);
    const boot = this.add.image(DECOR_SPOTS.boot.x, DECOR_SPOTS.boot.y, 'boot').setDepth(6);
    this.tweens.add({
      targets: boot,
      y: '-=4',
      angle: { from: -1.5, to: 1.5 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add.image(650, 1045, 'waterlelies').setDepth(5);
    this.add.image(1350, 1095, 'waterlelies').setDepth(5).setFlipX(true);
    for (let i = 0; i < 10; i++) {
      const rx = Phaser.Math.Between(100, WORLD.w - 60);
      if (Math.abs(rx - DECOR_SPOTS.steiger.x) < 90 || Math.abs(rx - DECOR_SPOTS.boot.x) < 110) continue;
      this.add
        .image(rx, LAKE.waterTop + Phaser.Math.Between(-4, 14), Math.random() < 0.5 ? 'riet-groot' : 'riet-klein')
        .setDepth(7);
    }

    // bos bovenlangs: twee rijen bomen met variatie
    const treeKeys = ['boom-rond', 'boom-groot', 'boom-den', 'boom-bol'];
    for (let x = ROAD.width + 50; x < WORLD.w - 20; x += Phaser.Math.Between(62, 92)) {
      this.add
        .image(x, Phaser.Math.Between(50, 78), Phaser.Utils.Array.GetRandom(treeKeys))
        .setOrigin(0.5, 1)
        .setDepth(8);
    }
    for (let x = ROAD.width + 80; x < WORLD.w - 40; x += Phaser.Math.Between(90, 140)) {
      this.add
        .image(x, Phaser.Math.Between(100, 132), Phaser.Utils.Array.GetRandom(treeKeys))
        .setOrigin(0.5, 1)
        .setDepth(10);
    }
    // en een paar langs de oostrand
    for (let y = 380; y < 900; y += Phaser.Math.Between(120, 180)) {
      this.add
        .image(WORLD.w - Phaser.Math.Between(8, 26), y, Phaser.Utils.Array.GetRandom(treeKeys))
        .setOrigin(0.5, 1)
        .setDepth(y);
    }

    // familiehuisje + silo naast het veld (boven de moestuin)
    this.add
      .image(DECOR_SPOTS.huisje.x, DECOR_SPOTS.huisje.y, 'huisje-riet')
      .setOrigin(0.5, 1)
      .setScale(1.15)
      .setDepth(DECOR_SPOTS.huisje.y);
    this.add
      .image(DECOR_SPOTS.silo.x, DECOR_SPOTS.silo.y, 'silo')
      .setOrigin(0.5, 1)
      .setScale(0.95)
      .setDepth(DECOR_SPOTS.silo.y - 2);

    // pad van de poort naar de moestuin
    const path = this.add.graphics().setDepth(2);
    path.fillStyle(0xc2a878, 0.9);
    path.fillRoundedRect(
      MEADOW.right - 10,
      GATE.yTop + 16,
      GARDEN.left - MEADOW.right + 50,
      GATE.yBottom - GATE.yTop - 32,
      24
    );

    // moestuin-aarde met rijen
    const soil = this.add.graphics().setDepth(3);
    soil.fillStyle(0x7b5b3a);
    soil.fillRoundedRect(GARDEN.left, GARDEN.top, GARDEN.right - GARDEN.left, GARDEN.bottom - GARDEN.top, 22);
    soil.fillStyle(0x6d4c2f);
    for (let y = GARDEN.top + 34; y < GARDEN.bottom - 20; y += 46) {
      soil.fillRect(GARDEN.left + 16, y, GARDEN.right - GARDEN.left - 32, 8);
    }

    drawFence(this);
  }

  private onPhase(phase: Phase): void {
    this.arrow.setVisible(phase === 'RETURNING');
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.registry.get('dialogOpen')) return;
    const guard = (this.registry.get('dialogGuardUntil') as number | undefined) ?? 0;
    if (this.time.now < guard) return;
    if (this.time.now - this.lastTap < TUNING.tapDebounceMs) return;
    this.lastTap = this.time.now;

    // tikken op de voertuig-picker (linkerrand) is geen wereld-tik
    const tiers = this.registry.get('tiers') as { unlocked: number } | undefined;
    if ((tiers?.unlocked ?? 0) > 0 && p.x < 82 && p.y > 72 && p.y < 560) return;

    const wx = p.worldX;
    const wy = p.worldY;

    if (this.delivery.tryTapPlant(wx, wy)) return;

    const vlaai = this.cowDirector.nearestVlaai(wx, wy, TUNING.tapSnap);
    if (vlaai && this.queue.length < TUNING.queueCap) {
      vlaai.reserved = true;
      vlaai.showRing();
      this.queue.push(vlaai);
      this.sfx.pop();
      return;
    }

    // vrij rondrijden: tik op gras — een onderweg-zijnde vlaai wordt dan losgelaten
    if (this.queue.length === 0 && !this.scooping) {
      this.releaseCurrentTarget();
      this.vehicle.driveTo(wx, wy);
    }
  }

  /** Geef de vlaai waar Ward naartoe reed weer vrij (ring weg, weer tikbaar). */
  private releaseCurrentTarget(): void {
    if (this.currentTarget) {
      this.currentTarget.reserved = false;
      this.currentTarget.hideRing();
      this.currentTarget = null;
    }
  }

  /** Maak de hele tikwachtrij leeg (bij start van het afleveren). */
  private clearQueue(): void {
    for (const v of this.queue) {
      v.reserved = false;
      v.hideRing();
    }
    this.queue = [];
    this.releaseCurrentTarget();
  }

  update(time: number, delta: number): void {
    this.vehicle.update(delta);
    this.cowDirector.update(time, delta, this.vehicle);
    if (!this.delivery.active) this.chatter.update(delta);
    this.water.tilePositionX += delta * 0.008;
    this.engine.setMoving(this.vehicle.isMoving);

    // tik-wachtrij afwerken
    if (!this.delivery.active && !this.vehicle.busy && !this.scooping && this.queue.length) {
      const v = this.queue.shift()!;
      if (v.active) {
        this.currentTarget = v;
        this.vehicle.driveTo(v.x, v.y, () => this.scoop(v));
      }
    }

    // moestuin binnenrijden met vlaaien in de kar → afleveren
    if (!this.delivery.active && this.qm.canStartDelivery() && this.vehicle.x > MEADOW.right + 80) {
      this.clearQueue();
      this.delivery.start(this.plants, this.vehicle);
    }
  }

  private scoop(v: Vlaai): void {
    this.scooping = true;
    v.hideRing();
    this.tweens.add({
      targets: v,
      x: this.vehicle.x,
      y: this.vehicle.y - 22,
      scale: 0.25,
      alpha: 0.7,
      angle: 180,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.cowDirector.removeVlaai(v);
        v.destroy();
        if (this.currentTarget === v) this.currentTarget = null;
        this.vehicle.wobble();
        this.sfx.plop();
        const n = this.qm.collectOne();
        void this.voice.say([`num.${n}`]);
        this.scooping = false;
      },
    });
  }

  // ---- QuestHost ----

  spawnPlants(n: number): void {
    this.clearGarden();
    for (let i = 0; i < n; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = GARDEN.left + 110 + col * 92;
      const y = GARDEN.top + 140 + row * 140;
      this.plants.push(new Plant(this, x, y));
    }
  }

  clearGarden(): void {
    const old = this.plants;
    this.plants = [];
    for (const p of old) {
      this.tweens.add({
        targets: p,
        alpha: 0,
        duration: 500,
        delay: 900,
        onComplete: () => p.destroy(),
      });
    }
  }

  /** Speler kiest een vrijgespeeld voertuig via de picker links. */
  private selectVehicle(t: number): void {
    if (t < 0 || t > this.qm.save.vehicleTier || !TIERS[t]) return;
    this.qm.save.selectedTier = t;
    SaveGame.save(this.qm.save);
    this.vehicle.setTier(TIERS[t]);
    this.engine.setProfile(TIERS[t].engine);
    this.sfx.honk();
    this.registry.set('tiers', { unlocked: this.qm.save.vehicleTier, selected: t });
    this.game.events.emit(Ev.TiersChanged, { unlocked: this.qm.save.vehicleTier, selected: t });
  }

  setGiver(giver: Giver | null): void {
    for (const [name, npc] of this.npcs) {
      npc.setActiveGiver(name === giver);
    }
  }

  playUpgrade(tier: VehicleTier, onDone: () => void): void {
    const v = this.vehicle;
    this.sfx.honk();
    this.add
      .particles(v.x, v.y - 30, 'confetti', {
        speed: { min: 120, max: 300 },
        lifespan: 1000,
        gravityY: 600,
        tint: [0xe53935, 0xfbc02d, 0x43a047, 0x1e88e5, 0xd81b60],
        emitting: false,
      })
      .setDepth(99999)
      .explode(50);
    this.tweens.add({
      targets: v,
      scaleX: 0,
      scaleY: 0,
      duration: 240,
      ease: 'Back.easeIn',
      onComplete: () => {
        v.setTier(tier);
        this.engine.setProfile(tier.engine);
        this.registry.set('tiers', { unlocked: tier.tier, selected: tier.tier });
        this.sfx.honk();
        this.tweens.add({
          targets: v,
          scaleX: 1,
          scaleY: 1,
          duration: 450,
          ease: 'Back.easeOut',
          onComplete: () => this.time.delayedCall(400, onDone),
        });
      },
    });
  }
}
