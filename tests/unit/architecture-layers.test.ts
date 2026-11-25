import {describe,it,expect} from 'vitest';
import {RaftGrid} from '../../src/raft/Grid';
import {evaluateBuild} from '../../src/raft/BuildTarget';
import {architectureBlocks,upperFloor,UPPER_Y} from '../../src/raft/Architecture';
import {StructureGraph} from '../../src/raft/StructureGraph';
import {RaftRenderer} from '../../src/raft/RaftRenderer';
describe('CP10.5b camadas e materiais',()=>{
 it('quatro lados, teto e equipamento convivem e persistem',()=>{const g=new RaftGrid();expect(g.placeModule('cama',1,0,0).ok).toBe(true);for(let i=0;i<4;i++){expect(evaluateBuild(g,'parede',1,0,true,i).valid).toBe(true);expect(g.placeModule('parede',1,0,i).ok).toBe(true);}expect(g.placeModule('piso_superior',1,0,0).ok).toBe(true);expect(g.modulesAt(1,0)).toHaveLength(6);expect(evaluateBuild(g,'porta',1,0,true,2).valid).toBe(false);const h=new RaftGrid();h.restore(g.serialize());expect(h.modulesAt(1,0)).toHaveLength(6);expect(upperFloor(h,1,0)).toBe(UPPER_Y);expect(architectureBlocks(h,1,.46,.3,1,0)).toBe(true);h.removeModulesAt(1,0);expect(h.modulesAt(1,0)).toHaveLength(0);});
 it('metal tem 360 HP, maior capacidade e lote gráfico separado',()=>{const g=new RaftGrid(),r=new RaftRenderer();const before=StructureGraph.computeBuoyancy(g);expect(g.upgradeMetal(1,0).ok).toBe(true);expect(g.getFoundation(1,0)?.hp).toBe(360);expect(StructureGraph.computeBuoyancy(g).capacity-before.capacity).toBe(60);expect(g.setFinish(1,0,'dark').ok).toBe(false);expect(g.setFinish(0,1,'dark').ok).toBe(true);r.syncWithGrid(g);expect(r.root.getObjectByName('foundation-metal')?.visible).toBe(true);r.dispose();});
});