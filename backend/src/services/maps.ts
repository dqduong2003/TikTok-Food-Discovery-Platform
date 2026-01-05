import { CONFIG } from "../config/env";
import axios from "axios";

interface GooglePlaceResult {
    places: {
        id: string;
        formattedAddress: string;
        location: {
          latitude: number;
          longitude: number;
        };
        displayName: {
          text: string;
          languageCode: string;
        };
      }[];
}

export async function findPlaceCoordinates(restaurantName: string, locationContext: string = "") {
    const query = `${restaurantName}, ${locationContext}`;
    
    // Endpoint for the "New" Places API
    const url = "https://places.googleapis.com/v1/places:searchText";
    
    console.log("Getting exact coordinates...")
    try {   
      const response = await axios.post<GooglePlaceResult>(
        url,
        {
          textQuery: query,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": CONFIG.GOOGLE_PLACES_API_KEY,
            // CRITICAL: You MUST specify the fields you want.
            // This keeps costs low and is required by the v1 API.
            "X-Goog-FieldMask": "places.id,places.formattedAddress,places.location,places.displayName",
          },
        }
      );
  
      const places = response.data.places;
  
      if (!places || places.length === 0) {
        console.log(`No Google Maps result found for: ${query}`);
        return null;
      }
  
      // Return the first (most relevant) match
      const topMatch = places[0];
      
      return {
        googlePlaceId: topMatch.id,
        name: topMatch.displayName.text, // The "official" name from Google
        address: topMatch.formattedAddress,
        lat: topMatch.location.latitude,
        lng: topMatch.location.longitude,
      };
  
    } catch (error) {
      console.error("Google Maps API Error:", error);
      return null;
    }
  }