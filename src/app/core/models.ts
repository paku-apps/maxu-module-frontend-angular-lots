export type NumeroStatus = 'observed' | 'deduccion' | 'recuperado' | null;
export type AreaStatus =
  | 'documental_validated'
  | 'documental_mismatch'
  | 'missing'
  | (string & {})
  | null;

export interface Confidence {
  geometry: number;
  number: number;
  area: number;
  measurements: number;
  manzana: number;
}

export interface Lote {
  id: string;
  manzana: string | null;
  numero: number | null;
  numero_original: number | null;
  numero_status: NumeroStatus;
  numero_ocr_score: number | null;
  area_m2: number | null;
  area_geom_m2: number | null;
  area_error_percent: number | null;
  area_status: AreaStatus;
  review_required: boolean;
  n_medidas: number;
  'M.F': number | null;
  'M.D': number | null;
  'M.I': number | null;
  'M.P': number | null;
  'Col Norte': string | null;
  'Col Sur': string | null;
  'Col Este': string | null;
  'Col Oeste': string | null;
  centroid: [number, number];
  overall_confidence: number | null;

  // Solo presentes en el detalle (GET /lotes/{id})
  area_geom_units2?: number;
  area_source?: string | null;
  area_ambiguous?: boolean;
  geometry_semantic_mismatch?: boolean;
  bbox?: [number, number, number, number];
  confidence?: Confidence;
  polygon?: [number, number][];
}

export type LoteItem = Omit<
  Lote,
  | 'area_geom_units2'
  | 'area_source'
  | 'area_ambiguous'
  | 'geometry_semantic_mismatch'
  | 'bbox'
  | 'confidence'
  | 'polygon'
>;

export interface Manzana {
  codigo: string;
  n_lotes: number;
  confidence: number;
}

export interface ManzanaDetalle extends Manzana {
  lotes: LoteItem[];
}

export interface Stats {
  lotes: number;
  manzanas: number;
  con_area_m2: number;
  con_numero: number;
  con_frente: number;
  review_pending: number;
  por_numero_status: Record<string, number>;
  recuperados: number;
}

export interface LotesPage {
  total: number;
  limit: number;
  offset: number;
  items: LoteItem[];
}

export interface GeoFeatureProps {
  id: string;
  manzana: string | null;
  numero: number | null;
  area_m2: number | null;
  area_geom_m2: number | null;
  review_required: boolean;
}

export interface GeoGeometry {
  type: string;
  coordinates: number[][] | number[][][] | number[][][][];
}

export interface GeoFeature {
  type: 'Feature';
  properties: GeoFeatureProps;
  geometry: GeoGeometry | null;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  name: string;
  crs: unknown;
  features: GeoFeature[];
}

export type ReviewPriority = 'low' | 'medium' | 'high' | (string & {});
export type ReviewStatus = 'pending' | 'in_progress' | 'resolved' | (string & {});

export interface ReviewCase {
  review_id: string;
  lot_id: string;
  type: string;
  field: string;
  detected_value: string;
  reason: string;
  priority: ReviewPriority;
  status: ReviewStatus;
}

export interface ReviewCaseDetail extends ReviewCase {
  observations?: string | null;
  [key: string]: unknown;
}

export interface ReviewPage {
  total: number;
  items: ReviewCase[];
}

export interface AuditStats {
  manzanas: number;
  limpias: number;
  con_huecos: number;
  con_duplicados: number;
  huecos_total: number;
  duplicados_total: number;
  lotes_sin_numero: number;
  areas_verdes_detectadas: number;
  manzanas_con_area_verde: string[];
}

export interface AuditManzana {
  codigo: string;
  n_lotes?: number;
  sin_numero?: number;
  numeros?: number[];
  duplicados: Record<string, number>;
  faltantes: number[];
  outliers: number[];
  areas_verdes: number[];
  estado: string;
  rango?: [number, number];
}

export interface AuditAreaVerde {
  area_u2: number;
  area_m2: number;
  center: [number, number];
  bounds: [number, number, number, number];
  polygon: [number, number][];
}

export interface AuditResponse {
  stats: AuditStats;
  manzanas: AuditManzana[];
  revision_manual: AuditManzana[];
  areas_verdes: AuditAreaVerde[];
  version?: number;
  source?: string;
  crs?: unknown;
}

export type AuditRevisionItem = AuditManzana;

export interface LotesQuery {
  manzana?: string | null;
  numero?: number | null;
  con_area?: boolean;
  review_required?: boolean;
  numero_status?: NumeroStatus | string;
  recuperado?: boolean;
  limit?: number;
  offset?: number;
}

export interface GeoQuery {
  manzana?: string | null;
  limit?: number;
}

export interface ReviewQuery {
  status?: string | null;
  priority?: string | null;
  type?: string | null;
  limit?: number;
}

export type CorrectableField =
  | 'area_m2'
  | 'numero'
  | 'manzana_codigo'
  | 'area_status';

export interface CorrectionBody {
  field: CorrectableField;
  new_value: string | number;
  reason: string;
  kind: string;
}

export interface CorrectionResult {
  lot_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
}
