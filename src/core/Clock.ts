/**
 * Relógio lógico do mundo: tick fixo (20 Hz padrão) e ciclo dia/noite de 24 minutos reais.
 */
export class WorldClock {
  static readonly DAY_DURATION_SECONDS = 24 * 60; // 1440s (16 min dia + 8 min noite)
  static readonly FIXED_DT = 1 / 20; // 20 Hz

  tick = 0;
  elapsedSeconds = 0;
  /** Hora normalizada no dia [0, 1): 0.25 = amanhecer, 0.5 = meio-dia, 0.75 = pôr do sol. */
  timeOfDay = 0.35;
  dayCount = 1;

  advance(dtSeconds: number): void {
    this.tick += 1;
    this.elapsedSeconds += dtSeconds;
    const prev = this.timeOfDay;
    this.timeOfDay = (this.timeOfDay + dtSeconds / WorldClock.DAY_DURATION_SECONDS) % 1;
    if (this.timeOfDay < prev) {
      this.dayCount += 1;
    }
  }

  /** Retorna true durante os 16 minutos de claridade (0.18 a 0.85 do ciclo). */
  isDaytime(): boolean {
    return this.timeOfDay >= 0.18 && this.timeOfDay <= 0.85;
  }

  /** Formata hora virtual em HH:MM. */
  getFormattedTime(): string {
    const totalMinutes = Math.floor(this.timeOfDay * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  serialize(): { tick: number; elapsedSeconds: number; timeOfDay: number; dayCount: number } {
    return {
      tick: this.tick,
      elapsedSeconds: this.elapsedSeconds,
      timeOfDay: this.timeOfDay,
      dayCount: this.dayCount,
    };
  }

  restore(data: { tick: number; elapsedSeconds: number; timeOfDay: number; dayCount: number }): void {
    this.tick = data.tick;
    this.elapsedSeconds = data.elapsedSeconds;
    this.timeOfDay = data.timeOfDay;
    this.dayCount = data.dayCount;
  }
}
