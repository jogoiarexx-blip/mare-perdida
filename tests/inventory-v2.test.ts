import {describe,it,expect} from 'vitest';
import {Inventory} from '../src/player/Inventory';
import {ITEMS} from '../src/data/items';
describe('Mochila V2',()=>{
  it('junta pilhas até o limite e mantém excedente',()=>{
    const inv=new Inventory();
    const max=ITEMS.madeira.stackMax;
    inv.slots[8]={itemId:'madeira',count:5};
    inv.slots[9]={itemId:'madeira',count:max-2};
    expect(inv.moveSlot(8,9)).toBe(true);
    expect(inv.slots[9]?.count).toBe(max);
    expect(inv.slots[8]?.count).toBe(3);
    expect(inv.getItemCount('madeira')).toBe(max+3);
  });
  it('organiza somente reserva e preserva ferramentas e quantidades',()=>{
    const inv=new Inventory();
    inv.slots[0]={itemId:'gancho',count:1,durability:7};
    inv.slots[10]={itemId:'madeira',count:3};
    inv.slots[12]={itemId:'madeira',count:4};
    inv.slots[15]={itemId:'machado',count:1,durability:4};
    inv.selectedHotbar=3;
    const hotbar=inv.slots.slice(0,8).map(s=>s?{...s}:null);
    inv.organizeBackpack();
    expect(inv.slots.slice(0,8)).toEqual(hotbar);
    expect(inv.selectedHotbar).toBe(3);
    expect(inv.slots[8]?.itemId).toBe('machado');
    expect(inv.slots[8]?.durability).toBe(4);
    expect(inv.getItemCount('madeira')).toBe(7);
    expect(inv.slots.filter(s=>s?.itemId==='madeira')).toHaveLength(1);
  });
  it('consome exatamente o slot selecionado e divide sem ocupar atalhos livres',()=>{
    const inv=new Inventory();
    inv.slots[0]={itemId:'agua_pura',count:2};
    inv.slots[9]={itemId:'agua_pura',count:2};
    expect(inv.consumeSlot(0)).toBe(true);
    expect(inv.slots[0]?.count).toBe(1);
    expect(inv.slots[9]?.count).toBe(2);
    expect(inv.splitSlot(9)).toBe(true);
    expect(inv.slots[8]?.count).toBe(1);
    expect(inv.slots[1]).toBeNull();
  });
});