import { validDiveId } from '../world/DiveLayout';
import { validAnimalDelta,type AnimalDelta } from '../ai/IslandFauna';
import { validDiscoveredChunk } from '../world/Navigation';
import { validResourceId } from '../world/IslandResources';
import type { SerializedInventory } from '../player/Inventory';
import type { SurvivalState } from '../player/Survival';
import type { SerializedRaftGrid } from '../raft/Grid';
import type { SerializedQuestEngine } from '../quests/QuestEngine';

export const SAVE_SCHEMA_VERSION = 1;

export interface WorldSaveData {
  schemaVersion: number;
  worldId: string;
  seed: number;
  epoch: number;
  savedAtIso: string;
  clock: {
    tick: number;
    elapsedSeconds: number;
    timeOfDay: number;
    dayCount: number;
  };
  raftTransform: {
    x: number;
    z: number;
    heading: number;
  };
  playerPosition: {
    x: number;
    y: number;
    z: number;
  };
  inventory: SerializedInventory;
  survival: SurvivalState;
  raft: SerializedRaftGrid;
  quests: SerializedQuestEngine;
  depletedIslandResources?: string[];
  discoveredChunks?:string[];
  animalDeltas?:AnimalDelta[];
  depletedDiveResources?:string[];
  worldFlags: {
    wreckLooted: boolean;
    buoyInspected: boolean;
    sharkRepelledCount: number;
  };
}

export interface StoredSlotEnvelope {
  slotId: 'slot_a' | 'slot_b' | 'checkpoint';
  hash: string;
  payload: WorldSaveData;
}

export interface GameOptions {
  hudScale: number;
  fov: number;
  mouseSensitivity: number;
  cameraBob: boolean;
  highContrast: boolean;
  quality: 'alto' | 'baixo';
  masterVolume: number;
  autoCollectNear: boolean;
  touchControls: 'auto' | 'on' | 'off';
}

export const DEFAULT_OPTIONS: GameOptions = {
  hudScale: 1,
  fov: 72,
  mouseSensitivity: 1,
  cameraBob: true,
  highContrast: false,
  quality: 'alto',
  masterVolume: 0.55,
  autoCollectNear: false,
  touchControls: 'auto',
};

const DB_NAME = 'mare_perdida_db';
const DB_VERSION = 1;
const STORE_SAVES = 'saves';
const OPTIONS_KEY = 'mare_perdida_options_v1';

/** Hash determinístico FNV-1a 32-bit para detectar corrupção acidental de slot. */
export function computeSaveHash(data: WorldSaveData): string {
  const json = JSON.stringify(data);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function validateSaveData(raw: unknown): raw is WorldSaveData {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Partial<WorldSaveData>;
  return (
    typeof obj.schemaVersion === 'number' &&
    obj.schemaVersion === SAVE_SCHEMA_VERSION &&
    typeof obj.worldId === 'string' &&
    typeof obj.seed === 'number' &&
    Boolean(obj.clock) &&
    Boolean(obj.inventory) &&
    Boolean(obj.survival) &&
    Boolean(obj.raft) &&
    Array.isArray(obj.raft?.foundations) &&
    Boolean(obj.quests) &&
    (obj.depletedIslandResources===undefined || (Array.isArray(obj.depletedIslandResources) && obj.depletedIslandResources.every(validResourceId))) &&
    (obj.discoveredChunks===undefined||(Array.isArray(obj.discoveredChunks)&&obj.discoveredChunks.every(validDiscoveredChunk))) &&
    (obj.animalDeltas===undefined||(Array.isArray(obj.animalDeltas)&&obj.animalDeltas.every(validAnimalDelta))) &&
    (obj.depletedDiveResources===undefined||(Array.isArray(obj.depletedDiveResources)&&obj.depletedDiveResources.every(validDiveId)))
  );
}

/**
 * Persistência IndexedDB com dois slots rotativos A/B, checkpoint de chefe e export/import JSON.
 */
export class SaveStore {
  private nextSlot: 'slot_a' | 'slot_b' = 'slot_a';

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB indisponível neste ambiente.'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_SAVES)) {
          db.createObjectStore(STORE_SAVES, { keyPath: 'slotId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('Erro ao abrir IndexedDB.'));
    });
  }

  async saveRotating(data: WorldSaveData): Promise<'slot_a' | 'slot_b'> {
    const slotId = this.nextSlot;
    this.nextSlot = slotId === 'slot_a' ? 'slot_b' : 'slot_a';
    await this.writeSlot(slotId, data);
    return slotId;
  }

  async writeSlot(slotId: StoredSlotEnvelope['slotId'], data: WorldSaveData): Promise<void> {
    const db = await this.openDb();
    try {
      const envelope: StoredSlotEnvelope = {
        slotId,
        hash: computeSaveHash(data),
        payload: data,
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SAVES, 'readwrite');
        tx.objectStore(STORE_SAVES).put(envelope);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Falha ao gravar save.'));
      });
    } finally {
      db.close();
    }
  }

  async readRawSlot(slotId: StoredSlotEnvelope['slotId']): Promise<StoredSlotEnvelope | null> {
    const db = await this.openDb();
    try {
      return await new Promise<StoredSlotEnvelope | null>((resolve, reject) => {
        const tx = db.transaction(STORE_SAVES, 'readonly');
        const req = tx.objectStore(STORE_SAVES).get(slotId);
        req.onsuccess = () => resolve((req.result as StoredSlotEnvelope | undefined) ?? null);
        req.onerror = () => reject(req.error ?? new Error('Falha ao ler save.'));
      });
    } finally {
      db.close();
    }
  }

  /**
   * Lê os slots rotativos ordenados do mais recente ao mais antigo e retorna o primeiro íntegro.
   */
  async loadLatestValid(): Promise<{ data: WorldSaveData; slotId: string; recoveredFromCorruption: boolean } | null> {
    const candidates = (await Promise.all([this.readRawSlot('slot_a'), this.readRawSlot('slot_b')])).filter(
      (e): e is StoredSlotEnvelope => e !== null
    );

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => (b.payload?.clock?.tick ?? 0) - (a.payload?.clock?.tick ?? 0));

    let sawCorrupted = false;
    for (const env of candidates) {
      if (validateSaveData(env.payload) && computeSaveHash(env.payload) === env.hash) {
        return {
          data: env.payload,
          slotId: env.slotId,
          recoveredFromCorruption: sawCorrupted,
        };
      }
      sawCorrupted = true;
    }

    const cp = await this.readRawSlot('checkpoint');
    if (cp && validateSaveData(cp.payload) && computeSaveHash(cp.payload) === cp.hash) {
      return { data: cp.payload, slotId: 'checkpoint', recoveredFromCorruption: true };
    }
    return null;
  }

  exportJson(data: WorldSaveData): string {
    return JSON.stringify(
      {
        format: 'mare-perdida-save',
        hash: computeSaveHash(data),
        payload: data,
      },
      null,
      2
    );
  }

  parseImportJson(rawText: string): { ok: true; data: WorldSaveData } | { ok: false; error: string } {
    try {
      const parsed = JSON.parse(rawText) as { format?: string; hash?: string; payload?: unknown };
      if (!parsed || parsed.format !== 'mare-perdida-save' || !validateSaveData(parsed.payload)) {
        return { ok: false, error: 'Arquivo de save inválido ou versão incompatível.' };
      }
      if (parsed.hash && computeSaveHash(parsed.payload) !== parsed.hash) {
        return { ok: false, error: 'Falha na verificação de integridade (hash divergente).' };
      }
      return { ok: true, data: parsed.payload };
    } catch {
      return { ok: false, error: 'JSON malformado ao importar save.' };
    }
  }

  loadOptions(): GameOptions {
    try {
      if (typeof localStorage === 'undefined') return { ...DEFAULT_OPTIONS };
      const raw = localStorage.getItem(OPTIONS_KEY);
      if (!raw) return { ...DEFAULT_OPTIONS };
      return { ...DEFAULT_OPTIONS, ...(JSON.parse(raw) as Partial<GameOptions>) };
    } catch {
      return { ...DEFAULT_OPTIONS };
    }
  }

  saveOptions(opts: GameOptions): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(opts));
      }
    } catch {
      // ignora erro de quota
    }
  }
}
