import { SIMULATION_REAL_SECONDS_PER_SIM_DAY, SIMULATION_TICK_MS } from '../config.js';

const MS_PER_DAY = 86_400_000;
const ratio = MS_PER_DAY / (SIMULATION_REAL_SECONDS_PER_SIM_DAY * 1000);

export class SimulationClock {
  constructor({ startSimTime } = {}) {
    this.startRealTime = Date.now();
    this.startSimTime = startSimTime ?? Date.UTC(2024, 0, 1, 0, 0, 0);
    this.interval = null;
    this.listeners = new Set();
  }

  get now() {
    const elapsedRealMs = Date.now() - this.startRealTime;
    const elapsedSimMs = elapsedRealMs * ratio;
    return new Date(this.startSimTime + elapsedSimMs);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      const current = this.now;
      for (const listener of this.listeners) {
        listener(current);
      }
    }, SIMULATION_TICK_MS).unref?.();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
