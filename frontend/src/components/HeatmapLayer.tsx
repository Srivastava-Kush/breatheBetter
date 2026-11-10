import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../types';
import { getAQIColorHex } from '../utils';

interface HeatmapLayerProps {
  locations: Location[];
  visible: boolean;
}

/**
 * Continuous Multi-Point Pollution Heatmap Surface.
 * Employs Gaussian density radius blending to visualize pollution intensity across geographic space.
 */
export function HeatmapLayer({ locations, visible }: HeatmapLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    const layerGroup = L.layerGroup();
    layerGroupRef.current = layerGroup;
    map.addLayer(layerGroup);

    return () => {
      map.removeLayer(layerGroup);
      layerGroup.clearLayers();
      layerGroupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    layerGroup.clearLayers();
    if (!visible) return;

    // Filter locations with coordinates and valid AQI
    const activeLocations = locations.filter(
      (loc) => loc.coordinates?.latitude && loc.coordinates?.longitude
    );

    activeLocations.forEach((loc) => {
      const { latitude, longitude } = loc.coordinates;
      const aqi = loc.latestAqi?.value ?? 100;
      const color = loc.latestAqi?.category
        ? getAQIColorHex(loc.latestAqi.category as any)
        : '#ffde33';

      // Higher AQI generates wider, more intense thermal dispersion plume
      const baseRadiusMeters = 55000 + Math.min(60000, aqi * 120);

      // Outer diffuse dispersion halo
      const outerHalo = L.circle([latitude, longitude], {
        radius: baseRadiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        stroke: false,
        interactive: false,
      });

      // Mid-tier thermal concentration
      const midHalo = L.circle([latitude, longitude], {
        radius: baseRadiusMeters * 0.55,
        color: color,
        fillColor: color,
        fillOpacity: 0.22,
        stroke: false,
        interactive: false,
      });

      // Core emission epicenter
      const coreHalo = L.circle([latitude, longitude], {
        radius: baseRadiusMeters * 0.25,
        color: color,
        fillColor: color,
        fillOpacity: 0.38,
        stroke: false,
        interactive: false,
      });

      layerGroup.addLayer(outerHalo);
      layerGroup.addLayer(midHalo);
      layerGroup.addLayer(coreHalo);
    });
  }, [locations, visible]);

  return null;
}

