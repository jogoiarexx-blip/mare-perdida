import { describe, expect, it } from 'vitest';
import { validateGameData } from '../../src/data/validator';
import { CHAPTER_1_QUESTS } from '../../src/data/quests';
import { RECIPES } from '../../src/data/recipes';

describe('Catálogo de dados do GDD', () => {
  it('valida integridade referencial, IDs únicos e grafo acíclico (DAG)', () => {
    const res = validateGameData();
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
  });

  it('contém exatamente 5 missões principais (M01–M05) e 10 secundárias (S001–S010) no Capítulo 1', () => {
    const mains = CHAPTER_1_QUESTS.filter((q) => q.type === 'main').map((q) => q.id);
    const sides = CHAPTER_1_QUESTS.filter((q) => q.type === 'side').map((q) => q.id);
    expect(mains).toEqual(['M01', 'M02', 'M03', 'M04', 'M05']);
    expect(sides).toHaveLength(10);
  });

  it('inclui receitas iniciais do GDD com ingredientes positivos', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(18);
    for (const r of RECIPES) {
      expect(r.ingredients.length).toBeGreaterThan(0);
    }
  });
});
