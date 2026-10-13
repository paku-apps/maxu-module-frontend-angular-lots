import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Manzana } from '../../core/models';
import { confidenceColor, fmtInt, fmtPct } from '../../core/format';

@Component({
  selector: 'app-manzana-list',
  templateUrl: './manzana-list.html',
  styleUrl: './manzana-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManzanaList {
  readonly manzanas = input<Manzana[]>([]);
  readonly selected = input<string | null>(null);
  readonly loading = input(false);

  readonly select = output<string | null>();

  readonly query = signal('');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list = this.manzanas();
    if (!q) return list;
    return list.filter((m) => m.codigo.toLowerCase().includes(q));
  });

  readonly confidenceColor = confidenceColor;
  readonly fmtInt = fmtInt;
  readonly fmtPct = fmtPct;

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
