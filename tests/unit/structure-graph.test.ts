import { describe, expect, it } from 'vitest';
import { RaftGrid } from '../../src/raft/Grid';
import { StructureGraph } from '../../src/raft/StructureGraph';

describe('RaftGrid & StructureGraph', () => {
  it('inicia com jangada 2x2 e expande até 3x3 (9 fundações) validando adjacência', () => {
    const grid = new RaftGrid(64);
    expect(grid.foundations.size).toBe(4);

    // Recusa fundação isolada no oceano
    expect(grid.addFoundation(5, 5).ok).toBe(false);

    // Expande para 3x3
    const extras: Array<[number, number]> = [
      [-1, 0],
      [-1, 1],
      [0, -1],
      [1, -1],
      [-1, -1],
    ];
    for (const [x, z] of extras) {
      expect(grid.addFoundation(x, z).ok).toBe(true);
    }
    expect(grid.foundations.size).toBe(9);
  });

  it('impede remoção que desconectaria outras fundações e protege o núcleo (0,0)', () => {
    const grid = new RaftGrid(64);
    expect(grid.addFoundation(2, 0).ok).toBe(true);
    expect(grid.addFoundation(3, 0).ok).toBe(true);

    // Remover (2,0) isolaria (3,0)
    const blocked = StructureGraph.removeFoundation(grid, 2, 0, false);
    expect(blocked.ok).toBe(false);
    expect(grid.getFoundation(2, 0)).toBeDefined();

    // Remover (0,0) é proibido por ser o núcleo
    const coreBlocked = StructureGraph.removeFoundation(grid, 0, 0, true);
    expect(coreBlocked.ok).toBe(false);

    // Remover a ponta (3,0) funciona
    const tipOk = StructureGraph.removeFoundation(grid, 3, 0, false);
    expect(tipOk.ok).toBe(true);
  });

  it('calcula massa, capacidade (100/fundação) e alerta de margem <15%', () => {
    const grid = new RaftGrid(64); // 4 fundações -> 400 capacidade
    let metrics = StructureGraph.computeBuoyancy(grid);
    expect(metrics.capacity).toBe(400);
    expect(metrics.overweight).toBe(false);

    // 4 fundações (1 núcleo reforçado) = 90 massa base; +270 módulos = 360 (10% de margem < 15%)
    grid.placeModule('vela', 0, 0, 0, 120);
    grid.placeModule('ancora', 1, 0, 0, 120);
    grid.placeModule('radio', 0, 1, 0, 30);
    metrics = StructureGraph.computeBuoyancy(grid);
    expect(metrics.overweight).toBe(false);
    expect(metrics.lowMarginWarning).toBe(true);
    expect(metrics.speedMultiplier).toBeLessThan(1);

    // Exceder 400 dispara sobrepeso
    grid.placeModule('cama', 1, 1, 0, 60);
    metrics = StructureGraph.computeBuoyancy(grid);
    expect(metrics.overweight).toBe(true);
    expect(metrics.speedMultiplier).toBeLessThan(0.5);
  });
});
