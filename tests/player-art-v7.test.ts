import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {HeldTools,heldToolGeometry,heldToolIds} from '../src/player/HeldTools';
import {survivorGear,survivorGlove,sharkGills} from '../src/render/DetailGeometry';
describe('Personagem e ferramentas V7',()=>{
  it('gera modelos leves, finitos e com normais',()=>{
    for(const g of [...heldToolIds.map(heldToolGeometry),survivorGear(),survivorGlove(),sharkGills()]){
      expect(g.getAttribute('position').count).toBeGreaterThan(0);
      expect(g.getAttribute('position').count).toBeLessThan(3000);
      expect(g.getAttribute('normal').count).toBe(g.getAttribute('position').count);
      expect(Array.from(g.getAttribute('position').array).every(Number.isFinite)).toBe(true);
      g.dispose();
    }
  });
  it('mantém apenas a ferramenta selecionada e troca entre mão e primeira pessoa',()=>{
    const scene=new THREE.Scene(), hand=new THREE.Group(), camera=new THREE.PerspectiveCamera();
    scene.add(hand);
    const held=new HeldTools(scene);
    held.update('lanca',true,hand,camera,.016,1,false,false);
    expect(held.root.parent).toBe(hand);
    expect(held.root.visible).toBe(true);
    held.trigger('machado');
    held.update('machado',false,hand,camera,.016,1,true,false);
    expect(held.root.parent).toBe(scene);
    expect(held.root.children.filter(c=>c.visible)).toHaveLength(1);
    held.update('machado',false,hand,camera,.016,1,false,true);
    expect(held.root.visible).toBe(false);
    held.update('madeira',false,hand,camera,.016,1,false,false);
    expect(held.root.visible).toBe(false);
    held.dispose();
    expect(held.root.parent).toBeNull();
  });
});
