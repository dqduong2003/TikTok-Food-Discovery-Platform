import { CONFIG } from "../config/env";

interface Coordinates {
  lat: number;
  lng: number;
}

export const getCoordinates = async (locationName: string): Promise<Coordinates | null> => {
  try {
    const token = CONFIG.MAPBOX_ACCESS_TOKEN; // Add this to your .env
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${token}&country=au&limit=1`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center; // Mapbox returns [lng, lat]
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
};