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
        console.log(`🚀 Processing Video: ${videoData.id}`);

        // ---------------------------------------------------------
        // 1. DUPLICATE CHECK
        // ---------------------------------------------------------
        const exists = await checkPostExists(videoData.id);
        if (exists) {
            console.log(`🛑 Video ${videoData.id} already exists. Skipping.`);
            // res.status(200).json({ status: 'skipped', reason: 'duplicate' });
            return;
        }

        // ---------------------------------------------------------
        // 2. DOWNLOAD VIDEO (Required for Gemini File API)
        // ---------------------------------------------------------
        if (!videoData.mediaUrls || videoData.mediaUrls.length === 0) {
            throw new Error("No media URLs provided");
        }     
        console.log("⬇️ Downloading video...");

        // ---------------------------------------------------------
        // 3. GEMINI ANALYSIS
        // ---------------------------------------------------------
        console.log("🤖 Running Gemini Analysis...");

        // ---------------------------------------------------------
        // 4. GOOGLE MAPS VERIFICATION
        // ---------------------------------------------------------

        // ---------------------------------------------------------
        // 5. SAVE TO DATABASE
        // ---------------------------------------------------------
    } catch (error: any) {
        console.error("❌ Processing Error:", error.message);
        // res.status(500).json({ error: error.message });
    } finally {
        // CLEANUP
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
    }
}