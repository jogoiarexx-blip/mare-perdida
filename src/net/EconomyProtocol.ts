import {ITEMS} from '../data/items';
import {RECIPES} from '../data/recipes';
import type {SerializedInventory,InventorySlot} from '../player/Inventory';
import type {FlotsamKind} from '../world/SectorManager';
export type FloatView={id:string;kind:FlotsamKind;x:number;z:number;rotY:number};
export type EconomyAction=
  |{action:'collect';id:string}
  |{action:'build';recipe:string;gx:number;gz:number;rotation:number}
  |{action:'craft';recipe:string}
  |{action:'move';from:number;to:number}
  |{action:'split';index:number}
  |{action:'sort'};
export type EconomyRequest={v:1;type:'economyRequest';seq:number;revision:number;command:EconomyAction};
export type EconomyState={v:1;type:'economyState';seq:number;inventory:SerializedInventory;floats:FloatView[];ack:number;ok:boolean};
const int=(x:unknown,min:number,max:number):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=min&&x<=max;
const num=(x:unknown,min:number,max:number):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const floatId=(x:unknown):x is string=>typeof x==='string'&&/^flt_\d{1,10}$/.test(x);
const kinds=new Set(['madeira','plastico','folha','caixote','barril']);
export function readEconomy(p:any):EconomyRequest|EconomyState|null{
  if(!p||p.v!==1||!int(p.seq,0,Number.MAX_SAFE_INTEGER))return null;
  if(p.type==='economyRequest'){
    const c=p.command;if(!c||!int(p.revision,1,Number.MAX_SAFE_INTEGER))return null;
    let command:EconomyAction;
    switch(c.action){
      case 'collect':if(!floatId(c.id))return null;command={action:'collect',id:c.id};break;
      case 'craft':if(typeof c.recipe!=='string'||!RECIPES.some(r=>r.id===c.recipe&&r.bench==='manual'&&r.outputItemId&&!r.placesStructure))return null;command={action:'craft',recipe:c.recipe};break;
      case 'build':if(typeof c.recipe!=='string'||!RECIPES.some(r=>r.id===c.recipe&&r.placesStructure)||!int(c.gx,-64,64)||!int(c.gz,-64,64)||!int(c.rotation,0,3))return null;command={action:'build',recipe:c.recipe,gx:c.gx,gz:c.gz,rotation:c.rotation};break;
      case 'move':if(!int(c.from,0,19)||!int(c.to,0,19)||c.from===c.to)return null;command={action:'move',from:c.from,to:c.to};break;
      case 'split':if(!int(c.index,0,19))return null;command={action:'split',index:c.index};break;
      case 'sort':command={action:'sort'};break;
      default:return null;
    }
    return {v:1,type:'economyRequest',seq:p.seq,revision:p.revision,command};
  }
  if(p.type!=='economyState'||!int(p.ack,-1,Number.MAX_SAFE_INTEGER)||typeof p.ok!=='boolean')return null;
  const inv=p.inventory;
  if(!inv||inv.capacity!==20||!Array.isArray(inv.slots)||inv.slots.length!==20||!int(inv.revision,1,Number.MAX_SAFE_INTEGER)||!int(inv.selectedHotbar,0,7)||!Array.isArray(p.floats)||p.floats.length>34)return null;
  const slots:(InventorySlot|null)[]=[];
  for(const s of inv.slots){
    if(s===null){slots.push(null);continue;}
    if(!s||typeof s.itemId!=='string'||!Object.prototype.hasOwnProperty.call(ITEMS,s.itemId))return null;
    const def=ITEMS[s.itemId];if(!int(s.count,1,def.stackMax))return null;
    if(def.maxDurability!==undefined&&!num(s.durability,1,def.maxDurability))return null;
    slots.push({itemId:s.itemId,count:s.count,...(def.maxDurability!==undefined?{durability:s.durability}:{})});
  }
  const floats:FloatView[]=[],ids=new Set<string>();
  for(const f of p.floats){
    if(!f||!floatId(f.id)||ids.has(f.id)||!kinds.has(f.kind)||!num(f.x,-1e6,1e6)||!num(f.z,-1e6,1e6)||!num(f.rotY,-Math.PI*2,Math.PI*2))return null;
    ids.add(f.id);floats.push({id:f.id,kind:f.kind,x:f.x,z:f.z,rotY:f.rotY});
  }
  return {v:1,type:'economyState',seq:p.seq,inventory:{capacity:20,slots,revision:inv.revision,selectedHotbar:inv.selectedHotbar},floats,ack:p.ack,ok:p.ok};
}
