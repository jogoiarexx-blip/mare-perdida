import { describe, expect, it } from 'vitest';
import { SurvivalSystem } from '../../src/player/Survival';

describe('SurvivalSystem', () => {
  it('aplica taxas do GDD normal (-0.045/s fome, -0.065/s sede) e oxigênio 45s', () => {
    const s = new SurvivalSystem();
    s.update(100, { sprinting: false, underwater: false, sheltered: false });
    expect(s.hunger).toBeCloseTo(100 - 4.5, 4);
    expect(s.thirst).toBeCloseTo(100 - 6.5, 4);
    expect(s.dead).toBe(false);
  });

  it('drena oxigênio submerso e causa dano ao zerar, com respawn seguro (50 HP / 35 fome+sede)', () => {
    const s = new SurvivalSystem();
    s.update(50, { sprinting: false, underwater: true, sheltered: false });
    expect(s.oxygen).toBe(0);
    expect(s.health).toBeLessThan(100);

    s.applyDamage(200);
    expect(s.dead).toBe(true);
    s.hunger = 5;
    s.thirst = 10;
    s.respawn();
    expect(s.dead).toBe(false);
    expect(s.health).toBe(50);
    expect(s.hunger).toBe(35);
    expect(s.thirst).toBe(35);
  });
});
