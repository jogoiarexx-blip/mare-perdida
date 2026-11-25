import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {IslandFauna,islandAnimals,animalGeometry,validAnimalDelta} from '../../src/ai/IslandFauna';
import {islandForChunk} from '../../src/world/ChunkLayout';
import {Inventory} from '../../src/player/Inventory';
import {RECIPES} from '../../src/data/recipes';
describe('CP10.1 fauna e caça',()=>{
 const spec=islandForChunk(7,0,-1)!;
 it('gera três animais determinísticos com orçamento baixo',()=>{
   expect(islandAnimals(spec)).toEqual(islandAnimals(spec));expect(islandAnimals(spec)).toHaveLength(3);
   for(const kind of ['caranguejo','javali'] as const){const g=animalGeometry(kind);expect(g.getAttribute('position').count/3).toBeLessThan(600);g.dispose();}
 });
 it('sinaliza ataque, respeita alcance e suspende fora da ilha',()=>{
   const f=new IslandFauna(),a=islandAnimals(spec)[0],p=new THREE.Vector3(a.x,a.y,a.z);
   let hits=0;f.update(.05,spec,p,true,()=>hits++);expect(f.warning(p)).toContain('ataque iminente');expect(hits).toBe(0);
   for(let i=0;i<16;i++)f.update(.05,spec,p,true,()=>hits++);
   expect(hits).toBeGreaterThan(0);
   f.update(.05,spec,new THREE.Vector3(1000,0,1000),false,()=>hits++);expect(f.activeCount).toBe(0);f.dispose();
 });
 it('abate, remove corpo depois de cinco segundos e mantém loot sem duplicação',()=>{
   const f=new IslandFauna(),a=islandAnimals(spec)[0],p=new THREE.Vector3(a.x,a.y,a.z);
   f.update(.01,spec,p,false,()=>{});expect(f.strike(p)?.hit).toBe(true);expect(f.strike(p)?.hit).toBe(false);
   f.update(.6,spec,p,false,()=>{});expect(f.strike(p)?.killed).toBe(true);expect(f.nearestLoot(p)).toBeNull();
   f.update(5,spec,p,false,()=>{});const drop=f.nearestLoot(p)!;expect(drop.count).toBe(1);
   expect(f.serialize().every(validAnimalDelta)).toBe(true);expect(f.claim(drop.id)).toBe(true);expect(f.claim(drop.id)).toBe(false);
   const save=f.serialize();f.reset(save);f.update(.05,spec,p,false,()=>{});expect(f.activeCount).toBe(2);expect(f.nearestLoot(p)).toBeNull();f.dispose();
 });
 it('carne pode ser preparada sem perder ingredientes',()=>{
   const inv=new Inventory();inv.addItem('carne_crua',1);expect(inv.craft(RECIPES.find(r=>r.id==='rec_carne_assada')!).ok).toBe(true);
   expect(inv.getItemCount('carne_assada')).toBe(1);
 });
});