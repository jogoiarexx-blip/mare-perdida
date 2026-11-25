import { describe, expect, it } from 'vitest';
import { sharkBody, sharkBelly, sharkTail, sharkEyes, plankDeck, survivorClothing, survivorHead, survivorArm, survivorLeg, survivorVest } from '../../src/render/DetailGeometry';
import type { BufferGeometry } from 'three';
function triangles(g: BufferGeometry) { const n=(g.index?.count ?? g.getAttribute('position').count)/3; g.dispose(); return n; }
describe('geometria procedural leve',()=>{
  it('mantém orçamento do convés por fundação',()=>expect(triangles(plankDeck())).toBeLessThanOrEqual(100));
  it('limita o tubarão completo',()=>expect([sharkBody(),sharkBelly(),sharkTail(),sharkEyes()].reduce((n,g)=>n+triangles(g),0)).toBeLessThan(1200));
  it('limita avatar completo',()=>expect(triangles(survivorClothing())+triangles(survivorHead())+triangles(survivorVest())+2*triangles(survivorArm())+2*triangles(survivorLeg())).toBeLessThan(2500));
});