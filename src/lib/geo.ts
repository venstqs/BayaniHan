import { BARANGAYS } from './data';
import type { Barangay } from './types';

/** Distance in meters between two lat/lng points. */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Approximate distance (meters) from point p to segment a-b using a local flat projection. */
function distToSegment(p: { lat: number; lng: number }, a: [number, number], b: [number, number]) {
  const kx = 111320 * Math.cos((p.lat * Math.PI) / 180);
  const ky = 110540;
  const ax = (a[1] - p.lng) * kx, ay = (a[0] - p.lat) * ky;
  const bx = (b[1] - p.lng) * kx, by = (b[0] - p.lat) * ky;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx, y = ay + t * dy;
  return Math.sqrt(x * x + y * y);
}

/** Minimum distance (meters) from point to a polyline of [lat, lng]. */
export function distToPolyline(p: { lat: number; lng: number }, line: [number, number][]) {
  if (line.length === 1) return haversine(p, { lat: line[0][0], lng: line[0][1] });
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) min = Math.min(min, distToSegment(p, line[i], line[i + 1]));
  return min;
}

export function lineLength(line: [number, number][]) {
  let d = 0;
  for (let i = 0; i < line.length - 1; i++) d += haversine({ lat: line[i][0], lng: line[i][1] }, { lat: line[i + 1][0], lng: line[i + 1][1] });
  return d;
}

/**
 * Nearest barangay centroid to a point, or null if the point is clearly outside Naga City.
 * Centroids are approximate, so this is a suggestion the person can still change.
 */
export function nearestBarangay(p: { lat: number; lng: number }, maxMeters = 3000): Barangay | null {
  let best: Barangay | null = null;
  let bestD = Infinity;
  for (const b of BARANGAYS) {
    const d = haversine(p, b);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return bestD <= maxMeters ? best : null;
}
