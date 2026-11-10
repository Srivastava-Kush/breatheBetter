/**
 * Geospatial utility for exact spherical distance and bounding box calculations.
 * Uses the Haversine formula (Earth radius R = 6371 km).
 */

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

export interface CoordinatesHolder {
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Filter an array of items with coordinates within exact radius in kilometers.
 * Returns items sorted by distance ascending.
 */
export function filterWithinRadius<T extends CoordinatesHolder>(
  items: T[],
  targetLat: number,
  targetLng: number,
  radiusKm: number
): Array<T & { distanceKm: number }> {
  const matches: Array<T & { distanceKm: number }> = [];

  for (const item of items) {
    if (!item.coordinates || typeof item.coordinates.latitude !== 'number') continue;
    const dist = haversineDistanceKm(
      targetLat,
      targetLng,
      item.coordinates.latitude,
      item.coordinates.longitude
    );

    if (dist <= radiusKm) {
      matches.push({
        ...item,
        distanceKm: dist,
      });
    }
  }

  return matches.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Check if a coordinate pair falls within a bounding box (minLat, minLng, maxLat, maxLng).
 */
export function isWithinBoundingBox(
  lat: number,
  lng: number,
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): boolean {
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

