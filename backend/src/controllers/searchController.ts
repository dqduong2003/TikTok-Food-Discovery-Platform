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