import { analyzeVideo } from "./services/gemini";
import { findPlaceCoordinates } from "./services/maps"
import { saveToDatabase } from "./services/db"
import tiktokData from "../sample_data/tiktok.json";
import geminiData from "../sample_data/gemini.json";
import placesData from "../sample_data/places.json";

async function main() {
  // Import all sample data and transform to match the expected types
  const videoData = {
    id: tiktokData.id,
    webVideoUrl: tiktokData.webVideoUrl,
    authorMeta: {
      name: tiktokData.authorMeta.name
    },
    createTimeISO: tiktokData.createTimeISO,
    platform: "TikTok",
  };

  const analysisData = {
    restaurant_name: geminiData.restaurant_name,
    dishes_detected: geminiData.dishes_detected,
    vibe_tags: geminiData.vibe_tags,
    sentiment_score: geminiData.sentiment_score,
    summary: geminiData.summary,
    full_json_response: geminiData
  };

  const placeData = {
    googlePlaceId: placesData.googlePlaceId,
    name: placesData.name,
    address: placesData.address,
    lat: placesData.lat,
    lng: placesData.lng
  };

  // Save to database
  await saveToDatabase(videoData, analysisData, placeData);
  console.log("✅ Data saved to database successfully!");
}

main();