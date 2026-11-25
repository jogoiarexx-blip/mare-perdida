import {describe,it,expect} from 'vitest';
import {RaftGrid} from '../../src/raft/Grid';
import {RaftRenderer} from '../../src/raft/RaftRenderer';
import {architectureBlocks,adjacentUpper,upperFloor,UPPER_Y} from '../../src/raft/Architecture';
import {evaluateBuild} from '../../src/raft/BuildTarget';
describe('CP10.5 cabines',()=>{
 it('porta bloqueia fechada, libera aberta e persiste',()=>{const g=new RaftGrid(),m=g.placeModule('porta',0,0,0,14).module!;expect(architectureBlocks(g,0,.44,.3,0,0)).toBe(true);m.active=true;expect(architectureBlocks(g,0,.44,.3,0,0)).toBe(false);const restored=new RaftGrid();restored.restore(g.serialize());expect(restored.getModuleAt(0,0)?.active).toBe(true);});
 it('rotação muda o lado da parede e não bloqueia segundo andar',()=>{const g=new RaftGrid();g.placeModule('parede',0,0,1,12);expect(architectureBlocks(g,.46,0,.3,0,0)).toBe(true);expect(architectureBlocks(g,0,.46,.3,0,0)).toBe(false);expect(architectureBlocks(g,.46,0,UPPER_Y,0,0)).toBe(false);});
 it('escada requer plataforma adjacente e módulos aparecem na cena',()=>{const g=new RaftGrid(),r=new RaftRenderer();expect(evaluateBuild(g,'escada_interna',1,0,true).valid).toBe(false);g.placeModule('piso_superior',0,0,0,24);expect(upperFloor(g,0,0)).toBe(UPPER_Y);expect(adjacentUpper(g,1,0)?.kind).toBe('piso_superior');expect(evaluateBuild(g,'escada_interna',1,0,true).valid).toBe(true);g.placeModule('escada_interna',1,0,0,15);r.syncWithGrid(g);expect(r.root.children.some(o=>o.userData.kind==='escada_interna')).toBe(true);r.dispose();});
});