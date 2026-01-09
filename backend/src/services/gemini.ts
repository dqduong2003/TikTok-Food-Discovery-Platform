import { CONFIG } from "../config/env";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";


const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

// Define the shape of data we want (Structured Output)
const extractionSchema = {
    description: "Restaurant data extracted from video",
    type: "object",
    properties: {
      restaurant_name: { type: "string" },
      address: { type: "string" },
      dishes_detected: { 
        type: "array", 
        items: { type: "string" },
        description: "Specific food items shown or mentioned" 
      },
      vibe_tags: { 
        type: "array", 
        items: { type: "string" },
        description: "Visual atmosphere (e.g., 'asian', 'street-food', 'authentic')" 
      },
      sentiment_score: { type: "number", description: "1-10 Estimated enthusiasm of the reviewer for the restaurant" },
      summary: { type: "string" },
    },
    required: ["restaurant_name", "address", "dishes_detected", "vibe_tags"]
  };

// Define the schema for search intent parsing
const searchIntentSchema = {
  description: "Search intent parsed from user query",
  type: "object",
  properties: {
    searchTerms: { 
      type: "string",
      description: "The food, cuisine, or vibe terms with synonyms, without location"
    },
    locationName: { 
      type: ["string", "null"],
      description: "The specific suburb or city mentioned, or null if not found"
    },
  },
  required: ["searchTerms"]
};

// Define the interface for parsed result
interface SearchIntent {
  searchTerms: string;
  locationName: string | null;
}


// 1. Upload Video to Google
async function uploadToGemini(filePath: string, mimeType: string) {
    const myfile = await ai.files.upload({
        file: filePath,
        config: { mimeType: mimeType },
    });

    // Wait for file to be in ACTIVE state
    console.log("Waiting for file to be processed...");
    let fileStatus = myfile;
    while (fileStatus.state !== "ACTIVE") {
        if (fileStatus.state === "FAILED") {
            throw new Error("File processing failed");
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 second
        fileStatus = await ai.files.get({ name: myfile.name! });
        console.log(`File state: ${fileStatus.state}`);
    }

    console.log("File is ready!");
    return fileStatus
  }

// 2. Main Analysis Function
export async function analyzeVideo(localFilePath: string) {
    try {
        // A. Upload
        const videoFile = await uploadToGemini(localFilePath, "video/mp4");

        // B. Analyze with Gemini 3 Flash
        const prompt = `
            Watch this video carefully. It is a food review.
            
            1. Extract the restaurant name and location. 
            - **STRICT RULE**: Only return a location if it is **explicitly written on a text overlay or clearly spoken** in the audio.
            - If the location is only implied (e.g., "downtown") or inferred from landmarks, **return null**.
            - **Do not use external knowledge** to guess the location.
            - If no specific address or city is explicitly verifiable in the media, return null.

            2. Identify the specific dishes shown visually.
            3. Summarize the 'vibe' based on food type, interior design, and environment.
            4. Judge the estimated enthusiasm of the reviewer for the restaurant from 1-10.
            5. Summarise the review in 3 sentences.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: createUserContent([
              createPartFromUri(videoFile.uri!, videoFile.mimeType!),
              prompt,
            ]),
            config: {
                responseMimeType: "application/json",
                responseSchema: extractionSchema,
            }
          });
        
        // C. Clean up from Google
        if (videoFile.name) {
            await ai.files.delete({ name: videoFile.name });
        }

        // Return the JSON object directly
        const responseText = response.text;
        if (!responseText) {
            throw new Error("No response text received from Gemini");
        }
        console.log("Analysis is ready!")
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Analysis failed:", error);
        return null;
    }
}


// 3. Search Function
export const parseSearchIntent = async (userQuery: string): Promise<SearchIntent> => {
  try {
    const prompt = `
      You are an intelligent search parser for a food app in Australia.
      Analyze the User Query and split it into two parts:
      
      1. "searchTerms": The food, cuisine, or vibe (e.g., "Bingsu", "Vietnamese", "Cozy"). 
         - Expand these terms with 3-5 synonyms to help a database search.
         - REMOVE the location name from this string.
      2. "locationName": The specific suburb or city mentioned (e.g., "Hawthorn", "CBD"). 
         - If no location is mentioned, return null.
         - If found, append the state/city to ensure accuracy (e.g. "Hawthorn" -> "Hawthorn, VIC").

      User Query: "${userQuery}"
      
      Output JSON format only.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: createUserContent([prompt]),
      config: {
        responseMimeType: "application/json",
        responseSchema: searchIntentSchema,
      }
    });
    
    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response text received from Gemini");
    }
    const data = JSON.parse(responseText);

    return {
      searchTerms: data.searchTerms || userQuery,
      locationName: data.locationName === null || data.locationName === "null" || data.locationName === "" ? null : data.locationName,
    }

  } catch (error) {
    console.error("Gemini Intent Error:", error);
    // Fallback: Treat the whole string as search terms
    return { searchTerms: userQuery, locationName: null };
  }
}