import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/env';

// Initialize client
const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SECRET_KEY);

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
interface VideoData {
    id: string;          // The External ID (TikTok ID)
    webVideoUrl: string;
    authorMeta: { name: string };
    createTimeISO: string;
    platform: string;
}
interface GeminiAnalysis {
    restaurant_name: string;
    dishes_detected: string[];
    vibe_tags: string[];
    sentiment_score: number;
    summary: string;
    full_json_response: any;
}
interface GooglePlaceData {
    googlePlaceId: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

// ---------------------------------------------------------
// "Pre-Check" Function
// ---------------------------------------------------------
export async function checkPostExists(externalId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('social_posts')
      .select('id')
      .eq('external_id', externalId)
      .maybeSingle();
  
    if (error) {
      console.error("Error checking post existence:", error);
      return false; // Assume false to be safe, or throw error
    }
    return !!data; // Returns true if exists, false if not
}

// ---------------------------------------------------------
// Main Transaction Function
// ---------------------------------------------------------
export async function saveToDatabase (
    video: VideoData,
    analysis: GeminiAnalysis,
    place: GooglePlaceData
) {
    console.log(`💾 Starting DB Transaction for: ${place.name}`);

    try {
    // Call the Postgress function in Supabase database
    // This call is ATOMIC. Either it completely succeeds, or it completely fails.
    const { error } = await supabase.rpc('handle_new_review', {
        p_video: video,
        p_analysis: analysis,
        p_place: place
      });
  
      if (error) {
        throw new Error(`RPC Failed: ${error.message}`);
      }

        console.log('✅ DB Transaction Completed.');
    } catch (err) {
        console.error('❌ Transaction Failed:', err);
        throw err; // Re-throw so the worker knows this job failed
    }
}

