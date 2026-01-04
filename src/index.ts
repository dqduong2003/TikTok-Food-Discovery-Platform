import { analyzeVideo } from "./services/gemini"; // Import your function

async function main() {
  const sampleVideoPath = "./video/tiktok_cafe_2.mp4"

  const insightData = await analyzeVideo(sampleVideoPath);
  console.log(insightData);
  console.log(typeof insightData);
}

main();