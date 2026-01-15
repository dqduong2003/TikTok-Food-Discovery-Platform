-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------
create extension if not exists pg_trgm;

-- -----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_review(
  p_video jsonb,
  p_analysis jsonb,
  p_place jsonb
) 
RETURNS void 
LANGUAGE plpgsql 
AS $$
DECLARE
  v_venue_id bigint;
  v_post_id bigint;
  v_new_vibes text[];
  v_new_dishes text[];
  v_current_vibes text[];
  v_current_dishes text[];
  v_new_score float;
BEGIN
  -- 1. PREPARE DATA
  v_new_score := (p_analysis->>'sentiment_score')::float;
  
  -- Extract arrays from JSON inputs
  SELECT ARRAY(SELECT jsonb_array_elements_text(p_analysis->'vibe_tags')) INTO v_new_vibes;
  SELECT ARRAY(SELECT jsonb_array_elements_text(p_analysis->'dishes_detected')) INTO v_new_dishes;

  -- 2. CHECK IF VENUE EXISTS
  SELECT id, consolidated_vibes, consolidated_dishes 
  INTO v_venue_id, v_current_vibes, v_current_dishes
  FROM venues 
  WHERE google_place_id = p_place->>'googlePlaceId';

  IF v_venue_id IS NOT NULL THEN
    -- A. UPDATE EXISTING VENUE
    -- Logic: Combine Old List + New List, remove duplicates (using UNNEST/DISTINCT)
    
    UPDATE venues 
    SET 
        -- Update Counts (Your old logic)
        review_count = review_count + 1,
        cached_rating = round((((cached_rating * review_count) + v_new_score) / (review_count + 1))::numeric, 2),
        
        -- Update Preview (Just take the latest one)
        preview_video_url = p_video->>'webVideoUrl',
        preview_author = p_video->'authorMeta'->>'name',

        -- Merge Vibes: "Old Array" + "New Array" -> Unique Set
        consolidated_vibes = (
          SELECT array_agg(DISTINCT x) 
          FROM unnest(COALESCE(v_current_vibes, '{}') || v_new_vibes) as t(x)
        ),

        -- Merge Dishes
        consolidated_dishes = (
          SELECT array_agg(DISTINCT x) 
          FROM unnest(COALESCE(v_current_dishes, '{}') || v_new_dishes) as t(x)
        )
    WHERE id = v_venue_id;

  ELSE
    -- B. CREATE NEW VENUE
    INSERT INTO venues (
        name, google_place_id, address, location, cached_rating, review_count,
        preview_video_url, preview_author, consolidated_vibes, consolidated_dishes
    )
    VALUES (
      p_place->>'name',
      p_place->>'googlePlaceId',
      p_place->>'address',
      ST_Point((p_place->>'lng')::float, (p_place->>'lat')::float)::geography,
      v_new_score,
      1,
      p_video->>'webVideoUrl',
      p_video->'authorMeta'->>'name',
      v_new_vibes,
      v_new_dishes
    )
    RETURNING id INTO v_venue_id;
  END IF;

  -- 3. INSERT SOCIAL POST (Standard)
  INSERT INTO social_posts (
    venue_id, platform, external_id, original_url, author, posted_at
  )
  VALUES (
    v_venue_id,
    (p_video->>'platform')::platform, 
    p_video->>'id',
    p_video->>'webVideoUrl',
    p_video->'authorMeta'->>'name',
    (p_video->>'createTimeISO')::timestamptz
  )
  RETURNING id INTO v_post_id;

  -- 4. INSERT AI INSIGHTS (Standard)
  INSERT INTO ai_insights (
    post_id, summary, dishes_detected, vibe_tags, sentiment_score, extracted_json
  )
  VALUES (
    v_post_id,
    p_analysis->>'summary',
    v_new_dishes,
    v_new_vibes,
    (p_analysis->>'sentiment_score')::float,
    p_analysis->'full_json_response'
  );

END;
$$;

-- Create a virtual field 'lat' for the venues table
create or replace function lat(rec venues) 
returns float as $$
  select st_y(rec.location::geometry);
$$ language sql immutable;

-- Create a virtual field 'lng' for the venues table
create or replace function lng(rec venues) 
returns float as $$
  select st_x(rec.location::geometry);
$$ language sql immutable;

CREATE OR REPLACE FUNCTION immutable_array_to_string(text_array text[])
RETURNS text AS $$
    SELECT array_to_string(text_array, ' ');
$$ LANGUAGE sql IMMUTABLE;

-- =============================================
-- PERFORMANCE INDEXES (Must Run These!)
-- =============================================
CREATE INDEX idx_venues_search_v2 ON venues USING GIN(venue_search_vector);

-- Index for Name
CREATE INDEX IF NOT EXISTS idx_venues_name_trgm ON venues USING gin (name gin_trgm_ops);

-- Index for the dishes array using our new function
CREATE INDEX IF NOT EXISTS idx_venues_dishes_trgm 
ON venues USING gin (immutable_array_to_string(consolidated_dishes) gin_trgm_ops);

-- Index for the vibes array
CREATE INDEX IF NOT EXISTS idx_venues_vibes_trgm 
ON venues USING gin (immutable_array_to_string(consolidated_vibes) gin_trgm_ops);