import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { AppStore } from '../../core/store';
import { CorrectionBody, LoteItem } from '../../core/models';
import { fmtNum } from '../../core/format';
import { MapCanvas, MapColorMode } from '../map-canvas/map-canvas';
import { ManzanaList } from '../manzana-list/manzana-list';
import { StatsBar } from '../stats-bar/stats-bar';
import { LotDetail } from '../lot-detail/lot-detail';
import { ReviewPanel } from '../review-panel/review-panel';

@Component({
  selector: 'app-dashboard',
  imports: [MapCanvas, ManzanaList, StatsBar, LotDetail, ReviewPanel],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  readonly store = inject(AppStore);

  readonly colorMode = signal<MapColorMode>('review');
  readonly showLabels = signal(false);
  readonly rotation = signal(270);
  readonly rotations = [0, 90, 180, 270];
  readonly reviewOpen = signal(false);
  readonly reviewStatus = signal('');
  readonly reviewPriority = signal('');

  readonly features = computed(() => this.store.geojson()?.features ?? []);
  readonly lotes = computed<LoteItem[]>(() => this.store.manzanaDetail()?.lotes ?? []);

  readonly fmtNum = fmtNum;

  constructor() {
    void this.store.bootstrap();

    effect(() => {
      const manzana = this.store.selectedManzana();
      this.showLabels.set(manzana !== null);
    });
  }

  setColorMode(mode: MapColorMode): void {
    this.colorMode.set(mode);
  }

  setRotation(event: Event): void {
    this.rotation.set(Number((event.target as HTMLSelectElement).value));
  }

  toggleReview(): void {
    const open = !this.reviewOpen();
    this.reviewOpen.set(open);
    if (open) void this.store.loadReviewCases();
  }

  closeReview(): void {
    this.reviewOpen.set(false);
    this.store.activeReviewCase.set(null);
  }

  onReviewFilter(filter: { status?: string; priority?: string }): void {
    this.reviewStatus.set(filter.status ?? '');
    this.reviewPriority.set(filter.priority ?? '');
    void this.store.loadReviewCases({
      status: this.reviewStatus(),
      priority: this.reviewPriority(),
    });
  }

  onCorrect(body: CorrectionBody): void {
    const id = this.store.selectedLoteId();
    if (id) void this.store.correctLote(id, body);
  }

  lotColor(item: LoteItem): string {
    if (item.review_required) return 'var(--bad)';
    return 'var(--good)';
  }
}
