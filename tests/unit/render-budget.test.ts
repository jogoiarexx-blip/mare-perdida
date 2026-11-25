import { describe,it,expect } from 'vitest';
import { AdaptiveResolution,resolutionLimits } from '../../src/core/RenderBudget';
import { RaftRenderer } from '../../src/raft/RaftRenderer';
import { RaftGrid } from '../../src/raft/Grid';
import { InstancedMesh,Color } from 'three';
describe('orçamento adaptativo',()=>{
  it('reduz resolução sob carga sem ultrapassar limites',()=>{
    const r=new AdaptiveResolution(true,true,3);
    for(let i=0;i<400;i++)r.sample(.035);
    expect(r.scale).toBeLessThan(1);
    expect(r.scale).toBeGreaterThanOrEqual(.65);
    for(let i=0;i<1200;i++)r.sample(.016);
    expect(r.scale).toBeGreaterThan(.65);
    expect(r.scale).toBeLessThanOrEqual(1);
    expect(resolutionLimits(false,true,3).max).toBe(1.35);
  });
  it('agrupa fundações, conserva cor e atualiza apenas quando o estado visual muda',()=>{
    const g=new RaftGrid();const r=new RaftRenderer();
    for(let i=2;i<50;i++)expect(g.addFoundation(i,0).ok).toBe(true);
    r.syncWithGrid(g);
    let d=r.root.getObjectByName('foundation-decks') as InstancedMesh;
    const f=r.root.getObjectByName('foundation-reinforcements') as InstancedMesh;
    expect(d.count).toBe(52);expect(f.count).toBe(1);
    expect(r.root.children.filter(o=>o instanceof InstancedMesh)).toHaveLength(2);
    const version=d.instanceMatrix.version;r.syncWithGrid(g);expect(d.instanceMatrix.version).toBe(version);
    const a=new Color(),b=new Color();d.getColorAt(1,a);
    g.getFoundation(1,0)!.hp=20;r.syncWithGrid(g);d.getColorAt(1,b);expect(a.equals(b)).toBe(false);
    g.foundations.delete('49,0');r.syncWithGrid(g);expect(d.count).toBe(51);
    r.dispose();
  });
});