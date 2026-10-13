import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CorrectableField, CorrectionBody, Lote } from '../../core/models';
import { rotatePoint } from '../../core/geo';
import {
  confidenceColor,
  confidenceEntries,
  fmtInt,
  fmtNum,
  fmtPct,
  statusLabel,
} from '../../core/format';

type Tab = 'resumen' | 'medidas' | 'geometria' | 'corregir';

interface PolyView {
  d: string;
  viewBox: string;
}

@Component({
  selector: 'app-lot-detail',
  templateUrl: './lot-detail.html',
  styleUrl: './lot-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotDetail {
  readonly lote = input<Lote | null>(null);
  readonly loading = input(false);
  readonly rotation = input<number>(270);

  readonly correct = output<CorrectionBody>();
  readonly close = output<void>();
  readonly locate = output<string>();

  readonly tab = signal<Tab>('resumen');

  readonly field = signal<CorrectableField>('area_status');
  readonly newValue = signal<string>('manual_review');
  readonly reason = signal<string>('');
  readonly kind = signal<string>('manual');

  readonly confidenceColor = confidenceColor;
  readonly fmtNum = fmtNum;
  readonly fmtInt = fmtInt;
  readonly fmtPct = fmtPct;
  readonly statusLabel = statusLabel;

  readonly fields: { value: CorrectableField; label: string }[] = [
    { value: 'area_m2', label: 'Área (m²)' },
    { value: 'numero', label: 'Número de lote' },
    { value: 'manzana_codigo', label: 'Código de manzana' },
    { value: 'area_status', label: 'Estado del área' },
  ];

  readonly areaStatusOptions = [
    'documental_validated',
    'documental_mismatch',
    'missing',
    'manual_review',
  ];

  readonly confidence = computed(() => confidenceEntries(this.lote()?.confidence));

  readonly geometry = computed<PolyView | null>(() => {
    const poly = this.lote()?.polygon;
    if (!poly || poly.length < 3) return null;
    const rot = this.rotation();
    const pts = poly.map(([x, y]) => rotatePoint(x, y, rot));
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const w = Math.max(maxX - minX, 1e-6);
    const h = Math.max(maxY - minY, 1e-6);
    const pad = Math.max(w, h) * 0.08;
    const vw = w + pad * 2;
    const vh = h + pad * 2;
    const d =
      pts
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${(x - minX + pad).toFixed(2)} ${(y - minY + pad).toFixed(2)}`)
        .join('') + 'Z';
    return { d, viewBox: `0 0 ${vw} ${vh}` };
  });

  readonly isNumberField = computed(
    () => this.field() === 'area_m2' || this.field() === 'numero',
  );
  readonly isSelectField = computed(() => this.field() === 'area_status');

  setField(value: string): void {
    const field = value as CorrectableField;
    this.field.set(field);
    if (field === 'area_status') this.newValue.set('manual_review');
    else this.newValue.set('');
  }

  onFieldChange(event: Event): void {
    this.setField((event.target as HTMLSelectElement).value);
  }

  onValueInput(event: Event): void {
    this.newValue.set((event.target as HTMLInputElement).value);
  }

  onReasonInput(event: Event): void {
    this.reason.set((event.target as HTMLInputElement).value);
  }

  onKindInput(event: Event): void {
    this.kind.set((event.target as HTMLInputElement).value);
  }

  submit(): void {
    const lote = this.lote();
    if (!lote) return;
    const raw = this.newValue().trim();
    const value: string | number = this.isNumberField() ? Number(raw) : raw;
    if (this.isNumberField() && Number.isNaN(value as number)) return;
    this.correct.emit({
      field: this.field(),
      new_value: value,
      reason: this.reason().trim() || 'revisión manual',
      kind: this.kind().trim() || 'manual',
    });
  }
}
