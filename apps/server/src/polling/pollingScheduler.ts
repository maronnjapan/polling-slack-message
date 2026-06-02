import type { AppConfig } from "../config/appConfig.js";
import type { PollingService } from "./pollingService.js";
import type { PollingRepository } from "../storage/repositories/pollingRepository.js";
export class PollingScheduler {
  private running = false;
  private timer?: NodeJS.Timeout;
  private inFlight = false;
  constructor(
    private config: AppConfig,
    private service: PollingService,
    private repo: PollingRepository,
  ) {}
  start() {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => void this.runOnce(), this.config.polling.intervalMs);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.running = false;
  }
  async runOnce() {
    if (this.inFlight) return;
    this.inFlight = true;
    try {
      await this.service.pollingTick();
    } catch (e) {
      this.repo.setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      this.inFlight = false;
    }
  }
  status() {
    return {
      running: this.running,
      intervalMs: this.config.polling.intervalMs,
      lastPolledAt: this.repo.lastPolledAt(),
      lastError: this.repo.lastError(),
    };
  }
}
