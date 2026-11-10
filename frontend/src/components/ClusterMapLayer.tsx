import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location, AQICategory } from '../types';
import { getAQIColorHex } from '../utils';

interface StationMarkersLayerProps {
  locations: Location[];
  onSelectStation: (locationId: number) => void;
}

/**
 * StationMarkersLayer (Individual Stations Mode)
 * Renders every regulatory ground station as an individual high-visibility tactile AQI badge.
 * Eliminates clustering so users can see real-time numeric AQI values across all cities simultaneously.
 */
export function StationMarkersLayer({ locations, onSelectStation }: StationMarkersLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

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

    locations.forEach((loc) => {
      const { latitude, longitude } = loc.coordinates;
      if (!latitude || !longitude) return;

      const aqi = loc.latestAqi;
      const color = aqi?.category
        ? getAQIColorHex(aqi.category as AQICategory)
        : '#9ca3af';

      const aqiVal = aqi?.value !== undefined && aqi?.value !== null ? `${aqi.value}` : '—';
      const textColor = aqi?.category === 'Moderate' ? '#111827' : '#ffffff';

      // Tactile CPCB AQI Badge Marker: visible numeric score, color-coded, with downward pointer tip
      const stationIcon = L.divIcon({
        className: 'bb-station-marker-container',
        html: `
          <div class="bb-station-pin group" style="
            background-color: ${color};
            color: ${textColor};
            border: 2px solid #ffffff;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
            min-width: 44px;
            height: 28px;
            padding: 0 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: -0.02em;
            cursor: pointer;
            position: relative;
            user-select: none;
            transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease-out;
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
              border-top: 5px solid ${color};
            "></div>
          </div>
        `,
        iconSize: [44, 32],
        iconAnchor: [22, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([latitude, longitude], {
        icon: stationIcon,
        riseOnHover: true,
      });

      // Hover elevation: bring hovered marker above nearby overlapping pins in dense metros
      marker.on('mouseover', () => {
        marker.setZIndexOffset(10000);
      });
      marker.on('mouseout', () => {
        marker.setZIndexOffset(0);
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
            : `<div class="text-xs text-gray-400 italic p-1">AQI unavailable — insufficient valid pollutant data</div>`
        }
        <div class="text-[10px] text-gray-400 font-mono">
          ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E
        </div>
      `;

      const actionBtn = document.createElement('button');
      actionBtn.className =
        'w-full mt-2 py-1.5 px-3 rounded text-xs font-medium bg-[#106644] text-white hover:bg-[#0d5337] transition-colors text-center block shadow-xs cursor-pointer';
      actionBtn.textContent = 'Open Station Analytics →';
      actionBtn.onclick = () => {
        onSelectStation(loc.openaqId);
      };
      popupContent.appendChild(actionBtn);

      marker.bindPopup(popupContent, { maxWidth: 280 });
      layerGroup.addLayer(marker);
    });
  }, [locations, onSelectStation]);

  return null;
}

// Backward-compatible export
export const ClusterMapLayer = StationMarkersLayer;
