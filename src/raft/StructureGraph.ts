import { cellKey, type RaftGrid } from './Grid';

export interface BuoyancyMetrics {
  foundationCount: number;
  capacity: number;
  totalMass: number;
  marginRatio: number;
  lowMarginWarning: boolean;
  overweight: boolean;
  speedMultiplier: number;
}

/**
 * Grafo estrutural ligado à fundação-núcleo (0,0) + cálculo simplificado de massa e empuxo.
 * Evita simulação física pesada por bloco conforme GDD §8.
 */
export class StructureGraph {
  static readonly CAPACITY_PER_FOUNDATION = 100;
  static readonly BASE_FOUNDATION_MASS = 20;

  /** Retorna conjunto de chaves conectadas à âncora/núcleo da jangada por BFS. */
  static getConnectedFoundationKeys(grid: RaftGrid): Set<string> {
    const visited = new Set<string>();
    const root = grid.getFoundation(0, 0) ?? grid.foundations.values().next().value;
    if (!root) return visited;

    const queue: Array<[number, number]> = [[root.gx, root.gz]];
    visited.add(cellKey(root.gx, root.gz));

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    while (queue.length > 0) {
      const [cx, cz] = queue.shift()!;
      for (const [dx, dz] of dirs) {
        const nk = cellKey(cx + dx, cz + dz);
        if (!visited.has(nk) && grid.foundations.has(nk)) {
          visited.add(nk);
          queue.push([cx + dx, cz + dz]);
        }
      }
    }
    return visited;
  }

  /**
   * Remove fundação se não isolar outras peças (ou remove também subgrafo desconectado).
   * Retorna peças removidas e evita deletar a célula-núcleo protegida (0,0).
   */
  static removeFoundation(
    grid: RaftGrid,
    gx: number,
    gz: number,
    allowCascade = false
  ): { ok: boolean; removedKeys: string[]; reason?: string } {
    const key = cellKey(gx, gz);
    const target = grid.foundations.get(key);
    if (!target) return { ok: false, removedKeys: [], reason: 'Fundação inexistente.' };
    if (target.isCore) {
      return { ok: false, removedKeys: [], reason: 'A fundação central não pode ser removida.' };
    }
    const mod = grid.modules.get(key);
    if (mod?.storedItems && Object.values(mod.storedItems).some((v) => v > 0)) {
      return { ok: false, removedKeys: [], reason: 'Esvazie o baú antes de desmontar esta peça.' };
    }

    const removedFoundation = target;
    grid.foundations.delete(key);

    const connected = StructureGraph.getConnectedFoundationKeys(grid);
    const disconnected: string[] = [];
    for (const k of grid.foundations.keys()) {
      if (!connected.has(k)) disconnected.push(k);
    }

    if (disconnected.length > 0 && !allowCascade) {
      // Restaura para não deixar peças desconectadas
      grid.foundations.set(key, removedFoundation);
      return {
        ok: false,
        removedKeys: [],
        reason: 'Remover esta peça desconectaria parte da jangada.',
      };
    }

    const removedKeys = [key, ...disconnected];
    for (const dk of disconnected) {
      grid.foundations.delete(dk);
    }
    for (const rk of removedKeys) {
      grid.modules.delete(rk);
    }
    return { ok: true, removedKeys };
  }

  static computeBuoyancy(grid: RaftGrid): BuoyancyMetrics {
    const foundationCount = grid.foundations.size;
    const capacity = foundationCount * StructureGraph.CAPACITY_PER_FOUNDATION;

    let totalMass = 0;
    for (const f of grid.foundations.values()) {
      totalMass += StructureGraph.BASE_FOUNDATION_MASS + (f.reinforced ? 10 : 0);
    }
    for (const m of grid.modules.values()) {
      totalMass += m.mass;
    }

    const marginRatio = capacity > 0 ? (capacity - totalMass) / capacity : 0;
    const overweight = totalMass > capacity;
    const lowMarginWarning = !overweight && marginRatio < 0.15;
    const speedMultiplier = overweight ? 0.45 : marginRatio < 0.15 ? 0.78 : 1.0;

    return {
      foundationCount,
      capacity,
      totalMass,
      marginRatio,
      lowMarginWarning,
      overweight,
      speedMultiplier,
    };
  }
}
