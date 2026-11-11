import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../types';
import { getAQIColorHex } from '../utils';

interface HeatmapLayerProps {
  locations: Location[];
  visible: boolean;
}

/**
 * Dynamic Zoom-Aware Multi-Tier Pollution Heatmap Surface.
 * Automatically expands thermal dispersion radius at national zoom levels so that
 * ground stations blend into a seamless, vibrant chromatic atmospheric surface across all of India.
 */
export function HeatmapLayer({ locations, visible }: HeatmapLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const getZoomRadiusMultiplier = (zoom: number): number => {
    if (zoom <= 4) return 3.4;  // All India macro view: 250km - 360km dispersion halo
    if (zoom === 5) return 2.6; // Pan-India regional view: 190km - 280km halo
    if (zoom === 6) return 1.9; // State level: 140km - 200km halo
    if (zoom === 7) return 1.35;// Division level: 100km - 145km halo
    if (zoom === 8) return 0.95;// District level: 70km - 105km halo
    if (zoom === 9) return 0.65;// Metropolitan level: 45km - 70km halo
    if (zoom === 10) return 0.45;// Urban corridor: 30km - 50km halo
    return 0.3;                 // Local street level: 18km - 30km halo
  };

  const renderHeatmap = useCallback(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup || !map) return;

    layerGroup.clearLayers();
    if (!visible) return;

    const currentZoom = map.getZoom();
    const zoomMultiplier = getZoomRadiusMultiplier(currentZoom);

    // Filter locations with coordinates
    const activeLocations = locations.filter(
      (loc) => loc.coordinates?.latitude && loc.coordinates?.longitude
    );

    activeLocations.forEach((loc) => {
      const { latitude, longitude } = loc.coordinates;
      const aqi = loc.latestAqi?.value ?? 100;
      const color = loc.latestAqi?.category
        ? getAQIColorHex(loc.latestAqi.category as any)
        : '#ffde33';

      // Base radius calculation weighted by AQI severity
      const severityBoost = Math.min(45000, aqi * 110);
      const baseRadiusMeters = (75000 + severityBoost) * zoomMultiplier;

      // 1. Ultra-wide atmospheric haze dispersion (blends seamlessly across Indian states)
      const ultraGlow = L.circle([latitude, longitude], {
        radius: baseRadiusMeters * 1.55,
        color: color,
        fillColor: color,
        fillOpacity: 0.08,
        stroke: false,
        interactive: false,
      });

      // 2. Outer regional dispersion plume
      const outerHalo = L.circle([latitude, longitude], {
        radius: baseRadiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.16,
        stroke: false,
        interactive: false,
      });

      // 3. Mid-tier particulate concentration boundary
      const midHalo = L.circle([latitude, longitude], {
        radius: baseRadiusMeters * 0.55,
        color: color,
        fillColor: color,
        fillOpacity: 0.26,
        stroke: false,
        interactive: false,
      });

      // 4. Core emission epicenter
      const coreHalo = L.circle([latitude, longitude], {
        radius: baseRadiusMeters * 0.22,
        color: color,
        fillColor: color,
        fillOpacity: 0.42,
        stroke: false,
        interactive: false,
      });

      layerGroup.addLayer(ultraGlow);
      layerGroup.addLayer(outerHalo);
      layerGroup.addLayer(midHalo);
      layerGroup.addLayer(coreHalo);
    });
  }, [map, locations, visible]);

  // Setup layer group and zoom listeners
  useEffect(() => {
    if (!map) return;
    const layerGroup = L.layerGroup();
    layerGroupRef.current = layerGroup;
    map.addLayer(layerGroup);

    const onZoomEnd = () => {
      renderHeatmap();
    };

    map.on('zoomend', onZoomEnd);

    return () => {
      map.off('zoomend', onZoomEnd);
      map.removeLayer(layerGroup);
      layerGroup.clearLayers();
      layerGroupRef.current = null;
    };
  }, [map, renderHeatmap]);

  // Re-render when locations or visibility changes
  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  return null;
}
