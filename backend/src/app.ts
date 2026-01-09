import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',        // Local Vite (Standard)
  'http://localhost:3000',        // Local React (Alternative)
  'https://reelfoodplaces.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
})); 

app.use(express.json());

// Mount the API routes
app.use('/api', routes); 

export default app;