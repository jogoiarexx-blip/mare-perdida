import * as THREE from 'three';
import { ISLAND_RINGS,ringHeight,type IslandSpec,islandHeight,islandRim,islandBiome } from './ChunkLayout';
import { SeededRng } from '../core/SeededRng';
import { combine } from '../render/DetailGeometry';

export function islandTerrain(spec:IslandSpec,segments:number):THREE.BufferGeometry {
  const positions:number[]=[0,spec.height,0],colors:number[]=[],indices:number[]=[];
  const palette={tropical:[0x5d874a,0x698f50,0x769952,0xc6ab70,0xe5cb95,0xc7b58d],rochoso:[0x686c68,0x777b70,0x8d8d79,0xb3a68a,0xd5c7a6,0xa6a49a],verde:[0x365e3e,0x46754b,0x679550,0x9da66b,0xd9c491,0xbdb091],arenoso:[0xa39865,0xc4b47d,0xd6c28c,0xe0cc9d,0xf0dfb4,0xc9b995]}[islandBiome(spec)];
  const color=new THREE.Color(palette[0]);colors.push(color.r,color.g,color.b);
  for(let ring=1;ring<ISLAND_RINGS.length;ring++){
    color.setHex(palette[ring]);
    const y=ringHeight(spec,ring);
    for(let i=0;i<segments;i++){
      const a=i*Math.PI*2/segments,r=islandRim(spec,a,ISLAND_RINGS[ring]);
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
export function palmCrown(count=6):THREE.BufferGeometry {
  const leaves:THREE.BufferGeometry[]=[];
  for(let i=0;i<count;i++){
    const shape=new THREE.BufferGeometry();
    shape.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.52,.18,.42,1.6,-.38,0,.52,.18,-.42,.72,.28,0],3));
    shape.setIndex([0,4,1,1,4,2,2,4,3,3,4,0]);
    shape.computeVertexNormals();shape.setAttribute('uv',new THREE.Float32BufferAttribute([0,.5,.3,1,1,.5,.3,0,.45,.5],2));
    leaves.push(shape.rotateY(i*Math.PI*2/count));
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

/** Ruína baixa de pedra, agrupada numa única malha; não é um edifício acessível. */
export function ruinGeometry():THREE.BufferGeometry{
  const pieces:THREE.BufferGeometry[]=[];
  for(const x of [-1.25,1.25])for(let i=0;i<3;i++){
    pieces.push(new THREE.BoxGeometry(.45,.22,.62).translate(x,.11,i*.65-.65));
  }
  for(const x of [-.65,0,.65])pieces.push(new THREE.BoxGeometry(.62,.24,.42).translate(x,.12,-1.05));
  pieces.push(new THREE.BoxGeometry(.42,.58,.45).translate(-1.25,.29,-1.05));
  pieces.push(new THREE.BoxGeometry(.42,.38,.45).translate(1.25,.19,-1.05));
  return combine(pieces);
}
export function vegetationLod(distance:number,previous:number):0|1|2{
  // 0: detalhe, 1: simplificado, 2: oculto. Histerese de 10m.
  if(distance<(previous===0?42:32))return 0;
  if(distance<(previous<=1?82:72))return 1;
  return 2;
}
