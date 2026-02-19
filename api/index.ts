import express from 'express';
import cors from 'cors';
import { stockRouter } from '../server/src/routes/stock';
import { errorHandler } from '../server/src/middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/stock', stockRouter);
app.use(errorHandler);

export default app;
