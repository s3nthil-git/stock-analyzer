import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { stockRouter } from '../server/src/routes/stock';
import { errorHandler } from '../server/src/middleware/errorHandler';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/stock', stockRouter);
app.use(errorHandler);

export default app;
