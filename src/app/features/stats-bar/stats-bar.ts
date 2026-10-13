import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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

  readonly fmtInt = fmtInt;

  ratio(value: number | undefined): number {
    const total = this.stats()?.lotes ?? 0;
    if (!total || value === undefined) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  }
}
