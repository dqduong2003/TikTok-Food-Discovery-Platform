import { Router } from 'express';
import { searchVenues } from '../controllers/searchController';

const router = Router();

// Define the route
// GET http://localhost:3000/api/search?q=matcha
router.get('/search', searchVenues);

export default router;