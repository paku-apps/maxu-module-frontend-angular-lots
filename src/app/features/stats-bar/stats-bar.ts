import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Stats } from '../../core/models';
import { fmtInt } from '../../core/format';

@Component({
  selector: 'app-stats-bar',
  templateUrl: './stats-bar.html',
  styleUrl: './stats-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsBar {
  readonly stats = input<Stats | null>(null);
  readonly openReview = output<void>();
  readonly openAudit = output<void>();
  readonly filterRecuperados = output<void>();

  readonly fmtInt = fmtInt;

  readonly numStatus = computed(() => {
    const p = this.stats()?.por_numero_status ?? {};
    return [
      { key: 'observed', label: 'Observado', value: p['observed'] ?? 0, color: 'var(--good)' },
      { key: 'deduccion', label: 'Deducción', value: p['deduccion'] ?? 0, color: 'var(--warn)' },
      { key: 'recuperado', label: 'Recuperado', value: p['recuperado'] ?? 0, color: 'var(--accent-2)' },
    ];
  });

  ratio(value: number | undefined): number {
    const total = this.stats()?.lotes ?? 0;
    if (!total || value === undefined) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }
}
