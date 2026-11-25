export interface GameEvents {
  itemCollected: { itemId: string; count: number; source: string };
  crafted: { recipeId: string; itemId: string; count: number };
  structurePlaced: { kind: string; gx: number; gz: number };
  structureRemoved: { kind: string; gx: number; gz: number };
  structureDamaged: { gx: number; gz: number; amount: number; source: string };
  structureRepaired: { gx: number; gz: number };
  regionEntered: { regionId: string };
  npcRescued: { npcId: string };
  landmarkReached: { landmarkId: string };
  bossResolved: { bossId: string; outcome: 'repelled' | 'defeated' | 'pacified' };
  dialogueChoice: { dialogueId: string; choiceId: string };
  questUpdated: { questId: string; status: string };
  playerRested: { source: string };
  waterPurified: { count: number };
  fishCaught: { count: number };
  cropHarvested: { cropId: string; count: number };
  radioTuned: { frequency: string };
  wreckLooted: { wreckId: string; itemId: string };
  notification: { text: string; kind?: 'info' | 'warn' | 'success' | 'danger' };
}

type Handler<T> = (payload: T) => void;

/**
 * Barramento tipado de eventos do jogo para desacoplar simulação, missões e UI.
 */
export class EventBus {
  private listeners = new Map<keyof GameEvents, Set<Handler<never>>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => {
      set?.delete(handler as Handler<never>);
    };
  }

  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      (handler as Handler<GameEvents[K]>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
