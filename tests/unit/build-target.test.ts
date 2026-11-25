import { describe,it,expect } from 'vitest';
import * as THREE from 'three';
import { RaftGrid } from '../../src/raft/Grid';
import { RaftRenderer } from '../../src/raft/RaftRenderer';
import { BuildTargetPicker,evaluateBuild } from '../../src/raft/BuildTarget';

describe('mira e regras de construção',()=>{
  it('seleciona célula correta mesmo com inclinação e rotação da jangada',()=>{
    const root=new THREE.Group(); root.position.set(13,1,-6);root.rotation.set(.08,.7,-.09);root.updateMatrixWorld(true);
    const target=root.localToWorld(new THREE.Vector3(2,.19,1));
    const player=root.localToWorld(new THREE.Vector3(1,.21,1));
    const camera=new THREE.PerspectiveCamera();camera.position.copy(root.localToWorld(new THREE.Vector3(1,2.2,1)));camera.lookAt(target);
    const picker=new BuildTargetPicker();
    expect(picker.pick(camera,root,player)).toEqual({gx:2,gz:1});
    camera.lookAt(camera.position.clone().add(new THREE.Vector3(0,1,0)));
    expect(picker.pick(camera,root,player)).toBeNull();
  });
  it('valida fundações, reforços, equipamentos e recursos',()=>{
    const g=new RaftGrid(5);
    expect(evaluateBuild(g,'fundacao',2,0,true).valid).toBe(true);
    expect(evaluateBuild(g,'fundacao',4,0,true).valid).toBe(false);
    expect(evaluateBuild(g,'fundacao',2,0,false).reason).toBe('Materiais insuficientes.');
    expect(evaluateBuild(g,'borda_reforcada',1,0,true).valid).toBe(true);
    g.reinforceFoundation(1,0);
    expect(evaluateBuild(g,'borda_reforcada',1,0,true).valid).toBe(false);
    g.placeModule('bau',1,0,0);
    expect(evaluateBuild(g,'cama',1,0,true).valid).toBe(false);
    g.addFoundation(2,0);
    expect(evaluateBuild(g,'fundacao',3,0,true).valid).toBe(false);
  });
  it('conversão de grade é inversa da rotação horizontal',()=>{
    const r=new RaftRenderer(); r.x=12;r.z=-7;r.heading=.8;
    const p=r.localToWorld(2,0,-1);
    expect(r.worldToLocalGrid(p.x,p.z)).toEqual({gx:2,gz:-1});
    r.dispose();
  });
});