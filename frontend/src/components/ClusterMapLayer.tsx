import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location, AQICategory } from '../types';
import { getAQIColorHex } from '../utils';

interface StationMarkersLayerProps {
  locations: Location[];
  onSelectStation: (locationId: number) => void;
  focusedStationId?: number | null;
}

/**
 * StationMarkersLayer (Individual Stations Mode)
 * Renders every regulatory ground station as an individual high-visibility tactile AQI badge.
 * Eliminates clustering so users can see real-time numeric AQI values across all cities simultaneously.
 */
export function StationMarkersLayer({ locations, onSelectStation, focusedStationId }: StationMarkersLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    // Create a plain LayerGroup for all individual stations (No clustering)
    const layerGroup = L.layerGroup();
    layerGroupRef.current = layerGroup;
    map.addLayer(layerGroup);

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current.clearLayers();
        layerGroupRef.current = null;
      }
    };
  }, [map]);

  // Update markers when locations or projected values change
  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();
    markersRef.current.clear();

    locations.forEach((loc) => {
      const { latitude, longitude } = loc.coordinates;
      if (!latitude || !longitude) return;

      const aqi = loc.latestAqi;
      const hasAqi = aqi?.value !== undefined && aqi?.value !== null;
      const isFocused = loc.openaqId === focusedStationId;
      const color = aqi?.category
        ? getAQIColorHex(aqi.category as AQICategory)
        : '#9ca3af';

      const aqiVal = hasAqi ? `${aqi.value}` : '—';
      const textColor = aqi?.category === 'Moderate' ? '#111827' : '#ffffff';

      // Tactile CPCB AQI Badge Marker for stations with valid AQI; subtle discrete dot for calibrating/offline stations
      const stationIcon = hasAqi
        ? L.divIcon({
            className: `bb-station-marker-container ${isFocused ? 'bb-marker-focused' : ''}`,
            html: `
              <div class="relative flex items-center justify-center">
                ${
                  isFocused
                    ? `
                  <div class="bb-sonar-ring bb-sonar-ring-1"></div>
                  <div class="bb-sonar-ring bb-sonar-ring-2"></div>
                  <div class="bb-sonar-ring bb-sonar-ring-3"></div>
                  <div style="
                    position: absolute;
                    bottom: 40px;
                    left: 50%;
                    transform: translateX(-50%);
                    white-space: nowrap;
                    z-index: 50000;
                    pointer-events: none;
                    animation: beacon-bounce 1.5s ease-in-out infinite;
                  ">
                    <div style="
                      background: #059669;
                      color: #ffffff;
                      font-size: 10px;
                      font-weight: 800;
                      letter-spacing: 0.04em;
                      padding: 2.5px 8px;
                      border-radius: 9999px;
                      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.5);
                      border: 1.5px solid #ffffff;
                      display: flex;
                      align-items: center;
                      gap: 4px;
                    ">
                      <span>🎯 FOCUSED MONITOR</span>
                    </div>
                    <div class="bb-focus-beacon-arrow"></div>
                  </div>
                `
                    : ''
                }
                <div class="bb-station-pin group" style="
                  background-color: ${color};
                  color: ${textColor};
                  border: ${isFocused ? '3.5px solid #10b981' : '2px solid #ffffff'};
                  border-radius: 9999px;
                  box-shadow: ${
                    isFocused
                      ? '0 0 0 6px rgba(16, 185, 129, 0.6), 0 0 35px rgba(16, 185, 129, 0.95), 0 8px 24px rgba(0, 0, 0, 0.5)'
                      : '0 4px 14px rgba(0, 0, 0, 0.35)'
                  };
                  min-width: ${isFocused ? '52px' : '44px'};
                  height: ${isFocused ? '32px' : '28px'};
                  padding: 0 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: ${isFocused ? '15px' : '13px'};
                  font-weight: 800;
                  letter-spacing: -0.02em;
                  cursor: pointer;
                  position: relative;
                  user-select: none;
                  transform: ${isFocused ? 'scale(1.45)' : 'scale(1)'};
                  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease-out;
                  z-index: ${isFocused ? '40000' : '1'};
                ">
                  <span>${aqiVal}</span>
                  <div style="
                    position: absolute;
                    bottom: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 5px solid ${isFocused ? '#10b981' : color};
                  "></div>
                </div>
              </div>
            `,
            iconSize: isFocused ? [54, 40] : [44, 32],
            iconAnchor: isFocused ? [27, 40] : [22, 32],
            popupAnchor: [0, -36],
          })
        : L.divIcon({
            className: `bb-station-dot-container ${isFocused ? 'bb-dot-focused' : ''}`,
            html: `
              <div class="relative flex items-center justify-center">
                ${
                  isFocused
                    ? `
                  <div class="bb-sonar-ring bb-sonar-ring-1"></div>
                  <div class="bb-sonar-ring bb-sonar-ring-2"></div>
                `
                    : ''
                }
                <div class="bb-station-dot group" style="
                  background-color: ${isFocused ? '#10b981' : '#94a3b8'};
                  border: ${isFocused ? '3px solid #ffffff' : '2px solid #ffffff'};
                  border-radius: 9999px;
                  box-shadow: ${
                    isFocused
                      ? '0 0 0 6px rgba(16, 185, 129, 0.6), 0 0 24px rgba(16, 185, 129, 0.95)'
                      : '0 1px 4px rgba(0, 0, 0, 0.3)'
                  };
                  width: ${isFocused ? '20px' : '10px'};
                  height: ${isFocused ? '20px' : '10px'};
                  cursor: pointer;
                  transform: ${isFocused ? 'scale(1.4)' : 'scale(1)'};
                  transition: transform 0.2s ease-out;
                " title="${loc.name} ${isFocused ? '(Focused)' : '(Awaiting telemetry cycle)'}"></div>
              </div>
            `,
            iconSize: isFocused ? [20, 20] : [10, 10],
            iconAnchor: isFocused ? [10, 10] : [5, 5],
            popupAnchor: [0, -12],
          });

      const marker = L.marker([latitude, longitude], {
        icon: stationIcon,
        riseOnHover: true,
        zIndexOffset: isFocused ? 45000 : 0,
      });

      marker.on('mouseover', () => {
        marker.setZIndexOffset(50000);
      });
      marker.on('mouseout', () => {
        marker.setZIndexOffset(isFocused ? 45000 : 0);
      });

      const isProjected = (aqi as any)?.isProjected;
      const hourOffset = (aqi as any)?.hourOffset;

      const popupContent = document.createElement('div');
      popupContent.className = 'bb-station-popup space-y-2 text-sm p-1 min-w-[220px]';
      popupContent.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="font-semibold text-gray-900 leading-tight">${loc.name}</div>
          ${
            isProjected
              ? `<span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold shrink-0">🔮 +${hourOffset}h Pred</span>`
              : `<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold shrink-0">🟢 Live</span>`
          }
        </div>
        ${loc.locality ? `<div class="text-gray-600 text-xs">${loc.locality}</div>` : ''}
        ${
          aqi
            ? `
          <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-100 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500 font-medium">${isProjected ? 'Predicted AQI' : 'CPCB AQI'}</span>
              <span class="px-2 py-0.5 rounded text-xs font-bold text-white shadow-xs" style="background-color: ${color}">
                ${aqi.value} · ${aqi.category}
              </span>
            </div>
            ${
              aqi.dominantPollutant
                ? `<div class="text-[11px] text-gray-600 flex justify-between">
                     <span>Dominant:</span>
                     <strong class="uppercase font-semibold text-gray-900">${aqi.dominantPollutant}</strong>
                   </div>`
                : ''
            }
            <div class="text-[10px] text-gray-400 italic">${isProjected ? 'ML Diurnal & Dispersion Projection' : 'CPCB Sub-Index Methodology'}</div>
          </div>
        `
            : `<div class="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs">
                 <div class="font-bold flex items-center gap-1 text-[11px]">⚠️ Sensor Offline / Calibrating</div>
                 <div class="text-[10px] text-amber-700 mt-0.5">Live ground telemetry awaiting next station observation cycle.</div>
               </div>`
        }
        <div class="text-[10px] text-gray-400 font-mono">
          ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E
        </div>
      `;

      const actionBtn = document.createElement('button');
      actionBtn.className =
        'w-full mt-2 py-1.5 px-3 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-center block shadow-xs cursor-pointer';
      actionBtn.textContent = 'Open Station Analytics →';
      actionBtn.onclick = () => {
        onSelectStation(loc.openaqId);
      };
      popupContent.appendChild(actionBtn);

      marker.bindPopup(popupContent, { maxWidth: 280 });
      layerGroup.addLayer(marker);
      markersRef.current.set(loc.openaqId, marker);
    });
  }, [locations, onSelectStation, focusedStationId]);

  // Automatically pop open popup and elevate marker when a station is focused
  useEffect(() => {
    if (!focusedStationId) return;
    const marker = markersRef.current.get(focusedStationId);
    if (marker) {
      marker.setZIndexOffset(35000);
      marker.openPopup();
    }
  }, [focusedStationId]);

  return null;
}

// Backward-compatible export
export const ClusterMapLayer = StationMarkersLayer;
