import { describe, expect, it } from 'vitest';
import { RaftGrid } from '../../src/raft/Grid';
import { RaftRenderer } from '../../src/raft/RaftRenderer';
import { reinforcedDeckFrame } from '../../src/render/DetailGeometry';
import { InstancedMesh, Color } from 'three';
describe('borda reforçada',()=>{
  it('exibe moldura acima da madeira e mantém orçamento de geometria',()=>{
    const g=reinforcedDeckFrame(); g.computeBoundingBox();
    expect(g.boundingBox!.max.y).toBeGreaterThan(.19);
    expect(g.boundingBox!.max.x).toBeLessThanOrEqual(.50);
    expect(g.getAttribute('position').count/3).toBeLessThan(500);
    expect(g.hasAttribute('color')).toBe(true); g.dispose();
  });
  it('distingue visual e HP ao reforçar uma fundação já existente',()=>{
    const grid=new RaftGrid(); const r=new RaftRenderer(); r.syncWithGrid(grid);
    const deck=r.root.getObjectByName('foundation-decks') as InstancedMesh;
    const rail=r.root.getObjectByName('foundation-reinforcements') as InstancedMesh;
    const original=new Color(),changed=new Color();
    deck.getColorAt(1,original);
    expect(deck.count).toBe(4);
    expect(rail.count).toBe(1);
    expect(grid.getFoundation(1,0)!.maxHp).toBe(100);
    expect(grid.reinforceFoundation(1,0).ok).toBe(true); r.syncWithGrid(grid);
    expect(rail.count).toBe(2);
    deck.getColorAt(1,changed);
    expect(changed.equals(original)).toBe(false);
    expect(grid.getFoundation(1,0)!.maxHp).toBe(220);
    expect(grid.getFoundation(1,0)!.hp).toBe(220);
    expect(grid.reinforceFoundation(1,0).ok).toBe(false);
    r.dispose();
  });
});