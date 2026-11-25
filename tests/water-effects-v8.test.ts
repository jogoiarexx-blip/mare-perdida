import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {WaterEffects,waterFxBudget} from '../src/world/WaterEffects';
import {weatherAt} from '../src/world/Weather';

describe('Imersão marítima V8',()=>{
  it('clima começa limpo e é reproduzível pelo seed e relógio',()=>{
    expect(weatherAt(2089,0)).toBe('limpo');
    const states=Array.from({length:40},(_,i)=>weatherAt(2089,i*240));
    expect(states).toEqual(Array.from({length:40},(_,i)=>weatherAt(2089,i*240)));
    expect(states).toContain('chuva');
    expect(states).toContain('neblina');
  });
  it('mantém limites e reutiliza os três objetos de renderização',()=>{
    const scene=new THREE.Scene(),fx=new WaterEffects(scene);
    const root=scene.children[0] as THREE.Group;
    const foam=root.children[0] as THREE.InstancedMesh;
    const splash=root.children[1] as THREE.Points;
    const bubbles=root.children[2] as THREE.Points;
    for(const low of [false,true]){
      for(let i=0;i<140;i++){
        fx.tick(.05,i*.05,.3,low,0,-1.8,0,true,i%20<12,2,0,0,2,0);
        const cap=waterFxBudget(low);
        expect(foam.count).toBeLessThanOrEqual(cap.foam);
        expect(splash.geometry.drawRange.count).toBeLessThanOrEqual(cap.splash);
        expect(bubbles.geometry.drawRange.count).toBeLessThanOrEqual(cap.bubbles);
      }
      expect(root.children).toHaveLength(3);
    }
    fx.reset();
    expect(foam.count).toBe(0);
    expect(splash.geometry.drawRange.count).toBe(0);
    expect(bubbles.geometry.drawRange.count).toBe(0);
    fx.dispose();
    expect(scene.children).toHaveLength(0);
  });
});
