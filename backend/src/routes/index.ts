import { Router } from 'express';
import { searchVenues, getVenuePosts } from '../controllers/searchController';

const router = Router();

// Search route
router.get('/search', searchVenues);

// Get detailed posts for a specific venue
router.get('/venues/:id/posts', getVenuePosts);

export default router;