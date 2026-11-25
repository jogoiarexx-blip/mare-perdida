import { describe,it,expect } from 'vitest';
import { nearestGridEntry, FlotsamBuckets } from '../../src/raft/GridQueries';
import { cellKey,RaftGrid } from '../../src/raft/Grid';
import { RaftRenderer } from '../../src/raft/RaftRenderer';
import { SectorManager } from '../../src/world/SectorManager';
import * as THREE from 'three';
describe('consultas espaciais e reutilização',()=>{
  it('encontra a peça mais próxima sem percorrer mapas grandes e mantém filtro de dano',()=>{
    const entries=new Map<string,{gx:number;gz:number;hp:number}>();
    for(let x=-10;x<=10;x++)for(let z=-10;z<=10;z++)entries.set(cellKey(x,z),{gx:x,gz:z,hp:x===2&&z===-3?50:100});
    expect(nearestGridEntry(entries,1.7,-3.1,3)).toEqual({gx:2,gz:-3,hp:50});
    expect(nearestGridEntry(entries,1.1,-3,3,f=>f.hp<100)?.gx).toBe(2);
    expect(nearestGridEntry(entries,40,40,2)).toBeNull();
  });
  it('grade de detritos preserva raio e ordem mesmo em coordenadas negativas',()=>{
    const f=[{x:-1,z:-1},{x:-1.2,z:-1.1},{x:3,z:4},{x:-2.35,z:-1}];
    const b=new FlotsamBuckets<typeof f[number]>();b.rebuild(f);
    expect(b.query(-1,-1,1.34)).toEqual([f[1],f[0]]);
    expect(b.query(3,4,.1)).toEqual([f[2]]);
  });
  it('transformações locais preservam resultado e permitem vetor reutilizável',()=>{
    const r=new RaftRenderer();r.x=10;r.z=-3;r.heading=1.1;
    const out=new THREE.Vector3();expect(r.getCellWorldPosition(2,-4,out)).toBe(out);
    const p=r.worldToLocalXZ(out.x,out.z);expect(p.x).toBeCloseTo(2);expect(p.y).toBeCloseTo(-4);
    r.dispose();
  });
  it('crescimento de horta não exige reconstrução da jangada',()=>{
    const grid=new RaftGrid();grid.placeModule('horta',1,0,0);const r=new RaftRenderer();r.syncWithGrid(grid);
    const h=grid.getModuleAt(1,0)!;
    const group=r.root.children.find(o=>o instanceof THREE.Group&&o.userData.kind==='horta')!;
    expect(group.children[2].visible).toBe(false);
    h.planted=true;h.progress=.5;r.syncDynamicModule(h);expect(group.children[2].visible).toBe(true);
    h.readyCount=2;r.syncDynamicModule(h);expect(group.children[2].scale.x).toBeCloseTo(1.3);r.dispose();
  });
  it('remoção de detritos não concede a mesma entidade duas vezes',()=>{
    const s=new SectorManager(5);s.seedInitialFlotsam(0,0);
    const f=s.flotsam[0];expect(s.removeFlotsam(f.id)).toBe(f);expect(s.removeFlotsam(f.id)).toBeNull();
    expect(s.flotsam).toHaveLength(21);s.dispose();
  });
});