import { describe,expect,it } from 'vitest';
import { islandTerrain,palmCrown,coastalRock,vegetationLod } from '../src/world/IslandGeometry';
import { islandForChunk,ISLAND_RINGS,ringHeight,islandRim } from '../src/world/ChunkLayout';

describe('Arte de ilhas V5',()=>{
  const spec=islandForChunk(2089,0,-1)!;
  it('mantém o terreno e a colisão de anéis, com cores determinísticas',()=>{
    const a=islandTerrain(spec,40),b=islandTerrain(spec,40);
    const p=a.getAttribute('position'),c=a.getAttribute('color');
    expect(p.count).toBe(1+(ISLAND_RINGS.length-1)*40);
    expect(Array.from(c.array)).toEqual(Array.from(b.getAttribute('color').array));
    for(let ring=1;ring<ISLAND_RINGS.length;ring++){
      const i=1+(ring-1)*40;
      expect(p.getX(i)).toBeCloseTo(islandRim(spec,0,ISLAND_RINGS[ring]),4);
      expect(p.getY(i)).toBeCloseTo(ringHeight(spec,ring),4);
    }
    expect(c.getX(1)).not.toBe(c.getX(2));
    a.dispose();b.dispose();
  });
  it('mantém a copa distante econômica e limita o detalhe próximo',()=>{
    const far=palmCrown(3),near=palmCrown();
    expect(far.getAttribute('position').count/3).toBe(12);
    expect(near.getAttribute('position').count/3).toBe(96);
    expect(near.getAttribute('normal').count).toBe(near.getAttribute('position').count);
    expect(vegetationLod(90,0)).toBe(2);
    far.dispose();near.dispose();
  });
  it('gera rochas finitas sem geometria excessiva',()=>{
    const g=coastalRock();
    expect(g.getAttribute('position').count).toBeLessThan(200);
    expect(Array.from(g.getAttribute('position').array).every(Number.isFinite)).toBe(true);
    g.dispose();
  });
});
