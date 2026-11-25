import {describe,it,expect} from 'vitest';
import {islandForChunk} from '../../src/world/ChunkLayout';
import {prepareChunk,terrainFromPayload,payloadTransfers} from '../../src/world/ChunkPayload';
import {islandTerrain} from '../../src/world/IslandGeometry';
import {PerformanceMonitor} from '../../src/core/PerformanceMonitor';
describe('CP09.5 geração e métricas',()=>{
  it('payload mantém terreno, índices e recursos após transferência',()=>{
    const spec=islandForChunk(7,0,-1)!;const p=prepareChunk(spec,false);
    expect(payloadTransfers(p)).toHaveLength(8);expect(p.resources).toHaveLength(29);
    const g=terrainFromPayload(p.near),original=islandTerrain(spec,40);
    expect(Array.from(g.getAttribute('position').array)).toEqual(Array.from(original.getAttribute('position').array));
    expect(Array.from(g.index!.array)).toEqual(Array.from(original.index!.array));g.dispose();original.dispose();
  });
  it('mede FPS e percentil sem ocultar quadros lentos',()=>{
    const p=new PerformanceMonitor();for(let i=0;i<95;i++)p.add(.016);for(let i=0;i<5;i++)p.add(.1);
    const s=p.snapshot();expect(s.fps).toBe(50);expect(s.longFrames).toBe(5);expect(s.worstMs).toBe(100);expect(s.p95ms).toBe(16);
    p.reset();expect(p.snapshot().fps).toBe(0);
  });
});