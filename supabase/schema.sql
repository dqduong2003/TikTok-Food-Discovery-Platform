-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_insights (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id bigint,
  summary text,
  dishes_detected ARRAY NOT NULL,
  vibe_tags ARRAY NOT NULL,
  sentiment_score real,
  extracted_json jsonb NOT NULL,
  search_vector tsvector DEFAULT ((to_tsvector('english'::regconfig, summary) || array_to_tsvector(dishes_detected)) || array_to_tsvector(vibe_tags)),
  CONSTRAINT ai_insights_pkey PRIMARY KEY (id),
  CONSTRAINT ai_insights_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id)
);
CREATE TABLE public.social_posts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  venue_id bigint NOT NULL,
  platform USER-DEFINED,
  external_id text UNIQUE,
  original_url text UNIQUE,
  author text,
  posted_at timestamp with time zone,
  CONSTRAINT social_posts_pkey PRIMARY KEY (id),
  CONSTRAINT social_posts_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.venues (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  google_place_id text NOT NULL UNIQUE,
  address text NOT NULL UNIQUE,
  location USER-DEFINED NOT NULL UNIQUE,
  cached_rating real,
  review_count smallint DEFAULT '0'::smallint,
  preview_video_url text,
  preview_author text,
  consolidated_vibes ARRAY DEFAULT '{}'::text[],
  consolidated_dishes ARRAY DEFAULT '{}'::text[],
  venue_search_vector tsvector DEFAULT (((to_tsvector('simple'::regconfig, COALESCE(name, ''::text)) || to_tsvector('simple'::regconfig, COALESCE(address, ''::text))) || to_tsvector('simple'::regconfig, immutable_array_to_string(COALESCE(consolidated_dishes, '{}'::text[])))) || to_tsvector('simple'::regconfig, immutable_array_to_string(COALESCE(consolidated_vibes, '{}'::text[])))),
  CONSTRAINT venues_pkey PRIMARY KEY (id)
);