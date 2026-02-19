import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { stockRouter } from '../server/src/routes/stock';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/stock', stockRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Serverless function error:', err.message, err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
