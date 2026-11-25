import * as THREE from 'three';
import { ISLAND_RINGS,ringHeight,type IslandSpec,islandHeight } from './ChunkLayout';
import { SeededRng } from '../core/SeededRng';
import { combine } from '../render/DetailGeometry';

export function islandTerrain(spec:IslandSpec,segments:number):THREE.BufferGeometry {
  const positions:number[]=[0,spec.height,0],colors:number[]=[],indices:number[]=[];
  const palette=[0x5d874a,0x698f50,0x769952,0xc6ab70,0xe5cb95,0xc7b58d];
  const color=new THREE.Color(palette[0]);colors.push(color.r,color.g,color.b);
  for(let ring=1;ring<ISLAND_RINGS.length;ring++){
    color.setHex(palette[ring]);
    const r=spec.radius*ISLAND_RINGS[ring],y=ringHeight(spec,ring);
    for(let i=0;i<segments;i++){
      const a=i*Math.PI*2/segments;
      positions.push(Math.cos(a)*r,y,Math.sin(a)*r);
      colors.push(color.r,color.g,color.b);
    }
  }
  for(let i=0;i<segments;i++)indices.push(0,1+(i+1)%segments,1+i);
  for(let ring=1;ring<ISLAND_RINGS.length-1;ring++){
    const inner=1+(ring-1)*segments,outer=inner+segments;
    for(let i=0;i<segments;i++){
      const j=(i+1)%segments;
      indices.push(inner+i,inner+j,outer+i,inner+j,outer+j,outer+i);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function palmCrown():THREE.BufferGeometry {
  const leaves:THREE.BufferGeometry[]=[];
  for(let i=0;i<6;i++){
    const shape=new THREE.BufferGeometry();
    shape.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.52,.18,.42,1.6,-.38,0,.52,.18,-.42,.72,.28,0],3));
    shape.setIndex([0,4,1,1,4,2,2,4,3,3,4,0]);
    shape.computeVertexNormals();shape.setAttribute('uv',new THREE.Float32BufferAttribute([0,.5,.3,1,1,.5,.3,0,.45,.5],2));
    leaves.push(shape.rotateY(i*Math.PI/3));
  }
  return combine(leaves);
}
export interface IslandDecor {x:number;y:number;z:number;scale:number;angle:number;}
export function islandDecor(spec:IslandSpec,count:number,kind:'palm'|'rock'):IslandDecor[]{
  const rng=new SeededRng(spec.seed+':'+kind);
  const out:IslandDecor[]=[];
  for(let i=0;i<count;i++){
    const a=rng.range(0,Math.PI*2),r=spec.radius*rng.range(.16,kind==='palm'?.62:.82);
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    out.push({x,z,y:islandHeight(spec,spec.x+x,spec.z+z)!,scale:rng.range(.7,1.25),angle:rng.range(0,Math.PI*2)});
  }
  return out;
}
