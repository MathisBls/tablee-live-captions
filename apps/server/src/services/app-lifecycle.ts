import { interval, Subscription } from 'rxjs';
import type { IAppLifecycle, ILogger, ISessionService, IWarmupService } from '../interfaces';

const EXPIRY_SWEEP_INTERVAL_MS = 30_000;

/** Tâches de fond du serveur : purge des sessions expirées et préchauffage des modèles. */
export class AppLifecycle implements IAppLifecycle {
  private readonly background = new Subscription();

  constructor(
    private readonly sessions: ISessionService,
    private readonly warmup: IWarmupService,
    private readonly logger: ILogger,
    private readonly now: () => number = Date.now,
  ) {}

  start(): void {
    this.background.add(
      interval(EXPIRY_SWEEP_INTERVAL_MS).subscribe(() => {
        this.sessions.purgeExpired(this.now());
      }),
    );
    this.background.add(
      this.warmup.warmUp().subscribe((report) => {
        if (report.succeeded) {
          this.logger.info(report, 'Model warmed up');
        } else {
          this.logger.warn(report, 'Model warm-up failed, the first request will be slow');
        }
      }),
    );
  }

  shutdown(): void {
    this.background.unsubscribe();
    this.sessions.endAll();
  }
}
