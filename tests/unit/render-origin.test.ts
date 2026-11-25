import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {RenderOrigin} from '../../src/world/RenderOrigin';
import {oceanPhases,getWaveHeight} from '../../src/world/Ocean';
import {ChunkManager} from '../../src/world/ChunkManager';
import {islandForChunk} from '../../src/world/ChunkLayout';
describe('CP09.6 origem gráfica',()=>{
  it('recentraliza cena e câmera sem alterar posições lógicas ou distâncias',()=>{
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
    const obj=new THREE.Object3D();scene.add(obj);
    obj.position.set(2000000.125,2,-1500000.25);camera.position.set(2000002.5,4,-1500001);
    const saved=obj.position.clone(),eye=camera.position.clone(),origin=new RenderOrigin();
    expect(origin.update(eye.x,eye.z)).toBe(true);
    expect(Math.abs(eye.x-origin.x)).toBeLessThan(65);
    origin.render(scene,camera,()=>{
      scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
      const w=obj.getWorldPosition(new THREE.Vector3());
      expect(w.x-camera.position.x).toBeCloseTo(saved.x-eye.x,8);
      expect(Math.abs(w.x)).toBeLessThan(70);
    });
    expect(obj.position.equals(saved)).toBe(true);expect(camera.position.equals(eye)).toBe(true);
    expect(obj.getWorldPosition(new THREE.Vector3()).equals(saved)).toBe(true);
    expect(origin.update(eye.x+10,eye.z)).toBe(false);
  });
  it('restaura espaço lógico mesmo em erro de render',()=>{
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),origin=new RenderOrigin();
    camera.position.set(-2000,2,5000);const saved=camera.position.clone();
    origin.update(saved.x,saved.z);
    expect(()=>origin.render(scene,camera,()=>{throw new Error('teste');})).toThrow('teste');
    expect(camera.position.equals(saved)).toBe(true);expect(scene.position.length()).toBe(0);
  });
  it('fases reduzidas conservam ondas em coordenadas de milhões de metros',()=>{
    const x=2000000,z=-3000000,t=123456,dx=.75,dz=-.35,storm=.45;
    const [a,b,c]=oceanPhases(x,z,t),amp=.22+storm*.35;
    const gpu=Math.sin(a+dx*.24)*amp+Math.cos(b+dz*.19)*amp*.72+Math.sin(c+(dx+dz)*.42)*amp*.35;
    expect(gpu).toBeCloseTo(getWaveHeight(x+dx,z+dz,t,storm),8);
  });
  it('broadphase costeira funciona inclusive sem chunk carregado',()=>{
    const m=new ChunkManager(7,true);const i=islandForChunk(7,0,-1)!;
    expect(m.hasLandNear(i.x,i.z,1)).toBe(true);
    expect(m.hasLandNear(0,0,2)).toBe(false);
    expect(m.hasLandNear(i.x+i.radius+4,i.z,5)).toBe(true);
    m.dispose();
  });
});