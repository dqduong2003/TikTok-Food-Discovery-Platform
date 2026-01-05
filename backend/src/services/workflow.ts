import fs from 'fs';
import { checkPostExists, saveToDatabase } from './db';
import { analyzeVideo } from './gemini';
import { findPlaceCoordinates } from './maps';
import { downloadTempVideo } from '../utils/download';

// Define the Input Type
export interface IngestData {
    id: string;     // The External ID (TikTok ID)
    mediaUrls: string[];
    webVideoUrl: string;
    createTimeISO: string;
    authorMeta: {
      name: string;
    };
    platform: string;
}

export async function processVideoPipeline(videoData: IngestData) {
    let tempFilePath: string | null = null;

    try {
        console.log(`🚀 Start Video Processing Pipeline...`);
        // ---------------------------------------------------------
        // 0. DETECT PLATFORM (Auto-assign based on URL)
        // ---------------------------------------------------------
        const urlLower = videoData.webVideoUrl.toLowerCase();
        
        if (urlLower.includes("tiktok")) {
            videoData.platform = "TikTok"; // Must match DB Enum exactly
        } else if (urlLower.includes("instagram")) {
            videoData.platform = "IG";     // Must match DB Enum exactly
        } else {
            // Optional: Default to TikTok or throw error if unknown
            console.warn("⚠️ Unknown platform URL. Defaulting to TikTok.");
            videoData.platform = "TikTok"; 
        }

        // ---------------------------------------------------------
        // 1. DUPLICATE CHECK
        // ---------------------------------------------------------
        const exists = await checkPostExists(videoData.id);
        if (exists) {
            console.log(`🛑 Video ${videoData.id} already exists. Skipping.`);
            return { status: 'skipped', reason: 'duplicate' };
        }

        // ---------------------------------------------------------
        // 2. DOWNLOAD VIDEO (Required for Gemini File API)
        // ---------------------------------------------------------
        if (!videoData.mediaUrls || videoData.mediaUrls.length === 0) {
            throw new Error("No media URLs provided");
        }     
        console.log("⬇️ Downloading video...");
        tempFilePath = await downloadTempVideo(videoData.mediaUrls[0], videoData.id);
        // console.log(tempFilePath);

        // ---------------------------------------------------------
        // 3. GEMINI ANALYSIS
        // ---------------------------------------------------------
        console.log("🤖 Running Gemini Analysis...");
        const analysis = await analyzeVideo(tempFilePath);
        if (!analysis) throw new Error("Gemini Analysis Failed");

        // Add the full raw response for storage
        analysis.full_json_response = { ...analysis };
        console.log(analysis);

        // ---------------------------------------------------------
        // 4. GOOGLE MAPS VERIFICATION
        // ---------------------------------------------------------
        console.log(`🗺️ Verifying location: ${analysis.restaurant_name} in ${analysis.location_area}`);
        const place = await findPlaceCoordinates(analysis.restaurant_name, analysis.location_area);
        
        if (!place) {
            console.warn("⚠️ Location not found in Google Maps. Aborting save.");
            return { status: 'failed', reason: 'location_not_found' }; 
        }
        console.log(place);

        // ---------------------------------------------------------
        // 5. SAVE TO DATABASE
        // ---------------------------------------------------------
        await saveToDatabase(videoData, analysis, place);
        console.log('💾 DB Data Pipeline Complete Successfully.');
        return { status: 'success', venue: place.name }
    } catch (error: any) {
        console.error("❌ Processing Error:", error.message);
    } finally {
        // CLEANUP
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log("🧹 Temp file cleaned up.");
        }
    }
}