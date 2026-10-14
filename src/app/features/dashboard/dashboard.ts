import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { AppStore } from '../../core/store';
import { CorrectionBody, LoteItem, LotesQuery } from '../../core/models';
import { fmtNum } from '../../core/format';
import { MapCanvas, MapColorMode } from '../map-canvas/map-canvas';
import { ManzanaList } from '../manzana-list/manzana-list';
import { StatsBar } from '../stats-bar/stats-bar';
import { LotDetail } from '../lot-detail/lot-detail';
import { ReviewPanel } from '../review-panel/review-panel';
import { AuditPanel } from '../audit-panel/audit-panel';

@Component({
  selector: 'app-dashboard',
  imports: [MapCanvas, ManzanaList, StatsBar, LotDetail, ReviewPanel, AuditPanel],
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
  readonly auditOpen = signal(false);
  readonly reviewStatus = signal('');
  readonly reviewPriority = signal('');

  // Filtros de lotes
  readonly filterNumeroStatus = signal('');
  readonly filterRecuperado = signal(false);
  readonly filterReview = signal<boolean | null>(null);
  readonly filterConArea = signal<boolean | null>(null);

  readonly features = computed(() => this.store.geojson()?.features ?? []);
  readonly lotes = computed<LoteItem[]>(() => this.store.manzanaDetail()?.lotes ?? []);
  readonly displayLotes = computed<LoteItem[]>(() =>
    this.store.filtersActive() ? this.store.filteredLotes() : this.lotes(),
  );

  readonly fmtNum = fmtNum;
  readonly numeroStatuses = ['observed', 'deduccion', 'recuperado'];

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

  // ---- Revisión -----------------------------------------------------------
  toggleReview(): void {
    const open = !this.reviewOpen();
    this.reviewOpen.set(open);
    if (open) {
      this.auditOpen.set(false);
      void this.store.loadReviewCases();
    }
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

  // ---- Auditoría ----------------------------------------------------------
  toggleAudit(): void {
    const open = !this.auditOpen();
    this.auditOpen.set(open);
    if (open) {
      this.reviewOpen.set(false);
      void this.store.loadAudit();
    }
  }

  closeAudit(): void {
    this.auditOpen.set(false);
  }

  goToManzana(codigo: string): void {
    this.auditOpen.set(false);
    void this.store.selectManzana(codigo);
  }

  // ---- Filtros de lotes ---------------------------------------------------
  toggleNumeroStatus(status: string): void {
    this.filterNumeroStatus.update((v) => (v === status ? '' : status));
    this.applyFilters();
  }

  toggleRecuperado(): void {
    this.filterRecuperado.update((v) => !v);
    this.applyFilters();
  }

  toggleReviewFilter(): void {
    this.filterReview.update((v) => (v === null ? true : v === true ? false : null));
    this.applyFilters();
  }

  toggleConArea(): void {
    this.filterConArea.update((v) => (v === null ? true : v === true ? false : null));
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterNumeroStatus.set('');
    this.filterRecuperado.set(false);
    this.filterReview.set(null);
    this.filterConArea.set(null);
    this.store.clearLotesFilters();
  }

  private applyFilters(): void {
    const query: LotesQuery = {};
    if (this.filterNumeroStatus()) query.numero_status = this.filterNumeroStatus();
    if (this.filterRecuperado()) query.recuperado = true;
    if (this.filterReview() !== null) query.review_required = this.filterReview() as boolean;
    if (this.filterConArea() !== null) query.con_area = this.filterConArea() as boolean;

    if (!query.numero_status && !query.recuperado && query.review_required === undefined && query.con_area === undefined) {
      this.store.clearLotesFilters();
      return;
    }
    if (this.store.selectedManzana()) {
      void this.store.selectManzana(null);
    }
    void this.store.queryLotes(query);
  }

  lotColor(item: LoteItem): string {
    if (item.review_required) return 'var(--bad)';
    return 'var(--good)';
  }
}
