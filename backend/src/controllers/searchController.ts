import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/env';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SECRET_KEY);

export const searchVenues = async (req: Request, res: Response) => {
    try {
      // 1. Get Query Parameters from URL (e.g., /api/search?q=matcha&lat=-37.8&lng=144.9)
      const { q, lat, lng, radius } = req.query;
      const queryText = (q as string) || '';
      const userLat = parseFloat(lat as string) || -37.8136; // Default Melbourne CBD
      const userLng = parseFloat(lng as string) || 144.9631;
      const searchRadius = parseInt(radius as string) || 5000; // Default 5km
  
      console.log(`🔍 Search Request: "${queryText}" near [${userLat}, ${userLng}]`);
    
      let queryBuilder = supabase
        .from('venues')
        .select(`
          id, name, address, cached_rating, review_count, 
          preview_video_url, consolidated_vibes, consolidated_dishes,
          location
        `);

        // A. If user typed a keyword -> Use Full Text Search (GIN Index)
        if (queryText) {
            // Uses the 'venue_search_vector' column we created earlier
            queryBuilder = queryBuilder.textSearch('venue_search_vector', queryText, {
            config: 'english',
            type: 'plain'
            });
        } else {
            // B. No keyword -> Default to highest rated (Feed Mode)
            queryBuilder = queryBuilder
            .order('cached_rating', { ascending: false })
            .limit(20);
        }

        // C. Execute Query
        const { data, error } = await queryBuilder;

        if (error) throw error;

        const formattedData = data.map((venue: any) => {
            // PostGIS returns location as a string usually. 
            return {
                ...venue,
            };
        });

        return res.status(200).json({
            success: true,
            count: formattedData.length,
            data: formattedData
        });
    } catch (error: any) {
        console.error('❌ Search Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}