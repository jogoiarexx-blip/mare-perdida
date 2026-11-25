import type { EventBus } from '../core/EventBus';
import { CHAPTER_1_QUESTS, CHAPTER_2_QUESTS, DIVE_QUESTS, type QuestDef, type QuestStatus } from '../data/quests';

export interface QuestRuntimeState {
  status: QuestStatus;
  progress: Record<string, number>;
  rewardClaimed: boolean;
}

export interface SerializedQuestEngine {
  states: Record<string, QuestRuntimeState>;
  xp: number;
  credits: number;
  reputation: Record<'docas' | 'farol' | 'frota', number>;
  unlocks: string[];
}

/**
 * Motor idempotente de missões orientadas a dados (Capítulo 1: M01–M05 e S001–S010).
 */
export class QuestEngine {
  states = new Map<string, QuestRuntimeState>();
  xp = 0;
  credits = 0;
  reputation: Record<'docas' | 'farol' | 'frota', number> = {
    docas: 0,
    farol: 0,
    frota: 0,
  };
  unlocks = new Set<string>();

  private unsubs: Array<() => void> = [];
  private rewardCallback?: (quest: QuestDef) => void;
  private dialogueCallback?: (speaker: string, lines: string[]) => void;
  private stateSnapshotProvider?: () => {
    inventoryCounts: Record<string, number>;
    foundationCount: number;
    placedModuleKinds: Set<string>;
  };

  constructor(
    private readonly bus: EventBus,
    private readonly defs: QuestDef[] = [...CHAPTER_1_QUESTS,...CHAPTER_2_QUESTS,...DIVE_QUESTS]
  ) {
    this.initStates();
    this.bindEvents();
  }

  onReward(cb: (quest: QuestDef) => void): void {
    this.rewardCallback = cb;
  }

  onDialogue(cb: (speaker: string, lines: string[]) => void): void {
    this.dialogueCallback = cb;
  }

  setStateSnapshotProvider(
    provider: () => {
      inventoryCounts: Record<string, number>;
      foundationCount: number;
      placedModuleKinds: Set<string>;
    }
  ): void {
    this.stateSnapshotProvider = provider;
  }

  /**
   * Sincroniza progresso já existente (itens raros, fundações, módulos construídos) ao desbloquear missões,
   * evitando softlock quando o jogador explora ou constrói antes da missão ativar.
   */
  syncExistingProgress(): void {
    const snap = this.stateSnapshotProvider?.();
    if (!snap) return;

    this.syncFoundationCount(snap.foundationCount);

    const toolTargetToItem: Record<string, string> = {
      rec_tanque_mergulho:'tanque_mergulho',rec_lanterna_mergulho:'lanterna_mergulho',rec_nadadeiras:'nadadeiras',
      rec_gancho: 'gancho',
      rec_lanca: 'lanca',
      rec_vara_pesca: 'vara_pesca',
      rec_martelo_reparo: 'martelo_reparo',
    };

    for (const q of this.defs) {
      const st = this.states.get(q.id);
      if (!st || st.status !== 'ACTIVE') continue;
      let changed = false;
      for (const obj of q.objectives) {
        if (obj.kind === 'collect') {
          const have = snap.inventoryCounts[obj.target] ?? 0;
          const next = Math.min(obj.count, Math.max(st.progress[obj.id] ?? 0, have));
          if (next !== st.progress[obj.id]) {
            st.progress[obj.id] = next;
            changed = true;
          }
        } else if (obj.kind === 'place' && snap.placedModuleKinds.has(obj.target)) {
          if ((st.progress[obj.id] ?? 0) < 1) {
            st.progress[obj.id] = Math.min(obj.count, Math.max(st.progress[obj.id] ?? 0, 1));
            changed = true;
          }
        } else if (obj.kind === 'craft' && toolTargetToItem[obj.target]) {
          const have = snap.inventoryCounts[toolTargetToItem[obj.target]] ?? 0;
          if (have >= 1 && (st.progress[obj.id] ?? 0) < 1) {
            st.progress[obj.id] = 1;
            changed = true;
          }
        }
      }
      if (changed) {
        this.checkQuestCompletion(q, st);
      }
    }
  }

  private initStates(): void {
    this.states.clear();
    for (const q of this.defs) {
      const progress: Record<string, number> = {};
      for (const obj of q.objectives) progress[obj.id] = 0;
      const unlocked = q.requires.length === 0;
      this.states.set(q.id, {
        status: unlocked ? 'ACTIVE' : 'LOCKED',
        progress,
        rewardClaimed: false,
      });
    }
  }

  triggerInitialDialogues(): void {
    for (const q of this.defs) {
      const st = this.states.get(q.id);
      if (st?.status === 'ACTIVE' && q.dialogueOnStart) {
        this.dialogueCallback?.(q.dialogueOnStart.speaker, q.dialogueOnStart.lines);
        break;
      }
    }
  }

  private bindEvents(): void {
    this.dispose();
    this.unsubs.push(
      this.bus.on('landmarkReached', ({landmarkId})=>this.applyProgress('landmark',landmarkId,1)),
      this.bus.on('itemCollected', ({ itemId, count }) => this.applyProgress('collect', itemId, count)),
      this.bus.on('crafted', ({ recipeId }) => this.applyProgress('craft', recipeId, 1)),
      this.bus.on('structurePlaced', ({ kind }) => {
        this.applyProgress('place', kind, 1);
      }),
      this.bus.on('waterPurified', ({ count }) => this.applyProgress('purifyWater', 'agua_pura', count)),
      this.bus.on('fishCaught', ({ count }) => this.applyProgress('catchFish', 'peixe_cru', count)),
      this.bus.on('cropHarvested', ({ count }) => this.applyProgress('harvestCrop', 'fruta_colhida', count)),
      this.bus.on('radioTuned', ({ frequency }) => this.applyProgress('radioTune', frequency, 1)),
      this.bus.on('bossResolved', ({ bossId }) => this.applyProgress('bossResolve', bossId, 1)),
      this.bus.on('playerRested', () => this.applyProgress('rest', 'cama', 1)),
      this.bus.on('wreckLooted', ({ wreckId }) => this.applyProgress('inspectBuoy', wreckId, 1))
    );
  }

  /** Atualiza contagem de fundações sem ultrapassar nem duplicar conclusão. */
  syncFoundationCount(count: number): void {
    for (const q of this.defs) {
      const st = this.states.get(q.id);
      if (!st || st.status !== 'ACTIVE') continue;
      let changed = false;
      for (const obj of q.objectives) {
        if (obj.kind === 'foundationCount') {
          const next = Math.min(obj.count, Math.max(st.progress[obj.id] ?? 0, count));
          if (next !== st.progress[obj.id]) {
            st.progress[obj.id] = next;
            changed = true;
          }
        }
      }
      if (changed) this.checkQuestCompletion(q, st);
    }
  }

  private applyProgress(kind: QuestDef['objectives'][number]['kind'], target: string, delta: number): void {
    if (delta <= 0) return;
    for (const q of this.defs) {
      const st = this.states.get(q.id);
      if (!st || st.status !== 'ACTIVE') continue;
      let changed = false;
      for (const obj of q.objectives) {
        if (obj.kind === kind && obj.target === target) {
          const prev = st.progress[obj.id] ?? 0;
          if (prev < obj.count) {
            st.progress[obj.id] = Math.min(obj.count, prev + delta);
            changed = true;
          }
        }
      }
      if (changed) {
        this.bus.emit('questUpdated', { questId: q.id, status: st.status });
        this.checkQuestCompletion(q, st);
      }
    }
  }

  private checkQuestCompletion(q: QuestDef, st: QuestRuntimeState): void {
    if (st.status === 'COMPLETED') return;
    const allDone = q.objectives.every((obj) => (st.progress[obj.id] ?? 0) >= obj.count);
    if (!allDone) return;

    st.status = 'COMPLETED';
    if (!st.rewardClaimed) {
      st.rewardClaimed = true;
      this.xp += q.rewards.xp ?? 0;
      this.credits += q.rewards.credits ?? 0;
      if (q.rewards.reputation) {
        this.reputation[q.rewards.reputation.faction] += q.rewards.reputation.delta;
      }
      for (const u of q.rewards.unlocks ?? []) {
        this.unlocks.add(u);
      }
      this.rewardCallback?.(q);
    }

    this.bus.emit('questUpdated', { questId: q.id, status: 'COMPLETED' });
    this.bus.emit('notification', { text: `Missão concluída: ${q.id} — ${q.title}`, kind: 'success' });

    if (q.dialogueOnComplete) {
      this.dialogueCallback?.(q.dialogueOnComplete.speaker, q.dialogueOnComplete.lines);
    }

    this.unlockDependentQuests();
  }

  private unlockDependentQuests(): void {
    let unlockedAny = false;
    for (const q of this.defs) {
      const st = this.states.get(q.id);
      if (!st || st.status !== 'LOCKED') continue;
      const depsMet = q.requires.every((reqId) => this.states.get(reqId)?.status === 'COMPLETED');
      if (depsMet) {
        st.status = 'ACTIVE';
        unlockedAny = true;
        this.bus.emit('questUpdated', { questId: q.id, status: 'ACTIVE' });
        if (q.dialogueOnStart) {
          this.dialogueCallback?.(q.dialogueOnStart.speaker, q.dialogueOnStart.lines);
        }
      }
    }
    if (unlockedAny) {
      this.syncExistingProgress();
    }
  }

  /** Saves anteriores não possuem estados de capítulos adicionados posteriormente. */
  reconcileUnlockedQuests():void{this.unlockDependentQuests();this.syncExistingProgress();}

  getActiveMainQuest(): { def: QuestDef; state: QuestRuntimeState } | null {
    for (const q of this.defs) {
      if (q.type !== 'main') continue;
      const st = this.states.get(q.id);
      if (st && st.status === 'ACTIVE') return { def: q, state: st };
    }
    return null;
  }

  getAllQuests(): Array<{ def: QuestDef; state: QuestRuntimeState }> {
    return this.defs.map((def) => ({
      def,
      state: this.states.get(def.id)!,
    }));
  }

  serialize(): SerializedQuestEngine {
    const states: Record<string, QuestRuntimeState> = {};
    for (const [id, st] of this.states.entries()) {
      states[id] = {
        status: st.status,
        progress: { ...st.progress },
        rewardClaimed: st.rewardClaimed,
      };
    }
    return {
      states,
      xp: this.xp,
      credits: this.credits,
      reputation: { ...this.reputation },
      unlocks: Array.from(this.unlocks),
    };
  }

  restore(data: SerializedQuestEngine): void {
    this.initStates();
    this.xp = data.xp ?? 0;
    this.credits = data.credits ?? 0;
    this.reputation = {
      docas: data.reputation?.docas ?? 0,
      farol: data.reputation?.farol ?? 0,
      frota: data.reputation?.frota ?? 0,
    };
    this.unlocks = new Set(data.unlocks ?? []);
    for (const [id, st] of Object.entries(data.states ?? {})) {
      if (this.states.has(id)) {
        this.states.set(id, {
          status: st.status,
          progress: { ...st.progress },
          rewardClaimed: Boolean(st.rewardClaimed),
        });
      }
    }
  }

  dispose(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}
