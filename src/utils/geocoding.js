/**
 * Geocode an address using Nominatim (OpenStreetMap) - free, no API key needed.
 * Returns { lat, lng } or null if not found.
 */
export async function geocodeAddress(address) {
  try {
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=us&limit=1`,
      {
        headers: {
          "User-Agent": "APHealthcareFacilityFinder/1.0",
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Calculate driving distance/duration using OSRM (free, no API key).
 * Returns { distance (miles), duration (minutes) } or null.
 */
export async function getDrivingDistance(fromLat, fromLng, toLat, toLng) {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    );
    const data = await response.json();
    if (data && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distanceMeters: route.distance,
        distanceMiles: (route.distance * 0.000621371).toFixed(1),
        durationSeconds: route.duration,
        durationMinutes: Math.round(route.duration / 60),
      };
    }
    return null;
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
}

/**
 * Batch geocode facilities (with rate limiting for Nominatim - 1 req/sec).
 * We pre-geocode and cache results in sessionStorage.
 */
export async function geocodeFacility(address) {
  if (!address || address.toLowerCase().includes("virtual")) {
    return null;
  }

  const cacheKey = `geo_${address}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await geocodeAddress(address);
  if (result) {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  }
  return result;
}

/**
 * Generate a Google Maps directions URL.
 */
export function getGoogleMapsDirectionsUrl(fromAddress, toAddress) {
  const from = encodeURIComponent(fromAddress);
  const to = encodeURIComponent(toAddress);
  return `https://www.google.com/maps/dir/?api=1&origin=${from}&destination=${to}&travelmode=driving`;
}

/**
 * Haversine formula for straight-line distance (fallback).
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
