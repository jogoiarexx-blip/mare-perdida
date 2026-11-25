import {describe,it,expect} from 'vitest';
import {plankDeck,reinforcedDeckFrame,weatheredWoodTexture} from '../src/render/DetailGeometry';
import {chestHardware,anchorWinch,purifierBands,collectionNet,roofGeometry} from '../src/render/EquipmentGeometry';

describe('Jangada V6',()=>{
  it('preserva o tamanho e o topo do convés e varia os tons da madeira',()=>{
    const g=plankDeck();g.computeBoundingBox();
    expect(g.boundingBox!.max.y).toBeCloseTo(.11,5);
    expect(g.boundingBox!.max.x).toBeCloseTo(.48,5);
    expect(g.boundingBox!.min.z).toBeCloseTo(-.48,5);
    const colors=g.getAttribute('color'),p=g.getAttribute('position');
    expect(colors.count).toBe(p.count);
    expect(new Set(colors.array).size).toBeGreaterThan(3);
    expect(p.count/3).toBe(84);
    g.dispose();
  });
  it('usa textura determinística e pequena',()=>{
    const a=weatheredWoodTexture(),b=weatheredWoodTexture();
    expect(a.image.width).toBe(64);
    expect(a.image.height).toBe(64);
    const ad=a.image.data,bd=b.image.data;
    expect(ad).not.toBeNull();expect(bd).not.toBeNull();
    expect(ad!.length).toBe(16384);
    expect(Array.from(ad!)).toEqual(Array.from(bd!));
    expect(new Set(ad!).size).toBeGreaterThan(10);
    a.dispose();b.dispose();
  });
  it('mantém moldura acima do convés e acessórios em geometrias únicas',()=>{
    const frame=reinforcedDeckFrame();frame.computeBoundingBox();
    expect(frame.boundingBox!.max.y).toBeGreaterThan(.19);
    for(const g of [frame,chestHardware(),anchorWinch(),purifierBands(),collectionNet(),roofGeometry()]){
      expect(g.getAttribute('position').count).toBeGreaterThan(0);
      expect(g.getAttribute('normal').count).toBe(g.getAttribute('position').count);
      expect(Array.from(g.getAttribute('position').array).every(Number.isFinite)).toBe(true);
      g.dispose();
    }
  });
});
