import {describe,it,expect} from 'vitest';
import {RaftGrid} from '../src/raft/Grid';
import {Inventory} from '../src/player/Inventory';
import {RECIPES} from '../src/data/recipes';
import {evaluateBuild} from '../src/raft/BuildTarget';

describe('Progressão da âncora',()=>{
  it('inicia sem âncora e exige recursos para construção',()=>{
    const raft=new RaftGrid(),inv=new Inventory();
    const recipe=RECIPES.find(r=>r.id==='build_ancora')!;
    expect(raft.modules.size).toBe(0);
    expect(raft.isAnchorDropped()).toBe(false);
    expect(evaluateBuild(raft,'ancora',1,1,inv.hasItems(recipe.ingredients),0).valid).toBe(false);
    inv.addItem('sucata',2);inv.addItem('corda',1);
    expect(evaluateBuild(raft,'ancora',1,1,inv.hasItems(recipe.ingredients),0).valid).toBe(true);
    const placed=raft.placeModule('ancora',1,1,0,recipe.structureMass);
    expect(placed.ok).toBe(true);
    expect(inv.consumeItems(recipe.ingredients)).toBe(true);
    expect(inv.getItemCount('sucata')).toBe(0);
    expect(inv.getItemCount('corda')).toBe(0);
    expect(raft.isAnchorDropped()).toBe(false);
    placed.module!.active=true;
    expect(raft.isAnchorDropped()).toBe(true);
    const restored=new RaftGrid();
    restored.restore(raft.serialize());
    expect(restored.isAnchorDropped()).toBe(true);
  });
});
