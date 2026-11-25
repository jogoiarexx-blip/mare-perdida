import { WorldClock } from './Clock';

export interface GameLoopCallbacks {
  onFixedUpdate: (dt: number) => void;
  onRender: (alpha: number, frameDt: number) => void;
}

/**
 * Loop principal separando simulação fixa (20 Hz) de renderização (30/60+ fps).
 */
export class GameLoop {
  private rafId: number | null = null;
  private lastTimeMs = 0;
  private accumulator = 0;
  private running = false;
  paused = false;

  constructor(private readonly callbacks: GameLoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimeMs = performance.now();
    const step = (nowMs: number) => {
      if (!this.running) return;
      const rawDt = Math.min(0.1, Math.max(0, (nowMs - this.lastTimeMs) / 1000));
      this.lastTimeMs = nowMs;

      if (!this.paused) {
        this.accumulator += rawDt;
        const fixedDt = WorldClock.FIXED_DT;
        let substeps = 0;
        while (this.accumulator >= fixedDt && substeps < 5) {
          this.callbacks.onFixedUpdate(fixedDt);
          this.accumulator -= fixedDt;
          substeps += 1;
        }
      }

      const alpha = this.accumulator / WorldClock.FIXED_DT;
      this.callbacks.onRender(alpha, rawDt);
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
