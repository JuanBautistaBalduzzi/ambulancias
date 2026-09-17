export type Theme = 'light' | 'dark';

export type ScreenKey = 'carga' | 'operador' | 'metricas' | 'facturacion';

export type ServiceMode = 'Emergencia' | 'Traslado';

export type IncidentState = 'Pendiente' | 'Asignado' | 'En camino' | 'Finalizado' | 'Cancelado';

export type IncidentCategory = 'Emergencia critica' | 'Urgente' | 'Emergencia menor' | 'Traslado programado';

export type IncidentZone = 'Norte' | 'Centro' | 'Sur';

export type Incident = {
  id: string;
  category: IncidentCategory;
  zone: IncidentZone;
  ambulance: string;
  etaMinutes: number;
  state: IncidentState;
  patient: string;
};

export type BillingItem = {
  id: string;
  provider: string;
  period: string;
  total: number;
  cases: number;
  status: 'Emitida' | 'Pendiente';
};
