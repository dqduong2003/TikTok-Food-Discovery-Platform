import { analyzeVideo } from "./services/gemini";
import { findPlaceCoordinates } from "./services/maps"
import * as place from "./sample_data.json";


async function main() {
  const sampleVideoPath = "./video/multi.mp4"

  // 1. Gemini extracts raw text
  const insightData = await analyzeVideo(sampleVideoPath);
  console.log(insightData);

  // 2. Google Maps verifies it and gets coords
  // const officialPlace = await findPlaceCoordinates(place.restaurant_name, place.address)
  if (insightData && insightData.restaurant_name) {
    const officialPlace = await findPlaceCoordinates(insightData.restaurant_name, insightData.address)
    if (officialPlace) {
      console.log(officialPlace);
    }
  }
}

main();