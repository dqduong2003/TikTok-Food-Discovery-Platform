import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', // Only allow YOUR frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed actions
  credentials: true // Allow cookies if you need them later
})); 
app.use(express.json());

// Mount the API routes
app.use('/api', routes); 

export default app;