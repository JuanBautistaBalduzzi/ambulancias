import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type MapUnit = {
  id: string;
  label: string;
  position: [number, number];
  etaMinutes?: number;
};

type DispatchMapProps = {
  casePoint: MapUnit | null;
  ambulances: MapUnit[];
  selectedAmbulanceId?: string;
  height?: number;
};

export function DispatchMap({ casePoint, ambulances, selectedAmbulanceId, height = 360 }: DispatchMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const mapId = useMemo(() => `dispatch-map-${Math.random().toString(36).slice(2, 11)}`, []);

  useEffect(() => {
    if (!mapElementRef.current || !casePoint) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapElementRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    const dynamicLayer = L.layerGroup().addTo(map);

    const caseMarker = L.circleMarker(casePoint.position, {
      radius: 9,
      color: '#d94848',
      fillColor: '#d94848',
      fillOpacity: 0.9,
      weight: 2,
    }).bindPopup(casePoint.label);
    caseMarker.addTo(dynamicLayer);

    const allPoints: L.LatLngExpression[] = [casePoint.position];

    ambulances.forEach((unit) => {
      const isSelected = selectedAmbulanceId === unit.id;
      const color = isSelected ? '#0c7a73' : '#1d7dd8';

      L.circleMarker(unit.position, {
        radius: isSelected ? 8 : 7,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: isSelected ? 3 : 2,
      })
        .bindPopup(`${unit.label}${typeof unit.etaMinutes === 'number' ? ` · ETA ${unit.etaMinutes} min` : ''}`)
        .addTo(dynamicLayer);

      L.polyline([unit.position, casePoint.position], {
        color,
        weight: isSelected ? 4 : 3,
        opacity: isSelected ? 0.95 : 0.65,
        dashArray: isSelected ? undefined : '7 7',
      }).addTo(dynamicLayer);

      allPoints.push(unit.position);
    });

    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds.pad(0.2));

    return () => {
      dynamicLayer.remove();
    };
  }, [ambulances, casePoint, selectedAmbulanceId]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (!casePoint) {
    return <div className="map-empty">Selecciona un caso para visualizar el mapa.</div>;
  }

  return (
    <div className="dispatch-map-wrap">
      <div id={mapId} ref={mapElementRef} style={{ height, width: '100%' }} />
    </div>
  );
}
