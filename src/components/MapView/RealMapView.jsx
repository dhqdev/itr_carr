import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { wktToGeoJSON, getPolygonBounds } from '../../utils/wktParser';
import API_BASE from '../../config/apiConfig';
import './RealMapView.css';

// Evita níveis de zoom onde algumas tiles retornam "Map data not yet available"
const MAX_LEGIBLE_ZOOM = 18;

const polygonStyle = {
  fill: false,
  fillOpacity: 0,
  color: '#ff0000',
  weight: 4,
  opacity: 1
};

/**
 * Controla o viewport do mapa quando os limites mudarem.
 */
function MapController({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length === 2) {
      // Padding menor evita zoom-out desnecessário
      map.fitBounds(bounds, { padding: [20, 20], animate: false });

      // Se a área é pequena mas o zoom ficou muito aberto, força um zoom mínimo
      // (isso ajuda quando o mapa ainda não calculou bem o tamanho do container)
      try {
        const latSpan = Math.abs(bounds[1][0] - bounds[0][0]);
        const lngSpan = Math.abs(bounds[1][1] - bounds[0][1]);
        const isSmallArea = latSpan < 0.5 && lngSpan < 0.5;
        const currentZoom = map.getZoom();
        if (isSmallArea && typeof currentZoom === 'number' && currentZoom < 12) {
          map.setZoom(12, { animate: false });
        }
      } catch (_e) {
        // noop
      }
    }
  }, [bounds, map]);

  return null;
}

function normalizeCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) return null;

  const normalized = coordinates
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const lng = Number(point[0]);
        const lat = Number(point[1]);
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          return [lng, lat];
        }
      }

      if (point && typeof point === 'object') {
        const lng = Number(point.lng ?? point.lon ?? point.x);
        const lat = Number(point.lat ?? point.y);
        if (Number.isFinite(lng) && Number.isFinite(lat)) {
          return [lng, lat];
        }
      }

      return null;
    })
    .filter(Boolean);

  if (normalized.length < 3) return null;

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    normalized.push([...first]);
  }

  return normalized;
}

function getPolygonRingsFromFeature(feature) {
  if (!feature || !feature.geometry || !feature.geometry.type || !feature.geometry.coordinates) {
    return [];
  }

  if (feature.geometry.type === 'Polygon') {
    return Array.isArray(feature.geometry.coordinates[0])
      ? [feature.geometry.coordinates[0]]
      : [];
  }

  if (feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates
      .map((polygon) => (Array.isArray(polygon?.[0]) ? polygon[0] : null))
      .filter(Boolean);
  }

  return [];
}

function computeLeafletBoundsFromLngLat(coordsLngLat) {
  if (!Array.isArray(coordsLngLat) || coordsLngLat.length < 3) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const pt of coordsLngLat) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const lng = Number(pt[0]);
    const lat = Number(pt[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng]
  ];
}

function extendLeafletBounds(bounds, positionsLatLng) {
  if (!bounds || bounds.length !== 2) return bounds;
  if (!Array.isArray(positionsLatLng) || positionsLatLng.length < 3) return bounds;

  let [[minLat, minLng], [maxLat, maxLng]] = bounds;

  for (const pt of positionsLatLng) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const lat = Number(pt[0]);
    const lng = Number(pt[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    minLat = Math.min(minLat, lat);
    minLng = Math.min(minLng, lng);
    maxLat = Math.max(maxLat, lat);
    maxLng = Math.max(maxLng, lng);
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng]
  ];
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toMonthValue(dateObj) {
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth() + 1;
  return `${y}-${pad2(m)}`;
}

function monthLabel(monthValue) {
  // monthValue: YYYY-MM
  const [y, m] = String(monthValue).split('-');
  if (!y || !m) return String(monthValue);
  return `${m}/${y}`;
}

function getMonthOptions({ monthsBack = 36, endDate = new Date() } = {}) {
  const options = [];
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  for (let i = 0; i < Math.max(1, monthsBack); i++) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const value = toMonthValue(d);
    options.push({ value, label: monthLabel(value) });
  }
  return options;
}

function coerceToMonthValue(input) {
  if (!input) return null;
  const s = String(input).trim();
  // aceita YYYY-MM-DD ou YYYY-MM
  const match = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

/**
 * Componente de Mapa Real com geometrias do banco de dados
 */
function RealMapView({ property }) {
  const [polygonCoords, setPolygonCoords] = useState(null); // [lng, lat]
  const [yellowPolygons, setYellowPolygons] = useState([]);
  const [bounds, setBounds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mockProcessing, setMockProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(toMonthValue(new Date()));

  const propertyId = property?.id || null;
  const geometryWkt = property?.geometry_wkt || null;
  const imovelPolygon = property?.imovel?.poligono || null;

  const monthOptions = useMemo(() => getMonthOptions({ monthsBack: 12 }), []);

  useEffect(() => {
    // Ajusta seleção inicial quando muda a propriedade (usa histórico, se existir)
    const histDate = property?.historico?.data_imagem_satelite;
    const coerced = coerceToMonthValue(histDate);
    const defaultMonth = toMonthValue(new Date());
    const isAllowed = coerced && monthOptions.some((opt) => opt.value === coerced);
    setSelectedMonth(isAllowed ? coerced : defaultMonth);
  }, [property?.id, property?.historico?.data_imagem_satelite, monthOptions]);

  useEffect(() => {
    if (!mockProcessing) return undefined;
    const t = setTimeout(() => setMockProcessing(false), 900);
    return () => clearTimeout(t);
  }, [mockProcessing]);

  useEffect(() => {
    let isMounted = true;

    setYellowPolygons([]);

    if (!property?.id) {
      return () => {
        isMounted = false;
      };
    }

    fetch(`${API_BASE}/api/properties/${property.id}/layers/linha-amarela`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Falha ao carregar camada Linha Amarela');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;

        const features = Array.isArray(data?.features) ? data.features : [];
        const parsedPolygons = features
          .flatMap((feature) =>
            getPolygonRingsFromFeature(feature).map((ring) => {
              const normalized = normalizeCoordinates(ring);
              if (!normalized) return null;

              return {
                id: `${feature?.properties?.identificador_lote || 'sem-id'}-${feature?.properties?.nome || 'linha'}`,
                nome: feature?.properties?.nome || 'Linha amarela',
                identificadorLote: feature?.properties?.identificador_lote || null,
                positions: normalized.map(([lng, lat]) => [lat, lng])
              };
            })
          )
          .filter(Boolean);

        setYellowPolygons(parsedPolygons);
      })
      .catch((err) => {
        console.error('Erro ao carregar camada Linha Amarela:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [property?.id]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    // Reset quando mudar propriedade
    setPolygonCoords(null);
    setBounds(null);
    setError(null);

    if (!propertyId) {
      setLoading(false);
      return () => {
        isActive = false;
        controller.abort();
      };
    }

    setLoading(true);

    function applyCoordinates(coordinates) {
      const normalized = normalizeCoordinates(coordinates);

      if (!normalized || normalized.length < 3) {
        if (!isActive) return;
        setError('Geometria inválida');
        setLoading(false);
        return;
      }

      if (!isActive) return;

      const calculatedBounds = getPolygonBounds(normalized);
      setPolygonCoords(normalized);

      // Bounds do polígono vermelho (base)
      let leafletBounds = [
        [calculatedBounds[0][1], calculatedBounds[0][0]],
        [calculatedBounds[1][1], calculatedBounds[1][0]]
      ];

      setBounds(leafletBounds);
      setLoading(false);
    }

    // 1) Tenta usar geometry_wkt se disponível
    if (geometryWkt) {
      try {
        const geo = wktToGeoJSON(geometryWkt);
        if (geo && geo.geometry && geo.geometry.coordinates && geo.geometry.coordinates[0]) {
          applyCoordinates(geo.geometry.coordinates[0]);
        } else {
          if (!isActive) return;
          setError('Formato de geometria inválido');
          setLoading(false);
        }
      } catch (err) {
        if (!isActive) return;
        console.error('Erro ao processar geometria WKT:', err);
        setError('Erro ao carregar geometria');
        setLoading(false);
      }

    // 2) Usa imovel.poligono que já vem no objeto property
    } else if (Array.isArray(imovelPolygon) && imovelPolygon.length >= 3) {
      applyCoordinates([...imovelPolygon]);

    // 3) Tenta buscar da API como último recurso
    } else {
      fetch(`${API_BASE}/api/properties/${propertyId}/geometry`, { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error('Falha ao buscar geometria');
          return res.json();
        })
        .then(data => {
          if (!isActive) return;

          if (data.geometry_wkt) {
            const geo = wktToGeoJSON(data.geometry_wkt);
            if (geo && geo.geometry && geo.geometry.coordinates && geo.geometry.coordinates[0]) {
              applyCoordinates(geo.geometry.coordinates[0]);
            } else {
              setError('Formato de geometria inválido');
              setLoading(false);
            }
          } else {
            setError('Geometria não encontrada');
            setLoading(false);
          }
        })
        .catch(err => {
          if (!isActive || err.name === 'AbortError') return;
          console.error('Erro ao buscar geometria:', err);
          setError('Geometria não disponível');
          setLoading(false);
        });
    }

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [propertyId, geometryWkt, imovelPolygon]);

  useEffect(() => {
    // Quando a Linha Amarela chega depois do polígono vermelho, recalcula bounds (viewport)
    if (!polygonCoords) return;
    if (!Array.isArray(yellowPolygons) || yellowPolygons.length === 0) return;

    let leafletBounds = computeLeafletBoundsFromLngLat(polygonCoords);
    if (!leafletBounds) return;

    for (const poly of yellowPolygons) {
      leafletBounds = extendLeafletBounds(leafletBounds, poly?.positions);
    }

    setBounds(leafletBounds);
  }, [polygonCoords, yellowPolygons]);

  const polygonPositions = polygonCoords
    ? polygonCoords.map(([lng, lat]) => [lat, lng])
    : null;

  return (
    <div className="real-map-view">
      {loading && (
        <div className="map-loading-overlay">
          <div className="spinner"></div>
          <p>Carregando mapa...</p>
        </div>
      )}

      {mockProcessing && (
        <div className="map-loading-overlay">
          <div className="spinner"></div>
          <p>Processando data...</p>
        </div>
      )}

      <MapContainer
        center={[-15.7801, -47.9292]}
        zoom={4}
        minZoom={3}
        maxZoom={MAX_LEGIBLE_ZOOM}
        zoomSnap={1}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Camada Base - OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxNativeZoom={MAX_LEGIBLE_ZOOM}
          maxZoom={MAX_LEGIBLE_ZOOM}
        />

        {/* Camada Satélite - ESRI World Imagery */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri'
          maxNativeZoom={MAX_LEGIBLE_ZOOM}
          maxZoom={MAX_LEGIBLE_ZOOM}
        />

        {/* Controle de viewport */}
        <MapController bounds={bounds} />

        {/* Polígono da propriedade */}
        {polygonPositions && property && (
          <Polygon key={property.id} positions={polygonPositions} pathOptions={polygonStyle}>
            <Popup>
              <div style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#2E7D32' }}>{property.imovel?.nome}</h3>
                <p style={{ margin: '4px 0' }}><strong>Proprietário:</strong> {property.proprietario?.nome}</p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Área:</strong> {Number(property.imovel?.area_total_ha || 0).toFixed(2)} ha
                </p>
                <p style={{ margin: '4px 0' }}><strong>Status:</strong> {property.status_auditoria}</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Polígonos secundários (Linha Amarela) */}
        {yellowPolygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            positions={polygon.positions}
            pathOptions={{
              color: '#EAB308',
              weight: 4,
              opacity: 1,
              fill: false,
              fillOpacity: 0
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#A16207' }}>Linha Amarela</h3>
                <p style={{ margin: '4px 0' }}><strong>Descrição:</strong> {polygon.nome}</p>
                {polygon.identificadorLote && (
                  <p style={{ margin: '4px 0' }}><strong>Lote:</strong> {polygon.identificadorLote}</p>
                )}
              </div>
            </Popup>
          </Polygon>
        ))}
      </MapContainer>

      {/* Controle de data (mês a mês) */}
      <div className="map-date-control" role="group" aria-label="Selecionar mês">
        <label className="map-date-label" htmlFor="map-month-select">Data:</label>
        <select
          id="map-month-select"
          className="map-date-select"
          value={selectedMonth}
          onChange={(e) => {
            const next = e.target.value;
            setSelectedMonth(next);
            // Mock: simula recarregamento sem alterar camadas
            setMockProcessing(true);
          }}
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Info Box */}
      <div className="map-info-box">
        <div className="info-title">ℹ️ Informações do Mapa</div>
        <div className="info-content">
          <strong>Satélite:</strong> ESRI World Imagery<br/>
          <strong>Resolução:</strong> Alta resolução<br/>
          <strong>Base:</strong> OpenStreetMap<br/>
          <strong>Camadas:</strong> Área do terreno (vermelha) + Linha Amarela ({yellowPolygons.length})
        </div>
      </div>

      {error && (
        <div className="map-error-box">
          <span>⚠️ {error}</span>
        </div>
      )}
    </div>
  );
}

export default RealMapView;
