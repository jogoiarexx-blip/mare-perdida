import {readEconomy,type EconomyRequest,type EconomyState} from './EconomyProtocol';
import {RECIPES} from '../data/recipes';
import {cellKey,moduleKey,type SerializedRaftGrid,type FoundationCell,type PlacedModule} from '../raft/Grid';
export const WORLD_LIMIT=60000;
export const COOP_FOUNDATIONS=64;
export const COOP_MODULES=128;
export type RaftMotion={v:1;type:'motion';seq:number;x:number;z:number;heading:number;elapsed:number;day:number;time:number;tick:number};
export type RaftSnapshot={v:1;type:'raft';seq:number;grid:SerializedRaftGrid};
export type AnchorRequest={v:1;type:'anchor';seq:number};
export type WorldPacket=RaftMotion|RaftSnapshot|AnchorRequest|EconomyRequest|EconomyState;
const kinds=new Set(RECIPES.filter(r=>r.placesStructure).map(r=>r.placesStructure));
const integer=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max;
const finite=(n:unknown,min:number,max:number):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function readWorld(raw:string):WorldPacket|null{
  if(raw.length>WORLD_LIMIT)return null;
  try{
    const p=JSON.parse(raw);if(!p||p.v!==1||!integer(p.seq,0,Number.MAX_SAFE_INTEGER))return null;
    if(p.type==='economyRequest'||p.type==='economyState')return readEconomy(p);
    if(p.type==='anchor')return {v:1,type:'anchor',seq:p.seq};
    if(p.type==='motion'){
      if(!finite(p.x,-1e6,1e6)||!finite(p.z,-1e6,1e6)||!finite(p.heading,-Math.PI*2,Math.PI*2)||!finite(p.elapsed,0,1e8)||!integer(p.day,1,1e6)||!finite(p.time,0,1)||!integer(p.tick,0,2e9))return null;
      return {v:1,type:'motion',seq:p.seq,x:p.x,z:p.z,heading:p.heading,elapsed:p.elapsed,day:p.day,time:p.time,tick:p.tick};
    }
    if(p.type!=='raft'||!p.grid||!Array.isArray(p.grid.foundations)||!Array.isArray(p.grid.modules)||p.grid.foundations.length>COOP_FOUNDATIONS||p.grid.modules.length>COOP_MODULES)return null;
    const foundations:FoundationCell[]=[],modules:PlacedModule[]=[];
    const cells=new Set<string>(),keys=new Set<string>(),ids=new Set<string>();
    for(const f of p.grid.foundations){
      if(!f||!integer(f.gx,-64,64)||!integer(f.gz,-64,64)||!finite(f.maxHp,1,360)||!finite(f.hp,0,f.maxHp)||typeof f.reinforced!=='boolean')return null;
      const key=cellKey(f.gx,f.gz);if(cells.has(key))return null;cells.add(key);
      foundations.push({gx:f.gx,gz:f.gz,hp:f.hp,maxHp:f.maxHp,reinforced:f.reinforced,isCore:key==='0,0',material:f.material==='metal'?'metal':'wood',finish:f.finish==='light'||f.finish==='dark'?f.finish:'natural'});
    }
    if(!cells.has('0,0'))return null;
    // Exige uma grade conectada ao núcleo.
    const visited=new Set(['0,0']),queue=[[0,0]];
    for(let i=0;i<queue.length;i++){const [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=cellKey(x+dx,z+dz);if(cells.has(k)&&!visited.has(k)){visited.add(k);queue.push([x+dx,z+dz]);}}}
    if(visited.size!==cells.size)return null;
    for(const m of p.grid.modules){
      if(!m||typeof m.id!=='string'||!/^mod_\d{1,8}$/.test(m.id)||ids.has(m.id)||!kinds.has(m.kind)||['fundacao','borda_reforcada','fundacao_metal','piso_claro','piso_escuro'].includes(m.kind)||!integer(m.gx,-64,64)||!integer(m.gz,-64,64)||!integer(m.rotation,0,3)||!cells.has(cellKey(m.gx,m.gz))||!finite(m.mass,0,200)||!finite(m.maxHp,1,360)||!finite(m.hp,0,m.maxHp)||typeof m.active!=='boolean')return null;
      const key=moduleKey(m.kind,m.gx,m.gz,m.rotation);if(keys.has(key))return null;keys.add(key);ids.add(m.id);
      modules.push({id:m.id,kind:m.kind,gx:m.gx,gz:m.gz,rotation:m.rotation,mass:m.mass,hp:m.hp,maxHp:m.maxHp,active:m.active,progress:0,readyCount:0,storedItems:m.kind==='bau'?{}:undefined,fuel:finite(m.fuel,0,600)?m.fuel:undefined});
    }
    return {v:1,type:'raft',seq:p.seq,grid:{foundations,modules,maxFoundations:COOP_FOUNDATIONS}};
  }catch{return null;}
}
