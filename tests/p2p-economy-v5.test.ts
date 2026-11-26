import {describe,it,expect} from 'vitest';
import {Inventory} from '../src/player/Inventory';
import {RaftGrid} from '../src/raft/Grid';
import {SectorManager} from '../src/world/SectorManager';
import {buildShared,collectShared,craftShared} from '../src/net/EconomyAuthority';
import {readEconomy} from '../src/net/EconomyProtocol';

describe('P2P V5 economia',()=>{
  it('não permite dois jogadores coletarem o mesmo detrito',()=>{
    const sector=new SectorManager(2089);sector.seedInitialFlotsam(0,0);
    const f=sector.flotsam[0],a=new Inventory(),b=new Inventory();
    expect(collectShared(sector,a,f.id,f.x,f.z)).toBe(true);
    expect(collectShared(sector,b,f.id,f.x,f.z)).toBe(false);
    expect(b.slots.every(s=>s===null)).toBe(true);
    sector.dispose();
  });
  it('preserva o detrito quando a mochila está cheia',()=>{
    const sector=new SectorManager(2089);sector.seedInitialFlotsam(0,0);
    const f=sector.flotsam[0],inv=new Inventory();
    inv.addItem('madeira',400);
    expect(collectShared(sector,inv,f.id,f.x+20,f.z)).toBe(false);
    // Preenche com item diferente para impedir qualquer pilha de loot.
    inv.slots=Array.from({length:20},()=>({itemId:'corda',count:20}));
    expect(collectShared(sector,inv,f.id,f.x,f.z)).toBe(false);
    expect(sector.flotsam.some(x=>x.id===f.id)).toBe(true);
    sector.dispose();
  });
  it('constrói âncora apenas com materiais e não cobra duas vezes por uma célula ocupada',()=>{
    const grid=new RaftGrid(64),inv=new Inventory();
    const c={action:'build',recipe:'build_ancora',gx:1,gz:1,rotation:0} as const;
    expect(buildShared(grid,inv,c,1,1)).toBe(false);
    inv.addItem('sucata',4);inv.addItem('corda',2);
    expect(buildShared(grid,inv,c,1,1)).toBe(true);
    expect(grid.isAnchorDropped()).toBe(false);
    expect(buildShared(grid,inv,c,1,1)).toBe(false);
    expect(inv.getItemCount('sucata')).toBe(2);
    expect(inv.getItemCount('corda')).toBe(1);
  });
  it('fabrica corda sem criar materiais e valida snapshots',()=>{
    const inv=new Inventory();inv.addItem('fibra',2);
    expect(craftShared(inv,'rec_corda')).toBe(true);
    expect(craftShared(inv,'rec_corda')).toBe(false);
    expect(inv.getItemCount('corda')).toBe(1);
    const p={v:1,type:'economyState',seq:1,inventory:inv.serialize(),floats:[],ack:1,ok:true};
    expect(readEconomy(p)?.type).toBe('economyState');
    expect(readEconomy({...p,inventory:{...p.inventory,capacity:200}})).toBeNull();
    expect(readEconomy({v:1,type:'economyRequest',seq:1,revision:1,command:{action:'move',from:-1,to:2}})).toBeNull();
  });
});