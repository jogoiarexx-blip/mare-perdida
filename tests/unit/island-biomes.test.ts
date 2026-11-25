import {describe,it,expect} from 'vitest';
import {islandForChunk,islandBiome,islandRim,islandHeight,CHUNK_SIZE} from '../../src/world/ChunkLayout';
import {islandTerrain,palmCrown,ruinGeometry,vegetationLod} from '../../src/world/IslandGeometry';
import {resourcesForIsland} from '../../src/world/IslandResources';
describe('CP09.4 biomas e LOD',()=>{
  it('mantém centros e recursos dentro dos limites e produz quatro biomas',()=>{
    const seen=new Set<string>();
    for(let x=-6;x<=6;x++)for(let z=-6;z<=6;z++){
      const i=islandForChunk(27,x,z);if(!i)continue;seen.add(islandBiome(i));
      for(let a=0;a<6.3;a+=.2){
        const r=islandRim(i,a,1);expect(r).toBeLessThanOrEqual(i.radius+1e-8);
        expect(islandHeight(i,i.x+Math.cos(a)*(r+.01),i.z+Math.sin(a)*(r+.01))).toBeNull();
        expect(i.x+r).toBeLessThanOrEqual((x+1)*CHUNK_SIZE);
      }
      const n=resourcesForIsland(i);expect(n).toHaveLength(29);expect(n.every(v=>Number.isFinite(v.y))).toBe(true);
    }
    expect(seen.size).toBe(4);
  });
  it('terreno e vegetação permanecem leves',()=>{
    const i=islandForChunk(27,0,-1)!,g=islandTerrain(i,40),near=palmCrown(),mid=palmCrown(3),ruin=ruinGeometry();
    expect(g.index!.count/3).toBeLessThan(400);
    expect(mid.getAttribute('position').count/3).toBeLessThanOrEqual(12);
    expect(near.getAttribute('position').count/3).toBeLessThanOrEqual(96);
    expect(mid.getAttribute('position').count).toBeLessThan(near.getAttribute('position').count);
    expect(ruin.getAttribute('position').count/3).toBeLessThan(160);
    g.dispose();near.dispose();mid.dispose();ruin.dispose();
  });
  it('histerese impede troca repetitiva de vegetação',()=>{
    expect(vegetationLod(35,0)).toBe(0);expect(vegetationLod(35,1)).toBe(1);
    expect(vegetationLod(77,1)).toBe(1);expect(vegetationLod(77,2)).toBe(2);
  });
});