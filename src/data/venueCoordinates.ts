/**
 * venueCoordinates.ts — Koordinat lat/lng per venue untuk Concert Check-in
 * Radius check-in: 1 km (1000 meter)
 */

export interface VenueCoord {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export const VENUE_COORDS: Record<string, VenueCoord> = {
  // GBK
  'Gelora Bung Karno (GBK) Utama':              { name: 'GBK Utama',     lat: -6.2183, lng: 106.8018, radiusMeters: 1000 },
  'Stadion Utama Gelora Bung Karno (GBK)':       { name: 'GBK Utama',     lat: -6.2183, lng: 106.8018, radiusMeters: 1000 },
  'Indonesia Arena, GBK':                        { name: 'Indonesia Arena', lat: -6.2175, lng: 106.8027, radiusMeters: 800 },
  'Istora Senayan':                              { name: 'Istora Senayan', lat: -6.2178, lng: 106.8014, radiusMeters: 800 },
  // JIS
  'Jakarta International Stadium (JIS)':         { name: 'JIS',           lat: -6.1256, lng: 106.8705, radiusMeters: 1000 },
  // ICE BSD
  'ICE BSD City':                                { name: 'ICE BSD',       lat: -6.3024, lng: 106.6534, radiusMeters: 1000 },
  'ICE BSD City Hall 5 & 6':                     { name: 'ICE BSD',       lat: -6.3024, lng: 106.6534, radiusMeters: 1000 },
  // NICE PIK2
  'NICE PIK2':                                   { name: 'NICE PIK2',     lat: -6.0932, lng: 106.7254, radiusMeters: 1000 },
  // Beach City
  'Beach City International Stadium':            { name: 'Beach City',    lat: -6.1249, lng: 106.8346, radiusMeters: 1000 },
  // Ancol
  'Pantai Carnaval Ancol':                       { name: 'Ancol Carnaval', lat: -6.1219, lng: 106.8512, radiusMeters: 1200 },
  // JIEXPO
  'JIEXPO Kemayoran':                            { name: 'JIEXPO',        lat: -6.1620, lng: 106.8565, radiusMeters: 1000 },
  // Balai Sarbini
  'Balai Sarbini':                               { name: 'Balai Sarbini', lat: -6.2213, lng: 106.8226, radiusMeters: 600 },
};

/** Cari VenueCoord berdasarkan nama venue (partial match) */
export function findVenueCoord(venueName: string): VenueCoord | null {
  // Exact match
  if (VENUE_COORDS[venueName]) return VENUE_COORDS[venueName];
  // Partial match
  const lower = venueName.toLowerCase();
  for (const [key, val] of Object.entries(VENUE_COORDS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val;
  }
  return null;
}

/** Hitung jarak (meter) antara dua titik (Haversine) */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
