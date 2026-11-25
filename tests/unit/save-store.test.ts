import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { SaveStore, SAVE_SCHEMA_VERSION, type WorldSaveData } from '../../src/save/Store';
import { Inventory } from '../../src/player/Inventory';
import { SurvivalSystem } from '../../src/player/Survival';
import { RaftGrid } from '../../src/raft/Grid';
import { EventBus } from '../../src/core/EventBus';
import { QuestEngine } from '../../src/quests/QuestEngine';

function createDummySave(tick: number): WorldSaveData {
  const inv = new Inventory(20);
  inv.addItem('madeira', 12);
  const surv = new SurvivalSystem();
  const grid = new RaftGrid(64);
  const qe = new QuestEngine(new EventBus());

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    worldId: 'world_test',
    seed: 2089,
    epoch: 1,
    savedAtIso: '2026-11-24T18:00:00.000Z',
    clock: { tick, elapsedSeconds: tick / 20, timeOfDay: 0.4, dayCount: 1 },
    raftTransform: { x: 4, z: -2, heading: 0 },
    playerPosition: { x: 4, y: 1, z: -2 },
    inventory: inv.serialize(),
    survival: surv.serialize(),
    raft: grid.serialize(),
    quests: qe.serialize(),
    worldFlags: { wreckLooted: false, buoyInspected: false, sharkRepelledCount: 0 },
  };
}

describe('SaveStore (IndexedDB A/B + Export/Import)', () => {
  it('grava slots rotativos A/B e recupera pelo slot B quando o slot A está corrompido', async () => {
    const store = new SaveStore();
    const older = createDummySave(100);
    const newer = createDummySave(250);

    await store.writeSlot('slot_b', older);
    await store.writeSlot('slot_a', newer);

    // Simula corrupção no slot_a via hash incompatível gravando payload alterado direto no DB
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('mare_perdida_db', 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put({
        slotId: 'slot_a',
        hash: 'deadbeef',
        payload: { ...newer, seed: 999999 },
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();

    const loaded = await store.loadLatestValid();
    expect(loaded).not.toBeNull();
    expect(loaded!.slotId).toBe('slot_b');
    expect(loaded!.recoveredFromCorruption).toBe(true);
    expect(loaded!.data.clock.tick).toBe(100);
  });

  it('exporta e importa JSON válido e rejeita payload adulterado/malformado', () => {
    const store = new SaveStore();
    const save = createDummySave(50);
    const json = store.exportJson(save);

    const ok = store.parseImportJson(json);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.worldId).toBe('world_test');
    }

    const tampered = json.replace('"seed": 2089', '"seed": 1234');
    const badHash = store.parseImportJson(tampered);
    expect(badHash.ok).toBe(false);

    const malformed = store.parseImportJson('{not-json');
    expect(malformed.ok).toBe(false);
  });
});
