import { islandDecor } from './IslandGeometry';
import type { IslandSpec } from './ChunkLayout';

export type ResourceKind='palm'|'rock'|'bush'|'chest';
export interface IslandResource {
  id:string; kind:ResourceKind; x:number;y:number;z:number;scale:number;angle:number;
  radius:number; label:string;loot:{itemId:string;count:number}[];
}
const definitions:Record<ResourceKind,{count:number;radius:number;label:string;loot:{itemId:string;count:number}[]}>={
  palm:{count:13,radius:.25,label:'Cortar coqueiro (machado)',loot:[{itemId:'madeira',count:5},{itemId:'folha',count:2},{itemId:'fibra',count:2}]},
  rock:{count:10,radius:.55,label:'Recolher pedras',loot:[{itemId:'pedra',count:3}]},
  bush:{count:5,radius:.25,label:'Colher frutos e fibras',loot:[{itemId:'fruta_colhida',count:2},{itemId:'fibra',count:2},{itemId:'semente_salina',count:1}]},
  chest:{count:1,radius:.45,label:'Vasculhar caixote abandonado',loot:[{itemId:'sucata',count:3},{itemId:'plastico',count:2},{itemId:'corda',count:1}]}
};
/** IDs não dependem de qualidade ou ordem de streaming. */
export function resourcesForIsland(spec:IslandSpec):IslandResource[]{
  const out:IslandResource[]=[];
  for(const kind of ['palm','rock','bush','chest'] as const){
    const def=definitions[kind];
    // Streams separados para não deslocar a vegetação existente ao adicionar recursos.
    const decor=islandDecor(kind==='bush'||kind==='chest'?{...spec,seed:spec.seed+(kind==='bush'?193:379)}:spec,def.count,kind==='palm'?'palm':'rock');
    for(let i=0;i<decor.length;i++){
      const d=decor[i];
      out.push({...d,id:spec.id+':'+kind+':'+i,kind,x:spec.x+d.x,z:spec.z+d.z,radius:def.radius*d.scale,label:def.label,loot:def.loot.map(l=>({...l}))});
    }
  }
  return out;
}
export function validResourceId(id:unknown):id is string{
  return typeof id==='string'&&/^island:-?\d{1,9}:-?\d{1,9}:(palm|rock|bush|chest):\d{1,2}$/.test(id);
}
export function blocksResourceMovement(nodes:readonly IslandResource[],depleted:ReadonlySet<string>,x:number,z:number,y:number,fromX:number,fromZ:number):boolean{
  for(const n of nodes){
    if(depleted.has(n.id)||n.kind==='bush'||Math.abs(y-n.y)>2.1)continue;
    const d=(x-n.x)**2+(z-n.z)**2;
    const previous=(fromX-n.x)**2+(fromZ-n.z)**2;
    const radius=n.radius+.28;
    // Permite sair caso um save antigo coloque o personagem dentro de uma árvore.
    if(d<radius*radius&&d<previous-1e-8)return true;
  }
  return false;
}
