/**
 * PRNG determinístico (Mulberry32) por seed para geração de detritos, ilhas e eventos.
 */
export class SeededRng {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === 'number' ? seed >>> 0 : SeededRng.hashString(seed);
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  static hashString(input: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /** Retorna número em [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Retorna inteiro em [min, max] inclusivo. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Retorna float em [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Escolhe um elemento aleatório de um array não vazio. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('SeededRng.pick recebeu lista vazia');
    }
    return items[Math.floor(this.next() * items.length)];
  }

  getState(): number {
    return this.state >>> 0;
  }

  setState(state: number): void {
    this.state = state >>> 0 || 0x9e3779b9;
  }
}
