import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuditResponse,
  AuditRevisionItem,
  CorrectionBody,
  CorrectionResult,
  FeatureCollection,
  GeoQuery,
  Lote,
  LotesPage,
  LotesQuery,
  Manzana,
  ManzanaDetalle,
  ReviewCaseDetail,
  ReviewPage,
  ReviewQuery,
  Stats,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBase;

  private buildParams(query: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.base}/stats`);
  }

  getHealth(): Observable<{ status: string; api_version: string }> {
    return this.http.get<{ status: string; api_version: string }>(`${this.base}/health`);
  }

  getAudit(): Observable<AuditResponse> {
    return this.http.get<AuditResponse>(`${this.base}/audit`);
  }

  getAuditRevision(): Observable<AuditRevisionItem[]> {
    return this.http.get<AuditRevisionItem[]>(`${this.base}/audit/revision`);
  }

  getManzanas(): Observable<Manzana[]> {
    return this.http.get<Manzana[]>(`${this.base}/manzanas`);
  }

  getManzana(codigo: string): Observable<ManzanaDetalle> {
    return this.http.get<ManzanaDetalle>(
      `${this.base}/manzanas/${encodeURIComponent(codigo)}`,
    );
  }

  getLotes(query: LotesQuery = {}): Observable<LotesPage> {
    return this.http.get<LotesPage>(`${this.base}/lotes`, {
      params: this.buildParams(query as Record<string, unknown>),
    });
  }

  getLote(id: string): Observable<Lote> {
    return this.http.get<Lote>(`${this.base}/lotes/${encodeURIComponent(id)}`);
  }

  getGeoJson(query: GeoQuery = {}): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>(`${this.base}/lotes.geojson`, {
      params: this.buildParams(query as Record<string, unknown>),
    });
  }

  getReviewCases(query: ReviewQuery = {}): Observable<ReviewPage> {
    return this.http.get<ReviewPage>(`${this.base}/review_cases`, {
      params: this.buildParams(query as Record<string, unknown>),
    });
  }

  getReviewCase(id: string): Observable<ReviewCaseDetail> {
    return this.http.get<ReviewCaseDetail>(
      `${this.base}/review_cases/${encodeURIComponent(id)}`,
    );
  }

  updateReviewCase(
    id: string,
    body: { status?: string; observations?: string },
  ): Observable<ReviewCaseDetail> {
    return this.http.patch<ReviewCaseDetail>(
      `${this.base}/review_cases/${encodeURIComponent(id)}`,
      body,
    );
  }

  correctLote(id: string, body: CorrectionBody): Observable<CorrectionResult> {
    return this.http.post<CorrectionResult>(
      `${this.base}/lotes/${encodeURIComponent(id)}/corrections`,
      body,
    );
  }
}
