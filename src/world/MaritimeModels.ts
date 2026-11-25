import * as THREE from 'three';
import { combine } from '../render/DetailGeometry';

/** LOD visual com histerese; não altera entidades, colisões ou recompensas. */
export function detailedAtDistance(distanceSq: number, wasDetailed: boolean): boolean {
  const radius = wasDetailed ? 36 : 30;
  return distanceSq <= radius * radius;
}

export function wreckHull(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-2.65,-1.0); s.lineTo(-2.65,1.0); s.lineTo(-1.6,1.4);
  s.lineTo(1.1,1.4); s.quadraticCurveTo(2.15,1.15,2.75,0);
  s.quadraticCurveTo(2.15,-1.15,1.1,-1.4); s.lineTo(-1.6,-1.4); s.closePath();
  return new THREE.ExtrudeGeometry(s,{depth:.65,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.15,bevelThickness:.24,curveSegments:6})
    .rotateX(Math.PI/2).translate(0,.52,0);
}
export function wreckCabin(): THREE.BufferGeometry {
  return combine([
    new THREE.BoxGeometry(1.5,.85,1.55).translate(-1.0,.95,0),
    new THREE.BoxGeometry(1.68,.13,1.73).translate(-1.0,1.43,0),
    new THREE.BoxGeometry(.85,.38,1.1).translate(.9,.62,0),
    new THREE.BoxGeometry(.18,.75,.18).translate(-1.6,1.82,.45),
  ]);
}
export function wreckRails(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for(const z of [-1.21,1.21]){
    parts.push(new THREE.BoxGeometry(3.55,.055,.055).translate(-.25,1.0,z));
    for(let i=0;i<5;i++) parts.push(new THREE.CylinderGeometry(.034,.034,.55,6).translate(-2+i*.86,.73,z));
  }
  for(let i=0;i<3;i++) parts.push(new THREE.BoxGeometry(.26,.28,.035).translate(-1.46+i*.43,1.12, .786));
  return combine(parts);
}
