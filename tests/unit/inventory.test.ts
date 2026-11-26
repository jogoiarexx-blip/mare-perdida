import { describe, expect, it } from 'vitest';
import { Inventory } from '../../src/player/Inventory';
import { RECIPES } from '../../src/data/recipes';

describe('Inventory', () => {
  it('empilha até o máximo do item e reporta overflow sem descartar silenciosamente', () => {
    const inv = new Inventory(2);
    const res = inv.addItem('madeira', 45);
    expect(res.added).toBe(40);
    expect(res.overflow).toBe(5);
    expect(inv.getItemCount('madeira')).toBe(40);
  });

  it('fabrica receita atomicamente sem consumir ingredientes quando mochila está cheia', () => {
    const inv = new Inventory(2);
    inv.addItem('madeira', 20);
    inv.addItem('plastico', 20);
    // Ambos os slots cheios e madeira/plastico não ficam livres após consumir 3+2!
    const hookRecipe = RECIPES.find((r) => r.id === 'rec_gancho')!;
    const failRes = inv.craft(hookRecipe);
    expect(failRes.ok).toBe(false);
    expect(inv.getItemCount('madeira')).toBe(20);
    expect(inv.getItemCount('plastico')).toBe(20);

    // Quando há espaço após consumo ou em novo slot, fabrica com sucesso
    const inv2 = new Inventory(4);
    inv2.addItem('madeira', 3);
    inv2.addItem('plastico', 2);
    const okRes = inv2.craft(hookRecipe);
    expect(okRes.ok).toBe(true);
    expect(inv2.getItemCount('gancho')).toBe(1);
    expect(inv2.getItemCount('madeira')).toBe(0);
  });

  it('usa um espaço livre da barra apenas quando a mochila não tem espaço',()=>{
    const inv=new Inventory(9);
    inv.addItem('madeira',10);
    inv.slots[8]={itemId:'plastico',count:20};
    expect(inv.splitSlot(0)).toBe(true);
    expect(inv.slots[0]?.count).toBe(5);
    expect(inv.slots[1]).toEqual({itemId:'madeira',count:5});
    expect(inv.getItemCount('madeira')).toBe(10);
  });

  it('divide pilhas e aplica penalidade de morte preservando ferramentas e itens de missão', () => {
    const inv = new Inventory(10);
    inv.addItem('madeira', 10);
    inv.addItem('gancho', 1);
    inv.addItem('carta_verde', 1);

    expect(inv.splitSlot(0)).toBe(true);
    expect(inv.slots[0]?.count).toBe(5);
    // Dividir uma pilha prioriza os espaços da mochila, preservando a barra rápida.
    expect(inv.slots[Inventory.HOTBAR_SIZE]).toEqual({itemId:'madeira',count:5});
    expect(inv.slots[3]).toBeNull();
    expect(inv.getItemCount('madeira')).toBe(10);

    const dropped = inv.applyNormalDeathPenalty();
    expect(dropped.length).toBeGreaterThan(0);
    expect(inv.getItemCount('gancho')).toBe(1);
    expect(inv.getItemCount('carta_verde')).toBe(1);
    expect(inv.getItemCount('madeira')).toBe(8);
  });
});
