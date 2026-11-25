import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Uma única geometria por material: mais detalhe sem multiplicar chamadas de desenho.
export function combine(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const compatible = parts.map(p => p.index ? p.toNonIndexed() : p);
  const result = mergeGeometries(compatible);
  for (const p of new Set([...parts, ...compatible])) p.dispose();
  if (!result) throw new Error('Geometrias incompatíveis');
  result.computeBoundingSphere();
  return result;
}
function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  return new THREE.BoxGeometry(w,h,d).translate(x,y,z);
}
function oval(rx: number, ry: number, rz: number, x: number, y: number, z: number, segments = 12) {
  return new THREE.SphereGeometry(1,segments,8).scale(rx,ry,rz).translate(x,y,z);
}
function fin(points: number[][], thickness: number, angle: number, x: number, y: number, z: number) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0],points[0][1]);
  for (const p of points.slice(1)) shape.lineTo(p[0],p[1]);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false,steps:1})
    .translate(0,0,-thickness/2).rotateY(angle).translate(x,y,z);
}
export function sharkBody(): THREE.BufferGeometry {
  const profile = [[0,-1.52],[.16,-1.42],[.33,-1.05],[.47,-.45],[.47,.15],[.37,.65],[.19,1.2],[.09,1.48],[0,1.57]]
    .map(([r,y])=>new THREE.Vector2(r,y));
  const body = new THREE.LatheGeometry(profile,16).rotateX(Math.PI/2).scale(1,.72,1).translate(0,-.12,0);
  return combine([body,
    fin([[-.42,0],[.27,.83],[.37,0]],.10,-Math.PI/2,0,.12,.02),
    fin([[0,0],[.73,-.22],[.35,.09]],.07,0,.25,-.24,.18),
    fin([[0,0],[-.73,-.22],[-.35,.09]],.07,0,-.25,-.24,.18)]);
}
export function sharkTail(): THREE.BufferGeometry {
  return combine([fin([[-.20,0],[.32,.72],[.40,.12],[.33,-.48]],.08,-Math.PI/2,0,0,0)]);
}
export function sharkBelly(): THREE.BufferGeometry {
  return oval(.35,.12,1.15,0,-.36,-.1,16);
}
export function sharkEyes(): THREE.BufferGeometry {
  return combine([oval(.06,.055,.06,-.33,-.07,-.95,8),oval(.06,.055,.06,.33,-.07,-.95,8)]);
}
export function plankDeck(): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[]=[];
  for(let i=0;i<5;i++) pieces.push(box(.182,.15,.96,(i-2)*.194,.035,0));
  for(const z of [-.32,.32]) pieces.push(box(.96,.08,.13,0,-.075,z));
  return combine(pieces);
}
export function survivorClothing(): THREE.BufferGeometry {
  const torso=oval(.25,.32,.16,0,1.12,0);
  const hips=oval(.21,.14,.15,0,.79,0);
  return combine([torso,hips]);
}
export function survivorLeg(): THREE.BufferGeometry {
  return combine([oval(.095,.31,.105,0,-.27,0,10),box(.19,.15,.28,0,-.56,-.055)]);
}
export function survivorArm(): THREE.BufferGeometry {
  return combine([oval(.085,.20,.085,0,-.18,0,10),oval(.07,.16,.07,0,-.45,0,10)]);
}
export function survivorHead(): THREE.BufferGeometry {
  return combine([oval(.18,.22,.18,0,1.55,0),oval(.045,.07,.065,-.17,1.54,0,8),oval(.045,.07,.065,.17,1.54,0,8)]);
}
export function survivorVest(): THREE.BufferGeometry {
  return combine([box(.12,.42,.08,-.13,1.12,-.145),box(.12,.42,.08,.13,1.12,-.145),box(.40,.07,.32,0,.96,0),box(.32,.34,.12,0,1.12,.19)]);
}

/** Moldura metálica visível por cima do convés (topo da madeira em y=0,19).
 * Aros e rebites agrupados em uma geometria compartilhada, sem novos draw calls por peça.
 */
export function reinforcedDeckFrame(): THREE.BufferGeometry {
  const rails: THREE.BufferGeometry[] = [];
  for (const sign of [-1,1]) {
    rails.push(box(.98,.19,.095,0,.12,sign*.445));
    rails.push(box(.095,.19,.79,sign*.445,.12,0));
    for(const along of [-.27,0,.27]) {
      rails.push(new THREE.CylinderGeometry(.024,.024,.018,6).translate(along,.224,sign*.445));
      rails.push(new THREE.CylinderGeometry(.024,.024,.018,6).translate(sign*.445,.224,along));
    }
  }
  // Uma única malha com cor de vértice para distinguir aço e cabeças dos rebites.
  const colors = [new THREE.Color(0x99aebb),new THREE.Color(0xe1e7e9)];
  for (let i=0;i<rails.length;i++){
    const geo=rails[i], color=colors[i%8<2?0:1];
    const count=geo.getAttribute('position').count;
    const values=new Float32Array(count*3);
    for(let j=0;j<count;j++) color.toArray(values,j*3);
    geo.setAttribute('color',new THREE.BufferAttribute(values,3));
  }
  return combine(rails);
}
