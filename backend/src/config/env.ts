import dotenv from 'dotenv'

dotenv.config();

export const CONFIG = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || "",
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || "",
};

// Validate all required environment variables
const requiredKeys: (keyof typeof CONFIG)[] = [
    'GEMINI_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
];

for (const key of requiredKeys) {
    if (!CONFIG[key]) {
        throw new Error(`Missing ${key} in .env file`);
    }
}