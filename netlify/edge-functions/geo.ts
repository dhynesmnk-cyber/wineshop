import type { Config } from '@netlify/edge-functions';

export const config: Config = {
  path: '/*',
};

interface GeoData {
  country: string;
  subdivision?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  
  // Get geo data from Netlify headers (primary method)
  const country = context.geo?.country?.code || request.headers.get('x-nf-country') || '';
  const subdivision = context.geo?.subdivision?.code || request.headers.get('x-nf-subdivision') || '';
  const city = context.geo?.city?.names?.en || request.headers.get('x-nf-city') || '';
  const postalCode = context.geo?.postalCode || request.headers.get('x-nf-postal-code') || '';
  const latitude = context.geo?.latitude;
  const longitude = context.geo?.longitude;
  const timezone = context.geo?.timezone?.name || request.headers.get('x-nf-timezone') || '';
  
  const geoData: GeoData = {
    country,
    subdivision: subdivision || undefined,
    city: city || undefined,
    postalCode: postalCode || undefined,
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    timezone: timezone || undefined,
  };
  
  // Fallback: If no geo data from Netlify, try IP-based geolocation
  // This would require an external API call, so we'll skip it for edge functions
  // and handle it client-side instead
  
  // Set geo data in response headers for downstream functions/pages
  const response = await context.next();
  
  // Add geo headers to response (for caching purposes)
  response.headers.set('X-Geo-Country', geoData.country);
  if (geoData.subdivision) {
    response.headers.set('X-Geo-Subdivision', geoData.subdivision);
  }
  if (geoData.city) {
    response.headers.set('X-Geo-City', geoData.city);
  }
  if (geoData.timezone) {
    response.headers.set('X-Geo-Timezone', geoData.timezone);
  }
  
  // Set cache control based on geo data
  // Geo data is stable per user, so we can cache for a reasonable time
  response.headers.set('Cache-Control', 'public, max-age=3600');
  
  // Add Vary header to ensure different geo locations get different cached versions
  response.headers.append('Vary', 'X-NF-Country, X-NF-Subdivision, X-NF-City');
  
  return response;
};
