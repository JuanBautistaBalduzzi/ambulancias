import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import type { ServiceMode } from '../types';

const allSymptoms = [
  'Dolor de pecho',
  'Disnea',
  'Fiebre',
  'Trauma',
  'Desmayo',
  'Hemorragia',
  'Debilidad',
  'Convulsion',
];

type CargaScreenProps = {
  onCaseCreated: (payload: { patient: string; mode: ServiceMode; symptoms: string[]; destination: string }) => void;
};

export function CargaScreen({ onCaseCreated }: CargaScreenProps) {
  const [tab, setTab] = useState<'paciente' | 'triage' | 'confirmacion'>('paciente');
  const [openModal, setOpenModal] = useState(false);
  const [patient, setPatient] = useState('Maria Perez');
  const [destination, setDestination] = useState('Hospital San Juan');
  const [mode, setMode] = useState<ServiceMode>('Emergencia');
  const [symptoms, setSymptoms] = useState<string[]>(['Dolor de pecho', 'Disnea']);

  const suggestion = useMemo(() => {
    if (symptoms.includes('Dolor de pecho') && symptoms.includes('Disnea')) return 'Emergencia critica';
    if (symptoms.includes('Hemorragia')) return 'Urgente';
    if (mode === 'Traslado') return 'Traslado programado';
    return 'Emergencia menor';
  }, [mode, symptoms]);

  const toggleSymptom = (symptom: string) => {
    setSymptoms((current) =>
      current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom],
    );
  };

  const saveCase = () => {
    onCaseCreated({ patient, mode, symptoms, destination });
    setOpenModal(false);
    setTab('confirmacion');
  };

  return (
    <section className="screen-card">
      <div className="screen-actions">
        <h2>Carga</h2>
        <button className="btn primary" onClick={() => setOpenModal(true)}>Nuevo caso</button>
      </div>

      <nav className="sub-nav" aria-label="Navegacion de carga">
        <button className={tab === 'paciente' ? 'btn active' : 'btn'} onClick={() => setTab('paciente')}>Paciente</button>
        <button className={tab === 'triage' ? 'btn active' : 'btn'} onClick={() => setTab('triage')}>Triage</button>
        <button className={tab === 'confirmacion' ? 'btn active' : 'btn'} onClick={() => setTab('confirmacion')}>Confirmacion</button>
      </nav>

      {tab === 'paciente' && (
        <div className="panel-grid two">
          <article className="panel">
            <h3>Datos del paciente</h3>
            <label>Nombre y apellido</label>
            <input value={patient} onChange={(event) => setPatient(event.target.value)} />
            <label>Destino</label>
            <input value={destination} onChange={(event) => setDestination(event.target.value)} />
            <label>Modo de servicio</label>
            <div className="inline-actions">
              <button className={mode === 'Emergencia' ? 'btn active' : 'btn'} onClick={() => setMode('Emergencia')}>Emergencia</button>
              <button className={mode === 'Traslado' ? 'btn active' : 'btn'} onClick={() => setMode('Traslado')}>Traslado</button>
            </div>
          </article>
          <article className="panel">
            <h3>Resumen</h3>
            <p><strong>Paciente:</strong> {patient}</p>
            <p><strong>Destino:</strong> {destination}</p>
            <p><strong>Modo:</strong> {mode}</p>
            <p><strong>Categoria sugerida:</strong> {suggestion}</p>
          </article>
        </div>
      )}

      {tab === 'triage' && (
        <article className="panel">
          <h3>Sintomas</h3>
          <div className="chips-wrap">
            {allSymptoms.map((symptom) => (
              <button
                key={symptom}
                className={symptoms.includes(symptom) ? 'btn chip active' : 'btn chip'}
                onClick={() => toggleSymptom(symptom)}
              >
                {symptom}
              </button>
            ))}
          </div>
          <p className="hint">La categoria se recalcula en vivo: <strong>{suggestion}</strong></p>
        </article>
      )}

      {tab === 'confirmacion' && (
        <article className="panel">
          <h3>Confirmacion operativa</h3>
          <button className="btn primary" onClick={() => setOpenModal(true)}>Abrir modal de guardado</button>
        </article>
      )}

      <Modal open={openModal} title="Confirmar carga de servicio" onClose={() => setOpenModal(false)}>
        <div className="modal-body">
          <p><strong>Paciente:</strong> {patient}</p>
          <p><strong>Modo:</strong> {mode}</p>
          <p><strong>Sintomas:</strong> {symptoms.join(', ')}</p>
          <p><strong>Destino:</strong> {destination}</p>
          <div className="inline-actions">
            <button className="btn" onClick={() => setOpenModal(false)}>Cancelar</button>
            <button className="btn primary" onClick={saveCase}>Guardar y enviar</button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
