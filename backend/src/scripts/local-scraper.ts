import fs from 'fs';
import path from 'path';
import { processVideoPipeline, IngestData } from '../services/workflow';

async function run() {
  try {
    // 1. Read local JSON file
    const jsonPath = path.join(__dirname, '../../data/dessert-data.json'); 
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`File not found at: ${jsonPath}`);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    
    // UPDATE: Treat the input as an Array of IngestData
    const videoList: IngestData[] = JSON.parse(rawData);

    // Validation to ensure it's actually a list
    if (!Array.isArray(videoList)) {
        throw new Error("Input file must contain a JSON Array of objects.");
    }

    console.log("------------------------------------------------");
    console.log(`🚀 Starting Batch Process: ${videoList.length} videos`);
    console.log("------------------------------------------------");

    // 2. Loop through each video sequentially
    // We use a "for...of" loop (not forEach) to respect 'await'
    for (const [index, video] of videoList.entries()) {
        console.log(`\n▶️ [${index + 1}/${videoList.length}] Processing Video ID: ${video.id}`);

        try {
            const result = await processVideoPipeline(video);
            console.log("✅ Result:", result);
        } catch (videoError: any) {
            // Critical: Catch error here so the loop continues to the next video
            console.error(`❌ Failed to process video ${video.id}:`, videoError.message);
        }
    }

    console.log("\n🏁 Batch Job Complete.");

  } catch (error) {
    console.error("\n❌ GLOBAL SCRIPT FAILED:", error);
  }
}

run();