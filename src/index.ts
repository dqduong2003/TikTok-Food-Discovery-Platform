import { analyzeVideo } from "./services/gemini";
import { findPlaceCoordinates } from "./services/maps"
import * as place from "./sample_data.json";


async function main() {
  // const sampleVideoPath = "./video/tiktok_cafe_2.mp4"

  // const insightData = await analyzeVideo(sampleVideoPath);
  // console.log(insightData);
  // console.log(typeof insightData);

  const officialPlace = await findPlaceCoordinates(place.restaurant_name, place.address)
  if (officialPlace) {
    console.log(officialPlace);
  }
}

main();