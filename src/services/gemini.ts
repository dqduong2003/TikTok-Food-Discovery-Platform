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
      sentiment_score: { type: "number", description: "1-10 Estimated enthusiasm of the reviewer for the restaurant" }
    },
    required: ["restaurant_name", "address", "dishes_detected", "vibe_tags"]
  };

// 1. Helper: Upload Video to Google
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
            1. Extract the restaurant name and location from the audio or text overlays.
            2. Identify the specific dishes shown visually.
            3. Summarize the 'vibe' based on food type, interior design and environment.
            4. Judge the estimated enthusiasm of the reviewer for the restaurant from 1-10.
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