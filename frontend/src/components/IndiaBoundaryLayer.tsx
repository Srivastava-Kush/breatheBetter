import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import indiaBoundaryData from '../data/india-boundary.json';
import indiaMaskData from '../data/india-mask.json';
import { useIsDark } from '../stores/appStore';

interface IndiaBoundaryLayerProps {
  highlight: boolean;
}

/**
 * High-performance GeoJSON layer that spotlights India:
 * 1. Inverse World Mask dimming regions outside India.
 * 2. High-precision sovereign national border line with emerald ambient glow.
 */
export function IndiaBoundaryLayer({ highlight }: IndiaBoundaryLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const isDark = useIsDark();

  useEffect(() => {
    if (!map) return;
    const group = L.layerGroup();
    layerGroupRef.current = group;
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
      group.clearLayers();
      layerGroupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (!highlight) return;

    // 1. Inverted World Mask - Dims everything outside India's borders
    const maskLayer = L.geoJSON(indiaMaskData as any, {
      style: {
        fillColor: isDark ? '#000000' : '#0f172a',
        fillOpacity: isDark ? 0.6 : 0.22,
        stroke: false,
      },
      interactive: false,
    });

    // 2. Outer Ambient Boundary Glow
    const glowBorder = L.geoJSON(indiaBoundaryData as any, {
      style: {
        color: '#10b981',
        weight: isDark ? 6 : 5,
        opacity: isDark ? 0.65 : 0.35,
        fill: false,
      },
      interactive: false,
    });

    // 3. Crisp Sovereign National Frontier Boundary
    const nationalBorder = L.geoJSON(indiaBoundaryData as any, {
      style: {
        color: isDark ? '#34d399' : '#047857',
        weight: 2.2,
        opacity: 0.95,
        fill: false,
      },
      interactive: false,
    });

    group.addLayer(maskLayer);
    group.addLayer(glowBorder);
    group.addLayer(nationalBorder);
  }, [highlight, isDark]);

  return null;
}
