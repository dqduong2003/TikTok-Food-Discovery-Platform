import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/env';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SECRET_KEY);

export const searchVenues = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const queryText = (q as string) || '';

      console.log(`🔍 Search Request: "${queryText}"`);
    
      let queryBuilder = supabase
        .from('venues')
        .select(`
          id, name, address, cached_rating, review_count, 
          preview_video_url, consolidated_vibes, consolidated_dishes,
          lat, lng  
        `); 
        // ^ NOW WORKS: 'lat' and 'lng' are available because of the SQL functions above.
        // We removed 'location' to save bandwidth since we have the coords now.

        // A. Full Text Search
        if (queryText) {
            queryBuilder = queryBuilder.textSearch('venue_search_vector', queryText, {
                config: 'english',
                type: 'plain'
            });
        } else {
            // B. Default Feed
            queryBuilder = queryBuilder
                .order('cached_rating', { ascending: false })
                .limit(50);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        // Data now already has lat/lng! No need to map manually.
        return res.status(200).json({
            success: true,
            count: data.length,
            data: data 
        });

    } catch (error: any) {
        console.error('❌ Search Error:', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}