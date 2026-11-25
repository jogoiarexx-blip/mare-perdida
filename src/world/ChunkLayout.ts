import { SeededRng } from '../core/SeededRng';
export const CHUNK_SIZE=128;
export interface ChunkCoord {cx:number;cz:number;}
export interface IslandSpec {id:string;x:number;z:number;radius:number;height:number;seed:number;}
export function chunkAt(x:number,z:number):ChunkCoord {
  return {cx:Math.floor(x/CHUNK_SIZE),cz:Math.floor(z/CHUNK_SIZE)};
}
export function chunkKey(cx:number,cz:number):string{return cx+':'+cz;}
export function chunkRadius(low:boolean):number{return low?1:2;}
/** IDs e posição independem da ordem de carregamento. Margem impede sobreposição entre setores. */
export function islandForChunk(seed:number,cx:number,cz:number):IslandSpec|null {
  const rng=new SeededRng(seed+':island:v1:'+chunkKey(cx,cz));
  if(cx===0&&cz===0)return null; // preservar jangada inicial
  if(cx===0&&cz===-1)return {id:'island:0:-1',x:40,z:-67,radius:24,height:5.4,seed:rng.getState()};
  if(cx===-1&&cz===-1)return null; // preservar boia inicial
  if(rng.next()>.38)return null;
  return {id:'island:'+chunkKey(cx,cz),x:cx*CHUNK_SIZE+rng.range(32,96),z:cz*CHUNK_SIZE+rng.range(32,96),radius:rng.range(17,28),height:rng.range(4,7),seed:rng.getState()};
}
export const ISLAND_RINGS=[0,.30,.55,.72,.86,1] as const;
export function ringHeight(spec:IslandSpec,index:number):number{
  return [spec.height,spec.height*.81,spec.height*.47,spec.height*.22,.18,-1.4][index];
}
/** Perfil físico idêntico às alturas dos anéis do terreno; null fora da ilha. */
export function islandHeight(spec:IslandSpec,x:number,z:number):number|null {
  const r=Math.hypot(x-spec.x,z-spec.z)/spec.radius;
  if(r>1)return null;
  for(let i=1;i<ISLAND_RINGS.length;i++)if(r<=ISLAND_RINGS[i]){
    const t=(r-ISLAND_RINGS[i-1])/(ISLAND_RINGS[i]-ISLAND_RINGS[i-1]);
    return ringHeight(spec,i-1)*(1-t)+ringHeight(spec,i)*t;
  }
  return null;
}
export function desiredChunks(x:number,z:number,r:number):ChunkCoord[]{
  const c=chunkAt(x,z),list:ChunkCoord[]=[];
  for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)list.push({cx:c.cx+dx,cz:c.cz+dz});
  return list.sort((a,b)=>((a.cx+.5)*CHUNK_SIZE-x)**2+((a.cz+.5)*CHUNK_SIZE-z)**2-(((b.cx+.5)*CHUNK_SIZE-x)**2+((b.cz+.5)*CHUNK_SIZE-z)**2));
}
