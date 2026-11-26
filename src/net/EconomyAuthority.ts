import {RECIPES} from '../data/recipes';
import {evaluateBuild} from '../raft/BuildTarget';
import {COOP_MODULES} from './RaftProtocol';
import type {Inventory} from '../player/Inventory';
import type {RaftGrid} from '../raft/Grid';
import type {SectorManager} from '../world/SectorManager';
import type {EconomyAction} from './EconomyProtocol';

export function collectShared(sector:SectorManager,inv:Inventory,id:string,x:number,z:number):boolean{
  const f=sector.flotsam.find(f=>f.id===id);
  if(!f||Math.hypot(f.x-x,f.z-z)>3.2)return false;
  const trial=inv.clone();
  for(const l of f.loot)if(l.count>0&&trial.addItem(l.itemId,l.count).overflow)return false;
  if(!sector.removeFlotsam(id))return false;
  for(const l of f.loot)if(l.count>0)inv.addItem(l.itemId,l.count);
  return true;
}
export function buildShared(grid:RaftGrid,inv:Inventory,c:Extract<EconomyAction,{action:'build'}>,localX:number,localZ:number):boolean{
  const recipe=RECIPES.find(r=>r.id===c.recipe),kind=recipe?.placesStructure;
  if(!recipe||!kind||Math.abs(c.gx)>64||Math.abs(c.gz)>64||Math.hypot(c.gx-localX,c.gz-localZ)>5.8)return false;
  if(!evaluateBuild(grid,kind,c.gx,c.gz,inv.hasItems(recipe.ingredients),c.rotation).valid)return false;
  let placed=false;
  if(kind==='fundacao')placed=grid.addFoundation(c.gx,c.gz).ok;
  else if(kind==='borda_reforcada')placed=grid.reinforceFoundation(c.gx,c.gz).ok;
  else if(kind==='fundacao_metal')placed=grid.upgradeMetal(c.gx,c.gz).ok;
  else if(kind==='piso_claro'||kind==='piso_escuro')placed=grid.setFinish(c.gx,c.gz,kind==='piso_claro'?'light':'dark').ok;
  else if(grid.modules.size<COOP_MODULES)placed=grid.placeModule(kind,c.gx,c.gz,c.rotation,recipe.structureMass??20).ok;
  return placed&&inv.consumeItems(recipe.ingredients);
}
export function craftShared(inv:Inventory,id:string):boolean{
  const recipe=RECIPES.find(r=>r.id===id&&r.bench==='manual'&&r.outputItemId&&!r.placesStructure);
  return !!recipe&&inv.craft(recipe).ok;
}
