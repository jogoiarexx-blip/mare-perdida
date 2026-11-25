import {describe,it,expect} from 'vitest';
import {chunkAt,chunkRadius,desiredChunks,islandForChunk,islandHeight,CHUNK_SIZE} from '../../src/world/ChunkLayout';
import {ChunkManager} from '../../src/world/ChunkManager';
import {islandTerrain,islandDecor} from '../../src/world/IslandGeometry';
import {PlayerController} from '../../src/player/Controller';
import {RaftRenderer} from '../../src/raft/RaftRenderer';
import {RaftGrid} from '../../src/raft/Grid';
import * as THREE from 'three';
describe('CP09: streaming e primeiras ilhas',()=>{
  it('gera posições estáveis e respeita limites, inclusive coordenadas negativas',()=>{
    expect(chunkAt(-.1,-128.1)).toEqual({cx:-1,cz:-2});
    expect(desiredChunks(0,0,chunkRadius(true))).toHaveLength(9);
    expect(desiredChunks(0,0,chunkRadius(false))).toHaveLength(25);
    expect(islandForChunk(7,0,0)).toBeNull();
    const first=islandForChunk(7,0,-1)!;
    expect(first).toEqual(islandForChunk(7,0,-1));
    for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){
      const i=islandForChunk(7,x,z);if(!i)continue;
      expect(i.x-i.radius).toBeGreaterThanOrEqual(x*CHUNK_SIZE);
      expect(i.z+i.radius).toBeLessThanOrEqual((z+1)*CHUNK_SIZE);
    }
  });
  it('descarrega setores antigos e respeita teto após 12 transições',()=>{
    const m=new ChunkManager(7,true);m.update(0,0,9);
    const initial=m.nearestIsland(0,0)!;
    expect(m.loadedCount).toBe(9);
    for(let i=1;i<=12;i++){
      m.update(i*128,0,9);expect(m.loadedCount).toBeLessThanOrEqual(25);
    }
    m.update(0,0,9);expect(m.nearestIsland(0,0)?.id).toBe(initial.id);
    m.reset(7);expect(m.loadedCount).toBe(0);expect(m.group.children).toHaveLength(0);m.dispose();
  });
  it('limita triângulos e reconstrói decoração deterministicamente',()=>{
    const i=islandForChunk(7,0,-1)!;
    const near=islandTerrain(i,40),far=islandTerrain(i,12);
    expect(near.index!.count/3).toBeLessThan(400);
    expect(far.index!.count).toBeLessThan(near.index!.count);
    expect(islandDecor(i,10,'palm')).toEqual(islandDecor(i,10,'palm'));
    expect(islandHeight(i,i.x,i.z)).toBeCloseTo(i.height);
    expect(islandHeight(i,i.x+i.radius+1,i.z)).toBeNull();
    near.dispose();far.dispose();
  });
  it('personagem fica sobre o solo e não acompanha a jangada em terra',()=>{
    const m=new ChunkManager(7,true),r=new RaftRenderer(),grid=new RaftGrid(),player=new PlayerController(new THREE.Scene());
    const i=islandForChunk(7,0,-1)!;player.position.set(i.x,i.height+.1,i.z);
    const input={forward:0,strafe:0,jump:false,sprint:false,yawDelta:0,pitchDelta:0};
    for(let n=0;n<8;n++)player.update(.05,input,grid,r,0,0,true,1,0,(x,z)=>m.groundHeight(x,z));
    expect(player.grounded).toBe(true);expect(player.inWater).toBe(false);
    expect(player.position.x).toBeCloseTo(i.x);expect(player.position.y).toBeCloseTo(i.height);
    expect(m.blocksRaft(i.x,i.z)).toBe(true);
    r.dispose();m.dispose();
  });
});