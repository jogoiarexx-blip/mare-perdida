import { ITEMS } from '../data/items';

export type Difficulty = 'historia' | 'normal' | 'dificil';

export interface SurvivalState {
  health: number;
  hunger: number;
  thirst: number;
  stamina: number;
  oxygen: number;
  maxOxygen: number;
  difficulty: Difficulty;
  dead: boolean;
}

/**
 * Sistema de sobrevivência (0–100) fiel às taxas do GDD:
 * fome -0,045/s e sede -0,065/s no modo normal, oxigênio base 45s submerso.
 */
export class SurvivalSystem {
  static readonly BASE_HUNGER_DRAIN = 0.045;
  static readonly BASE_THIRST_DRAIN = 0.065;
  static readonly BASE_OXYGEN_MAX = 45;

  health = 100;
  hunger = 100;
  thirst = 100;
  stamina = 100;
  oxygen = SurvivalSystem.BASE_OXYGEN_MAX;
  maxOxygen = SurvivalSystem.BASE_OXYGEN_MAX;
  difficulty: Difficulty = 'normal';
  dead = false;

  private getDifficultyMultiplier(): number {
    switch (this.difficulty) {
      case 'historia':
        return 0.55;
      case 'dificil':
        return 1.3;
      default:
        return 1;
    }
  }

  update(dt: number, options: { sprinting: boolean; underwater: boolean; sheltered: boolean }): void {
    if (this.dead) return;

    const mult = this.getDifficultyMultiplier();
    const effortMult = options.sprinting ? 1.35 : 1.0;

    this.hunger = Math.max(0, this.hunger - SurvivalSystem.BASE_HUNGER_DRAIN * mult * effortMult * dt);
    this.thirst = Math.max(0, this.thirst - SurvivalSystem.BASE_THIRST_DRAIN * mult * effortMult * dt);

    if (options.sprinting) {
      this.stamina = Math.max(0, this.stamina - 16 * dt);
    } else {
      const regen = options.sheltered ? 20 : 14;
      this.stamina = Math.min(100, this.stamina + regen * dt);
    }

    if (options.underwater) {
      this.oxygen = Math.max(0, this.oxygen - dt);
      if (this.oxygen === 0) {
        this.applyDamage(6 * dt);
      }
    } else {
      this.oxygen = Math.min(this.maxOxygen, this.oxygen + 15 * dt);
    }

    if (this.hunger === 0) {
      this.applyDamage(0.9 * mult * dt);
    }
    if (this.thirst === 0) {
      this.applyDamage(1.3 * mult * dt);
    }
  }

  applyDamage(amount: number): void {
    if (this.dead || amount <= 0) return;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.dead = true;
    }
  }

  consumeItem(itemId: string): boolean {
    const def = ITEMS[itemId];
    if (!def) return false;
    let used = false;
    if (def.hungerRestore !== undefined) {
      this.hunger = Math.max(0, Math.min(100, this.hunger + def.hungerRestore));
      used = true;
    }
    if (def.thirstRestore !== undefined) {
      this.thirst = Math.max(0, Math.min(100, this.thirst + def.thirstRestore));
      used = true;
    }
    if (def.healthRestore !== undefined) {
      this.health = Math.max(0, Math.min(100, this.health + def.healthRestore));
      used = true;
    }
    return used;
  }

  rest(): void {
    this.stamina = 100;
    this.health = Math.min(100, this.health + 25);
  }

  respawn(): void {
    this.dead = false;
    this.health = 50;
    this.hunger = Math.max(this.hunger, 35);
    this.thirst = Math.max(this.thirst, 35);
    this.stamina = 100;
    this.oxygen = this.maxOxygen;
  }

  isCritical(): boolean {
    return this.health < 25 || this.hunger < 15 || this.thirst < 15 || this.oxygen < 10;
  }

  serialize(): SurvivalState {
    return {
      health: this.health,
      hunger: this.hunger,
      thirst: this.thirst,
      stamina: this.stamina,
      oxygen: this.oxygen,
      maxOxygen: this.maxOxygen,
      difficulty: this.difficulty,
      dead: this.dead,
    };
  }

  restore(data: SurvivalState): void {
    this.health = data.health;
    this.hunger = data.hunger;
    this.thirst = data.thirst;
    this.stamina = data.stamina;
    this.oxygen = data.oxygen;
    this.maxOxygen = data.maxOxygen || SurvivalSystem.BASE_OXYGEN_MAX;
    this.difficulty = data.difficulty || 'normal';
    this.dead = Boolean(data.dead);
  }
}
