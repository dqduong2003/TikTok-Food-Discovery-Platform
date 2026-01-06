import { GoogleGenAI, Type } from "@google/genai";
import { TikTokReview } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchTikTokReviews = async (placeName: string): Promise<TikTokReview[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 realistic, creative TikTok-style short reviews for a trendy, artisanal restaurant named "${placeName}". 
      Each review should simulate a popular food influencer's content.
      Include a catchy summary of what happens in the video, a fake original URL (like tiktok.com/@user/video...), a creative author handle, specific featured dishes, the vibe/atmosphere described, and a recent date posted.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "Short summary of the video content" },
              originalUrl: { type: Type.STRING, description: "Fake TikTok URL" },
              author: { type: Type.STRING, description: "TikTok username/handle" },
              featuredDishes: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of dishes mentioned" 
              },
              vibes: { type: Type.STRING, description: "The atmosphere described in the video" },
              datePosted: { type: Type.STRING, description: "Date posted string" }
            },
            required: ["summary", "originalUrl", "author", "featuredDishes", "vibes", "datePosted"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as TikTokReview[];
  } catch (error) {
    console.error("Error fetching reviews from Gemini:", error);
    return [];
  }
};
