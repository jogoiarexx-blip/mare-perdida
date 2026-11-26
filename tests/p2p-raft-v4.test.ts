import {describe,it,expect} from 'vitest';
import {RaftGrid} from '../src/raft/Grid';
import {readWorld,COOP_FOUNDATIONS,WORLD_LIMIT} from '../src/net/RaftProtocol';
describe('P2P V4: jangada',()=>{
  it('reconstrói convés e âncora sem transmitir inventários',()=>{
    const host=new RaftGrid(COOP_FOUNDATIONS);
    expect(host.isAnchorDropped()).toBe(false);
    expect(host.addFoundation(2,1).ok).toBe(true);
    const anchor=host.placeModule('ancora',1,1,0,35).module!;
    anchor.active=true;
    const snapshot=readWorld(JSON.stringify({v:1,type:'raft',seq:1,grid:host.serialize()}));
    expect(snapshot?.type).toBe('raft');
    if(snapshot?.type!=='raft')throw Error('snapshot inválido');
    const guest=new RaftGrid();guest.restore(snapshot.grid);
    expect(guest.foundations.size).toBe(5);
    expect(guest.isAnchorDropped()).toBe(true);
    expect(guest.maxFoundations).toBe(64);
  });
  it('rejeita células duplicadas, desconectadas e módulos inválidos',()=>{
    const grid=new RaftGrid().serialize();
    const parse=(g:unknown)=>readWorld(JSON.stringify({v:1,type:'raft',seq:1,grid:g}));
    expect(parse({...grid,foundations:[...grid.foundations,grid.foundations[0]]})).toBeNull();
    expect(parse({...grid,foundations:[...grid.foundations,{...grid.foundations[0],gx:15,gz:15}]})).toBeNull();
    expect(parse({...grid,modules:[{kind:'invalid'}]})).toBeNull();
    expect(readWorld('x'.repeat(WORLD_LIMIT+1))).toBeNull();
  });
  it('valida relógio, posição e pedidos de âncora',()=>{
    const motion={v:1,type:'motion',seq:2,x:3,z:2,heading:.1,elapsed:120,time:.4,tick:2400,day:1};
    expect(readWorld(JSON.stringify(motion))).toEqual(motion);
    expect(readWorld(JSON.stringify({...motion,x:1e9}))).toBeNull();
    expect(readWorld(JSON.stringify({...motion,day:0}))).toBeNull();
    expect(readWorld(JSON.stringify({v:1,type:'anchor',seq:3}))).toEqual({v:1,type:'anchor',seq:3});
    expect(readWorld(JSON.stringify({v:1,type:'anchor',seq:-1}))).toBeNull();
  });
});
