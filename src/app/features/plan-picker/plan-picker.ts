import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Plano } from '../../core/models';
import { fmtInt } from '../../core/format';

@Component({
  selector: 'app-plan-picker',
  templateUrl: './plan-picker.html',
  styleUrl: './plan-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanPicker {
  readonly planos = input<Plano[]>([]);
  readonly loading = input(false);
  readonly current = input<Plano | null>(null);

  readonly select = output<Plano>();
  readonly close = output<void>();

  readonly fmtInt = fmtInt;
}
