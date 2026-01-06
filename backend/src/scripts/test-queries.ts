import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config/env';

// 1. Load Environment Variables
const SUPABASE_URL = CONFIG.SUPABASE_URL || '';
const SUPABASE_KEY = CONFIG.SUPABASE_SECRET_KEY || ''; // Use Service Key for testing

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase Credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------
// TEST 1: The "Default Feed" (Top 20 by Rating)
// ---------------------------------------------------------
async function testDefaultFeed() {
    console.log("\n📋 --- TEST 1: Fetching Default Feed (Top Rated) ---");

    const { data, error } = await supabase
        .from('venues')
        .select('name, cached_rating, review_count, consolidated_vibes')
        .order('cached_rating', { ascending: false })
        .limit(5); // Limiting to 5 for cleaner console output

    if (error) {
        console.error("❌ Default Feed Failed:", error.message);
        return;
    }

    if (data.length === 0) {
        console.warn("⚠️ No venues found. Did you run the Backfill script?");
    } else {
        console.table(data); // Prints a nice table in terminal
    }
}

// ---------------------------------------------------------
// TEST 2: The "Keyword Search" (Using Full Text Search)
// ---------------------------------------------------------
async function testSearch(keyword: string) {
    console.log(`\n🔍 --- TEST 2: Searching for "${keyword}" ---`);

    const { data, error } = await supabase
        .from('venues')
        .select('name, consolidated_dishes, consolidated_vibes')
        // This uses the 'venue_search_vector' column we created
        .textSearch('venue_search_vector', keyword, {
            config: 'english',
            type: 'plain' 
        });

    if (error) {
        console.error("❌ Search Failed:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`No results found for "${keyword}".`);
    } else {
        console.log(`✅ Found ${data.length} matches:`);
        data.forEach(venue => {
            console.log(`   - ${venue.name}`);
            console.log(`     Dishes: ${venue.consolidated_dishes}`);
            console.log(`     Vibes:  ${venue.consolidated_vibes}\n`);
        });
    }
}

// ---------------------------------------------------------
// RUNNER
// ---------------------------------------------------------
async function run() {
    try {
        // await testDefaultFeed();
        
        // Change this string to test different searches
        await testSearch('matcha'); 
        // await testSearch('cozy');

    } catch (err) {
        console.error("Unexpected Error:", err);
    }
}

run();