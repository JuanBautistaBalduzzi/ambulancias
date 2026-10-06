import { useEffect, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  CHeader,
  CHeaderBrand,
  CHeaderNav,
  CHeaderToggler,
  CSidebar,
  CSidebarNav,
  CNavItem,
  CNavLink,
  CContainer,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu, cilMoon, cilSun, cilTruck, cilMedicalCross, cilChartLine, cilDollar } from '@coreui/icons';
import { CChartBar, CChartDoughnut, CChartLine } from '@coreui/react-chartjs';
import * as XLSX from 'xlsx';

type Theme = 'light' | 'dark';
type RoutePath = '/carga' | '/operador' | '/metricas' | '/facturacion';
type LoadStep = 1 | 2 | 3 | 4;
type LoadTab = 'casos' | 'guardia' | 'recursos';
type ServiceMode = 'Emergencia' | 'Traslado';
type TriageLevel = 'Rojo' | 'Amarillo' | 'Verde' | 'Negro';
type OperatorTab = 'incidentes' | 'monitoreo' | 'recursos';
type MetricsTab = 'operacion' | 'ambulancias';
type MetricsPeriod = '15m' | '30m' | '1h' | '6h' | '12h' | '1d' | '3d' | 'custom';
type BillingTab = 'generacion' | 'historicos' | 'catalogo';

type RecentCase = {
  id: string;
  time: string;
  patient: string;
  dni: string;
  obraSocial: string;
  afiliado: string;
  plan: string;
  mode: ServiceMode;
  detail: string;
  status: string;
};

type PatientRecord = {
  id: string;
  fullName: string;
  dni: string;
  obraSocial: string;
  afiliado: string;
  plan: string;
  defaultHospital: string;
  defaultMode: ServiceMode;
};

type LoadDraft = {
  query: string;
  selectedPatientId: string | null;
  fullName: string;
  dni: string;
  obraSocial: string;
  afiliado: string;
  plan: string;
  mode: ServiceMode;
  triageLevel: TriageLevel;
  triageNote: string;
  hospital: string;
  schedule: string;
  needsReturn: boolean;
};

type OperatorIncident = {
  id: string;
  nro: string;
  patient: string;
  title: string;
  domicilio: string;
  edad: string;
  barrio: string;
  zone: string;
  category: 'Emergencia' | 'Traslado' | 'Programado';
  delay: number;
  ambulance: string;
  eta: string;
  state: 'Pendiente' | 'Asignado' | 'En camino' | 'Finalizado' | 'Cancelado';
  note: string;
  // datos minimos para el detalle del incidente
  sexo: 'F' | 'M';
  triageColor: 'Rojo' | 'Amarillo' | 'Verde' | 'Negro';
  obraSocial: string;
  afiliado: string;
  plan: string;
  copago: string;
  telefono: string;
  receptor: string;
  despachador: string;
  horaEnvio: string;
  horaRecepcion: string;
  recursoNecesario: string;
};

type IncidentSortColumn = 'category' | 'nro' | 'domicilio' | 'title' | 'edad' | 'barrio' | 'ambulance' | 'delay' | 'state';

type AmbulanceState = 'Disponible' | 'En servicio' | 'En camino' | 'Reservada' | 'Fuera de servicio';
type OutOfServiceReason = 'Internación' | 'Cargando nafta' | 'Incidente';

type Ambulance = {
  id: string;
  name: string;
  zone: string;
  state: AmbulanceState;
  eta: string;
  crew: string;
  outOfServiceReason?: OutOfServiceReason;
};

type AmbulanceCrewMember = {
  id: string;
  name: string;
  document: string;
  license: string;
  phone: string;
  state: 'Activo' | 'Inactivo';
};

type GuardShift = {
  id: string;
  ambulanceId: string;
  crewMember: string;
  startTime: string;
};

type InvoiceRecord = {
  id: string;
  period: string;
  provider: string;
  services: number;
  total: string;
  state: string;
};

type LiquidationRecord = {
  id: string;
  period: string;
  provider: string;
  total: string;
  state: string;
};

type CatalogRow = {
  id: string;
  type: string;
  provider: string;
  concept: string;
  price: string;
};

const routes: Array<{ path: RoutePath; label: string; icon: string[] }> = [
  { path: '/carga', label: 'Carga', icon: cilMedicalCross },
  { path: '/operador', label: 'Operador', icon: cilTruck },
  { path: '/metricas', label: 'Métricas', icon: cilChartLine },
  { path: '/facturacion', label: 'Facturación', icon: cilDollar },
];

const loadSteps: Array<{ title: string; help: string }> = [
  { title: 'Paciente', help: 'autocompletado' },
  { title: 'Cobertura', help: 'obra social' },
  { title: 'Caso', help: 'triage / traslado' },
  { title: 'Revisión', help: 'confirmar' },
];

const patients: PatientRecord[] = [
  { id: 'p-001', fullName: 'María Pérez', dni: '34988721', obraSocial: 'OSDE', afiliado: 'A-229441', plan: 'Plan Oro', defaultHospital: 'Hospital San Juan', defaultMode: 'Emergencia' },
  { id: 'p-002', fullName: 'Jorge Gómez', dni: '31245988', obraSocial: 'Swiss Medical', afiliado: 'SM-884120', plan: 'Integral Plus', defaultHospital: 'Sanatorio Delta', defaultMode: 'Traslado' },
  { id: 'p-003', fullName: 'Ana Torres', dni: '36500111', obraSocial: 'PAMI', afiliado: 'PM-552104', plan: 'Cobertura Base', defaultHospital: 'Hospital Italiano', defaultMode: 'Traslado' },
  { id: 'p-004', fullName: 'Luis Herrera', dni: '29874120', obraSocial: 'Medicus', afiliado: 'MD-119802', plan: 'Gold', defaultHospital: 'Clínica Norte', defaultMode: 'Emergencia' },
  { id: 'p-005', fullName: 'Carla Ruiz', dni: '33880044', obraSocial: 'OSDE', afiliado: 'A-229998', plan: 'Plan Azul', defaultHospital: 'Hospital Alemán', defaultMode: 'Traslado' },
];

const initialLoadDraft = (): LoadDraft => ({
  query: 'Mar',
  selectedPatientId: null,
  fullName: '',
  dni: '',
  obraSocial: '',
  afiliado: '',
  plan: '',
  mode: 'Emergencia',
  triageLevel: 'Amarillo',
  triageNote: 'Dolor torácico con disnea',
  hospital: 'Hospital San Juan',
  schedule: '20/07/2026 18:30',
  needsReturn: true,
});

const recentCasesSeed: RecentCase[] = [
  { id: 'C-1042', time: '09:42', patient: 'María Pérez', dni: '34.988.721', obraSocial: 'OSDE', afiliado: 'A-229441', plan: 'Plan Oro', mode: 'Emergencia', detail: 'Triage rojo · dolor de pecho', status: 'Asignado' },
  { id: 'C-1041', time: '09:35', patient: 'Jorge Gómez', dni: '31.245.988', obraSocial: 'Swiss Medical', afiliado: 'SM-884120', plan: 'Integral Plus', mode: 'Traslado', detail: 'Hospital Delta · ida y vuelta', status: 'Programado' },
  { id: 'C-1040', time: '09:21', patient: 'Ana Torres', dni: '36.500.111', obraSocial: 'PAMI', afiliado: 'PM-552104', plan: 'Base', mode: 'Traslado', detail: 'Hospital Italiano · sin retorno', status: 'En curso' },
  { id: 'C-1039', time: '09:10', patient: 'Luis Herrera', dni: '29.874.120', obraSocial: 'Medicus', afiliado: 'MD-119802', plan: 'Gold', mode: 'Emergencia', detail: 'Triage rojo · disnea', status: 'Pendiente' },
  { id: 'C-1038', time: '08:58', patient: 'Carla Ruiz', dni: '33.880.044', obraSocial: 'OSDE', afiliado: 'A-229998', plan: 'Plan Azul', mode: 'Traslado', detail: 'Clínica Norte · ida y vuelta', status: 'Asignado' },
  { id: 'C-1037', time: '08:47', patient: 'Pedro Sánchez', dni: '27.666.300', obraSocial: 'Galeno', afiliado: 'GL-007812', plan: 'Plus', mode: 'Emergencia', detail: 'Triage amarillo · trauma', status: 'En camino' },
  { id: 'C-1036', time: '08:32', patient: 'Silvia Castro', dni: '22.145.991', obraSocial: 'Swiss Medical', afiliado: 'SM-220115', plan: 'Platinum', mode: 'Traslado', detail: 'Sanatorio Central · retorno', status: 'Programado' },
  { id: 'C-1035', time: '08:21', patient: 'Nicolás Vega', dni: '30.112.780', obraSocial: 'OSDE', afiliado: 'A-223410', plan: 'Plan Oro', mode: 'Emergencia', detail: 'Triage rojo · politrauma', status: 'Pendiente' },
  { id: 'C-1034', time: '08:05', patient: 'Lucía Paz', dni: '32.009.114', obraSocial: 'PAMI', afiliado: 'PM-665778', plan: 'Base', mode: 'Traslado', detail: 'Hospital de Clínicas · ida y vuelta', status: 'Emitido' },
  { id: 'C-1033', time: '07:54', patient: 'Tomás Ibarra', dni: '28.441.009', obraSocial: 'Medifé', afiliado: 'MF-300901', plan: 'Premium', mode: 'Emergencia', detail: 'Triage verde · descompensación leve', status: 'Asignado' },
];

const operatorSeed: OperatorIncident[] = [
  { id: 'INC-1001', nro: '001363', patient: 'Antonella Cacharo', title: 'Dificultad para respirar', domicilio: 'Olavarria 579 * 5 D', edad: '89A', barrio: 'Capital Federal', zone: 'Norte', category: 'Emergencia', delay: 8, ambulance: 'A-14', eta: '8m', state: 'Pendiente', note: 'Paciente estable, dolor súbito', sexo: 'F', triageColor: 'Amarillo', obraSocial: 'PAMI', afiliado: '140184633708/16', plan: '61009 - Hospital', copago: '0', telefono: '1557010041', receptor: '**PAMI', despachador: 'MMARTINEZ', horaEnvio: '14:08', horaRecepcion: '14:23', recursoNecesario: 'Complejidad media' },
  { id: 'INC-1002', nro: '001364', patient: 'Elena Ramos', title: 'Confusion / obnubilacion', domicilio: 'Yatay 120 * 10 B', edad: '92A', barrio: 'Capital Federal', zone: 'Centro', category: 'Traslado', delay: 11, ambulance: 'A-14', eta: '11m', state: 'Asignado', note: 'Derivación programada', sexo: 'F', triageColor: 'Amarillo', obraSocial: 'OSDE', afiliado: 'A-229441', plan: 'Plan Oro', copago: '0', telefono: '1145223310', receptor: 'OSDE', despachador: 'RGOMEZ', horaEnvio: '09:12', horaRecepcion: '09:20', recursoNecesario: 'Soporte basico' },
  { id: 'INC-1003', nro: '001348', patient: 'Roberto Díaz', title: 'Dolor abdominal', domicilio: 'Caracas 4604 * Casa', edad: '84A', barrio: 'Capital - Villa Pueyrredon', zone: 'Sur', category: 'Emergencia', delay: 15, ambulance: 'C-11', eta: '15m', state: 'En camino', note: 'Oxígeno en curso', sexo: 'M', triageColor: 'Amarillo', obraSocial: 'Swiss Medical', afiliado: 'SM-884120', plan: 'Integral Plus', copago: '2400', telefono: '1133456781', receptor: 'SWISS', despachador: 'LPAEZ', horaEnvio: '10:41', horaRecepcion: '10:52', recursoNecesario: 'Complejidad media' },
  { id: 'INC-1004', nro: '001369', patient: 'Marta Sosa', title: 'Sintomas respiratorios', domicilio: 'Calle 841 2441 * Fondo', edad: '80A', barrio: 'San Francisco Solano', zone: 'Oeste', category: 'Emergencia', delay: 24, ambulance: 'A-14', eta: '24m', state: 'Pendiente', note: 'Control y traslado', sexo: 'M', triageColor: 'Amarillo', obraSocial: 'Medicus', afiliado: 'MD-119802', plan: 'Gold', copago: '0', telefono: '1167890231', receptor: 'MEDICUS', despachador: 'FSANCHEZ', horaEnvio: '11:03', horaRecepcion: '11:19', recursoNecesario: 'Soporte basico' },
  { id: 'INC-1005', nro: '001358', patient: 'Laura Méndez', title: 'Sondas y cateteres', domicilio: 'Guayra 2207 * CS', edad: '68A', barrio: 'Capital - Nuñez', zone: 'Norte', category: 'Programado', delay: 19, ambulance: 'E-02', eta: '19m', state: 'Asignado', note: 'Retiro de paciente', sexo: 'F', triageColor: 'Verde', obraSocial: 'Galeno', afiliado: 'GL-007812', plan: 'Plus', copago: '0', telefono: '1122334455', receptor: 'GALENO', despachador: 'JTORRES', horaEnvio: '08:50', horaRecepcion: '08:59', recursoNecesario: 'Traslado programado' },
];


const ambulanceSeed: Ambulance[] = [
  { id: 'A-14', name: 'A-14', zone: 'Norte', state: 'Disponible', eta: '8m', crew: '2x EMT' },
  { id: 'B-03', name: 'B-03', zone: 'Centro', state: 'En servicio', eta: '11m', crew: '1x médico + 1x EMT' },
  { id: 'C-11', name: 'C-11', zone: 'Sur', state: 'En camino', eta: '15m', crew: '2x EMT' },
  { id: 'D-08', name: 'D-08', zone: 'Oeste', state: 'Disponible', eta: '24m', crew: '1x médico + 1x EMT' },
  { id: 'E-02', name: 'E-02', zone: 'Norte', state: 'Reservada', eta: '19m', crew: '2x EMT' },
];

const crewSeed: AmbulanceCrewMember[] = [
  { id: 'AMB-001', name: 'Juan Pérez', document: '28.341.920', license: 'CNRT-8821', phone: '11 4555-2100', state: 'Activo' },
  { id: 'AMB-002', name: 'Sofía Martínez', document: '31.204.881', license: 'CNRT-9124', phone: '11 6210-4482', state: 'Activo' },
  { id: 'AMB-003', name: 'Diego Luna', document: '29.877.340', license: 'CNRT-7740', phone: '11 5033-7741', state: 'Activo' },
];

const guardSeed: GuardShift[] = [
  { id: 'G-A14', ambulanceId: 'A-14', crewMember: 'Juan Pérez', startTime: '08:00' },
  { id: 'G-B03', ambulanceId: 'B-03', crewMember: 'Sofía Martínez', startTime: '08:00' },
];

function initialAmbulanceQueues() {
  return Object.fromEntries(
    ambulanceSeed.map((ambulance) => [
      ambulance.id,
      operatorSeed.filter((incident) => incident.ambulance === ambulance.id).map((incident) => incident.id),
    ]),
  );
}

const triageMetricSeed = [
  { color: 'Rojo', className: 'danger', cases: 34, arrival: 7, attention: 42 },
  { color: 'Amarillo', className: 'yellow', cases: 58, arrival: 13, attention: 31 },
  { color: 'Verde', className: 'ok', cases: 41, arrival: 21, attention: 19 },
  { color: 'Negro', className: 'black', cases: 3, arrival: 5, attention: 16 },
];

const metricPeriodOptions: Array<{ value: MetricsPeriod; label: string; factor: number }> = [
  { value: '15m', label: 'Últimos 15 min', factor: 0.12 },
  { value: '30m', label: 'Últimos 30 min', factor: 0.22 },
  { value: '1h', label: 'Última hora', factor: 0.38 },
  { value: '6h', label: 'Últimas 6 horas', factor: 0.62 },
  { value: '12h', label: 'Últimas 12 horas', factor: 0.8 },
  { value: '1d', label: 'Último día', factor: 1 },
  { value: '3d', label: 'Últimos 3 días', factor: 2.45 },
];

const billingGenerationSeed: InvoiceRecord[] = [
  { id: 'GEN-182', period: '01/07 - 10/07', provider: 'PAMI', services: 24, total: '$594.000', state: 'Pendiente' },
  { id: 'GEN-183', period: '01/07 - 10/07', provider: 'Swiss Medical', services: 18, total: '$412.800', state: 'Pendiente' },
  { id: 'GEN-184', period: '01/07 - 10/07', provider: 'OSDE', services: 11, total: '$286.300', state: 'Pendiente' },
  { id: 'GEN-185', period: '01/07 - 10/07', provider: 'Medicus', services: 9, total: '$198.000', state: 'Pendiente' },
  { id: 'GEN-186', period: '01/07 - 10/07', provider: 'Galeno', services: 7, total: '$162.000', state: 'Pendiente' },
  { id: 'GEN-187', period: '01/07 - 10/07', provider: 'PAMI', services: 15, total: '$338.000', state: 'Pendiente' },
  { id: 'GEN-188', period: '01/07 - 10/07', provider: 'OSDE', services: 5, total: '$104.000', state: 'Pendiente' },
  { id: 'GEN-189', period: '01/07 - 10/07', provider: 'Swiss Medical', services: 14, total: '$272.000', state: 'Pendiente' },
  { id: 'GEN-190', period: '01/07 - 10/07', provider: 'Medifé', services: 12, total: '$244.000', state: 'Pendiente' },
  { id: 'GEN-191', period: '01/07 - 10/07', provider: 'PAMI', services: 8, total: '$187.000', state: 'Pendiente' },
];

const invoiceHistorySeed: InvoiceRecord[] = [
  { id: 'FAC-0182', period: 'Julio 2026', provider: 'Swiss Medical', services: 24, total: '$182.400', state: 'Emitida' },
  { id: 'FAC-0183', period: 'Julio 2026', provider: 'PAMI', services: 38, total: '$311.200', state: 'Emitida' },
  { id: 'FAC-0184', period: 'Junio 2026', provider: 'OSDE', services: 31, total: '$266.000', state: 'Emitida' },
  { id: 'FAC-0185', period: 'Junio 2026', provider: 'Medicus', services: 12, total: '$104.000', state: 'Emitida' },
];

const liquidationHistorySeed: LiquidationRecord[] = [
  { id: 'LIQ-044', period: 'Julio 2026', provider: 'A-14', total: '$214.000', state: 'Pendiente' },
  { id: 'LIQ-045', period: 'Julio 2026', provider: 'B-03', total: '$148.000', state: 'En revisión' },
  { id: 'LIQ-046', period: 'Junio 2026', provider: 'C-11', total: '$128.500', state: 'Cerrada' },
  { id: 'LIQ-047', period: 'Junio 2026', provider: 'D-08', total: '$98.000', state: 'Cerrada' },
];

const catalogSeed: CatalogRow[] = [
  { id: 'CAT-001', type: 'Emergencia', provider: 'General', concept: 'Base emergencia', price: '$18.500' },
  { id: 'CAT-002', type: 'Traslado', provider: 'General', concept: 'Traslado programado', price: '$24.000' },
  { id: 'CAT-003', type: 'Extra', provider: 'General', concept: 'Ida y vuelta', price: '$31.000' },
  { id: 'CAT-004', type: 'Emergencia', provider: 'PAMI', concept: 'Rojo / alta complejidad', price: '$42.000' },
  { id: 'CAT-005', type: 'Traslado', provider: 'OSDE', concept: 'Traslado interhospitalario', price: '$36.500' },
];

const symptoms = ['Dolor de pecho', 'Disnea', 'Fiebre', 'Trauma', 'Desmayo', 'Hemorragia'];
const triageLegend: Record<TriageLevel, string> = {
  Rojo: 'Inmediata: riesgo vital reversible con intervención rápida',
  Amarillo: 'Urgente: grave, puede esperar mientras se atienden los rojos',
  Verde: 'Baja prioridad: lesiones o cuadros leves',
  Negro: 'Fallecido / expectante: sin posibilidad razonable de supervivencia',
};

const incidentColumns: Array<{ key: IncidentSortColumn; label: string }> = [
  { key: 'category', label: 'Tipo' },
  { key: 'nro', label: 'Nro' },
  { key: 'domicilio', label: 'Domicilio' },
  { key: 'title', label: 'Motivo' },
  { key: 'edad', label: 'Edad' },
  { key: 'barrio', label: 'Zona/Barrio' },
  { key: 'ambulance', label: 'Mvl' },
  { key: 'delay', label: 'Duración' },
  { key: 'state', label: 'Estado' },
];

function getInitialPath(): RoutePath {
  const currentPath = window.location.pathname as RoutePath;
  if (currentPath === '/operador' || currentPath === '/metricas' || currentPath === '/facturacion' || currentPath === '/carga') {
    return currentPath;
  }

  return '/carga';
}

// el color de emergencia/traslado sale del triage cargado en el ingreso, no de la categoria
function triagePillClass(triageColor: TriageLevel) {
  if (triageColor === 'Rojo') return 'danger';
  if (triageColor === 'Amarillo') return 'yellow';
  if (triageColor === 'Negro') return 'black';
  return 'ok';
}

function ambulanceStatusLabel(ambulance: Ambulance) {
  return ambulance.outOfServiceReason ?? ambulance.state;
}

function ambulanceStatusClass(ambulance: Ambulance) {
  if (ambulance.state === 'Disponible') return 'ok';
  if (ambulance.state === 'En camino') return 'blue';
  if (ambulance.state === 'Fuera de servicio') return 'danger';
  return 'warn';
}

function incidentStatusClass(state: OperatorIncident['state']) {
  if (state === 'Pendiente') return 'warn';
  if (state === 'Asignado') return 'blue';
  if (state === 'Cancelado') return 'danger';
  return 'ok';
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [path, setPath] = useState<RoutePath>(getInitialPath());
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const [loadTab, setLoadTab] = useState<LoadTab>('casos');
  const [loadStep, setLoadStep] = useState<LoadStep>(1);
  const [loadDraft, setLoadDraft] = useState<LoadDraft>(initialLoadDraft());
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Dolor de pecho', 'Disnea']);
  const [recentCases, setRecentCases] = useState<RecentCase[]>(recentCasesSeed);
  const [guardShifts, setGuardShifts] = useState<GuardShift[]>(guardSeed);
  const [guardPreview, setGuardPreview] = useState<GuardShift[]>([]);
  const [guardFileName, setGuardFileName] = useState('');
  const [guardImportError, setGuardImportError] = useState('');
  const [crewMembers, setCrewMembers] = useState<AmbulanceCrewMember[]>(crewSeed);
  const [crewDraft, setCrewDraft] = useState({ name: '', document: '', license: '', phone: '' });
  const [ambulanceDraft, setAmbulanceDraft] = useState({ id: '', zone: 'Norte', eta: '10m', crew: '' });

  const [operatorTab, setOperatorTab] = useState<OperatorTab>('incidentes');
  const [operatorIncidents, setOperatorIncidents] = useState<OperatorIncident[]>(operatorSeed);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(ambulanceSeed);
  const [ambulanceQueues, setAmbulanceQueues] = useState<Record<string, string[]>>(initialAmbulanceQueues);
  const [selectedResourceId, setSelectedResourceId] = useState(ambulanceSeed[0]?.id ?? '');
  const [draggedQueueIncidentId, setDraggedQueueIncidentId] = useState<string | null>(null);
  const [queueDropTargetId, setQueueDropTargetId] = useState<string | null>(null);
  const [operatorFilters, setOperatorFilters] = useState({ zone: 'Todas', category: 'Todas', maxDelay: 'Todos', triage: 'Todos' });
  const [incidentSearch, setIncidentSearch] = useState('');
  const [incidentSort, setIncidentSort] = useState<{ column: IncidentSortColumn; direction: 'asc' | 'desc' }>({ column: 'nro', direction: 'asc' });
  const [ambulanceStatusFilter, setAmbulanceStatusFilter] = useState('Todos');
  const [ambulancePanelOpen, setAmbulancePanelOpen] = useState(true);
  const [ambulanceMenuId, setAmbulanceMenuId] = useState<string | null>(null);
  const [incidentMenuId, setIncidentMenuId] = useState<string | null>(null);
  const [caseModalId, setCaseModalId] = useState<string | null>(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>(ambulanceSeed[0]?.id ?? '');
  const [reassigning, setReassigning] = useState(false);
  const [expandedIncidentId, setExpandedIncidentId] = useState<string | null>(null);
  const [draggedAmbulanceId, setDraggedAmbulanceId] = useState<string | null>(null);
  const [dragOverIncidentId, setDragOverIncidentId] = useState<string | null>(null);

  const [metricsTab, setMetricsTab] = useState<MetricsTab>('operacion');
  const [metricsZone, setMetricsZone] = useState('Todas');
  const [metricsPeriod, setMetricsPeriod] = useState<MetricsPeriod>('1d');
  const [metricsStartDate, setMetricsStartDate] = useState('2026-09-15');
  const [metricsEndDate, setMetricsEndDate] = useState('2026-09-16');
  const [metricsAmbulanceId, setMetricsAmbulanceId] = useState(ambulanceSeed[0]?.id ?? '');

  const [billingTab, setBillingTab] = useState<BillingTab>('generacion');
  const [generationOpen, setGenerationOpen] = useState(false);
  const [generationStart, setGenerationStart] = useState('');
  const [generationEnd, setGenerationEnd] = useState('');
  const [generationRows] = useState<InvoiceRecord[]>(billingGenerationSeed);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceRecord[]>(invoiceHistorySeed);
  const [liquidationHistory] = useState<LiquidationRecord[]>(liquidationHistorySeed);
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>(catalogSeed);
  const [catalogDraft, setCatalogDraft] = useState({ type: 'Emergencia', provider: 'General', concept: '', price: '' });

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('ambulancias-theme') as Theme | null;
    const initialTheme: Theme = storedTheme === 'light' ? 'light' : 'dark';
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('ambulancias-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => {
      setPath(getInitialPath());
      setLoadModalOpen(false);
      setGenerationOpen(false);
      setCaseModalId(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.body.style.overflow = loadModalOpen || generationOpen || caseModalId ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loadModalOpen, generationOpen, caseModalId]);

  const navigate = (nextPath: RoutePath) => {
    if (nextPath === path) {
      return;
    }

    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    setLoadModalOpen(false);
    setGenerationOpen(false);
    setCaseModalId(null);
  };

  const selectedPatient = patients.find((patient) => patient.id === loadDraft.selectedPatientId) ?? null;
  const matchingPatients = patients.filter((patient) => {
    const query = loadDraft.query.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [patient.fullName, patient.dni, patient.obraSocial, patient.afiliado, patient.plan].join(' ').toLowerCase().includes(query);
  });

  const saveNewCase = () => {
    const patient = selectedPatient ?? matchingPatients[0] ?? null;
    const newCase: RecentCase = {
      id: `C-${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      patient: loadDraft.fullName || patient?.fullName || 'Paciente sin nombre',
      dni: loadDraft.dni || patient?.dni || '-',
      obraSocial: loadDraft.obraSocial || patient?.obraSocial || '-',
      afiliado: loadDraft.afiliado || patient?.afiliado || '-',
      plan: loadDraft.plan || patient?.plan || '-',
      mode: loadDraft.mode,
      detail: loadDraft.mode === 'Emergencia' ? `Triage ${loadDraft.triageLevel} · ${loadDraft.triageNote || 'sin detalle'}` : `${loadDraft.hospital || 'Traslado'} · ${loadDraft.needsReturn ? 'ida y vuelta' : 'solo ida'}`,
      status: 'Nuevo',
    };

    setRecentCases((current) => [newCase, ...current].slice(0, 10));
    setLoadDraft(initialLoadDraft());
    setLoadStep(1);
    setSelectedSymptoms(['Dolor de pecho', 'Disnea']);
    setLoadModalOpen(false);
  };

  const updateLoadDraft = (patch: Partial<LoadDraft>) => {
    setLoadDraft((current) => ({ ...current, ...patch }));
  };

  const selectPatient = (patient: PatientRecord) => {
    setLoadDraft((current) => ({
      ...current,
      query: patient.fullName,
      selectedPatientId: patient.id,
      fullName: patient.fullName,
      dni: patient.dni,
      obraSocial: patient.obraSocial,
      afiliado: patient.afiliado,
      plan: patient.plan,
      mode: patient.defaultMode,
      hospital: patient.defaultHospital,
    }));
  };

  const handleGuardFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setGuardFileName(file.name);
    setGuardImportError('');
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
      const parsed = rows.map((row, index) => {
        const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [
          key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
          value,
        ]));
        const ambulanceId = String(normalized.unidad || normalized.ambulancia || normalized.movil || '').trim();
        const crewMember = String(normalized.ambulanciero || normalized.chofer || normalized.personal || '').trim();
        const rawTime = normalized.hora || normalized.ingreso || normalized.inicio || '';
        const startTime = typeof rawTime === 'number' ? XLSX.SSF.format('hh:mm', rawTime) : String(rawTime).trim();
        return { id: `IMPORT-${Date.now()}-${index}`, ambulanceId, crewMember, startTime };
      }).filter((row) => row.ambulanceId && row.crewMember && row.startTime);

      if (!parsed.length) {
        setGuardPreview([]);
        setGuardImportError('No se encontraron filas válidas. Usá las columnas Unidad, Ambulanciero y Hora.');
        return;
      }
      setGuardPreview(parsed);
    } catch {
      setGuardPreview([]);
      setGuardImportError('No se pudo leer el archivo. Verificá que sea un Excel válido.');
    }
  };

  const confirmGuardImport = () => {
    if (!guardPreview.length) return;
    setGuardShifts(guardPreview);
    setAmbulances((current) => {
      const next = [...current];
      guardPreview.forEach((shift) => {
        const index = next.findIndex((ambulance) => ambulance.id === shift.ambulanceId);
        if (index >= 0) {
          next[index] = { ...next[index], state: 'Disponible', crew: shift.crewMember, outOfServiceReason: undefined };
        } else {
          next.push({ id: shift.ambulanceId, name: shift.ambulanceId, zone: 'Centro', state: 'Disponible', eta: '10m', crew: shift.crewMember });
        }
      });
      return next;
    });
    setAmbulanceQueues((current) => ({ ...current, ...Object.fromEntries(guardPreview.map((shift) => [shift.ambulanceId, current[shift.ambulanceId] ?? []])) }));
    setGuardPreview([]);
  };

  const downloadGuardTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { Unidad: 'A-14', Ambulanciero: 'Juan Pérez', Hora: '08:00' },
      { Unidad: 'B-03', Ambulanciero: 'Sofía Martínez', Hora: '08:00' },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guardia');
    XLSX.writeFile(workbook, 'plantilla-guardia.xlsx');
  };

  const addCrewMember = () => {
    if (!crewDraft.name.trim() || !crewDraft.document.trim() || !crewDraft.license.trim()) return;
    setCrewMembers((current) => [...current, { id: `AMB-${String(current.length + 1).padStart(3, '0')}`, ...crewDraft, state: 'Activo' }]);
    setCrewDraft({ name: '', document: '', license: '', phone: '' });
  };

  const addAmbulance = () => {
    const id = ambulanceDraft.id.trim().toUpperCase();
    if (!id || ambulances.some((ambulance) => ambulance.id === id)) return;
    setAmbulances((current) => [...current, { ...ambulanceDraft, id, name: id, state: 'Disponible' }]);
    setAmbulanceQueues((current) => ({ ...current, [id]: [] }));
    setAmbulanceDraft({ id: '', zone: 'Norte', eta: '10m', crew: '' });
  };

  const openLoadModal = () => {
    setLoadStep(1);
    setLoadDraft(initialLoadDraft());
    setSelectedSymptoms(['Dolor de pecho', 'Disnea']);
    setLoadModalOpen(true);
  };

  const handleLoadStepChange = (nextStep: LoadStep) => {
    if (nextStep === 2 && !loadDraft.selectedPatientId) {
      const match = matchingPatients[0];
      if (match) {
        selectPatient(match);
      }
    }

    setLoadStep(nextStep);
  };

  const filteredIncidents = operatorIncidents
    .filter((incident) => {
      if (operatorFilters.zone !== 'Todas' && incident.zone !== operatorFilters.zone) {
        return false;
      }

      if (operatorFilters.category !== 'Todas' && incident.category !== operatorFilters.category) {
        return false;
      }

      if (operatorFilters.maxDelay !== 'Todos' && incident.delay > Number(operatorFilters.maxDelay)) {
        return false;
      }

      if (operatorFilters.triage !== 'Todos' && incident.triageColor !== operatorFilters.triage) {
        return false;
      }

      if (incidentSearch.trim()) {
        const query = incidentSearch.trim().toLowerCase();
        const haystack = [
          incident.nro,
          incident.patient,
          incident.title,
          incident.domicilio,
          incident.edad,
          incident.barrio,
          incident.zone,
          incident.category,
          incident.ambulance,
          incident.state,
          incident.obraSocial,
          incident.afiliado,
        ].join(' ').toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => {
      const { column, direction } = incidentSort;
      const factor = direction === 'asc' ? 1 : -1;
      const leftValue = column === 'delay' ? left.delay : left[column];
      const rightValue = column === 'delay' ? right.delay : right[column];

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * factor;
      }

      return String(leftValue).localeCompare(String(rightValue), 'es') * factor;
    });

  const toggleIncidentSort = (column: IncidentSortColumn) => {
    setIncidentSort((current) => {
      if (current.column === column) {
        return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { column, direction: 'asc' };
    });
  };

  const filteredAmbulances = ambulances.filter((ambulance) => {
    if (ambulanceStatusFilter === 'Todos') {
      return true;
    }

    return ambulance.state === ambulanceStatusFilter;
  });

  const selectedResource = ambulances.find((ambulance) => ambulance.id === selectedResourceId) ?? null;
  const selectedResourceQueue = (ambulanceQueues[selectedResourceId] ?? [])
    .map((incidentId) => operatorIncidents.find((incident) => incident.id === incidentId))
    .filter((incident): incident is OperatorIncident => Boolean(incident));

  const moveIncidentToQueue = (incidentId: string, ambulanceId: string) => {
    setAmbulanceQueues((current) => {
      const next = Object.fromEntries(
        Object.entries(current).map(([id, queue]) => [id, queue.filter((queuedId) => queuedId !== incidentId)]),
      );
      next[ambulanceId] = [...(next[ambulanceId] ?? []), incidentId];
      return next;
    });
  };

  const removeIncidentFromQueues = (incidentId: string) => {
    setAmbulanceQueues((current) => Object.fromEntries(
      Object.entries(current).map(([ambulanceId, queue]) => [
        ambulanceId,
        queue.filter((queuedId) => queuedId !== incidentId),
      ]),
    ));
  };

  const setIncidentState = (incidentId: string, state: OperatorIncident['state']) => {
    if (state === 'Finalizado' || state === 'Cancelado') {
      removeIncidentFromQueues(incidentId);
    }
    if (state === 'Asignado' || state === 'En camino') {
      const incident = operatorIncidents.find((item) => item.id === incidentId);
      if (incident?.ambulance && incident.ambulance !== 'Sin asignar') {
        moveIncidentToQueue(incidentId, incident.ambulance);
      }
    }
    setOperatorIncidents((current) => current.map((incident) => (
      incident.id === incidentId ? { ...incident, state } : incident
    )));
    setIncidentMenuId(null);
  };

  const reorderQueue = (ambulanceId: string, incidentId: string, targetIncidentId: string) => {
    if (incidentId === targetIncidentId) return;
    setAmbulanceQueues((current) => {
      const queue = [...(current[ambulanceId] ?? [])];
      const fromIndex = queue.indexOf(incidentId);
      const targetIndex = queue.indexOf(targetIncidentId);
      if (fromIndex < 0 || targetIndex < 0) return current;
      queue.splice(fromIndex, 1);
      queue.splice(queue.indexOf(targetIncidentId), 0, incidentId);
      return { ...current, [ambulanceId]: queue };
    });
  };

  const setOutOfService = (ambulanceId: string, reason: OutOfServiceReason) => {
    setAmbulances((current) => current.map((ambulance) => (
      ambulance.id === ambulanceId
        ? { ...ambulance, state: 'Fuera de servicio', outOfServiceReason: reason }
        : ambulance
    )));
  };

  const returnToGuard = (ambulanceId: string) => {
    setAmbulances((current) => current.map((ambulance) => (
      ambulance.id === ambulanceId
        ? { ...ambulance, state: 'Disponible', outOfServiceReason: undefined }
        : ambulance
    )));
  };

  const setOperationalState = (ambulanceId: string, state: Extract<AmbulanceState, 'Disponible' | 'En camino' | 'En servicio'>) => {
    setAmbulances((current) => current.map((ambulance) => (
      ambulance.id === ambulanceId
        ? { ...ambulance, state, outOfServiceReason: undefined }
        : ambulance
    )));
    setAmbulanceMenuId(null);
  };

  const setUnavailableState = (ambulanceId: string, reason: OutOfServiceReason) => {
    setOutOfService(ambulanceId, reason);
    setAmbulanceMenuId(null);
  };

  const caseModalIncident = operatorIncidents.find((incident) => incident.id === caseModalId) ?? null;

  const openCaseModal = (incident: OperatorIncident) => {
    setCaseModalId(incident.id);
    setSelectedAmbulanceId(incident.ambulance && incident.ambulance !== 'Sin asignar' ? incident.ambulance : ambulances[0]?.id || '');
    setReassigning(incident.state === 'Pendiente');
  };

  const closeCaseModal = () => {
    setCaseModalId(null);
    setReassigning(false);
  };

  const toggleRowExpand = (id: string) => {
    setExpandedIncidentId((current) => (current === id ? null : id));
  };

  const confirmAssignment = () => {
    if (!caseModalIncident) {
      return;
    }

    moveIncidentToQueue(caseModalIncident.id, selectedAmbulanceId);
    setOperatorIncidents((current) => current.map((incident) => (incident.id === caseModalIncident.id ? { ...incident, ambulance: selectedAmbulanceId, state: 'Asignado' } : incident)));
    setReassigning(false);
  };

  const markEnRoute = () => {
    if (!caseModalIncident) {
      return;
    }

    setOperatorIncidents((current) => current.map((incident) => (incident.id === caseModalIncident.id ? { ...incident, state: 'En camino' } : incident)));
  };

  const assignAmbulanceToIncident = (incidentId: string, ambulanceId: string) => {
    moveIncidentToQueue(incidentId, ambulanceId);
    setOperatorIncidents((current) => current.map((incident) => (incident.id === incidentId ? { ...incident, ambulance: ambulanceId, state: 'Asignado' } : incident)));
  };

  const openGenerationModal = () => {
    setGenerationOpen(true);
  };

  const confirmGeneration = () => {
    const generated: InvoiceRecord = {
      id: `FAC-${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
      period: `${generationStart || 'Inicio pendiente'} - ${generationEnd || 'Fin pendiente'}`,
      provider: 'PAMI / Consolidadas',
      services: generationRows.length,
      total: '$594.000',
      state: 'Confirmada',
    };

    setInvoiceHistory((current) => [generated, ...current]);
    setGenerationOpen(false);
  };

  const addCatalogRow = () => {
    if (!catalogDraft.concept.trim() || !catalogDraft.price.trim()) {
      return;
    }

    setCatalogRows((current) => [
      {
        id: `CAT-${Math.floor(Date.now() / 1000).toString().slice(-4)}`,
        type: catalogDraft.type,
        provider: catalogDraft.provider,
        concept: catalogDraft.concept,
        price: catalogDraft.price,
      },
      ...current,
    ]);
    setCatalogDraft({ type: 'Emergencia', provider: 'General', concept: '', price: '' });
  };

  const periodFactor = metricsPeriod === 'custom'
    ? Math.max(0.4, Math.min(8, (Math.abs(new Date(metricsEndDate).getTime() - new Date(metricsStartDate).getTime()) / 86_400_000) + 1))
    : metricPeriodOptions.find((option) => option.value === metricsPeriod)?.factor ?? 1;
  const zoneFactor = metricsZone === 'Todas' ? 1 : metricsZone === 'Centro' ? 0.34 : metricsZone === 'Norte' ? 0.27 : metricsZone === 'Sur' ? 0.23 : 0.16;
  const metricScale = periodFactor * zoneFactor;
  const triageMetrics = triageMetricSeed.map((metric) => ({ ...metric, cases: Math.max(0, Math.round(metric.cases * metricScale)) }));
  const totalCases = triageMetrics.reduce((total, metric) => total + metric.cases, 0);
  const averageArrival = Math.round(triageMetrics.reduce((total, metric) => total + metric.arrival * metric.cases, 0) / Math.max(1, totalCases));
  const averageAttention = Math.round(triageMetrics.reduce((total, metric) => total + metric.attention * metric.cases, 0) / Math.max(1, totalCases));
  const recategorizedCases = Math.round(totalCases * 0.11);
  const timelineLabels = metricsPeriod === '3d'
    ? ['Día 1 00h', 'Día 1 12h', 'Día 2 00h', 'Día 2 12h', 'Día 3 00h', 'Ahora']
    : metricsPeriod === '1d' || metricsPeriod === 'custom'
      ? ['00h', '04h', '08h', '12h', '16h', '20h', 'Ahora']
      : ['Inicio', '20%', '40%', '60%', '80%', 'Ahora'];
  const timelineCases = timelineLabels.map((_, index) => Math.max(0, Math.round((6 + ((index * 7) % 13)) * metricScale)));
  const selectedMetricsAmbulance = ambulances.find((ambulance) => ambulance.id === metricsAmbulanceId) ?? ambulances[0];
  const ambulanceIndex = Math.max(0, ambulances.findIndex((ambulance) => ambulance.id === metricsAmbulanceId));
  const ambulanceCaseCount = Math.max(0, Math.round((18 + ambulanceIndex * 3) * periodFactor));
  const ambulanceTriageCases = triageMetricSeed.map((metric, index) => Math.max(0, Math.round((metric.cases / 7 + ambulanceIndex - index) * periodFactor)));
  const chartGridColor = theme === 'dark' ? 'rgba(203, 213, 225, 0.12)' : 'rgba(52, 72, 92, 0.12)';
  const chartTextColor = theme === 'dark' ? '#cbd5e1' : '#43566b';
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: chartTextColor } } },
    scales: {
      x: { ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
      y: { beginAtZero: true, ticks: { color: chartTextColor }, grid: { color: chartGridColor } },
    },
  };

  return (
    <div className="app-shell">
      <CHeader position="sticky" className="app-header">
        <CContainer fluid className="app-header-inner">
          <div className="app-header-start">
            <CHeaderToggler className="sidebar-toggle" aria-label="Mostrar u ocultar menú" onClick={() => setSidebarOpen((current) => !current)}>
              <CIcon icon={cilMenu} width={20} height={20} />
            </CHeaderToggler>
            <CHeaderBrand className="app-brand">Sistema de Ambulancias</CHeaderBrand>
          </div>
          <CHeaderNav className="app-header-nav">
            {path === '/carga' && (
              <>
                <CNavItem><CNavLink href="#" active={loadTab === 'casos'} onClick={(event) => { event.preventDefault(); setLoadTab('casos'); }}>Casos</CNavLink></CNavItem>
                <CNavItem><CNavLink href="#" active={loadTab === 'guardia'} onClick={(event) => { event.preventDefault(); setLoadTab('guardia'); }}>Carga de guardia</CNavLink></CNavItem>
                <CNavItem><CNavLink href="#" active={loadTab === 'recursos'} onClick={(event) => { event.preventDefault(); setLoadTab('recursos'); }}>Recursos</CNavLink></CNavItem>
              </>
            )}
            {path === '/operador' && (
              <>
                <CNavItem>
                  <CNavLink href="#" active={operatorTab === 'incidentes'} onClick={(event) => { event.preventDefault(); setOperatorTab('incidentes'); }}>Incidentes</CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink href="#" active={operatorTab === 'monitoreo'} onClick={(event) => { event.preventDefault(); setOperatorTab('monitoreo'); }}>Monitoreo</CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink href="#" active={operatorTab === 'recursos'} onClick={(event) => { event.preventDefault(); setOperatorTab('recursos'); }}>Recursos</CNavLink>
                </CNavItem>
              </>
            )}
            {path === '/facturacion' && (
              <>
                <CNavItem>
                  <CNavLink href="#" active={billingTab === 'generacion'} onClick={(event) => { event.preventDefault(); setBillingTab('generacion'); }}>Generación</CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink href="#" active={billingTab === 'historicos'} onClick={(event) => { event.preventDefault(); setBillingTab('historicos'); }}>Históricos</CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink href="#" active={billingTab === 'catalogo'} onClick={(event) => { event.preventDefault(); setBillingTab('catalogo'); }}>Catálogo</CNavLink>
                </CNavItem>
              </>
            )}
            {path === '/metricas' && (
              <>
                <CNavItem>
                  <CNavLink href="#" active={metricsTab === 'operacion'} onClick={(event) => { event.preventDefault(); setMetricsTab('operacion'); }}>Operación</CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink href="#" active={metricsTab === 'ambulancias'} onClick={(event) => { event.preventDefault(); setMetricsTab('ambulancias'); }}>Por ambulancia</CNavLink>
                </CNavItem>
              </>
            )}
          </CHeaderNav>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <CIcon icon={theme === 'dark' ? cilMoon : cilSun} width={16} height={16} className="theme-toggle-icon" /> {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </CContainer>
      </CHeader>

      <main className="main-layout">
        <CSidebar position="sticky" visible={sidebarOpen} onVisibleChange={(visible) => setSidebarOpen(visible)} className="app-sidebar">
          <CSidebarNav>
            {routes.map((routeItem) => (
              <CNavItem key={routeItem.path}>
                <CNavLink href="#" active={path === routeItem.path} onClick={(event) => { event.preventDefault(); navigate(routeItem.path); }}>
                  <CIcon customClassName="nav-icon" icon={routeItem.icon} width={16} height={16} /> {routeItem.label}
                </CNavLink>
              </CNavItem>
            ))}
          </CSidebarNav>
        </CSidebar>

        <section className="route-content">
          {path === '/carga' && (
            <section className="page-stack">
              {loadTab === 'casos' && (
                <>
                  <div className="page-toolbar">
                    <button className="action primary" onClick={openLoadModal}>Nuevo caso</button>
                  </div>
                  <div className="card panel">
                    <div className="section-head">
                      <h3>Últimos 10 casos</h3>
                      <span className="badge blue">Ingreso</span>
                    </div>
                    <div className="table load-table">
                      <div className="table-head load-grid-head">
                        <span>Hora</span><span>Paciente</span><span>Obra social</span><span>Detalle</span><span>Estado</span>
                      </div>
                      {recentCases.map((item) => (
                        <div className="table-row load-grid-row" key={item.id}>
                          <strong>{item.time}</strong>
                          <span>{item.patient}<small>DNI {item.dni}</small></span>
                          <span>{item.obraSocial}<small>{item.afiliado} · {item.plan}</small></span>
                          <span>{item.detail}</span>
                          <span className={`pill ${item.mode === 'Emergencia' ? 'danger' : 'blue'}`}>{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {loadTab === 'guardia' && (
                <div className="guard-load-layout">
                  <section className="card panel guard-upload-panel">
                    <div className="section-head">
                      <div><h3>Carga de guardia</h3><p>Importá la unidad, el ambulanciero y la hora de inicio.</p></div>
                      <button className="action" onClick={downloadGuardTemplate}>Descargar plantilla</button>
                    </div>
                    <label className="excel-dropzone">
                      <input type="file" accept=".xlsx,.xls" onChange={handleGuardFile} />
                      <strong>{guardFileName || 'Seleccionar archivo Excel'}</strong>
                      <span>Columnas requeridas: Unidad, Ambulanciero, Hora</span>
                    </label>
                    {guardImportError && <div className="callout import-error">{guardImportError}</div>}
                    {guardPreview.length > 0 && (
                      <>
                        <div className="section-head"><h3>Vista previa</h3><span className="badge blue">{guardPreview.length} filas</span></div>
                        <div className="guard-table">
                          <div className="guard-row guard-head"><span>Unidad</span><span>Ambulanciero</span><span>Hora</span></div>
                          {guardPreview.map((shift) => <div className="guard-row" key={shift.id}><strong>{shift.ambulanceId}</strong><span>{shift.crewMember}</span><span>{shift.startTime}</span></div>)}
                        </div>
                        <div className="button-row"><button className="action primary" onClick={confirmGuardImport}>Aplicar guardia</button><button className="action" onClick={() => setGuardPreview([])}>Descartar</button></div>
                      </>
                    )}
                  </section>

                  <section className="card panel">
                    <div className="section-head"><h3>Guardia vigente</h3><span className="badge ok">{guardShifts.length} unidades</span></div>
                    <div className="guard-table">
                      <div className="guard-row guard-head"><span>Unidad</span><span>Ambulanciero</span><span>Ingreso</span></div>
                      {guardShifts.map((shift) => <div className="guard-row" key={shift.id}><strong>{shift.ambulanceId}</strong><span>{shift.crewMember}</span><span>{shift.startTime}</span></div>)}
                    </div>
                  </section>
                </div>
              )}

              {loadTab === 'recursos' && (
                <div className="load-resources-grid">
                  <section className="card panel resource-load-panel">
                    <div className="section-head"><h3>Alta de ambulanciero</h3><span className="badge">Personal</span></div>
                    <div className="resource-form-grid">
                      <label>Nombre y apellido<input className="form-input" value={crewDraft.name} onChange={(event) => setCrewDraft((current) => ({ ...current, name: event.currentTarget.value }))} /></label>
                      <label>DNI<input className="form-input" value={crewDraft.document} onChange={(event) => setCrewDraft((current) => ({ ...current, document: event.currentTarget.value }))} /></label>
                      <label>Licencia<input className="form-input" value={crewDraft.license} onChange={(event) => setCrewDraft((current) => ({ ...current, license: event.currentTarget.value }))} /></label>
                      <label>Teléfono<input className="form-input" value={crewDraft.phone} onChange={(event) => setCrewDraft((current) => ({ ...current, phone: event.currentTarget.value }))} /></label>
                    </div>
                    <button className="action primary" onClick={addCrewMember}>Agregar ambulanciero</button>
                    <div className="resource-record-list">
                      {crewMembers.map((member) => <div className="resource-record" key={member.id}><span><strong>{member.name}</strong><small>{member.document} · {member.license}</small></span><span className="pill ok">{member.state}</span></div>)}
                    </div>
                  </section>

                  <section className="card panel resource-load-panel">
                    <div className="section-head"><h3>Alta de ambulancia</h3><span className="badge blue">Unidad</span></div>
                    <div className="resource-form-grid">
                      <label>ID de unidad<input className="form-input" placeholder="Ej. F-09" value={ambulanceDraft.id} onChange={(event) => setAmbulanceDraft((current) => ({ ...current, id: event.currentTarget.value }))} /></label>
                      <label>Zona<select className="form-input" value={ambulanceDraft.zone} onChange={(event) => setAmbulanceDraft((current) => ({ ...current, zone: event.currentTarget.value }))}><option>Norte</option><option>Centro</option><option>Sur</option><option>Oeste</option></select></label>
                      <label>ETA base<input className="form-input" value={ambulanceDraft.eta} onChange={(event) => setAmbulanceDraft((current) => ({ ...current, eta: event.currentTarget.value }))} /></label>
                      <label>Dotación / responsable<select className="form-input" value={ambulanceDraft.crew} onChange={(event) => setAmbulanceDraft((current) => ({ ...current, crew: event.currentTarget.value }))}><option value="">Sin asignar</option>{crewMembers.filter((member) => member.state === 'Activo').map((member) => <option key={member.id}>{member.name}</option>)}</select></label>
                    </div>
                    <button className="action primary" onClick={addAmbulance}>Agregar ambulancia</button>
                    <div className="resource-record-list">
                      {ambulances.map((ambulance) => <div className="resource-record" key={ambulance.id}><span><strong>{ambulance.id}</strong><small>{ambulance.zone} · {ambulance.crew || 'Sin dotación'}</small></span><span className={`pill ${ambulanceStatusClass(ambulance)}`}>{ambulanceStatusLabel(ambulance)}</span></div>)}
                    </div>
                  </section>
                </div>
              )}
            </section>
          )}

          {path === '/operador' && (
            <section className="page-stack">
              {operatorTab === 'incidentes' && (
                <div className={ambulancePanelOpen ? 'operator-incidents-layout' : 'operator-incidents-layout ambulance-panel-collapsed'}>
                  <div className="card panel operator-incidents-panel">
                    <div className="section-head">
                      <h3>Incidentes asignados y por asignar</h3>
                      <div className="section-head-actions">
                        {!ambulancePanelOpen && (
                          <button className="action" onClick={() => setAmbulancePanelOpen(true)}>Mostrar ambulancias</button>
                        )}
                        <span className="badge">Tabla</span>
                      </div>
                    </div>
                    <div className="filter-bar">
                      <select className="form-input compact-select" value={operatorFilters.zone} onChange={(event) => setOperatorFilters((current) => ({ ...current, zone: event.currentTarget.value }))}>
                        <option value="Todas">Zona</option>
                        <option value="Norte">Norte</option>
                        <option value="Centro">Centro</option>
                        <option value="Sur">Sur</option>
                        <option value="Oeste">Oeste</option>
                      </select>
                      <select className="form-input compact-select" value={operatorFilters.category} onChange={(event) => setOperatorFilters((current) => ({ ...current, category: event.currentTarget.value }))}>
                        <option value="Todas">Categoría</option>
                        <option value="Emergencia">Emergencia</option>
                        <option value="Traslado">Traslado</option>
                        <option value="Programado">Programado</option>
                      </select>
                      <select className="form-input compact-select" value={operatorFilters.maxDelay} onChange={(event) => setOperatorFilters((current) => ({ ...current, maxDelay: event.currentTarget.value }))}>
                        <option value="Todos">Demora</option>
                        <option value="10">Hasta 10m</option>
                        <option value="20">Hasta 20m</option>
                        <option value="30">Hasta 30m</option>
                      </select>
                      <select className="form-input compact-select" value={operatorFilters.triage} onChange={(event) => setOperatorFilters((current) => ({ ...current, triage: event.currentTarget.value }))}>
                        <option value="Todos">Triage</option>
                        <option value="Rojo">🔴 Rojo</option>
                        <option value="Amarillo">🟡 Amarillo</option>
                        <option value="Verde">🟢 Verde</option>
                        <option value="Negro">⚫ Negro</option>
                      </select>
                      <input
                        className="form-input compact-input search-input"
                        value={incidentSearch}
                        onChange={(event) => setIncidentSearch(event.currentTarget.value)}
                        placeholder="Buscar incidente (nro, motivo, domicilio, obra social...)"
                      />
                    </div>
                    <div className="table operator-table">
                      <div className="table-head incident-grid-head">
                        {incidentColumns.map((column) => (
                          <button
                            type="button"
                            key={column.key}
                            className={incidentSort.column === column.key ? 'sortable-head active' : 'sortable-head'}
                            onClick={() => toggleIncidentSort(column.key)}
                          >
                            {column.label}
                            {incidentSort.column === column.key && (
                              <span className="sort-arrow">{incidentSort.direction === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {filteredIncidents.map((incident) => (
                        <div
                          role="button"
                          tabIndex={0}
                          className={[
                            'table-row incident-grid-row',
                            incident.id === expandedIncidentId ? 'expanded' : '',
                            incident.id === dragOverIncidentId ? 'drop-target' : '',
                            incident.id === incidentMenuId ? 'menu-open' : '',
                          ].join(' ').trim()}
                          key={incident.id}
                          aria-expanded={incident.id === expandedIncidentId}
                          onClick={() => toggleRowExpand(incident.id)}
                          onDoubleClick={() => openCaseModal(incident)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              toggleRowExpand(incident.id);
                            }
                          }}
                          onDragOver={(event) => {
                            if (!draggedAmbulanceId) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = 'copy';
                            setDragOverIncidentId(incident.id);
                          }}
                          onDragLeave={() => setDragOverIncidentId((current) => (current === incident.id ? null : current))}
                          onDrop={(event) => {
                            event.preventDefault();
                            const ambulanceId = event.dataTransfer.getData('text/ambulance-id') || draggedAmbulanceId;
                            if (ambulanceId) {
                              assignAmbulanceToIncident(incident.id, ambulanceId);
                            }
                            setDragOverIncidentId(null);
                            setDraggedAmbulanceId(null);
                          }}
                        >
                          <span className={`pill ${triagePillClass(incident.triageColor)}`}>{incident.triageColor}</span>
                          <strong>{incident.nro}</strong>
                          <span className="cell-truncate">{incident.domicilio}</span>
                          <span className="cell-truncate">{incident.title}</span>
                          <span>{incident.edad}</span>
                          <span className="cell-truncate">{incident.barrio}</span>
                          <span>{incident.ambulance}</span>
                          <span>{incident.delay}m</span>
                          <span className="incident-status-cell">
                            <span className={`pill ${incidentStatusClass(incident.state)}`}>{incident.state}</span>
                            <button
                              type="button"
                              className="icon-action incident-menu-trigger"
                              aria-label={`Cambiar estado del incidente ${incident.nro}`}
                              title="Cambiar estado"
                              onClick={(event) => {
                                event.stopPropagation();
                                setIncidentMenuId((current) => current === incident.id ? null : incident.id);
                              }}
                              onDoubleClick={(event) => event.stopPropagation()}
                            >
                              ⋮
                            </button>
                            {incidentMenuId === incident.id && (
                              <span
                                className="incident-status-menu"
                                onClick={(event) => event.stopPropagation()}
                                onDoubleClick={(event) => event.stopPropagation()}
                              >
                                <button onClick={() => setIncidentState(incident.id, 'Pendiente')}>Pendiente</button>
                                <button onClick={() => setIncidentState(incident.id, 'Asignado')}>Asignado</button>
                                <button onClick={() => setIncidentState(incident.id, 'En camino')}>En camino</button>
                                <button onClick={() => setIncidentState(incident.id, 'Finalizado')}>Finalizado</button>
                                <button className="danger-action" onClick={() => setIncidentState(incident.id, 'Cancelado')}>Cancelar</button>
                              </span>
                            )}
                          </span>
                          {incident.id === expandedIncidentId && (
                            <div className="incident-expanded-details">
                              <span><strong>Paciente:</strong> {incident.patient}</span>
                              <span><strong>Zona:</strong> {incident.zone} · {incident.barrio}</span>
                              <span><strong>Triage:</strong> {incident.triageColor}</span>
                              <span><strong>ETA:</strong> {incident.eta}</span>
                              <span><strong>Recurso:</strong> {incident.recursoNecesario}</span>
                              <span><strong>Observación:</strong> {incident.note || 'Sin observaciones'}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {!filteredIncidents.length && (
                        <div className="table-row incident-grid-row empty-row">
                          <span>Sin resultados para esta búsqueda o filtros.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {ambulancePanelOpen && <aside className="card panel ambulance-sidebar">
                    <div className="section-head">
                      <h3>Ambulancias</h3>
                      <button
                        className="icon-action"
                        type="button"
                        title="Ocultar panel de ambulancias"
                        aria-label="Ocultar panel de ambulancias"
                        onClick={() => {
                          setAmbulancePanelOpen(false);
                          setAmbulanceMenuId(null);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="field-row ambulance-filter-box">
                      <label>Filtrar por estado</label>
                      <select className="form-input compact-select" value={ambulanceStatusFilter} onChange={(event) => setAmbulanceStatusFilter(event.currentTarget.value)}>
                        <option value="Todos">Todos</option>
                        <option value="Disponible">Disponible</option>
                        <option value="En servicio">En servicio</option>
                        <option value="En camino">En camino</option>
                        <option value="Reservada">Reservada</option>
                        <option value="Fuera de servicio">Fuera de servicio</option>
                      </select>
                    </div>
                    <p className="hint">Arrastrá una ambulancia y soltala sobre un incidente para asignarla al toque.</p>
                    <div className="ambulance-sidebar-list">
                      {filteredAmbulances.map((ambulance) => (
                        <article
                          className={ambulance.id === draggedAmbulanceId ? 'ambulance-sidebar-card dragging' : 'ambulance-sidebar-card'}
                          key={ambulance.id}
                          draggable={ambulance.state !== 'Fuera de servicio'}
                          onDragStart={(event) => {
                            if (ambulance.state === 'Fuera de servicio') {
                              event.preventDefault();
                              return;
                            }
                            event.dataTransfer.setData('text/ambulance-id', ambulance.id);
                            event.dataTransfer.effectAllowed = 'copy';
                            setDraggedAmbulanceId(ambulance.id);
                          }}
                          onDragEnd={() => {
                            setDraggedAmbulanceId(null);
                            setDragOverIncidentId(null);
                          }}
                        >
                          <div className="ambulance-sidebar-top">
                            <strong>{ambulance.name}</strong>
                            <span className="ambulance-sidebar-meta">{ambulance.zone} · ETA {ambulance.eta}</span>
                            <div className="ambulance-card-actions">
                              <span className={`pill ${ambulanceStatusClass(ambulance)}`}>{ambulanceStatusLabel(ambulance)}</span>
                              <button
                                type="button"
                                className="icon-action ambulance-menu-trigger"
                                aria-label={`Cambiar estado de ${ambulance.name}`}
                                title="Cambiar estado"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setAmbulanceMenuId((current) => current === ambulance.id ? null : ambulance.id);
                                }}
                              >
                                ⋮
                              </button>
                              {ambulanceMenuId === ambulance.id && (
                                <div className="ambulance-status-menu" onClick={(event) => event.stopPropagation()}>
                                  <button onClick={() => setOperationalState(ambulance.id, 'Disponible')}>Disponible</button>
                                  <button onClick={() => setOperationalState(ambulance.id, 'En camino')}>En camino</button>
                                  <button onClick={() => setOperationalState(ambulance.id, 'En servicio')}>En servicio</button>
                                  <button onClick={() => setUnavailableState(ambulance.id, 'Internación')}>Internación</button>
                                  <button onClick={() => setUnavailableState(ambulance.id, 'Cargando nafta')}>Cargando nafta</button>
                                  <button onClick={() => setUnavailableState(ambulance.id, 'Incidente')}>Incidente</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </aside>}
                </div>
              )}

              {operatorTab === 'monitoreo' && (
                <div className="operator-monitor-grid">
                  <div className="card panel big-map-panel">
                    <div className="section-head">
                      <h3>Monitoreo en mapa</h3>
                      <span className="badge blue">Tiempo real</span>
                    </div>
                    <div className="big-map">
                      <div className="map-grid"></div>
                      <div className="route route-a"></div>
                      <div className="pin a"></div>
                      <div className="pin b"></div>
                      <div className="pin c"></div>
                      <div className="pin d"></div>
                      <div className="map-caption">Vista grande para mirar cómo van las ambulancias y su ETA.</div>
                    </div>
                  </div>
                  <div className="card panel">
                    <div className="section-head">
                      <h3>Estado de flota</h3>
                      <span className="badge">Resumen</span>
                    </div>
                    <div className="stack">
                      {ambulances.map((ambulance) => (
                        <div className="resource-row" key={ambulance.id}>
                          <strong>{ambulance.name}</strong>
                          <span>{ambulance.zone}</span>
                          <span>{ambulance.state}</span>
                          <span>{ambulance.eta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {operatorTab === 'recursos' && (
                <div className="resource-management-layout">
                  <section className="card panel">
                    <div className="section-head">
                      <h3>Ambulancias</h3>
                      <span className="badge ok">{ambulances.length} unidades</span>
                    </div>
                    <div className="resource-unit-list">
                      {ambulances.map((ambulance) => (
                        <button
                          type="button"
                          className={ambulance.id === selectedResourceId ? 'resource-unit-row selected' : 'resource-unit-row'}
                          key={ambulance.id}
                          onClick={() => setSelectedResourceId(ambulance.id)}
                        >
                          <span><strong>{ambulance.name}</strong><small>{ambulance.zone} · {ambulance.crew}</small></span>
                          <span className={`pill ${ambulanceStatusClass(ambulance)}`}>{ambulanceStatusLabel(ambulance)}</span>
                          <span className="queue-count">{ambulanceQueues[ambulance.id]?.length ?? 0} casos</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="card panel resource-detail-panel">
                    {selectedResource && (
                      <>
                        <div className="section-head">
                          <div>
                            <h3>{selectedResource.name}</h3>
                            <p>{selectedResource.zone} · {selectedResource.crew} · ETA {selectedResource.eta}</p>
                          </div>
                          <span className={`pill ${ambulanceStatusClass(selectedResource)}`}>{ambulanceStatusLabel(selectedResource)}</span>
                        </div>

                        <div className="unit-actions">
                          {selectedResource.state === 'Fuera de servicio' ? (
                            <>
                              <span>Motivo: <strong>{selectedResource.outOfServiceReason}</strong></span>
                              <button className="action primary" onClick={() => returnToGuard(selectedResource.id)}>Volver a guardia</button>
                            </>
                          ) : (
                            <>
                              <span className="subtle-label">Poner fuera de servicio</span>
                              <button className="action" onClick={() => setOutOfService(selectedResource.id, 'Internación')}>Internación</button>
                              <button className="action" onClick={() => setOutOfService(selectedResource.id, 'Cargando nafta')}>Cargando nafta</button>
                              <button className="action" onClick={() => setOutOfService(selectedResource.id, 'Incidente')}>Incidente</button>
                            </>
                          )}
                        </div>

                        <div className="section-head queue-heading">
                          <div>
                            <h3>Cola de incidentes</h3>
                            <p>Arrastrá los casos para cambiar el orden de atención.</p>
                          </div>
                          <span className="badge">{selectedResourceQueue.length} en cola</span>
                        </div>
                        <div className="unit-queue">
                          {selectedResourceQueue.map((incident, index) => (
                            <article
                              className={incident.id === queueDropTargetId ? 'queue-incident drop-target' : 'queue-incident'}
                              key={incident.id}
                              draggable
                              onDragStart={() => setDraggedQueueIncidentId(incident.id)}
                              onDragOver={(event) => {
                                event.preventDefault();
                                setQueueDropTargetId(incident.id);
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                if (draggedQueueIncidentId) reorderQueue(selectedResource.id, draggedQueueIncidentId, incident.id);
                                setDraggedQueueIncidentId(null);
                                setQueueDropTargetId(null);
                              }}
                              onDragEnd={() => {
                                setDraggedQueueIncidentId(null);
                                setQueueDropTargetId(null);
                              }}
                            >
                              <span className="queue-position">{index + 1}</span>
                              <span><strong>{incident.nro}</strong><small>{incident.patient}</small></span>
                              <span className="queue-address">{incident.domicilio}</span>
                            </article>
                          ))}
                          {!selectedResourceQueue.length && <p className="empty-queue">La unidad no tiene incidentes en cola.</p>}
                        </div>
                      </>
                    )}
                  </section>
                </div>
              )}
            </section>
          )}

          {path === '/metricas' && (
            <section className="page-stack metrics-dashboard">
              <section className="card panel metrics-filter-panel">
                <div className="metrics-filter-row">
                  <label>Zona<select className="form-input" value={metricsZone} onChange={(event) => setMetricsZone(event.currentTarget.value)}><option>Todas</option><option>Norte</option><option>Centro</option><option>Sur</option><option>Oeste</option></select></label>
                  <label>Período
                    <select className="form-input" value={metricsPeriod} onChange={(event) => setMetricsPeriod(event.currentTarget.value as MetricsPeriod)}>
                      {metricPeriodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      <option value="custom">Rango personalizado</option>
                    </select>
                  </label>
                  <div className="date-range-fields">
                    <label>Desde<input type="date" className="form-input" value={metricsStartDate} onChange={(event) => { setMetricsStartDate(event.currentTarget.value); setMetricsPeriod('custom'); }} /></label>
                    <label>Hasta<input type="date" className="form-input" value={metricsEndDate} onChange={(event) => { setMetricsEndDate(event.currentTarget.value); setMetricsPeriod('custom'); }} /></label>
                  </div>
                </div>
              </section>

              {metricsTab === 'operacion' && (
                <>
                  <div className="metric-strip metric-summary-grid">
                    <article className="metric-card card panel"><strong>{averageArrival} min</strong><span>Tiempo promedio de llegada</span><small>Objetivo: ≤ 15 min</small></article>
                    <article className="metric-card card panel"><strong>{averageAttention} min</strong><span>Tiempo promedio de atención</span><small>Desde arribo hasta cierre</small></article>
                    <article className="metric-card card panel"><strong>{totalCases}</strong><span>Casos atendidos</span><small>{metricsZone === 'Todas' ? 'Todas las zonas' : metricsZone}</small></article>
                    <article className="metric-card card panel"><strong>{recategorizedCases}</strong><span>Casos recategorizados</span><small>{Math.round((recategorizedCases / Math.max(1, totalCases)) * 100)}% del total</small></article>
                    <article className="metric-card card panel"><strong>88%</strong><span>Llegadas dentro de SLA</span><small>+4 pp vs. período anterior</small></article>
                    <article className="metric-card card panel"><strong>76%</strong><span>Utilización de flota</span><small>{ambulances.filter((ambulance) => ambulance.state !== 'Fuera de servicio').length} unidades operativas</small></article>
                  </div>

                  <div className="triage-performance-grid">
                    <section className="card panel"><div className="section-head"><h3>Tiempo promedio de llegada</h3><span className="badge">Por triage</span></div><div className="triage-metric-list">{triageMetrics.map((metric) => <div key={metric.color}><span className={`pill ${metric.className}`}>{metric.color}</span><strong>{metric.arrival} min</strong><small>{metric.cases} casos</small></div>)}</div></section>
                    <section className="card panel"><div className="section-head"><h3>Tiempo promedio de atención</h3><span className="badge">Por triage</span></div><div className="triage-metric-list">{triageMetrics.map((metric) => <div key={metric.color}><span className={`pill ${metric.className}`}>{metric.color}</span><strong>{metric.attention} min</strong><small>{metric.cases} casos</small></div>)}</div></section>
                  </div>

                  <div className="metrics-chart-grid">
                    <section className="card panel chart-panel chart-panel-wide"><div className="section-head"><h3>Cantidad de casos en el tiempo</h3><span className="badge blue">{metricsPeriod === 'custom' ? 'Rango personalizado' : metricPeriodOptions.find((option) => option.value === metricsPeriod)?.label}</span></div><div className="chart-canvas"><CChartLine customTooltips={false} data={{ labels: timelineLabels, datasets: [{ label: 'Casos', data: timelineCases, borderColor: '#0b7a75', backgroundColor: 'rgba(11,122,117,.18)', fill: true, tension: 0.35 }] }} options={lineChartOptions} /></div></section>
                    <section className="card panel chart-panel"><div className="section-head"><h3>Casos por triage</h3><span className="badge">Distribución</span></div><div className="chart-canvas"><CChartDoughnut customTooltips={false} data={{ labels: triageMetrics.map((metric) => metric.color), datasets: [{ data: triageMetrics.map((metric) => metric.cases), backgroundColor: ['#bf4d4d', '#c4a014', '#1a8f5d', '#202126'] }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartTextColor } } } }} /></div></section>
                    <section className="card panel chart-panel chart-panel-wide"><div className="section-head"><h3>Tiempos por triage</h3><span className="badge">Minutos</span></div><div className="chart-canvas"><CChartBar customTooltips={false} data={{ labels: triageMetrics.map((metric) => metric.color), datasets: [{ label: 'Llegada', data: triageMetrics.map((metric) => metric.arrival), backgroundColor: '#2f5578' }, { label: 'Atención', data: triageMetrics.map((metric) => metric.attention), backgroundColor: '#0b7a75' }] }} options={lineChartOptions} /></div></section>
                  </div>
                </>
              )}

              {metricsTab === 'ambulancias' && selectedMetricsAmbulance && (
                <>
                  <section className="card panel ambulance-metric-selector"><label>Ambulancia<select className="form-input" value={metricsAmbulanceId} onChange={(event) => setMetricsAmbulanceId(event.currentTarget.value)}>{ambulances.map((ambulance) => <option key={ambulance.id}>{ambulance.id}</option>)}</select></label><div><strong>{selectedMetricsAmbulance.state}</strong><span>{selectedMetricsAmbulance.zone} · {selectedMetricsAmbulance.crew}</span></div></section>
                  <div className="metric-strip metric-summary-grid ambulance-metric-strip">
                    <article className="metric-card card panel"><strong>{ambulanceCaseCount}</strong><span>Casos asignados</span><small>En el período</small></article>
                    <article className="metric-card card panel"><strong>{8 + ambulanceIndex * 2} min</strong><span>Tiempo promedio de llegada</span><small>ETA real promedio</small></article>
                    <article className="metric-card card panel"><strong>{24 + ambulanceIndex * 3} min</strong><span>Tiempo promedio de atención</span><small>Por servicio</small></article>
                    <article className="metric-card card panel"><strong>{68 + ambulanceIndex * 4}%</strong><span>Utilización</span><small>Tiempo en servicio</small></article>
                    <article className="metric-card card panel"><strong>{Math.max(0, ambulanceIndex - 1)}</strong><span>Recategorizados</span><small>Durante atención</small></article>
                  </div>
                  <div className="metrics-chart-grid ambulance-chart-grid">
                    <section className="card panel chart-panel chart-panel-wide"><div className="section-head"><h3>Casos asignados en el tiempo</h3><span className="badge blue">{selectedMetricsAmbulance.id}</span></div><div className="chart-canvas"><CChartLine customTooltips={false} data={{ labels: timelineLabels, datasets: [{ label: 'Asignados', data: timelineLabels.map((_, index) => Math.max(0, Math.round((2 + ((index + ambulanceIndex) * 3) % 8) * periodFactor))), borderColor: '#0b7a75', backgroundColor: 'rgba(11,122,117,.18)', fill: true, tension: 0.35 }] }} options={lineChartOptions} /></div></section>
                    <section className="card panel chart-panel"><div className="section-head"><h3>Casos por color</h3><span className="badge">{ambulanceCaseCount} total</span></div><div className="chart-canvas"><CChartDoughnut customTooltips={false} data={{ labels: triageMetricSeed.map((metric) => metric.color), datasets: [{ data: ambulanceTriageCases, backgroundColor: ['#bf4d4d', '#c4a014', '#1a8f5d', '#202126'] }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartTextColor } } } }} /></div></section>
                  </div>
                </>
              )}
            </section>
          )}

          {path === '/facturacion' && (
            <section className="page-stack">
              {billingTab === 'generacion' && (
                <div className="card panel">
                  <div className="section-head">
                    <h3>Generación</h3>
                    <button className="action primary" onClick={openGenerationModal}>Generar por período</button>
                  </div>
                  <div className="filter-bar">
                    <input className="form-input compact-input" value={generationStart} onChange={(event) => setGenerationStart(event.currentTarget.value)} placeholder="Fecha inicio" />
                    <input className="form-input compact-input" value={generationEnd} onChange={(event) => setGenerationEnd(event.currentTarget.value)} placeholder="Fecha fin" />
                  </div>
                  <div className="table billing-table">
                    <div className="table-head billing-grid-head">
                      <span>Id</span><span>Período</span><span>Prestador</span><span>Servicios</span><span>Total</span><span>Estado</span>
                    </div>
                    {generationRows.map((row) => (
                      <div className="table-row billing-grid-row" key={row.id}>
                        <strong>{row.id}</strong>
                        <span>{row.period}</span>
                        <span>{row.provider}</span>
                        <span>{row.services}</span>
                        <span>{row.total}</span>
                        <span className="pill warn">{row.state}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {billingTab === 'historicos' && (
                <div className="card panel">
                  <div className="section-head">
                    <h3>Históricos de facturas y liquidaciones</h3>
                    <span className="badge blue">Filtros</span>
                  </div>
                  <div className="filter-bar">
                    <select className="form-input compact-select"><option>Período</option><option>Julio 2026</option><option>Junio 2026</option></select>
                    <select className="form-input compact-select"><option>Prestador</option><option>PAMI</option><option>OSDE</option><option>Swiss Medical</option></select>
                    <select className="form-input compact-select"><option>Mes</option><option>Julio</option><option>Junio</option></select>
                  </div>
                  <div className="history-grid">
                    <div>
                      <h4>Facturas</h4>
                      <div className="table history-table">
                        <div className="table-head history-grid-head">
                          <span>Id</span><span>Período</span><span>Prestador</span><span>Total</span><span>Estado</span>
                        </div>
                        {invoiceHistory.map((row) => (
                          <div className="table-row history-grid-row" key={row.id}>
                            <strong>{row.id}</strong>
                            <span>{row.period}</span>
                            <span>{row.provider}</span>
                            <span>{row.total}</span>
                            <span className="pill ok">{row.state}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4>Liquidaciones</h4>
                      <div className="table history-table">
                        <div className="table-head history-grid-head">
                          <span>Id</span><span>Período</span><span>Prestador</span><span>Total</span><span>Estado</span>
                        </div>
                        {liquidationHistory.map((row) => (
                          <div className="table-row history-grid-row" key={row.id}>
                            <strong>{row.id}</strong>
                            <span>{row.period}</span>
                            <span>{row.provider}</span>
                            <span>{row.total}</span>
                            <span className="pill blue">{row.state}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {billingTab === 'catalogo' && (
                <div className="card panel">
                  <div className="section-head">
                    <h3>Catálogo de costos</h3>
                    <span className="badge">Precios</span>
                  </div>
                  <div className="catalog-form">
                    <select className="form-input compact-select" value={catalogDraft.type} onChange={(event) => setCatalogDraft((current) => ({ ...current, type: event.currentTarget.value }))}>
                      <option value="Emergencia">Emergencia</option>
                      <option value="Traslado">Traslado</option>
                      <option value="Extra">Extra</option>
                    </select>
                    <select className="form-input compact-select" value={catalogDraft.provider} onChange={(event) => setCatalogDraft((current) => ({ ...current, provider: event.currentTarget.value }))}>
                      <option value="General">General</option>
                      <option value="PAMI">PAMI</option>
                      <option value="OSDE">OSDE</option>
                      <option value="Swiss Medical">Swiss Medical</option>
                    </select>
                    <input className="form-input compact-input" value={catalogDraft.concept} onChange={(event) => setCatalogDraft((current) => ({ ...current, concept: event.currentTarget.value }))} placeholder="Concepto" />
                    <input className="form-input compact-input" value={catalogDraft.price} onChange={(event) => setCatalogDraft((current) => ({ ...current, price: event.currentTarget.value }))} placeholder="Precio" />
                    <button className="action primary" onClick={addCatalogRow}>Agregar</button>
                  </div>
                  <div className="table catalog-table">
                    <div className="table-head catalog-grid-head">
                      <span>Tipo</span><span>Prestador</span><span>Concepto</span><span>Precio</span>
                    </div>
                    {catalogRows.map((row) => (
                      <div className="table-row catalog-grid-row" key={row.id}>
                        <strong>{row.type}</strong>
                        <span>{row.provider}</span>
                        <span>{row.concept}</span>
                        <span>{row.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </section>
      </main>

      {loadModalOpen && (
        <ModalBackdrop title="Carga de servicio" badge="Nuevo caso" description="Alta por pasos con autocompletado, cobertura, triage o traslado y guardado al final." onClose={() => setLoadModalOpen(false)}>
          <div className="wizard-shell">
            <div className="wizard-steps">
              {loadSteps.map((step, index) => {
                const stepNumber = (index + 1) as LoadStep;
                const isActive = loadStep === stepNumber;
                const isDone = loadStep > stepNumber;

                return (
                  <button key={step.title} className={isActive ? 'wizard-step active' : isDone ? 'wizard-step done' : 'wizard-step'} onClick={() => handleLoadStepChange(stepNumber)}>
                    <strong>{stepNumber}</strong>
                    <span>
                      {step.title}
                      <small>{step.help}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            {loadStep === 1 && (
              <div className="wizard-grid">
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Autocompletado</div>
                  <div className="field-row">
                    <label>Buscar paciente</label>
                    <input className="form-input" value={loadDraft.query} onChange={(event) => updateLoadDraft({ query: event.currentTarget.value, selectedPatientId: null })} placeholder="Nombre, DNI, afiliado o plan" />
                  </div>
                  <div className="autocomplete-list">
                    {matchingPatients.slice(0, 5).map((patient) => (
                      <button key={patient.id} className={loadDraft.selectedPatientId === patient.id ? 'autocomplete-item active' : 'autocomplete-item'} onClick={() => selectPatient(patient)}>
                        <strong>{patient.fullName}</strong>
                        <span>DNI {patient.dni} · {patient.obraSocial} · Afiliado {patient.afiliado} · {patient.plan}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Paciente elegido</div>
                  {selectedPatient ? (
                    <>
                      <div className="patient-box">
                        <div>
                          <strong>{selectedPatient.fullName}</strong>
                          <span>DNI {selectedPatient.dni} · {selectedPatient.obraSocial} · Plan {selectedPatient.plan}</span>
                        </div>
                        <span className="pill ok">Autocompletado</span>
                      </div>
                      <div className="mini-table">
                        <div>Afiliado <strong>{selectedPatient.afiliado}</strong></div>
                        <div>Obra social <strong>{selectedPatient.obraSocial}</strong></div>
                        <div>Plan <strong>{selectedPatient.plan}</strong></div>
                        <div>Modalidad sugerida <strong>{selectedPatient.defaultMode}</strong></div>
                      </div>
                    </>
                  ) : (
                    <div className="callout">Buscá un paciente para autocompletar el resto de los datos.</div>
                  )}
                </div>
              </div>
            )}

            {loadStep === 2 && (
              <div className="wizard-grid">
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Cobertura</div>
                  <div className="stack">
                    <div className="field-row"><label>Obra social</label><input className="form-input" value={loadDraft.obraSocial} onChange={(event) => updateLoadDraft({ obraSocial: event.currentTarget.value })} /></div>
                    <div className="field-row"><label>Número de afiliado</label><input className="form-input" value={loadDraft.afiliado} onChange={(event) => updateLoadDraft({ afiliado: event.currentTarget.value })} /></div>
                    <div className="field-row"><label>Plan</label><input className="form-input" value={loadDraft.plan} onChange={(event) => updateLoadDraft({ plan: event.currentTarget.value })} /></div>
                  </div>
                </div>
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Cobertura seleccionada</div>
                  <div className="assignment-box">
                    <strong>{loadDraft.fullName || 'Paciente sin seleccionar'}</strong>
                    <span>{loadDraft.obraSocial || 'Obra social'} · {loadDraft.afiliado || 'Afiliado'} · {loadDraft.plan || 'Plan'}</span>
                  </div>
                  <div className="mini-table">
                    <div>Paciente <strong>{loadDraft.fullName || 'Pendiente'}</strong></div>
                    <div>DNI <strong>{loadDraft.dni || 'Pendiente'}</strong></div>
                    <div>Obra social <strong>{loadDraft.obraSocial || 'Pendiente'}</strong></div>
                    <div>Afiliado <strong>{loadDraft.afiliado || 'Pendiente'}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {loadStep === 3 && (
              <div className="wizard-grid">
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Tipo de caso</div>
                  <div className="mode-switch">
                    <button className={loadDraft.mode === 'Emergencia' ? 'mode-chip active' : 'mode-chip'} onClick={() => updateLoadDraft({ mode: 'Emergencia' })}>Emergencia</button>
                    <button className={loadDraft.mode === 'Traslado' ? 'mode-chip active' : 'mode-chip'} onClick={() => updateLoadDraft({ mode: 'Traslado' })}>Traslado</button>
                  </div>
                  {loadDraft.mode === 'Emergencia' ? (
                    <div className="stack">
                      <div className="field-row">
                        <label>Caso de triage</label>
                        <select className="form-input" value={loadDraft.triageLevel} onChange={(event) => updateLoadDraft({ triageLevel: event.currentTarget.value as TriageLevel })}>
                          <option value="Rojo">Rojo</option>
                          <option value="Amarillo">Amarillo</option>
                          <option value="Verde">Verde</option>
                          <option value="Negro">Negro</option>
                        </select>
                      </div>
                      <div className="callout">{loadDraft.triageLevel}: {triageLegend[loadDraft.triageLevel]}</div>
                      <div className="chips-wrap compact-wrap">
                        {symptoms.map((symptom) => {
                          const active = selectedSymptoms.includes(symptom);
                          return <button key={symptom} className={active ? 'symptom active' : 'symptom'} onClick={() => setSelectedSymptoms((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom])}>{symptom}</button>;
                        })}
                      </div>
                      <div className="field-row">
                        <label>Motivo / observación</label>
                        <textarea className="form-input text-area" value={loadDraft.triageNote} onChange={(event) => updateLoadDraft({ triageNote: event.currentTarget.value })} />
                      </div>
                    </div>
                  ) : (
                    <div className="stack">
                      <div className="field-row"><label>Hospital destino</label><input className="form-input" value={loadDraft.hospital} onChange={(event) => updateLoadDraft({ hospital: event.currentTarget.value })} /></div>
                      <div className="field-row"><label>Fecha / hora</label><input className="form-input" value={loadDraft.schedule} onChange={(event) => updateLoadDraft({ schedule: event.currentTarget.value })} /></div>
                      <label className="toggle-row"><input type="checkbox" checked={loadDraft.needsReturn} onChange={(event) => updateLoadDraft({ needsReturn: event.currentTarget.checked })} /><span>Necesita vuelta</span></label>
                      <div className="callout">{loadDraft.needsReturn ? 'Incluye ida y vuelta.' : 'Solo ida programada.'}</div>
                    </div>
                  )}
                </div>
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Sugerencia</div>
                  <div className="assignment-box">
                    <strong>{loadDraft.mode === 'Emergencia' ? `Triage ${loadDraft.triageLevel}` : loadDraft.hospital || 'Traslado'}</strong>
                    <span>{loadDraft.mode === 'Emergencia' ? loadDraft.triageNote || 'Sin observaciones' : `${loadDraft.schedule || 'Fecha pendiente'} · ${loadDraft.needsReturn ? 'con vuelta' : 'sin vuelta'}`}</span>
                  </div>
                  <div className="mini-table">
                    <div>Modo <strong>{loadDraft.mode}</strong></div>
                    <div>Paciente <strong>{loadDraft.fullName || 'Pendiente'}</strong></div>
                    <div>Obra social <strong>{loadDraft.obraSocial || 'Pendiente'}</strong></div>
                    <div>Plan <strong>{loadDraft.plan || 'Pendiente'}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {loadStep === 4 && (
              <div className="wizard-grid">
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Revisión</div>
                  <div className="preview-box review-box">
                    <div className="preview-row"><span>Paciente</span><strong>{loadDraft.fullName || 'Pendiente'}</strong></div>
                    <div className="preview-row"><span>DNI</span><strong>{loadDraft.dni || 'Pendiente'}</strong></div>
                    <div className="preview-row"><span>Obra social</span><strong>{loadDraft.obraSocial || 'Pendiente'}</strong></div>
                    <div className="preview-row"><span>Afiliado / plan</span><strong>{loadDraft.afiliado || 'Pendiente'} · {loadDraft.plan || 'Pendiente'}</strong></div>
                    <div className="preview-row"><span>Modo</span><strong>{loadDraft.mode}</strong></div>
                    <div className="preview-row"><span>Detalle</span><strong>{loadDraft.mode === 'Emergencia' ? `Triage ${loadDraft.triageLevel}` : `Traslado a ${loadDraft.hospital}`}</strong></div>
                  </div>
                </div>
                <div className="card panel wizard-panel">
                  <div className="subtle-label">Confirmación</div>
                  <div className="callout">{loadDraft.mode === 'Emergencia' ? `Se guarda el caso ${loadDraft.triageLevel} con síntomas seleccionados.` : `Se guarda el traslado ${loadDraft.hospital} ${loadDraft.needsReturn ? 'con vuelta' : 'sin vuelta'}.`}</div>
                  <div className="button-row">
                    <button className="action primary" onClick={saveNewCase}>Guardar caso</button>
                    <button className="action" onClick={() => handleLoadStepChange(1)}>Volver a editar</button>
                  </div>
                </div>
              </div>
            )}

            <div className="wizard-footer">
              <button className="action" onClick={() => setLoadModalOpen(false)}>Cancelar</button>
              <div className="button-row">
                {loadStep > 1 && <button className="action" onClick={() => handleLoadStepChange((loadStep - 1) as LoadStep)}>Atrás</button>}
                {loadStep < 4 && <button className="action primary" onClick={() => handleLoadStepChange((loadStep + 1) as LoadStep)}>Siguiente</button>}
                {loadStep === 4 && <button className="action primary" onClick={saveNewCase}>Guardar caso</button>}
              </div>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {caseModalIncident && (
        <ModalBackdrop
          title={`Incidente ${caseModalIncident.nro}`}
          badge={caseModalIncident.category}
          description="Toda la info del caso arriba; abajo, el mapa y la asignación del móvil."
          onClose={closeCaseModal}
        >
          <div className="assignment-modal-grid">
            <div className="card panel assignment-list-panel">
              <div className="subtle-label">Paciente</div>
              <div className="assignment-box">
                <strong>{caseModalIncident.title}</strong>
                <span>
                  {caseModalIncident.sexo === 'F' ? 'Femenino' : 'Masculino'} · {caseModalIncident.edad} ·{' '}
                  <span className={`pill ${triagePillClass(caseModalIncident.triageColor)}`}>Triage {caseModalIncident.triageColor}</span>
                </span>
              </div>
              <div className="mini-table">
                <div>Domicilio <strong>{caseModalIncident.domicilio}</strong></div>
                <div>Zona/Barrio <strong>{caseModalIncident.barrio}</strong></div>
                <div>Teléfono <strong>{caseModalIncident.telefono}</strong></div>
                <div>Obra social <strong>{caseModalIncident.obraSocial}</strong></div>
                <div>Afiliado <strong>{caseModalIncident.afiliado}</strong></div>
                <div>Plan <strong>{caseModalIncident.plan}</strong></div>
                <div>Copago <strong>{caseModalIncident.copago}</strong></div>
                <div>Estado <strong>{caseModalIncident.state}</strong></div>
                <div>Recurso necesario <strong>{caseModalIncident.recursoNecesario}</strong></div>
                <div>Receptor <strong>{caseModalIncident.receptor}</strong></div>
                <div>Despachador <strong>{caseModalIncident.despachador}</strong></div>
                <div>Hora envío <strong>{caseModalIncident.horaEnvio}</strong></div>
                <div>Hora recepción <strong>{caseModalIncident.horaRecepcion}</strong></div>
              </div>

              <div className="subtle-label">Asignación</div>
              {(caseModalIncident.state === 'Cancelado' || caseModalIncident.state === 'Finalizado') ? (
                <div className="assignment-box">
                  <strong>Caso {caseModalIncident.state.toLowerCase()}</strong>
                  <span>La unidad {caseModalIncident.ambulance} ya no tiene este incidente en su cola.</span>
                </div>
              ) : (caseModalIncident.state === 'Pendiente' || reassigning) ? (
                <>
                  <div className="ambulance-list">
                    {ambulances
                      .filter((ambulance) => ambulance.state !== 'Fuera de servicio')
                      .slice()
                      .sort((left, right) => Number(right.id === caseModalIncident.ambulance) - Number(left.id === caseModalIncident.ambulance))
                      .map((ambulance) => {
                        const isSelected = selectedAmbulanceId === ambulance.id;
                        const isSuggested = ambulance.id === caseModalIncident.ambulance;

                        return (
                          <button
                            key={ambulance.id}
                            className={isSelected ? 'ambulance-option active' : 'ambulance-option'}
                            onClick={() => setSelectedAmbulanceId(ambulance.id)}
                          >
                            <div className="ambulance-option-main">
                              <strong>{ambulance.name}</strong>
                              <span>{ambulance.zone} · {ambulance.state} · ETA {ambulance.eta}</span>
                            </div>
                            <div className="ambulance-option-side">
                              {isSuggested && <span className="pill blue">Sugerida</span>}
                              {isSelected && <span className="pill ok">Elegida</span>}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                  <div className="button-row assignment-actions">
                    <button className="action primary" onClick={confirmAssignment}>Asignar elegida</button>
                    {caseModalIncident.state !== 'Pendiente' && (
                      <button className="action" onClick={() => setReassigning(false)}>Cancelar cambio</button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="assignment-box">
                    <strong>Móvil asignado: {caseModalIncident.ambulance}</strong>
                    <span>Estado {caseModalIncident.state}</span>
                  </div>
                  <div className="button-row assignment-actions">
                    <button className="action" onClick={() => setReassigning(true)}>Reasignar móvil</button>
                    {caseModalIncident.state === 'Asignado' && (
                      <button className="action primary" onClick={markEnRoute}>Marcar en camino</button>
                    )}
                  </div>
                </>
              )}
              <div className="button-row assignment-actions">
                <button className="action" onClick={closeCaseModal}>Cerrar</button>
              </div>
            </div>

            <div className="card panel assignment-map-panel">
              <div className="section-head">
                <div>
                  <div className="subtle-label">Mapa</div>
                  <h3>Ubicación y recorrido</h3>
                </div>
                <span className="badge blue">Tiempo real</span>
              </div>
              <div className="big-map assignment-map">
                <div className="map-grid"></div>
                <div className="route route-a"></div>
                <div className="pin a"></div>
                <div className="pin b"></div>
                <div className="pin c"></div>
                <div className="map-caption">
                  {caseModalIncident.state === 'Cancelado' || caseModalIncident.state === 'Finalizado'
                    ? `Caso ${caseModalIncident.state.toLowerCase()}: sin recorrido activo.`
                    : caseModalIncident.state === 'Pendiente'
                      ? 'Caso sin asignar: elegí abajo el móvil y su ETA.'
                      : `Móvil ${caseModalIncident.ambulance} en ruta hacia ${caseModalIncident.domicilio}.`}
                </div>
              </div>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {generationOpen && (
        <ModalBackdrop title="Generar facturación" badge="Facturación" description="Visualización de todos los servicios del período antes de confirmar." onClose={() => setGenerationOpen(false)}>
          <div className="assignment-modal-grid">
            <div className="card panel wizard-panel">
              <div className="subtle-label">Período</div>
              <div className="stack">
                <input className="form-input" value={generationStart} onChange={(event) => setGenerationStart(event.currentTarget.value)} placeholder="Fecha inicio" />
                <input className="form-input" value={generationEnd} onChange={(event) => setGenerationEnd(event.currentTarget.value)} placeholder="Fecha fin" />
              </div>
            </div>
            <div className="card panel wizard-panel">
              <div className="subtle-label">Servicios</div>
              <div className="table generation-preview-table">
                <div className="table-head generation-grid-head">
                  <span>Id</span><span>Prestador</span><span>Servicios</span><span>Total</span>
                </div>
                {generationRows.map((row) => (
                  <div className="table-row generation-grid-row" key={row.id}>
                    <strong>{row.id}</strong>
                    <span>{row.provider}</span>
                    <span>{row.services}</span>
                    <span>{row.total}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card panel wizard-panel">
              <div className="subtle-label">Confirmar</div>
              <div className="callout">Si confirmás, se genera la factura con la visualización del período seleccionado.</div>
              <button className="action primary" onClick={confirmGeneration}>Confirmar y facturar</button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}

type ModalBackdropProps = {
  title: string;
  badge: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
};

function ModalBackdrop({ title, badge, description, onClose, children }: ModalBackdropProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-shell" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header className="modal-top">
          <div>
            <span className="eyebrow">Vista modal</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="modal-top-actions">
            <span className="badge">{badge}</span>
            <button className="modal-close" onClick={onClose}>Cerrar</button>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}

export default App;
