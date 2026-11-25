import type {RaftGrid,PlacedModule} from './Grid';
import type {StructureKind} from '../data/recipes';
export const UPPER_Y=2.61;
export const WALL_Y=2.4;
export const ARCH_KINDS=new Set<StructureKind>(['parede','porta','janela','corrimao','piso_superior','escada_interna','telhado']);
export function isArchitecture(kind:StructureKind){return ARCH_KINDS.has(kind);}
const wallKind=(m:PlacedModule)=>m.kind==='parede'||m.kind==='janela'||m.kind==='corrimao'||(m.kind==='porta'&&!m.active);
/** Quatro orientações de painel; o painel fica na borda local +Z. */
export function wallOverlap(m:PlacedModule,x:number,z:number,y:number,r=.23):boolean{
 if(!wallKind(m)||y<-.4||y>(m.kind==='corrimao'?1.15:WALL_Y))return false;
 const dx=x-m.gx,dz=z-m.gz,rot=m.rotation%4;
 const u=rot===0?dx:rot===1?-dz:rot===2?-dx:dz;
 const v=rot===0?dz:rot===1?dx:rot===2?-dz:-dx;
 return Math.abs(u)<.5+r&&Math.abs(v-.46)<.075+r;
}
export function architectureBlocks(grid:RaftGrid,x:number,z:number,y:number,fx:number,fz:number):boolean{
 const gx=Math.round(x),gz=Math.round(z);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
  const m=grid.getModuleAt(gx+dx,gz+dz);
  if(m&&wallOverlap(m,x,z,y)&&!wallOverlap(m,fx,fz,y))return true;
 }
 return false;
}
export function upperFloor(grid:RaftGrid,gx:number,gz:number):number|null{
 return grid.getModuleAt(gx,gz)?.kind==='piso_superior'?UPPER_Y:null;
}
export function adjacentUpper(grid:RaftGrid,gx:number,gz:number):PlacedModule|null{
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const m=grid.getModuleAt(gx+dx,gz+dz);if(m?.kind==='piso_superior')return m;}
 return null;
}
export function nearbyStair(grid:RaftGrid,x:number,z:number):PlacedModule|null{
 const gx=Math.round(x),gz=Math.round(z);let best:PlacedModule|null=null,dist=2.1**2;
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
  const m=grid.getModuleAt(gx+dx,gz+dz);if(m?.kind!=='escada_interna'||!adjacentUpper(grid,m.gx,m.gz))continue;
  const d=(m.gx-x)**2+(m.gz-z)**2;if(d<dist){dist=d;best=m;}
 }
 return best;
}
