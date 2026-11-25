import { describe, it, expect } from 'vitest';
import { hookGeometry, collectionNet, plantGeometry, grillGeometry, radioFace, roofGeometry } from '../../src/render/EquipmentGeometry';
import { ambientBudget, fishGeometry } from '../../src/world/MarineAmbient';
import type { BufferGeometry } from 'three';
const triangles=(g:BufferGeometry)=>{const n=(g.index?.count??g.getAttribute('position').count)/3;g.dispose();return n;};
describe('detalhe de equipamentos e fauna',()=>{
  it('limita complexidade de cada equipamento',()=>{
    for(const make of [hookGeometry,collectionNet,plantGeometry,grillGeometry,radioFace,roofGeometry]) expect(triangles(make())).toBeLessThan(800);
  });
  it('mantém cardumes instanciados pequenos e orçamento de chuva fixo',()=>{
    const fish=triangles(fishGeometry());
    expect(fish*ambientBudget(true).fish).toBeLessThan(1500);
    expect(fish*ambientBudget(false).fish).toBeLessThan(3600);
    expect(ambientBudget(true).rain).toBe(72);
    expect(ambientBudget(false).rain).toBe(180);
  });
});
