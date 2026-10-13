import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { ReviewCase, ReviewCaseDetail } from '../../core/models';
import { fmtInt, priorityColor } from '../../core/format';

@Component({
  selector: 'app-review-panel',
  templateUrl: './review-panel.html',
  styleUrl: './review-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPanel {
  readonly cases = input<ReviewCase[]>([]);
  readonly total = input(0);
  readonly activeCase = input<ReviewCaseDetail | null>(null);
  readonly loading = input(false);
  readonly statusFilter = input<string>('');
  readonly priorityFilter = input<string>('');

  readonly close = output<void>();
  readonly filterChange = output<{ status?: string; priority?: string }>();
  readonly openCase = output<string>();
  readonly save = output<{ id: string; status: string; observations: string }>();
  readonly back = output<void>();

  readonly status = linkedSignal(() => this.activeCase()?.status ?? 'pending');
  readonly observations = linkedSignal(() => (this.activeCase()?.observations ?? '') as string);

  readonly fmtInt = fmtInt;
  readonly priorityColor = priorityColor;

  readonly statuses = ['pending', 'in_progress', 'resolved'];
  readonly priorities = ['high', 'medium', 'low'];

  toggleStatus(value: string): void {
    const next = this.statusFilter() === value ? '' : value;
    this.filterChange.emit({ status: next, priority: this.priorityFilter() });
  }

  togglePriority(value: string): void {
    const next = this.priorityFilter() === value ? '' : value;
    this.filterChange.emit({ status: this.statusFilter(), priority: next });
  }

  onStatusInput(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
  }

  onObsInput(event: Event): void {
    this.observations.set((event.target as HTMLTextAreaElement).value);
  }

  submit(): void {
    const c = this.activeCase();
    if (!c) return;
    this.save.emit({ id: c.review_id, status: this.status(), observations: this.observations() });
  }
}
