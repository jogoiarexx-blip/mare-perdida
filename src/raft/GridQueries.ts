import { cellKey } from './Grid';

export interface GridCoordinate { gx:number; gz:number; }
export interface LocalPoint { x:number; z:number; }

/** Consulta direta ao mapa da jangada, sem visitar todas as peças de uma base grande.
 * Para mapas pequenos, a busca linear é mais barata. O desempate mantém a primeira
 * peça encontrada no mapa no caminho linear; na grade, usa ordem espacial estável.
 */
export function nearestGridEntry<T extends GridCoordinate>(
  entries: ReadonlyMap<string,T>, x:number,z:number,radius:number,
  predicate:(entry:T)=>boolean=()=>true
):T|null {
  let nearest:T|null=null;
  let best=radius*radius;
  const minX=Math.ceil(x-radius),maxX=Math.floor(x+radius);
  const minZ=Math.ceil(z-radius),maxZ=Math.floor(z+radius);
  const accept=(entry:T)=>{
    const dx=entry.gx-x,dz=entry.gz-z,dist=dx*dx+dz*dz;
    if(dist<best&&predicate(entry)){best=dist;nearest=entry;}
  };
  const area=(maxX-minX+1)*(maxZ-minZ+1);
  if(entries.size<=area){
    for(const entry of entries.values())accept(entry);
  }else{
    for(let gz=minZ;gz<=maxZ;gz++)for(let gx=minX;gx<=maxX;gx++){
      const entry=entries.get(cellKey(gx,gz));if(entry)accept(entry);
    }
  }
  return nearest;
}

/** Grade espacial de detritos, reconstruída por tick apenas quando existem várias redes.
 * Retorna candidatos em ordem de inserção invertida, igual à coleta antiga.
 */
export class FlotsamBuckets<T extends {x:number;z:number}> {
  private readonly cells=new Map<string,T[]>();
  private readonly order=new Map<T,number>();
  private readonly result:T[]=[];
  constructor(private readonly size=3){}
  rebuild(entries:readonly T[]):void{
    this.cells.clear();this.order.clear();
    for(let i=0;i<entries.length;i++){
      const f=entries[i];const key=cellKey(Math.floor(f.x/this.size),Math.floor(f.z/this.size));
      let bucket=this.cells.get(key);if(!bucket){bucket=[];this.cells.set(key,bucket);}
      bucket.push(f);this.order.set(f,i);
    }
  }
  query(x:number,z:number,r:number):readonly T[]{
    const out=this.result;out.length=0;
    for(let gz=Math.floor((z-r)/this.size);gz<=Math.floor((z+r)/this.size);gz++){
      for(let gx=Math.floor((x-r)/this.size);gx<=Math.floor((x+r)/this.size);gx++){
        const bucket=this.cells.get(cellKey(gx,gz));if(!bucket)continue;
        for(const f of bucket){
          const dx=f.x-x,dz=f.z-z;
          if(dx*dx+dz*dz<r*r)out.push(f);
        }
      }
    }
    out.sort((a,b)=>this.order.get(b)!-this.order.get(a)!);
    return out;
  }
}
