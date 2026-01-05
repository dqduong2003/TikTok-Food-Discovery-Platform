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
// Main Transaction Function
// ---------------------------------------------------------
export async function saveToDatabase (
    video: VideoData,
    analysis: GeminiAnalysis,
    place: GooglePlaceData
) {
    console.log(`💾 Starting DB Transaction for: ${place.name}`);

    try {
        // =========================================================
        // STEP A: VENUE LOGIC (Create OR Update with Weighted Avg)
        // =========================================================
        let venueId: number;

        // 1. Check if venue exists
        const { data: existingVenue, error: findError } = await supabase
            .from('venues')
            .select('id, review_count, cached_rating')
            .eq('google_place_id', place.googlePlaceId)
            .maybeSingle();

        if (findError) throw new Error(`Venue lookup failed: ${findError.message}`);

        if (existingVenue) {
            // --- UPDATE EXISTING VENUE ---
            console.log(`📍 Venue exists (ID: ${existingVenue.id}). Updating stats...`);
            venueId = existingVenue.id;

            // Calculate new Weighted Average
            // Formula: ((OldAvg * OldCount) + NewScore) / (OldCount + 1)
            const currentCount = existingVenue.review_count || 0;
            const currentRating = existingVenue.cached_rating || 0;
            const newScore = analysis.sentiment_score;

            const newCount = currentCount + 1;
            // Handle edge case where currentRating might be null (0)
            const newAverage = ((currentRating * currentCount) + newScore) / newCount;

            // Update the venue
            const { error: updateError } = await supabase
            .from('venues')
            .update({
                review_count: newCount,
                cached_rating: parseFloat(newAverage.toFixed(2)) // Keep it clean (2 decimals)
            })
            .eq('id', venueId);

            if (updateError) throw new Error(`Venue update failed: ${updateError.message}`);

        } 
        
        // 2. If not exists, create new venue
        else {
            // --- CREATE NEW VENUE ---
            console.log(`🆕 Creating New Venue: ${place.name}`);

            const { data: newVenue, error: createError } = await supabase
                .from('venues')
                .insert({
                name: place.name,
                google_place_id: place.googlePlaceId,
                address: place.address,
                location: `POINT(${place.lng} ${place.lat})`,   // PostGIS
                cached_rating: analysis.sentiment_score,        // Initial score = this review
                review_count: 1
                })
                .select('id')
                .single();

            if (createError) throw new Error(`Venue creation failed: ${createError.message}`);
            venueId = newVenue.id;
        }
         
        // =========================================================
        // STEP B: SOCIAL POST (Insert)
        // =========================================================
        console.log(`📝 inserting Social Post...`);

        const { data: newPost, error: postError } = await supabase
        .from('social_posts')
        .insert({
            venue_id: venueId,   // Link to Venue (FK)
            platform: video.platform,
            external_id: video.id,
            original_url: video.webVideoUrl,
            author: video.authorMeta.name,
            posted_at: video.createTimeISO     
          })
        .select('id')
        .single();

        if (postError) throw new Error(`Post insertion failed: ${postError.message}`);
        const postId = newPost.id;

        // =========================================================
        // STEP C: AI INSIGHTS (Insert)
        // =========================================================
        console.log(`🧠 inserting AI Insights...`);

        const { error: insightError } = await supabase
        .from('ai_insights')
        .insert({
            post_id: postId,    // Link to Post (FK)
            summary: analysis.summary,
            dishes_detected: analysis.dishes_detected,
            vibe_tags: analysis.vibe_tags,
            sentiment_score: analysis.sentiment_score,
            extracted_json: analysis.full_json_response
        });

        if (insightError) throw new Error(`Insights insertion failed: ${insightError.message}`);

        console.log('✅ Data Pipeline Complete Successfully.');
    } catch (err) {
        console.error('❌ Transaction Failed:', err);
        throw err; // Re-throw so the worker knows this job failed
    }
}

