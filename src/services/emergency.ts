const OVERPASS_API = "https://overpass-api.de/api/interpreter";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type EmergencyHospital = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distanceKm: number;
  hasMaternalCare: boolean;
  phone?: string;
};

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

const MATERNAL_KEYWORDS = [
  "maternity",
  "maternal",
  "obstetric",
  "obstetrics",
  "gynaec",
  "gyne",
  "women",
  "pregnan",
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(origin: Coordinates, target: Coordinates) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(target.latitude - origin.latitude);
  const lonDelta = toRadians(target.longitude - origin.longitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(target.latitude)) *
      Math.sin(lonDelta / 2) *
      Math.sin(lonDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function hasMaternalSignal(tags: Record<string, string> = {}) {
  const searchable = [
    tags.name,
    tags.description,
    tags["healthcare:speciality"],
    tags.speciality,
    tags["hospital:speciality"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return MATERNAL_KEYWORDS.some((keyword) => searchable.includes(keyword));
}

function formatAddress(tags: Record<string, string> = {}) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(", ");

  return tags["addr:full"] || tags["is_in"] || "Address unavailable";
}

async function runOverpassQuery(query: string) {
  const response = await fetch(OVERPASS_API, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass error: ${response.status}`);
  }

  return (await response.json()) as OverpassResponse;
}

function buildPrimaryQuery(latitude: number, longitude: number, radiusMeters: number) {
  return `
[out:json][timeout:25];
(
  nwr(around:${radiusMeters},${latitude},${longitude})[amenity=hospital][~"name|healthcare:speciality|description"~"maternity|maternal|obstetric|gynaec|gyne|women|pregnan",i];
  nwr(around:${radiusMeters},${latitude},${longitude})[amenity=hospital]["healthcare:speciality"~"obstetric|gynaec|gyne|maternity|maternal",i];
);
out center tags;
`.trim();
}

function buildFallbackQuery(latitude: number, longitude: number, radiusMeters: number) {
  return `
[out:json][timeout:25];
(
  nwr(around:${radiusMeters},${latitude},${longitude})[amenity=hospital];
  nwr(around:${radiusMeters},${latitude},${longitude})[healthcare=hospital];
);
out center tags;
`.trim();
}

function mapElementsToHospitals(elements: OverpassElement[], origin: Coordinates) {
  const deduped = new Map<string, EmergencyHospital>();

  for (const element of elements) {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (typeof latitude !== "number" || typeof longitude !== "number") continue;

    const tags = element.tags ?? {};
    const name = tags.name || "Nearby Hospital";
    const phone = tags.phone || tags["contact:phone"] || tags["phone:mobile"];
    const hasMaternalCare = hasMaternalSignal(tags);
    const distanceKm = getDistanceKm(origin, { latitude, longitude });

    const key = `${name.toLowerCase()}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;

    deduped.set(key, {
      id: String(element.id),
      name,
      latitude,
      longitude,
      address: formatAddress(tags),
      distanceKm,
      hasMaternalCare,
      phone,
    });
  }

  return Array.from(deduped.values()).sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function findNearbyMaternalHospitals(
  origin: Coordinates,
  options?: { radiusMeters?: number; limit?: number }
) {
  const radiusMeters = options?.radiusMeters ?? 40000;
  const limit = options?.limit ?? 30;

  const primary = await runOverpassQuery(buildPrimaryQuery(origin.latitude, origin.longitude, radiusMeters));
  let results = mapElementsToHospitals(primary.elements ?? [], origin);

  if (results.length === 0) {
    const fallback = await runOverpassQuery(buildFallbackQuery(origin.latitude, origin.longitude, radiusMeters));
    results = mapElementsToHospitals(fallback.elements ?? [], origin);
  }

  return results.slice(0, limit);
}

export function buildDirectionsUrl(from: Coordinates, to: Coordinates) {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from.latitude}%2C${from.longitude}%3B${to.latitude}%2C${to.longitude}`;
}

export function buildIndiaOverviewMapUrl() {
  return "https://www.openstreetmap.org/#map=5/22.5937/78.9629";
}
