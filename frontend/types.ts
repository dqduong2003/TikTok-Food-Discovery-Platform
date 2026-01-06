export interface Place {
  id: number;
  name: string;
  addr: string;
  rating: number;
  reviews: number;
  text: string;
  x: number;
  y: number;
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
