import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AuditResponse, AuditRevisionItem } from '../../core/models';
import { fmtInt, fmtNum } from '../../core/format';

interface AuditCard {
  key: string;
  label: string;
  value: number;
  tone: 'good' | 'warn' | 'bad' | 'info';
}

@Component({
  selector: 'app-audit-panel',
  templateUrl: './audit-panel.html',
  styleUrl: './audit-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditPanel {
  readonly audit = input<AuditResponse | null>(null);
  readonly revision = input<AuditRevisionItem[]>([]);
  readonly loading = input(false);

  readonly close = output<void>();
  readonly selectManzana = output<string>();

  readonly fmtInt = fmtInt;
  readonly fmtNum = fmtNum;

  readonly cards = computed<AuditCard[]>(() => {
    const s = this.audit()?.stats;
    if (!s) return [];
    return [
      { key: 'limpias', label: 'Manzanas limpias', value: s.limpias, tone: 'good' },
      { key: 'con_huecos', label: 'Con huecos', value: s.con_huecos, tone: 'warn' },
      { key: 'huecos', label: 'Huecos totales', value: s.huecos_total, tone: 'warn' },
      { key: 'con_dup', label: 'Con duplicados', value: s.con_duplicados, tone: 'bad' },
      { key: 'dup', label: 'Duplicados totales', value: s.duplicados_total, tone: 'bad' },
      { key: 'sin_num', label: 'Lotes sin número', value: s.lotes_sin_numero, tone: 'info' },
      { key: 'verdes', label: 'Áreas verdes', value: s.areas_verdes_detectadas, tone: 'good' },
    ];
  });

  count(obj: Record<string, number> | number[] | undefined): number {
    if (!obj) return 0;
    return Array.isArray(obj) ? obj.length : Object.keys(obj).length;
  }
}
