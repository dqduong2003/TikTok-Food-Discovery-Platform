import { checkPostExists, saveToDatabase } from '../services/db';
import { analyzeVideo } from '../services/gemini';
import { findPlaceCoordinates } from '../services/maps';

// Interface for the incoming Request Body
interface IngestRequest {
    id: string;     // The External ID (TikTok ID)
    mediaUrls: string[];
    webVideoUrl: string;
    createTimeISO: string;
    authorMeta: {
      name: string;
    };
    platform: string;
}

export const processSingleVideo = async (req: IngestRequest) => {
    const videoData: IngestRequest = req;
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
        // We use the first URL in mediaUrls
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
    }
}

