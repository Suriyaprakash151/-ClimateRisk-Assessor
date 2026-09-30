const axios = require('axios');

// Popular global cities fallback lookup dictionary
const CITY_FALLBACKS = {
  'chennai': { name: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  'mumbai': { name: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  'delhi': { name: 'Delhi, National Capital Territory, India', lat: 28.6139, lng: 77.2090, city: 'Delhi', state: 'Delhi', country: 'India' },
  'coimbatore': { name: 'Coimbatore, Tamil Nadu, India', lat: 11.0168, lng: 76.9558, city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  'bangalore': { name: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  'bengaluru': { name: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946, city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  'rajasthan': { name: 'Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873, city: 'Jaipur', state: 'Rajasthan', country: 'India' },
  'london': { name: 'London, Greater London, United Kingdom', lat: 51.5074, lng: -0.1278, city: 'London', state: 'England', country: 'United Kingdom' },
  'new york': { name: 'New York, New York, United States', lat: 40.7128, lng: -74.0060, city: 'New York', state: 'New York', country: 'United States' },
  'tokyo': { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, city: 'Tokyo', state: 'Tokyo', country: 'Japan' },
  'sydney': { name: 'Sydney, New South Wales, Australia', lat: -33.8688, lng: 151.2093, city: 'Sydney', state: 'New South Wales', country: 'Australia' },
  'paris': { name: 'Paris, Île-de-France, France', lat: 48.8566, lng: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France' }
};

/**
 * Geocode address/city query using OpenStreetMap Nominatim with offline fallback
 * @param {string} query - Location search term (e.g. "Chennai, India")
 */
const geocodeLocation = async (query) => {
  if (!query || !query.trim()) {
    throw new Error('Search query is required');
  }

  const cleanQuery = query.trim().toLowerCase();

  // Check direct local fallback first for common cities to ensure fast response
  for (const [key, loc] of Object.entries(CITY_FALLBACKS)) {
    if (cleanQuery.includes(key)) {
      return [loc];
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'ClimateRisk-Assessor-App/1.0 (contact@climaterisk.app)'
      },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      return response.data.map(item => ({
        name: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
        state: item.address?.state || item.address?.region || '',
        country: item.address?.country || ''
      }));
    }
  } catch (err) {
    console.warn(`[Geocoding Warning] Nominatim request failed: ${err.message}. Using query fallback.`);
  }

  // Return empty array if Nominatim fails or returns no match
  return [];
};

module.exports = { geocodeLocation };
