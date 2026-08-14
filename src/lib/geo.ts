/**
 * Geolocation utilities for wine delivery zone detection
 * Works with Netlify Edge Functions geo headers and client-side fallbacks
 */

import type { GeoLocation, Supplier, DeliveryZone } from './types';

/**
 * Default geo data when location cannot be determined
 */
export const DEFAULT_GEO: GeoLocation = {
  country: 'US',
  subdivision: undefined,
  city: undefined,
  postalCode: undefined,
  latitude: undefined,
  longitude: undefined,
  timezone: 'America/New_York',
};

/**
 * Parse geo data from request headers (server-side)
 * Priority: Netlify context > Netlify headers > Default
 */
export function parseGeoFromHeaders(headers: Headers): GeoLocation {
  const country = headers.get('x-nf-country') || headers.get('X-Geo-Country') || DEFAULT_GEO.country;
  const subdivision = headers.get('x-nf-subdivision') || headers.get('X-Geo-Subdivision') || undefined;
  const city = headers.get('x-nf-city') || headers.get('X-Geo-City') || undefined;
  const postalCode = headers.get('x-nf-postal-code') || undefined;
  const timezone = headers.get('x-nf-timezone') || headers.get('X-Geo-Timezone') || DEFAULT_GEO.timezone;
  
  return {
    country,
    subdivision,
    city,
    postalCode,
    latitude: undefined,
    longitude: undefined,
    timezone,
  };
}

/**
 * Get geo data from browser API (client-side fallback)
 * Requires user permission for geolocation
 */
export async function getBrowserGeolocation(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          country: DEFAULT_GEO.country, // Browser doesn't provide country
          subdivision: undefined,
          city: undefined,
          postalCode: undefined,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      },
      () => {
        // Permission denied or error
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Reverse geocode coordinates to location data
 * Uses a free API - in production, consider a paid service for reliability
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<Partial<GeoLocation>> {
  try {
    // Using OpenStreetMap Nominatim (free, rate-limited)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    return {
      country: data.address?.country_code?.toUpperCase(),
      subdivision: data.address?.state,
      city: data.address?.city || data.address?.town || data.address?.village,
      postalCode: data.address?.postcode,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {};
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a location is within a supplier's delivery radius
 */
export function isInDeliveryZone(
  userLocation: GeoLocation,
  supplier: Supplier
): boolean {
  if (!supplier.location || !supplier.deliveryRadius) {
    return false;
  }
  
  const supplierCoords = supplier.location.coordinates;
  if (!supplierCoords?.latitude || !supplierCoords?.longitude) {
    return false;
  }
  
  // If user has coordinates, calculate exact distance
  if (userLocation.latitude && userLocation.longitude) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      supplierCoords.latitude,
      supplierCoords.longitude
    );
    
    return distance <= supplier.deliveryRadius;
  }
  
  // Fallback: Check by city/state match (less accurate)
  if (userLocation.city && supplierCoords.city) {
    return userLocation.city.toLowerCase() === supplierCoords.city.toLowerCase();
  }
  
  if (userLocation.subdivision && supplierCoords.state) {
    return (
      userLocation.subdivision.toLowerCase() === supplierCoords.state.toLowerCase()
    );
  }
  
  return false;
}

/**
 * Filter products by user's location
 * Only returns products from suppliers within delivery radius
 */
export function filterProductsByLocation<T extends { supplier?: Supplier | null }>(
  products: T[],
  userLocation: GeoLocation
): T[] {
  return products.filter((product) => {
    if (!product.supplier) {
      return false;
    }
    return isInDeliveryZone(userLocation, product.supplier);
  });
}

/**
 * Get available delivery zones for a location
 * Returns list of suppliers that can deliver to the user
 */
export function getAvailableSuppliers(
  suppliers: Supplier[],
  userLocation: GeoLocation
): Supplier[] {
  return suppliers.filter((supplier) => isInDeliveryZone(userLocation, supplier));
}

/**
 * Store geo data in session storage for persistence across pages
 */
export function storeGeoData(geo: GeoLocation): void {
  try {
    sessionStorage.setItem('wine_drop_geo', JSON.stringify(geo));
  } catch (e) {
    console.error('Failed to store geo data:', e);
  }
}

/**
 * Retrieve stored geo data from session storage
 */
export function getStoredGeoData(): GeoLocation | null {
  try {
    const stored = sessionStorage.getItem('wine_drop_geo');
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as GeoLocation;
  } catch (e) {
    console.error('Failed to retrieve geo data:', e);
    return null;
  }
}

/**
 * Initialize geo data for the application
 * Priority: Stored > Headers > Browser API > Default
 */
export async function initializeGeo(headers?: Headers): Promise<GeoLocation> {
  // Try stored data first
  const stored = getStoredGeoData();
  if (stored) {
    return stored;
  }
  
  // Try server-provided data
  if (headers) {
    const geoFromHeaders = parseGeoFromHeaders(headers);
    if (geoFromHeaders.country !== DEFAULT_GEO.country || geoFromHeaders.city) {
      storeGeoData(geoFromHeaders);
      return geoFromHeaders;
    }
  }
  
  // Try browser geolocation as fallback
  const browserGeo = await getBrowserGeolocation();
  if (browserGeo) {
    // Enrich with reverse geocoding
    const enriched = await reverseGeocode(
      browserGeo.latitude!,
      browserGeo.longitude!
    );
    const finalGeo = { ...browserGeo, ...enriched };
    storeGeoData(finalGeo);
    return finalGeo;
  }
  
  // Use default
  return DEFAULT_GEO;
}

export default {
  DEFAULT_GEO,
  parseGeoFromHeaders,
  getBrowserGeolocation,
  reverseGeocode,
  calculateDistance,
  isInDeliveryZone,
  filterProductsByLocation,
  getAvailableSuppliers,
  storeGeoData,
  getStoredGeoData,
  initializeGeo,
};
