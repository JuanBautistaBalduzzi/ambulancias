import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import type { BillingItem } from '../types';

type BillingAction =
  | { type: 'set-period'; from: string; to: string }
  | { type: 'set-preview'; cases: number; total: number }
  | { type: 'add-item'; item: BillingItem };

type BillingState = {
  periodFrom: string;
  periodTo: string;
  previewCases: number;
  previewTotal: number;
  items: BillingItem[];
};

const initialState: BillingState = {
  periodFrom: '2026-07-01',
  periodTo: '2026-07-31',
  previewCases: 24,
  previewTotal: 594000,
  items: [
    { id: '#0182', provider: 'Swiss Medical', period: '2026-07-01 al 2026-07-15', total: 182400, cases: 9, status: 'Emitida' },
    { id: '#0183', provider: 'PAMI', period: '2026-07-16 al 2026-07-31', total: 311200, cases: 15, status: 'Emitida' },
    { id: '#0184', provider: 'OSDE', period: '2026-07-01 al 2026-07-31', total: 429000, cases: 17, status: 'Emitida' },
    { id: '#0185', provider: 'Galeno', period: '2026-07-01 al 2026-07-31', total: 268000, cases: 12, status: 'Pendiente' },
    { id: '#0186', provider: 'Sancor Salud', period: '2026-07-01 al 2026-07-31', total: 377000, cases: 16, status: 'Emitida' },
    { id: '#0187', provider: 'IOMA', period: '2026-07-01 al 2026-07-31', total: 196000, cases: 8, status: 'Pendiente' },
    { id: '#0188', provider: 'OMINT', period: '2026-07-01 al 2026-07-31', total: 238000, cases: 10, status: 'Emitida' },
    { id: '#0189', provider: 'Medife', period: '2026-07-01 al 2026-07-31', total: 301000, cases: 13, status: 'Emitida' },
    { id: '#0190', provider: 'Prevencion', period: '2026-07-01 al 2026-07-31', total: 214000, cases: 9, status: 'Pendiente' },
    { id: '#0191', provider: 'Federada', period: '2026-07-01 al 2026-07-31', total: 344000, cases: 14, status: 'Emitida' },
  ],
};

function reducer(state: BillingState, action: BillingAction): BillingState {
  if (action.type === 'set-period') {
    return { ...state, periodFrom: action.from, periodTo: action.to };
  }

  if (action.type === 'set-preview') {
    return { ...state, previewCases: action.cases, previewTotal: action.total };
  }

  if (action.type === 'add-item') {
    return { ...state, items: [action.item, ...state.items] };
  }

  return state;
}

function currency(value: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

type FacturacionScreenProps = {
  state: BillingState;
  dispatch: React.Dispatch<BillingAction>;
};

export function FacturacionScreen({ state, dispatch }: FacturacionScreenProps) {
  const [tab, setTab] = useState<'resumen' | 'historico' | 'liquidacion'>('resumen');
  const [modalOpen, setModalOpen] = useState(false);
  const [provider, setProvider] = useState('Resumen multi proveedor');
  const liquidationRows = useMemo(
    () => [
      { mobile: 'A-14', services: 15, total: 214000 },
      { mobile: 'B-03', services: 11, total: 148000 },
      { mobile: 'D-08', services: 8, total: 102000 },
      { mobile: 'A-16', services: 10, total: 137000 },
      { mobile: 'E-02', services: 9, total: 126000 },
      { mobile: 'B-11', services: 7, total: 98000 },
      { mobile: 'A-05', services: 16, total: 232000 },
      { mobile: 'C-03', services: 6, total: 86000 },
      { mobile: 'D-03', services: 12, total: 171000 },
      { mobile: 'B-09', services: 8, total: 111000 },
    ],
    [],
  );

  const period = `${state.periodFrom} al ${state.periodTo}`;

  const feedback = useMemo(() => {
    if (state.previewTotal > 550000) return 'Monto alto. Revisar codigos antes de emitir.';
    if (state.previewTotal > 350000) return 'Monto normal para el periodo seleccionado.';
    return 'Monto bajo. Verificar que no falten servicios por liquidar.';
  }, [state.previewTotal]);

  const generateSummary = (event: FormEvent) => {
    event.preventDefault();
    const days = Math.max(1, Math.abs(new Date(state.periodTo).getDate() - new Date(state.periodFrom).getDate()) + 1);
    const cases = Math.max(8, Math.round(days * 0.9));
    const total = cases * 24500;
    dispatch({ type: 'set-preview', cases, total });
    setTab('resumen');
  };

  const consolidate = () => {
    const nextId = `#${Math.floor(Math.random() * 9000) + 1000}`;
    dispatch({
      type: 'add-item',
      item: {
        id: nextId,
        provider,
        period,
        total: state.previewTotal,
        cases: state.previewCases,
        status: 'Emitida',
      },
    });
    setModalOpen(false);
    setTab('historico');
  };

  return (
    <section className="screen-card">
      <div className="screen-actions">
        <h2>Facturacion</h2>
      </div>

      <nav className="sub-nav" aria-label="Navegacion de facturacion">
        <button className={tab === 'resumen' ? 'btn active' : 'btn'} onClick={() => setTab('resumen')}>Resumen</button>
        <button className={tab === 'historico' ? 'btn active' : 'btn'} onClick={() => setTab('historico')}>Historico</button>
        <button className={tab === 'liquidacion' ? 'btn active' : 'btn'} onClick={() => setTab('liquidacion')}>Liquidacion</button>
      </nav>

      <form className="panel" onSubmit={generateSummary}>
        <h3>Periodo</h3>
        <div className="filter-grid">
          <input
            type="date"
            value={state.periodFrom}
            onChange={(event) => dispatch({ type: 'set-period', from: event.target.value, to: state.periodTo })}
          />
          <input
            type="date"
            value={state.periodTo}
            onChange={(event) => dispatch({ type: 'set-period', from: state.periodFrom, to: event.target.value })}
          />
          <button className="btn primary" type="submit">Recalcular resumen</button>
        </div>
      </form>

      {tab === 'resumen' && (
        <article className="panel">
          <h3>Previsualizacion</h3>
          <p><strong>Periodo:</strong> {period}</p>
          <p><strong>Servicios:</strong> {state.previewCases}</p>
          <p><strong>Total estimado:</strong> {currency(state.previewTotal)}</p>
          <p className="hint">{feedback}</p>
          <button className="btn primary" onClick={() => setModalOpen(true)}>Consolidar en historico</button>
        </article>
      )}

      {tab === 'historico' && (
        <article className="panel">
          <div className="data-table">
            <div className="data-row data-head">
              <span>ID</span>
              <span>Proveedor</span>
              <span>Periodo</span>
              <span>Total</span>
              <span>Servicios</span>
              <span>Estado</span>
            </div>
            {state.items.map((item) => (
              <div className="data-row" key={item.id}>
                <span>{item.id}</span>
                <span>{item.provider}</span>
                <span>{item.period}</span>
                <span>{currency(item.total)}</span>
                <span>{item.cases}</span>
                <span>{item.status}</span>
              </div>
            ))}
          </div>
        </article>
      )}

      {tab === 'liquidacion' && (
        <article className="panel">
          <div className="data-table">
            <div className="data-row data-head">
              <span>Movil</span>
              <span>Servicios</span>
              <span>Total</span>
            </div>
            {liquidationRows.map((row) => (
              <div className="data-row" key={row.mobile}>
                <span>{row.mobile}</span>
                <span>{row.services}</span>
                <span>{currency(row.total)}</span>
              </div>
            ))}
          </div>
        </article>
      )}

      <Modal open={modalOpen} title="Consolidar facturacion" onClose={() => setModalOpen(false)}>
        <div className="modal-body">
          <label>Proveedor</label>
          <input value={provider} onChange={(event) => setProvider(event.target.value)} />
          <p><strong>Periodo:</strong> {period}</p>
          <p><strong>Total:</strong> {currency(state.previewTotal)}</p>
          <div className="inline-actions">
            <button className="btn" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn primary" onClick={consolidate}>Confirmar</button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

export { reducer as billingReducer, initialState as billingInitialState };
export type { BillingAction, BillingState };
