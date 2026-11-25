import { ITEMS } from './items';
import { RECIPES } from './recipes';
import { CHAPTER_1_QUESTS,CHAPTER_2_QUESTS,DIVE_QUESTS } from './quests';
const ALL_QUESTS=[...CHAPTER_1_QUESTS,...CHAPTER_2_QUESTS,...DIVE_QUESTS];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valida integridade referencial, unicidade de IDs e ausência de ciclos (DAG) em receitas e missões.
 */
export function validateGameData(): ValidationResult {
  const errors: string[] = [];

  // 1. Verificar receitas e referências a itens
  const recipeIds = new Set<string>();
  const itemProducedBy = new Map<string, string[]>();

  for (const r of RECIPES) {
    if (recipeIds.has(r.id)) {
      errors.push(`Receita duplicada: ${r.id}`);
    }
    recipeIds.add(r.id);

    if (r.outputItemId && !ITEMS[r.outputItemId]) {
      errors.push(`Receita ${r.id} produz item inexistente: ${r.outputItemId}`);
    }
    if (r.outputItemId) {
      const list = itemProducedBy.get(r.outputItemId) ?? [];
      list.push(r.id);
      itemProducedBy.set(r.outputItemId, list);
    }
    for (const ing of r.ingredients) {
      if (!ITEMS[ing.itemId]) {
        errors.push(`Receita ${r.id} exige item inexistente: ${ing.itemId}`);
      }
      if (ing.count <= 0) {
        errors.push(`Receita ${r.id} tem quantidade inválida para ${ing.itemId}`);
      }
    }
  }

  // 2. Verificar ciclos DAG nas receitas (item -> receita -> ingredientes)
  // Recursos base coletáveis são folhas sem necessidade de receita
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const hasRecipeCycle = (recipeId: string): boolean => {
    if (visiting.has(recipeId)) return true;
    if (visited.has(recipeId)) return false;
    visiting.add(recipeId);
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (recipe) {
      for (const ing of recipe.ingredients) {
        const producers = itemProducedBy.get(ing.itemId) ?? [];
        for (const prodId of producers) {
          if (hasRecipeCycle(prodId)) return true;
        }
      }
    }
    visiting.delete(recipeId);
    visited.add(recipeId);
    return false;
  };

  for (const r of RECIPES) {
    if (hasRecipeCycle(r.id)) {
      errors.push(`Ciclo detectado no grafo de receitas envolvendo ${r.id}`);
      break;
    }
  }

  // 3. Verificar missões (IDs únicos, requires válidos, DAG, failPolicy e objetivos)
  const questIds = new Set<string>();
  for (const q of ALL_QUESTS) {
    if (questIds.has(q.id)) {
      errors.push(`Missão duplicada: ${q.id}`);
    }
    questIds.add(q.id);
    if (q.objectives.length === 0) {
      errors.push(`Missão ${q.id} não possui objetivos`);
    }
    if (!q.failPolicy || q.failPolicy.trim().length < 5) {
      errors.push(`Missão ${q.id} sem política de recuperação`);
    }
  }

  for (const q of ALL_QUESTS) {
    for (const req of q.requires) {
      if (!questIds.has(req)) {
        errors.push(`Missão ${q.id} depende de missão inexistente: ${req}`);
      }
    }
  }

  const qVisiting = new Set<string>();
  const qVisited = new Set<string>();
  const hasQuestCycle = (qid: string): boolean => {
    if (qVisiting.has(qid)) return true;
    if (qVisited.has(qid)) return false;
    qVisiting.add(qid);
    const q = ALL_QUESTS.find((item) => item.id === qid);
    if (q) {
      for (const req of q.requires) {
        if (hasQuestCycle(req)) return true;
      }
    }
    qVisiting.delete(qid);
    qVisited.add(qid);
    return false;
  };

  for (const q of ALL_QUESTS) {
    if (hasQuestCycle(q.id)) {
      errors.push(`Ciclo detectado nas dependências de missão: ${q.id}`);
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
