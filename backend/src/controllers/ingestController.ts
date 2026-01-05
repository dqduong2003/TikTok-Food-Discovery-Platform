import { Request, Response } from 'express';
import { processVideoPipeline, IngestData } from '../services/workflow';


export const processSingleVideo = async (req: Request, res: Response) => {
    try {
      const result = await processVideoPipeline(req.body); // Calls the same service!
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
};
