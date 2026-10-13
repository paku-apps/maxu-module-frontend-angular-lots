import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import {
  CorrectionBody,
  CorrectionResult,
  FeatureCollection,
  Lote,
  LoteItem,
  Manzana,
  ManzanaDetalle,
  ReviewCase,
  ReviewCaseDetail,
  Stats,
} from './models';

export interface Toast {
  id: number;
  kind: 'info' | 'success' | 'error';
  text: string;
}

type LoadingKey = 'stats' | 'manzanas' | 'geo' | 'lote' | 'review';

@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly api = inject(ApiService);
  private toastSeq = 0;

  // ---- Estado global -------------------------------------------------------
  readonly stats = signal<Stats | null>(null);
  readonly manzanas = signal<Manzana[]>([]);
  readonly selectedManzana = signal<string | null>(null);
  readonly manzanaDetail = signal<ManzanaDetalle | null>(null);
  readonly geojson = signal<FeatureCollection | null>(null);
  readonly selectedLoteId = signal<string | null>(null);
  readonly selectedLote = signal<Lote | null>(null);
  readonly reviewCases = signal<ReviewCase[]>([]);
  readonly reviewTotal = signal(0);
  readonly activeReviewCase = signal<ReviewCaseDetail | null>(null);
  readonly toasts = signal<Toast[]>([]);

  readonly loading = signal({
    stats: false,
    manzanas: false,
    geo: false,
    lote: false,
    review: false,
  });

  readonly hasSelection = computed(() => this.selectedManzana() !== null);

  // ---- Carga inicial -------------------------------------------------------
  async bootstrap(): Promise<void> {
    await Promise.allSettled([this.loadStats(), this.loadManzanas(), this.loadGeo()]);
  }

  async loadStats(): Promise<void> {
    this.patchLoading('stats', true);
    try {
      this.stats.set(await firstValueFrom(this.api.getStats()));
    } catch (e) {
      this.notify('error', 'No se pudieron cargar las estadísticas. ¿Backend en localhost:8000?');
    } finally {
      this.patchLoading('stats', false);
    }
  }

  async loadManzanas(): Promise<void> {
    this.patchLoading('manzanas', true);
    try {
      const list = await firstValueFrom(this.api.getManzanas());
      this.manzanas.set([...list].sort((a, b) => b.n_lotes - a.n_lotes));
    } catch (e) {
      this.notify('error', 'No se pudieron cargar las manzanas.');
    } finally {
      this.patchLoading('manzanas', false);
    }
  }

  async loadGeo(): Promise<void> {
    this.patchLoading('geo', true);
    try {
      const manzana = this.selectedManzana();
      const geo = await firstValueFrom(
        this.api.getGeoJson({ manzana, limit: manzana ? 8000 : 5000 }),
      );
      this.geojson.set(geo);
    } catch (e) {
      this.notify('error', 'No se pudo cargar la cartografía (geojson).');
    } finally {
      this.patchLoading('geo', false);
    }
  }

  // ---- Selección -----------------------------------------------------------
  async selectManzana(codigo: string | null): Promise<void> {
    this.selectedManzana.set(codigo);
    this.selectedLoteId.set(null);
    this.selectedLote.set(null);
    this.manzanaDetail.set(null);
    await this.loadGeo();
    if (codigo) {
      await this.loadManzanaDetail(codigo);
    }
  }

  async loadManzanaDetail(codigo: string): Promise<void> {
    this.patchLoading('manzanas', true);
    try {
      this.manzanaDetail.set(await firstValueFrom(this.api.getManzana(codigo)));
    } catch (e) {
      this.notify('error', `No se pudo cargar la manzana ${codigo}.`);
    } finally {
      this.patchLoading('manzanas', false);
    }
  }

  async selectLote(id: string | null): Promise<void> {
    this.selectedLoteId.set(id);
    if (!id) {
      this.selectedLote.set(null);
      return;
    }
    this.patchLoading('lote', true);
    try {
      this.selectedLote.set(await firstValueFrom(this.api.getLote(id)));
    } catch (e) {
      this.notify('error', `No se pudo cargar el lote ${id}.`);
    } finally {
      this.patchLoading('lote', false);
    }
  }

  // ---- Revisión manual -----------------------------------------------------
  async loadReviewCases(query: { status?: string; priority?: string } = {}): Promise<void> {
    this.patchLoading('review', true);
    try {
      const page = await firstValueFrom(this.api.getReviewCases({ ...query, limit: 200 }));
      this.reviewCases.set(page.items);
      this.reviewTotal.set(page.total);
    } catch (e) {
      this.notify('error', 'No se pudieron cargar los casos de revisión.');
    } finally {
      this.patchLoading('review', false);
    }
  }

  async openReviewCase(id: string): Promise<void> {
    this.patchLoading('review', true);
    try {
      this.activeReviewCase.set(await firstValueFrom(this.api.getReviewCase(id)));
    } catch (e) {
      this.notify('error', `No se pudo abrir el caso ${id}.`);
    } finally {
      this.patchLoading('review', false);
    }
  }

  async saveReviewCase(id: string, status: string, observations: string): Promise<void> {
    try {
      const updated = await firstValueFrom(
        this.api.updateReviewCase(id, { status, observations }),
      );
      this.activeReviewCase.set(updated);
      this.reviewCases.update((list) =>
        list.map((c) => (c.review_id === id ? { ...c, status } : c)),
      );
      this.notify('success', `Caso ${id} actualizado a "${status}".`);
    } catch (e) {
      this.notify('error', `No se pudo actualizar el caso ${id}.`);
    }
  }

  // ---- Correcciones --------------------------------------------------------
  async correctLote(id: string, body: CorrectionBody): Promise<CorrectionResult | null> {
    try {
      const result = await firstValueFrom(this.api.correctLote(id, body));
      this.notify(
        'success',
        `Corrección aplicada: ${result.field} ${result.old_value ?? '—'} → ${result.new_value ?? '—'}`,
      );
      await this.selectLote(id);
      await Promise.allSettled([this.loadGeo(), this.loadStats()]);
      const manzana = this.selectedManzana();
      if (manzana) await this.loadManzanaDetail(manzana);
      return result;
    } catch (e) {
      this.notify('error', 'No se pudo aplicar la corrección.');
      return null;
    }
  }

  // ---- Utilidades ----------------------------------------------------------
  lotName(item: Pick<LoteItem, 'manzana' | 'numero' | 'id'> | Lote): string {
    const mz = item.manzana ?? '—';
    const num = item.numero ?? 's/n';
    return `${mz} · Lote ${num}`;
  }

  notify(kind: Toast['kind'], text: string): void {
    const id = ++this.toastSeq;
    this.toasts.update((t) => [...t, { id, kind, text }]);
    setTimeout(() => this.dismissToast(id), 5000);
  }

  dismissToast(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  private patchLoading(key: LoadingKey, value: boolean): void {
    this.loading.update((s) => ({ ...s, [key]: value }));
  }
}
