import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { GeoFeature, GeoGeometry } from '../../core/models';
import { colorForArea, colorForReview, fmtNum } from '../../core/format';
import { rotatePoint } from '../../core/geo';

export type MapColorMode = 'review' | 'area';

interface MapShape {
  id: string;
  d: string;
  color: string;
  cx: number;
  cy: number;
  numero: number | null;
  manzana: string | null;
  review: boolean;
}

interface MapView {
  ready: boolean;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  labelSize: number;
}

function ringsOf(geometry: GeoGeometry | null): number[][][] {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return geometry.coordinates as number[][][];
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates as number[][][][]).flat();
  return [];
}

@Component({
  selector: 'app-map-canvas',
  templateUrl: './map-canvas.html',
  styleUrl: './map-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapCanvas {
  readonly features = input<GeoFeature[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly colorMode = input<MapColorMode>('review');
  readonly showLabels = input<boolean>(false);
  readonly rotation = input<number>(270);

  readonly lotSelected = output<string>();
  readonly resetView = output<void>();

  private readonly svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');

  readonly scale = signal(1);
  readonly tx = signal(0);
  readonly ty = signal(0);
  readonly dragging = signal(false);

  readonly hovered = signal<MapShape | null>(null);
  readonly pointer = signal({ x: 0, y: 0 });

  private start = { x: 0, y: 0, tx: 0, ty: 0 };
  private moved = false;

  readonly transform = computed(
    () => `translate(${this.tx()} ${this.ty()}) scale(${this.scale()})`,
  );

  readonly view = computed<MapView>(() => {
    const feats = this.features();
    const rot = this.rotation();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const f of feats) {
      for (const ring of ringsOf(f.geometry)) {
        for (const p of ring) {
          const [rx, ry] = rotatePoint(p[0], p[1], rot);
          if (rx < minX) minX = rx;
          if (rx > maxX) maxX = rx;
          if (ry < minY) minY = ry;
          if (ry > maxY) maxY = ry;
        }
      }
    }
    if (!Number.isFinite(minX)) {
      return { ready: false, minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100, labelSize: 1 };
    }
    const w = Math.max(maxX - minX, 1e-6);
    const h = Math.max(maxY - minY, 1e-6);
    const pad = Math.max(w, h) * 0.02;
    return {
      ready: true,
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: w + pad * 2,
      height: h + pad * 2,
      labelSize: w * 0.012,
    };
  });

  readonly shapes = computed<MapShape[]>(() => {
    const v = this.view();
    if (!v.ready) return [];
    const mode = this.colorMode();
    const rot = this.rotation();
    const px = (x: number) => x - v.minX;
    const py = (y: number) => y - v.minY;
    return this.features().map((f) => {
      let d = '';
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (const ring of ringsOf(f.geometry)) {
        ring.forEach((p, i) => {
          const [rx, ry] = rotatePoint(p[0], p[1], rot);
          const x = px(rx);
          const y = py(ry);
          sx += x;
          sy += y;
          n++;
          d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
        });
        d += 'Z';
      }
      const props = f.properties;
      return {
        id: props.id,
        d,
        color: mode === 'area' ? colorForArea(props) : colorForReview(props),
        cx: n ? sx / n : 0,
        cy: n ? sy / n : 0,
        numero: props.numero,
        manzana: props.manzana,
        review: props.review_required,
      };
    });
  });

  readonly viewBox = computed(() => {
    const v = this.view();
    return `0 0 ${v.width} ${v.height}`;
  });

  private toUser(clientX: number, clientY: number): { x: number; y: number } {
    const svg = this.svgRef().nativeElement;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const u = pt.matrixTransform(ctm.inverse());
    return { x: u.x, y: u.y };
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const u = this.toUser(event.clientX, event.clientY);
    const s = this.scale();
    const factor = Math.exp(-event.deltaY * 0.0015);
    const next = Math.min(60, Math.max(0.4, s * factor));
    const ratio = next / s;
    this.tx.set(u.x - ratio * (u.x - this.tx()));
    this.ty.set(u.y - ratio * (u.y - this.ty()));
    this.scale.set(next);
  }

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const u = this.toUser(event.clientX, event.clientY);
    this.start = { x: u.x, y: u.y, tx: this.tx(), ty: this.ty() };
    this.dragging.set(true);
    this.moved = false;
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    const rect = this.svgRef().nativeElement.getBoundingClientRect();
    this.pointer.set({ x: event.clientX - rect.left, y: event.clientY - rect.top });

    if (!this.dragging()) return;
    const u = this.toUser(event.clientX, event.clientY);
    const dx = u.x - this.start.x;
    const dy = u.y - this.start.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) this.moved = true;
    this.tx.set(this.start.tx + dx);
    this.ty.set(this.start.ty + dy);
  }

  onPointerUp(): void {
    this.dragging.set(false);
  }

  onShapeClick(id: string): void {
    if (this.moved) return;
    this.lotSelected.emit(id);
  }

  zoom(factor: number): void {
    const v = this.view();
    const cx = v.minX + v.width / 2;
    const cy = v.minY + v.height / 2;
    const s = this.scale();
    const next = Math.min(60, Math.max(0.4, s * factor));
    const ratio = next / s;
    this.tx.set(cx - ratio * (cx - this.tx()));
    this.ty.set(cy - ratio * (cy - this.ty()));
    this.scale.set(next);
  }

  fit(): void {
    this.scale.set(1);
    this.tx.set(0);
    this.ty.set(0);
    this.resetView.emit();
  }

  readonly fmtNum = fmtNum;
}
