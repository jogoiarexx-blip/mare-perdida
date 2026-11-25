import { describe, expect, it } from 'vitest';
import { getWaveHeight, oceanSegments } from '../../src/world/Ocean';
import { detailedAtDistance, wreckHull, wreckCabin, wreckRails } from '../../src/world/MaritimeModels';

describe('orçamento marítimo',()=>{
  it('limita a malha de água por perfil',()=>{
    expect(oceanSegments(true)**2*2).toBeLessThan(9000);
    expect(oceanSegments(false)**2*2).toBeLessThan(26000);
    expect(getWaveHeight(0,0,0)).toBeCloseTo(.22*.72);
  });
  it('usa histerese na troca de detalhe',()=>{
    expect(detailedAtDistance(29**2,false)).toBe(true);
    expect(detailedAtDistance(33**2,false)).toBe(false);
    expect(detailedAtDistance(33**2,true)).toBe(true);
    expect(detailedAtDistance(37**2,true)).toBe(false);
  });
  it('mantém o destroço abaixo de 1800 triângulos',()=>{
    const total = [wreckHull(),wreckCabin(),wreckRails()].reduce((n,g)=>{
      const count = (g.index?.count ?? g.getAttribute('position').count)/3;
      g.dispose(); return n+count;
    },0);
    expect(total).toBeLessThan(1800);
  });
});
