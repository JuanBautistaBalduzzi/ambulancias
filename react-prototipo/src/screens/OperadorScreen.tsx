import { useMemo, useState } from 'react';
import { DispatchMap } from '../components/DispatchMap';
import { Modal } from '../components/Modal';
import type { Incident } from '../types';

const ambulancePositions: Record<string, [number, number]> = {
  'A-14': [-34.5662, -58.4582],
  'A-16': [-34.5924, -58.4265],
  'B-03': [-34.6201, -58.3988],
  'D-08': [-34.6432, -58.4372],
  'E-02': [-34.6664, -58.4019],
};

function casePositionByZone(zone: string): [number, number] {
  if (zone === 'Norte') return [-34.5517, -58.4729];
  if (zone === 'Sur') return [-34.6759, -58.4374];
  return [-34.6037, -58.3816];
}

type OperadorScreenProps = {
  incidents: Incident[];
  onPatchIncident: (id: string, patch: Partial<Incident>) => void;
};

export function OperadorScreen({ incidents, onPatchIncident }: OperadorScreenProps) {
  const [tab, setTab] = useState<'cola' | 'mapa' | 'asignacion'>('cola');
  const [category, setCategory] = useState('Todos');
  const [zone, setZone] = useState('Todas');
  const [state, setState] = useState('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [ambulanceDraft, setAmbulanceDraft] = useState('A-14');

  const filtered = useMemo(() => {
    return incidents.filter((item) => {
      const okCategory = category === 'Todos' || item.category === category;
      const okZone = zone === 'Todas' || item.zone === zone;
      const okState = state === 'Todos' || item.state === state;
      return okCategory && okZone && okState;
    });
  }, [category, incidents, state, zone]);

  const best = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.reduce((acc, item) => (item.etaMinutes < acc.etaMinutes ? item : acc));
  }, [filtered]);

  const selectedCase = useMemo(() => incidents.find((item) => item.id === selectedId) || null, [incidents, selectedId]);
  const actionCase = useMemo(() => incidents.find((item) => item.id === actionId) || null, [actionId, incidents]);
  const etaOptions = useMemo(() => {
    if (!actionCase) return [];

    const zoneModifier = actionCase.zone === 'Norte' ? 0 : actionCase.zone === 'Centro' ? 2 : 4;
    const base = Math.max(6, actionCase.etaMinutes - 2);
    const options = [
      { ambulance: 'A-14', eta: base + zoneModifier },
      { ambulance: 'A-16', eta: base + zoneModifier + 2 },
      { ambulance: 'B-03', eta: base + zoneModifier + 3 },
      { ambulance: 'D-08', eta: base + zoneModifier + 5 },
      { ambulance: 'E-02', eta: base + zoneModifier + 6 },
    ];

    return options.sort((a, b) => a.eta - b.eta);
  }, [actionCase]);

  const mapCase = useMemo(() => selectedCase || filtered[0] || null, [filtered, selectedCase]);
  const mapCasePoint = useMemo(() => {
    if (!mapCase) return null;
    return {
      id: mapCase.id,
      label: `${mapCase.id} - ${mapCase.patient}`,
      position: casePositionByZone(mapCase.zone),
    };
  }, [mapCase]);

  const mapAmbulances = useMemo(() => {
    if (!mapCase) return [];

    const zoneModifier = mapCase.zone === 'Norte' ? 0 : mapCase.zone === 'Centro' ? 2 : 4;
    return [
      { id: 'A-14', label: 'A-14', position: ambulancePositions['A-14'], etaMinutes: 8 + zoneModifier },
      { id: 'A-16', label: 'A-16', position: ambulancePositions['A-16'], etaMinutes: 10 + zoneModifier },
      { id: 'B-03', label: 'B-03', position: ambulancePositions['B-03'], etaMinutes: 11 + zoneModifier },
      { id: 'D-08', label: 'D-08', position: ambulancePositions['D-08'], etaMinutes: 13 + zoneModifier },
      { id: 'E-02', label: 'E-02', position: ambulancePositions['E-02'], etaMinutes: 15 + zoneModifier },
    ];
  }, [mapCase]);

  const modalCasePoint = useMemo(() => {
    if (!actionCase) return null;
    return {
      id: actionCase.id,
      label: `${actionCase.id} - ${actionCase.patient}`,
      position: casePositionByZone(actionCase.zone),
    };
  }, [actionCase]);

  const modalAmbulances = useMemo(
    () =>
      etaOptions.map((option) => ({
        id: option.ambulance,
        label: option.ambulance,
        position: ambulancePositions[option.ambulance] || ambulancePositions['A-14'],
        etaMinutes: option.eta,
      })),
    [etaOptions],
  );

  const openActionModal = (id: string) => {
    const incident = incidents.find((item) => item.id === id);
    setActionId(id);
    setAmbulanceDraft(incident?.ambulance && incident.ambulance !== 'Sin asignar' ? incident.ambulance : 'A-14');
    setModalOpen(true);
  };

  const applyAction = (patch: Partial<Incident>) => {
    if (!actionCase) return;
    onPatchIncident(actionCase.id, patch);
    setModalOpen(false);
  };

  return (
    <section className="screen-card">
      <div className="screen-actions">
        <h2>Operador</h2>
      </div>

      <nav className="sub-nav" aria-label="Navegacion de operador">
        <button className={tab === 'cola' ? 'btn active' : 'btn'} onClick={() => setTab('cola')}>Cola</button>
        <button className={tab === 'mapa' ? 'btn active' : 'btn'} onClick={() => setTab('mapa')}>Mapa</button>
        <button className={tab === 'asignacion' ? 'btn active' : 'btn'} onClick={() => setTab('asignacion')}>Asignacion</button>
      </nav>

      <article className="panel">
        <div className="filter-grid">
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>Todos</option>
            <option>Emergencia critica</option>
            <option>Urgente</option>
            <option>Emergencia menor</option>
            <option>Traslado programado</option>
          </select>
          <select value={zone} onChange={(event) => setZone(event.target.value)}>
            <option>Todas</option>
            <option>Norte</option>
            <option>Centro</option>
            <option>Sur</option>
          </select>
          <select value={state} onChange={(event) => setState(event.target.value)}>
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Asignado</option>
            <option>En camino</option>
            <option>Finalizado</option>
            <option>Cancelado</option>
          </select>
        </div>
      </article>

      {tab === 'cola' && (
        <article className="panel">
          <div className="data-table">
            <div className="data-row data-head">
              <span>ID</span>
              <span>Paciente</span>
              <span>Categoria</span>
              <span>Zona</span>
              <span>Movil</span>
              <span>ETA</span>
              <span>Estado</span>
              <span>Accion</span>
            </div>
            {filtered.map((item) => (
              <div key={item.id} className={selectedId === item.id ? 'data-row selected' : 'data-row'}>
                <span>{item.id}</span>
                <span>{item.patient}</span>
                <span>{item.category}</span>
                <span>{item.zone}</span>
                <span>{item.ambulance}</span>
                <span>{item.etaMinutes} min</span>
                <span>{item.state}</span>
                <button className="btn" onClick={() => openActionModal(item.id)}>Acciones</button>
              </div>
            ))}
            {!filtered.length && (
              <div className="data-row">
                <span>Sin resultados</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
              </div>
            )}
          </div>
        </article>
      )}

      {tab === 'mapa' && (
        <article className="panel">
          <DispatchMap casePoint={mapCasePoint} ambulances={mapAmbulances} selectedAmbulanceId={mapCase?.ambulance} />
        </article>
      )}

      {tab === 'asignacion' && (
        <article className="panel">
          {best ? (
            <>
              <p><strong>Movil sugerido:</strong> {best.ambulance} (ETA {best.etaMinutes} min)</p>
              <button className="btn primary" onClick={() => openActionModal(best.id)}>Abrir modal de asignacion</button>
            </>
          ) : (
            <p>No hay resultados con esos filtros.</p>
          )}
        </article>
      )}

      <Modal open={modalOpen} title="Acciones del caso" onClose={() => setModalOpen(false)}>
        <div className="modal-body">
          <p><strong>Caso:</strong> {actionCase ? `${actionCase.id} - ${actionCase.patient}` : 'Ninguno'}</p>
          <p><strong>Estado actual:</strong> {actionCase?.state ?? '-'}</p>

          {actionCase && (
            <>
              <DispatchMap
                casePoint={modalCasePoint}
                ambulances={modalAmbulances}
                selectedAmbulanceId={ambulanceDraft}
                height={220}
              />

              <div className="data-table eta-table">
                <div className="data-row data-head">
                  <span>Movil</span>
                  <span>ETA</span>
                </div>
                {etaOptions.map((option) => (
                  <button
                    type="button"
                    key={option.ambulance}
                    className={ambulanceDraft === option.ambulance ? 'data-row selected eta-row' : 'data-row eta-row'}
                    onClick={() => setAmbulanceDraft(option.ambulance)}
                  >
                    <span>{option.ambulance}</span>
                    <span>{option.eta} min</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {(actionCase?.state === 'Pendiente' || actionCase?.state === 'Asignado') && (
            <>
              <label>Movil</label>
              <select value={ambulanceDraft} onChange={(event) => setAmbulanceDraft(event.target.value)}>
                <option>A-14</option>
                <option>A-16</option>
                <option>B-03</option>
                <option>D-08</option>
                <option>E-02</option>
              </select>
            </>
          )}

          <div className="inline-actions">
            {actionCase?.state === 'Pendiente' && (
              <>
                <button className="btn primary" onClick={() => applyAction({ ambulance: ambulanceDraft, state: 'Asignado' })}>Asignar</button>
                <button className="btn" onClick={() => applyAction({ state: 'Cancelado' })}>Cancelar caso</button>
              </>
            )}

            {actionCase?.state === 'Asignado' && (
              <>
                <button className="btn primary" onClick={() => applyAction({ ambulance: ambulanceDraft })}>Reasignar</button>
                <button className="btn primary" onClick={() => applyAction({ state: 'En camino' })}>Marcar en camino</button>
                <button className="btn" onClick={() => applyAction({ state: 'Cancelado' })}>Cancelar caso</button>
              </>
            )}

            {actionCase?.state === 'En camino' && (
              <>
                <button className="btn primary" onClick={() => applyAction({ state: 'Finalizado' })}>Finalizar atencion</button>
                <button className="btn" onClick={() => applyAction({ state: 'Cancelado' })}>Cancelar caso</button>
              </>
            )}

            {(actionCase?.state === 'Finalizado' || actionCase?.state === 'Cancelado') && (
              <button className="btn primary" onClick={() => applyAction({ state: 'Pendiente' })}>Reabrir</button>
            )}

            <button className="btn" onClick={() => setModalOpen(false)}>Cerrar</button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
