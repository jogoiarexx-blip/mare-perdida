import { describe, expect, it } from 'vitest';
import { RaftGrid } from '../../src/raft/Grid';
import { RaftRenderer } from '../../src/raft/RaftRenderer';
import { reinforcedDeckFrame } from '../../src/render/DetailGeometry';
import { Group, Mesh } from 'three';
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
    const piece=r.root.children.find(obj=>obj instanceof Group && obj.position.x===1 && obj.position.z===0)!;
    const deck=piece.children[0] as Mesh; const rail=piece.children[1] as Mesh;
    const original=deck.material;
    expect(rail.visible).toBe(false);
    expect(grid.getFoundation(1,0)!.maxHp).toBe(100);
    expect(grid.reinforceFoundation(1,0).ok).toBe(true); r.syncWithGrid(grid);
    expect(rail.visible).toBe(true);
    expect(deck.material).not.toBe(original);
    expect(grid.getFoundation(1,0)!.maxHp).toBe(220);
    expect(grid.getFoundation(1,0)!.hp).toBe(220);
    expect(grid.reinforceFoundation(1,0).ok).toBe(false);
    r.dispose();
  });
});