import { describe, expect, it } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { QuestEngine } from '../../src/quests/QuestEngine';

describe('QuestEngine (Capítulo 1)', () => {
  it('desbloqueia M01->M05 sequencialmente, mantém idempotência e conclui B01', () => {
    const bus = new EventBus();
    const qe = new QuestEngine(bus);

    expect(qe.getActiveMainQuest()?.def.id).toBe('M01');

    // Conclui M01
    bus.emit('itemCollected', { itemId: 'madeira', count: 8, source: 'hook' });
    bus.emit('itemCollected', { itemId: 'plastico', count: 4, source: 'hook' });
    bus.emit('crafted', { recipeId: 'rec_gancho', itemId: 'gancho', count: 1 });

    expect(qe.states.get('M01')?.status).toBe('COMPLETED');
    expect(qe.getActiveMainQuest()?.def.id).toBe('M02');
    const xpAfterM01 = qe.xp;

    // Eventos duplicados após conclusão não multiplicam XP
    bus.emit('crafted', { recipeId: 'rec_gancho', itemId: 'gancho', count: 1 });
    expect(qe.xp).toBe(xpAfterM01);

    // Conclui M02
    bus.emit('structurePlaced', { kind: 'purificador', gx: 1, gz: 0 });
    bus.emit('waterPurified', { count: 3 });
    expect(qe.states.get('M02')?.status).toBe('COMPLETED');
    expect(qe.getActiveMainQuest()?.def.id).toBe('M03');

    // Conclui M03
    qe.syncFoundationCount(9);
    bus.emit('structurePlaced', { kind: 'cama', gx: 0, gz: 1 });
    expect(qe.states.get('M03')?.status).toBe('COMPLETED');
    expect(qe.getActiveMainQuest()?.def.id).toBe('M04');

    // Conclui M04
    bus.emit('itemCollected', { itemId: 'bateria', count: 1, source: 'wreck' });
    bus.emit('itemCollected', { itemId: 'antena', count: 1, source: 'wreck' });
    bus.emit('structurePlaced', { kind: 'radio', gx: 1, gz: 1 });
    bus.emit('radioTuned', { frequency: 'lia_ch1' });
    expect(qe.states.get('M04')?.status).toBe('COMPLETED');
    expect(qe.getActiveMainQuest()?.def.id).toBe('M05');

    // Conclui M05
    bus.emit('crafted', { recipeId: 'rec_lanca', itemId: 'lanca', count: 1 });
    bus.emit('bossResolved', { bossId: 'B01', outcome: 'repelled' });
    expect(qe.states.get('M05')?.status).toBe('COMPLETED');
    expect(qe.unlocks.has('arquipelago_verde')).toBe(true);
  });

  it('evita softlock sincronizando peças já coletadas/construídas antes do desbloqueio', () => {
    const bus = new EventBus();
    const qe = new QuestEngine(bus);
    qe.setStateSnapshotProvider(() => ({
      inventoryCounts: { bateria: 1, antena: 1 },
      foundationCount: 9,
      placedModuleKinds: new Set(['purificador', 'cama', 'radio']),
    }));

    // Completa M01 -> M02 -> M03 -> M04 deve auto-completar objetivos já satisfeitos exceto radioTune
    bus.emit('itemCollected', { itemId: 'madeira', count: 8, source: 'hook' });
    bus.emit('itemCollected', { itemId: 'plastico', count: 4, source: 'hook' });
    bus.emit('crafted', { recipeId: 'rec_gancho', itemId: 'gancho', count: 1 });
    bus.emit('waterPurified', { count: 3 });

    expect(qe.states.get('M02')?.status).toBe('COMPLETED');
    expect(qe.states.get('M03')?.status).toBe('COMPLETED');
    expect(qe.states.get('M04')?.status).toBe('ACTIVE');
    expect(qe.states.get('M04')?.progress.m04_bat).toBe(1);
    expect(qe.states.get('M04')?.progress.m04_ant).toBe(1);
    expect(qe.states.get('M04')?.progress.m04_radio).toBe(1);
  });
});
