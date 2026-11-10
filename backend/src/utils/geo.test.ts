import { haversineDistanceKm, filterWithinRadius, isWithinBoundingBox } from './geo';

describe('Geospatial Utilities (geo.ts)', () => {
  it('calculates accurate distance between Delhi and Noida (~20-25 km)', () => {
    // Delhi: 28.6139, 77.2090
    // Noida Sector 62: 28.6280, 77.3649
    const dist = haversineDistanceKm(28.6139, 77.209, 28.628, 77.3649);
    expect(dist).toBeGreaterThan(14);
    expect(dist).toBeLessThan(18);
  });

  it('calculates zero distance for identical coordinates', () => {
    const dist = haversineDistanceKm(25.44, 81.84, 25.44, 81.84);
    expect(dist).toBeCloseTo(0, 4);
  });

  it('correctly checks bounding box inclusions', () => {
    // Lucknow is ~26.84, 80.94
    const inBox = isWithinBoundingBox(26.84, 80.94, 26.0, 80.0, 27.5, 81.5);
    expect(inBox).toBe(true);

    // Mumbai (19.07, 72.87) is outside UP box
    const outBox = isWithinBoundingBox(19.07, 72.87, 26.0, 80.0, 27.5, 81.5);
    expect(outBox).toBe(false);
  });

  it('filters stations within radius and sorts by distance', () => {
    const stations = [
      { name: 'Far Station (Patna)', coordinates: { latitude: 25.5941, longitude: 85.1376 } },
      { name: 'Civil Lines Prayagraj', coordinates: { latitude: 25.4526, longitude: 81.8344 } },
      { name: 'Jhusi Prayagraj', coordinates: { latitude: 25.4312, longitude: 81.892 } },
    ];

    // Center in Prayagraj
    const nearby = filterWithinRadius(stations, 25.4448, 81.8432, 25);
    expect(nearby.length).toBe(2);
    expect(nearby[0].name).toBe('Civil Lines Prayagraj');
    expect(nearby[0].distanceKm).toBeLessThan(nearby[1].distanceKm);
  });
});

