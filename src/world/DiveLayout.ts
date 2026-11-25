import {SeededRng} from '../core/SeededRng';
import {chunkAt,islandForChunk,islandHeight} from './ChunkLayout';
export const DIVE_TILE=64;
export function seabedHeight(x:number,z:number,seed:number):number{
 const p=(seed%997)*.031;return -7+Math.sin(x*.071+p)*.75+Math.cos(z*.063-p)*.8+Math.sin((x+z)*.048)*.45;
}
export interface DiveNode {id:string;kind:'alga'|'minerio'|'destroco'|'bau_raro';x:number;y:number;z:number;loot:{itemId:string;count:number}[];label:string;}
export function diveNodes(seed:number,tx:number,tz:number):DiveNode[]{
 const rng=new SeededRng(seed+':dive:v1:'+tx+':'+tz),nodes:DiveNode[]=[];
 for(let i=0;i<5;i++){
  const x=tx*64+rng.range(8,56),z=tz*64+rng.range(8,56),c=chunkAt(x,z),island=islandForChunk(seed,c.cx,c.cz);
  if(island&&islandHeight(island,x,z)!==null)continue;
  const kind=i===4?'destroco':i<2?'alga':'minerio';
  nodes.push({id:'dive:'+tx+':'+tz+':'+i,kind,x,z,y:seabedHeight(x,z,seed),label:kind==='alga'?'Colher algas':kind==='minerio'?'Extrair minério marinho':'Vasculhar destroço submerso',loot:kind==='alga'?[{itemId:'alga_marinha',count:2}]:kind==='minerio'?[{itemId:'minerio_marinho',count:2}]:[{itemId:'sucata',count:3},{itemId:'plastico',count:2}]});
 }
 const wreck=nodes.find(n=>n.kind==='destroco');
 if(wreck&&hasWreckRoom(seed,wreck)){
  nodes.push({id:'dive:'+tx+':'+tz+':5',kind:'bau_raro',x:wreck.x,y:wreck.y+.65,z:wreck.z+2,label:'Abrir baú raro do naufrágio',loot:[{itemId:'reliquia_atlas',count:1},{itemId:'minerio_marinho',count:3},{itemId:'sucata',count:4}]});
 }
 return nodes;
}
export function hasWreckRoom(seed:number,n:DiveNode):boolean{
 for(const dx of [-4,0,4])for(const dz of [-5,0,5]){
  const x=n.x+dx,z=n.z+dz,c=chunkAt(x,z),island=islandForChunk(seed,c.cx,c.cz);
  if(island&&islandHeight(island,x,z)!==null)return false;
 }
 return true;
}
/** Casco aberto nas extremidades; duas paredes laterais, sem bloquear entradas. */
export function wreckWall(x:number,z:number,y:number,n:DiveNode):boolean{
 return Math.abs(z-n.z)<3.9&&Math.abs(Math.abs(x-n.x)-2.3)<.42&&y>n.y-.2&&y<n.y+2.55;
}
export function validDiveId(id:unknown):id is string{return typeof id==='string'&&/^dive:-?\d{1,9}:-?\d{1,9}:[0-5]$/.test(id);}
export const oxygenCapacity=(tank:boolean)=>tank?90:45;
