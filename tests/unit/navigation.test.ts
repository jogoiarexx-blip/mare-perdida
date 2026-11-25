import {describe,it,expect} from 'vitest';
import {Discovery,bearing,cardinal,headingDegrees,helmStep,minimapSvg} from '../../src/world/Navigation';
import {RaftGrid} from '../../src/raft/Grid';
import {RaftRenderer} from '../../src/raft/RaftRenderer';
describe('CP09.3 navegação',()=>{
  it('gira, avança, recua e respeita a âncora',()=>{
    const right=helmStep(0,1,1,true,false,1,1);expect(right.heading).toBeLessThan(0);expect(right.dx).toBeGreaterThan(0);
    expect(helmStep(0,0,-1,false,false,1,1).dz).toBeGreaterThan(0);
    expect(helmStep(0,1,1,true,true,1,1)).toEqual({heading:0,dx:0,dz:0});
    expect(cardinal(bearing(1,0))).toBe('L');expect(headingDegrees(-Math.PI/2)).toBe(90);
  });
  it('descoberta persiste, sem revelar setores desconhecidos',()=>{
    const d=new Discovery();d.visit(0,0);d.visit(40,-67);d.visit(40,-67);
    expect(d.count).toBe(2);expect(d.has(0,-1)).toBe(true);expect(d.has(1,1)).toBe(false);
    const restored=new Discovery();restored.reset(d.serialize());expect(restored.serialize()).toEqual(d.serialize());
    expect(minimapSvg(7,restored,0,0,0,0,0)).toContain('2 setores descobertos');
  });
  it('leme é módulo construível e renderizável',()=>{
    const grid=new RaftGrid(),r=new RaftRenderer();expect(grid.placeModule('leme',1,0,0,22).ok).toBe(true);
    r.syncWithGrid(grid);expect(r.root.children.some(o=>o.userData.kind==='leme')).toBe(true);r.dispose();
  });
});