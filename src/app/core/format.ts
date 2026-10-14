import { AreaStatus, Confidence, GeoFeatureProps, NumeroStatus, ReviewPriority } from './models';

export function fmtNum(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function fmtInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-PE').format(value);
}

export function fmtPct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return '—';
  return `${fmtNum(value, digits)}%`;
}

export function confidenceColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'var(--missing)';
  if (value >= 0.8) return 'var(--good)';
  if (value >= 0.6) return 'var(--warn)';
  return 'var(--bad)';
}

export function statusLabel(status: AreaStatus): string {
  switch (status) {
    case 'documental_validated':
      return 'Validada';
    case 'documental_mismatch':
      return 'Discrepancia';
    case 'geometrica':
      return 'Geométrica';
    case 'missing':
      return 'Sin área';
    default:
      return status ?? '—';
  }
}

export function numeroStatusLabel(status: NumeroStatus): string {
  switch (status) {
    case 'observed':
      return 'Observado';
    case 'deduccion':
      return 'Deducción';
    case 'recuperado':
      return 'Recuperado';
    default:
      return '—';
  }
}

export function numeroStatusColor(status: NumeroStatus): string {
  switch (status) {
    case 'recuperado':
      return 'var(--accent-2)';
    case 'deduccion':
      return 'var(--warn)';
    case 'observed':
      return 'var(--good)';
    default:
      return 'var(--muted)';
  }
}

export function areaErrorPercent(props: {
  area_m2: number | null;
  area_geom_m2: number | null;
}): number | null {
  if (props.area_m2 === null || !props.area_geom_m2) return null;
  return Math.abs(((props.area_m2 - props.area_geom_m2) / props.area_geom_m2) * 100);
}

/** Color por bandera de revisión. */
export function colorForReview(props: GeoFeatureProps): string {
  if (props.review_required) return 'var(--bad)';
  const err = areaErrorPercent(props);
  if (err !== null && err > 5) return 'var(--warn)';
  return 'var(--good)';
}

/** Color por estado del área (según error entre documental y geométrica). */
export function colorForArea(props: GeoFeatureProps): string {
  if (props.area_m2 === null) return 'var(--missing)';
  const err = areaErrorPercent(props);
  if (err === null) return '#38bdf8';
  if (err > 5) return 'var(--bad)';
  if (err > 2) return 'var(--warn)';
  return 'var(--good)';
}

export function priorityColor(priority: ReviewPriority): string {
  switch (priority) {
    case 'high':
      return 'var(--bad)';
    case 'medium':
      return 'var(--warn)';
    case 'low':
      return 'var(--good)';
    default:
      return 'var(--muted)';
  }
}

export function confidenceEntries(
  confidence: Confidence | undefined,
): { key: string; value: number }[] {
  if (!confidence) return [];
  const labels: Record<keyof Confidence, string> = {
    geometry: 'Geometría',
    number: 'Número',
    area: 'Área',
    measurements: 'Medidas',
    manzana: 'Manzana',
  };
  return (Object.keys(labels) as (keyof Confidence)[]).map((key) => ({
    key: labels[key],
    value: confidence[key],
  }));
}
