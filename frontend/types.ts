// src/types.ts
export interface Place {
  id: number;
  name: string;
  addr: string;
  rating: number;
  reviews: number;
  text: string; // We will use this to show the top vibe
  vibes: string[]; // Store the full array
  videoUrl: string; // New field for the video
  lat: number;
  lng: number;
  x: number; // Calculated CSS %
  y: number; // Calculated CSS %
  color: string;
}

export interface TikTokReview {
  summary: string;
  originalUrl: string;
  author: string;
  featuredDishes: string[];
  vibes: string;
  datePosted: string;
}
