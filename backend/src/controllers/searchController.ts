import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { parseSearchIntent } from '../services/gemini';
import { getCoordinates } from '../services/geocoder';
import { CONFIG } from '../config/env';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SECRET_KEY);

export const searchVenues = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const rawQuery = (q as string) || '';

    // Default Search Params (Australia Bounds)
    let searchTerms = rawQuery;
    let minLat = -44.0, maxLat = -10.0;
    let minLng = 112.0, maxLng = 154.0;
    let locationContext = "Australia";
    let locationCenter: [number, number] | null = null;

    const wordCount = rawQuery.trim().split(/\s+/).length;

    // 1. INTELLIGENT PARSING
    if (wordCount >= 2) {
      console.log("🧠 Query is complex, asking Gemini...");
      
      const intent = await parseSearchIntent(rawQuery);
      
      // Update the text search with the cleaned/expanded keywords
      searchTerms = intent.searchTerms;
      
      // 2. LOCATION HANDLING
      if (intent.locationName) {
        console.log(`📍 Detected Location: ${intent.locationName}`);
        const coords = await getCoordinates(intent.locationName);
        
        if (coords) {
            // Create a "Search Box" approx +/- 0.05 degrees (roughly 5km radius)
            const RADIUS = 0.03; 
            
            minLat = coords.lat - RADIUS;
            maxLat = coords.lat + RADIUS;
            minLng = coords.lng - RADIUS;
            maxLng = coords.lng + RADIUS;
            
            locationContext = intent.locationName;
            locationCenter = [coords.lng, coords.lat];
        }
      }
    }

    // 3. BUILD QUERY
    let queryBuilder = supabase
      .from('venues')
      .select(`id, name, address, cached_rating, review_count, lat, lng, preview_video_url`)
      // Apply Dynamic Location Filter
      .gte('lat', minLat)
      .lte('lat', maxLat)
      .gte('lng', minLng)
      .lte('lng', maxLng);

    // 4. TEXT MATCHING
    if (searchTerms) {
      const termsArray = searchTerms
          .replace(/,/g, ' ')
          .trim()
          .split(/\s+/)
          .filter(term => term.length > 0);
  
      // Use '|' (OR) for AI synonyms so we don't over-filter
      const tsQuery = termsArray.join(' | ') + ':*'; 
  
      console.log(`🔍 Flexible Query: "${tsQuery}"`);
  
      queryBuilder = queryBuilder.or(
        `name.ilike.%${rawQuery}%, venue_search_vector.fts(simple).${tsQuery}`
      );
  }

    const { data, error } = await queryBuilder;
    if (error) throw error;

    return res.status(200).json({ 
        success: true, 
        meta: {
            location: locationContext,
            search_terms: searchTerms,
            center: locationCenter
        },
        count: data?.length || 0,
        data: data 
    });

  } catch (error: any) {
    console.error('❌ Search Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getVenuePosts = async (req: Request, res: Response) => {
    try {
        // Expecting venue_id from URL params (e.g., /api/venues/:id/posts)
        const { id } = req.params; 

        if (!id) {
            return res.status(400).json({ success: false, error: 'Venue ID is required' });
        }

        console.log(`🔍 Fetching posts for Venue ID: ${id}`);

        // Query: Get posts + their linked AI insights
        const { data, error } = await supabase
            .from('social_posts')
            .select(`
                id,
                author,
                posted_at,
                platform,
                original_url, 
                ai_insights (
                    summary,
                    vibe_tags,
                    dishes_detected
                )
            `)
            .eq('venue_id', id)
            .order('posted_at', { ascending: false }); // Newest first

        if (error) throw error;

        // Flatten the structure for the frontend
        const formattedPosts = data.map((post: any) => {
            // Handle case where ai_insights might be null (not yet processed)
            const insights = post.ai_insights?.[0] || post.ai_insights || {};

            return {
                id: post.id,
                author: post.author || 'Anonymous',
                summary: insights.summary || 'No summary available',
                posted_at: post.posted_at,
                platform: post.platform,
                vibe_tags: insights.vibe_tags || [],
                dishes_detected: insights.dishes_detected || [],
                original_url: post.original_url
            };
        });

        return res.status(200).json({
            success: true,
            count: formattedPosts.length,
            data: formattedPosts
        });

    } catch (error: any) {
        console.error('❌ Get Posts Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};