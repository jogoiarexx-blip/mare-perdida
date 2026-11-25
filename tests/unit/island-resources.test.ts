import {describe,it,expect} from 'vitest';
import {ChunkManager} from '../../src/world/ChunkManager';
import {islandForChunk} from '../../src/world/ChunkLayout';
import {resourcesForIsland,blocksResourceMovement,validResourceId} from '../../src/world/IslandResources';
import {Inventory} from '../../src/player/Inventory';
import {RECIPES} from '../../src/data/recipes';
describe('CP09.2 recursos persistentes',()=>{
  const seed=7, spec=islandForChunk(seed,0,-1)!;
  it('gera 29 recursos estáveis e IDs válidos',()=>{
    const n=resourcesForIsland(spec);
    expect(n).toHaveLength(29);expect(new Set(n.map(r=>r.id)).size).toBe(29);
    expect(n.every(r=>validResourceId(r.id))).toBe(true);
    expect(n).toEqual(resourcesForIsland(spec));
  });
  it('coleta uma vez, mantém delta após unload, troca de qualidade e restore',()=>{
    const m=new ChunkManager(seed,true);m.update(spec.x,spec.z,9);
    const tree=resourcesForIsland(spec)[0];
    expect(m.harvest(tree.id)).toBe(true);expect(m.harvest(tree.id)).toBe(false);
    m.update(1000,1000,9);m.update(spec.x,spec.z,9);
    expect(m.harvest(tree.id)).toBe(false);
    m.setQuality(false);m.update(spec.x,spec.z,25);expect(m.harvest(tree.id)).toBe(false);
    const save=m.serializeResources();m.reset(seed,true,save);m.update(spec.x,spec.z,9);
    expect(m.harvest(tree.id)).toBe(false);expect(m.serializeResources()).toEqual([tree.id]);m.dispose();
  });
  it('bloqueia aproximação ao tronco, libera após corte',()=>{
    const tree=resourcesForIsland(spec)[0],used=new Set<string>();
    expect(blocksResourceMovement([tree],used,tree.x,tree.z,tree.y,tree.x+1,tree.z)).toBe(true);
    used.add(tree.id);expect(blocksResourceMovement([tree],used,tree.x,tree.z,tree.y,tree.x+1,tree.z)).toBe(false);
  });
  it('machado é fabricável e possui durabilidade',()=>{
    const inv=new Inventory();inv.addItem('madeira',3);inv.addItem('pedra',2);inv.addItem('corda',1);
    expect(inv.craft(RECIPES.find(r=>r.id==='rec_machado')!).ok).toBe(true);
    expect(inv.slots.find(s=>s?.itemId==='machado')?.durability).toBe(60);
  });
});