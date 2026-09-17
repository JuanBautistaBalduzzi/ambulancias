import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import type { Incident } from '../types';

type MetricasScreenProps = {
  incidents: Incident[];
};

export function MetricasScreen({ incidents }: MetricasScreenProps) {
  const [tab, setTab] = useState<'kpi' | 'distribucion' | 'detalle'>('kpi');
  const [openModal, setOpenModal] = useState(false);

  const detailedRows = useMemo(
    () => [
      { label: 'Tiempo promedio de llamada', value: '1m 18s' },
      { label: 'Tiempo promedio de despacho', value: '3m 45s' },
      { label: 'Tiempo promedio de arribo', value: '12m 10s' },
      { label: 'Casos recategorizados', value: '18' },
      { label: 'Casos con ida y vuelta', value: '11' },
      { label: 'Traslados programados', value: '29' },
      { label: 'Alertas por demora', value: '7' },
      { label: 'Moviles fuera de servicio', value: '3' },
      { label: 'Casos cerrados en guardia', value: '52' },
      { label: 'Casos abiertos en guardia', value: '14' },
      { label: 'Reintentos de asignacion', value: '9' },
      { label: 'Anulaciones del periodo', value: '4' },
    ],
    [],
  );

  const totals = useMemo(() => {
    const active = incidents.filter((item) => item.state !== 'Finalizado' && item.state !== 'Cancelado');
    const eta = Math.round(active.reduce((acc, item) => acc + item.etaMinutes, 0) / Math.max(active.length, 1));
    const pending = incidents.filter((item) => item.state === 'Pendiente').length;
    const assigned = incidents.filter((item) => item.state === 'Asignado').length;
    const onWay = incidents.filter((item) => item.state === 'En camino').length;
    return { eta, pending, assigned, onWay, active: active.length };
  }, [incidents]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    incidents.forEach((item) => {
      map.set(item.category, (map.get(item.category) || 0) + 1);
    });
    return Array.from(map.entries());
  }, [incidents]);

  return (
    <section className="screen-card">
      <div className="screen-actions">
        <h2>Metricas</h2>
        <button className="btn" onClick={() => setOpenModal(true)}>Ver snapshot</button>
      </div>

      <nav className="sub-nav" aria-label="Navegacion de metricas">
        <button className={tab === 'kpi' ? 'btn active' : 'btn'} onClick={() => setTab('kpi')}>KPI</button>
        <button className={tab === 'distribucion' ? 'btn active' : 'btn'} onClick={() => setTab('distribucion')}>Distribucion</button>
        <button className={tab === 'detalle' ? 'btn active' : 'btn'} onClick={() => setTab('detalle')}>Detalle</button>
      </nav>

      {tab === 'kpi' && (
        <article className="panel-grid four">
          <div className="metric-card"><strong>{totals.eta} min</strong><span>ETA promedio</span></div>
          <div className="metric-card"><strong>{totals.pending}</strong><span>Pendientes</span></div>
          <div className="metric-card"><strong>{totals.assigned}</strong><span>Asignados</span></div>
          <div className="metric-card"><strong>{totals.onWay}</strong><span>En camino</span></div>
        </article>
      )}

      {tab === 'distribucion' && (
        <article className="panel">
          <h3>Casos por categoria</h3>
          <div className="bars">
            {byCategory.map(([name, value]) => (
              <div key={name} className="bar-item">
                <span style={{ height: `${Math.min(value * 18 + 14, 100)}%` }} />
                <small>{name}</small>
              </div>
            ))}
          </div>
        </article>
      )}

      {tab === 'detalle' && (
        <article className="panel">
          <div className="data-table two-cols">
            <div className="data-row data-head">
              <span>Indicador</span>
              <span>Valor</span>
            </div>
            <div className="data-row">
              <span>Ambulancias activas</span>
              <span>{totals.active}</span>
            </div>
            <div className="data-row">
              <span>Casos finalizados</span>
              <span>{incidents.filter((item) => item.state === 'Finalizado').length}</span>
            </div>
            <div className="data-row">
              <span>Casos urgentes</span>
              <span>{incidents.filter((item) => item.category === 'Urgente').length}</span>
            </div>
            {detailedRows.map((row) => (
              <div className="data-row" key={row.label}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}
          </div>
        </article>
      )}

      <Modal open={openModal} title="Snapshot de metricas" onClose={() => setOpenModal(false)}>
        <div className="modal-body">
          <p><strong>ETA promedio:</strong> {totals.eta} min</p>
          <p><strong>Pendientes:</strong> {totals.pending}</p>
          <p><strong>Asignados:</strong> {totals.assigned}</p>
          <p><strong>En camino:</strong> {totals.onWay}</p>
          <button className="btn primary" onClick={() => setOpenModal(false)}>Cerrar</button>
        </div>
      </Modal>
    </section>
  );
}
