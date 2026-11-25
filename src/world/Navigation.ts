import {chunkAt,chunkKey,CHUNK_SIZE,islandForChunk,islandRim,islandBiome} from './ChunkLayout';
export const cardinal=(degrees:number)=>['N','NE','L','SE','S','SO','O','NO'][Math.round(((degrees%360+360)%360)/45)%8];
export function bearing(dx:number,dz:number):number{return (Math.atan2(dx,-dz)*180/Math.PI+360)%360;}
export function headingDegrees(heading:number):number{return (-heading*180/Math.PI%360+360)%360;}
export function helmStep(heading:number,turn:number,throttle:number,sail:boolean,anchored:boolean,dt:number,massMultiplier:number){
  if(anchored)return {heading,dx:0,dz:0};
  const next=heading-Math.max(-1,Math.min(1,turn))*.65*dt;
  const t=Math.max(-1,Math.min(1,throttle));
  const speed=(t<0?.55:sail?2.1:.85)*t*massMultiplier;
  return {heading:next,dx:-Math.sin(next)*speed*dt,dz:-Math.cos(next)*speed*dt};
}
export function validDiscoveredChunk(id:unknown):id is string{return typeof id==='string'&&/^-?\d{1,9}:-?\d{1,9}$/.test(id);}
export class Discovery {
  private readonly seen=new Set<string>();
  reset(ids:readonly string[]=[]){this.seen.clear();for(const id of ids)if(validDiscoveredChunk(id))this.seen.add(id);}
  visit(x:number,z:number){const {cx,cz}=chunkAt(x,z);this.seen.add(chunkKey(cx,cz));}
  serialize(){return [...this.seen].sort();}
  has(cx:number,cz:number){return this.seen.has(chunkKey(cx,cz));}
  get count(){return this.seen.size;}
}
/** Mapa norte para cima; só desenha ilhas dos setores visitados. */
export function minimapSvg(seed:number,discovery:Discovery,x:number,z:number,raftX:number,raftZ:number,yaw:number):string{
  const {cx,cz}=chunkAt(x,z),size=40;
  const originX=(cx-1)*CHUNK_SIZE,originZ=(cz-1)*CHUNK_SIZE;
  const px=(wx:number)=>(wx-originX)/CHUNK_SIZE*size;
  const py=(wz:number)=>(wz-originZ)/CHUNK_SIZE*size;
  let content='';
  for(let j=0;j<3;j++)for(let i=0;i<3;i++){
    const sx=cx+i-1,sz=cz+j-1,seen=discovery.has(sx,sz);
    content+='<rect x="'+(i*size)+'" y="'+(j*size)+'" width="40" height="40" fill="'+(seen?'#174e67':'#0a2536')+'" stroke="#42647b" stroke-width=".5"/>';
    const island=seen?islandForChunk(seed,sx,sz):null;
    if(island){
      const points=[];for(let k=0;k<16;k++){const a=k*Math.PI/8,r=islandRim(island,a,.86);points.push(px(island.x+Math.cos(a)*r).toFixed(1)+','+py(island.z+Math.sin(a)*r).toFixed(1));}
      const fill={tropical:'#92b97a',rochoso:'#969b95',verde:'#57986a',arenoso:'#dfc58b'}[islandBiome(island)];
      content+='<polygon points="'+points.join(' ')+'" fill="'+fill+'" stroke="#e0cd90" stroke-width="1"/>';
    }
  }
  const rx=px(raftX),rz=py(raftZ);
  if(rx>=0&&rx<=120&&rz>=0&&rz<=120)content+='<rect x="'+(rx-2).toFixed(1)+'" y="'+(rz-2).toFixed(1)+'" width="4" height="4" fill="#d8a15c"/>';
  content+='<path d="M0 -5 3 4 0 2 -3 4Z" fill="#f2faff" stroke="#122d3b" stroke-width=".6" transform="translate('+px(x).toFixed(1)+' '+py(z).toFixed(1)+') rotate('+headingDegrees(yaw).toFixed(0)+')"/>';
  return '<svg viewBox="0 0 120 120" role="img" aria-label="Minimapa dos setores explorados">'+content+'<text x="112" y="10" fill="#fff" font-size="8" text-anchor="middle">N</text></svg><small>'+discovery.count+' setores descobertos</small>';
}
