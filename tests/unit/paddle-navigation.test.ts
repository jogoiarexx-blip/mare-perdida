import {describe,it,expect} from 'vitest';
import {paddleStep,deckDistance} from '../../src/world/Navigation';
import {RaftGrid} from '../../src/raft/Grid';
import {Inventory} from '../../src/player/Inventory';
import {RECIPES} from '../../src/data/recipes';
describe('remo, âncora e retorno',()=>{
 it('navega sem vela, vira e recua',()=>{const a=paddleStep(0,1,1,false,1,1);expect(a.dx).toBeGreaterThan(0);expect(a.dz).toBeLessThan(0);expect(paddleStep(0,0,-1,false,1,1).dz).toBeGreaterThan(0);});
 it('âncora impede avanço e rotação e persiste no grid',()=>{const g=new RaftGrid();const m=g.placeModule('ancora',1,1,0,35).module!;m.active=true;const restored=new RaftGrid();restored.restore(g.serialize());expect(restored.isAnchorDropped()).toBe(true);expect(paddleStep(0,1,1,restored.isAnchorDropped(),1,1)).toEqual({heading:0,dx:0,dz:0});});
 it('distância é medida até a borda, não até o centro',()=>{const g=new RaftGrid();expect(deckDistance(1.5,1,g.foundations.values())).toBe(0);expect(deckDistance(2.5,1,g.foundations.values())).toBe(1);});
 it('remo pode ser fabricado com detritos iniciais',()=>{const inv=new Inventory();inv.addItem('madeira',2);inv.addItem('plastico',1);expect(inv.craft(RECIPES.find(r=>r.id==='rec_remo')!).ok).toBe(true);expect(inv.getItemCount('remo')).toBe(1);});
});