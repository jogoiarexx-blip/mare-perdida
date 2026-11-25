import {describe,it,expect} from 'vitest';
import {EventBus} from '../../src/core/EventBus';
import {QuestEngine} from '../../src/quests/QuestEngine';
import {greenPoints,anchoredNearGreenIsland} from '../../src/world/GreenCampaign';
import {islandForChunk,islandHeight} from '../../src/world/ChunkLayout';
describe('CP10.6a — primeiras missões do capítulo 2',()=>{
 it('migra save do capítulo 1 e desbloqueia M06; sequência e recompensa sem duplicar',()=>{
  const bus=new EventBus(),q=new QuestEngine(bus),save=q.serialize();
  delete save.states.M06;delete save.states.M07;
  save.states.M05={status:'COMPLETED',progress:{},rewardClaimed:true};
  q.restore(save);q.reconcileUnlockedQuests();expect(q.states.get('M06')!.status).toBe('ACTIVE');
  bus.emit('landmarkReached',{landmarkId:'green_anchor'});bus.emit('landmarkReached',{landmarkId:'green_spring'});
  expect(q.states.get('M06')!.status).toBe('COMPLETED');expect(q.states.get('M07')!.status).toBe('ACTIVE');
  bus.emit('landmarkReached',{landmarkId:'green_bento'});bus.emit('landmarkReached',{landmarkId:'green_stock'});
  expect(q.states.get('M07')!.status).toBe('COMPLETED');const xp=q.xp;
  bus.emit('landmarkReached',{landmarkId:'green_stock'});expect(q.xp).toBe(xp);q.dispose();
 });
 it('mantém pontos determinísticos em terra e exige âncora perto da ilha',()=>{
  const points=greenPoints(123),i=islandForChunk(123,0,-1)!;
  expect(points).toEqual(greenPoints(123));expect(points).toHaveLength(3);
  for(const p of points)expect(islandHeight(i,p.x,p.z)).toBeGreaterThan(0);
  expect(anchoredNearGreenIsland(123,i.x,i.z,false)).toBe(false);expect(anchoredNearGreenIsland(123,i.x+35,i.z,true)).toBe(true);expect(anchoredNearGreenIsland(123,0,0,true)).toBe(false);
 });
});