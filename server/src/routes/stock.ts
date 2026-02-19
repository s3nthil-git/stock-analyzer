import { Router, Request, Response, NextFunction } from 'express';
import { validateTicker } from '../utils/validators';
import { getStockData, FMPError } from '../services/fmpService';
import { getQuarterlyData } from '../services/quarterlyService';

export const stockRouter = Router();

stockRouter.get('/:ticker', async (req: Request<{ ticker: string }>, res: Response, next: NextFunction) => {
  try {
    const { valid, sanitized, error } = validateTicker(req.params.ticker);

    if (!valid) {
      res.status(400).json({ error, ticker: req.params.ticker });
      return;
    }

    const data = await getStockData(sanitized);
    res.json(data);
  } catch (err) {
    if (err instanceof FMPError) {
      res.status(err.statusCode).json({ error: err.message, ticker: req.params.ticker });
      return;
    }
    next(err);
  }
});

stockRouter.get('/:ticker/quarterly', async (req: Request<{ ticker: string }>, res: Response, next: NextFunction) => {
  try {
    const { valid, sanitized, error } = validateTicker(req.params.ticker);

    if (!valid) {
      res.status(400).json({ error, ticker: req.params.ticker });
      return;
    }

    const data = await getQuarterlyData(sanitized);
    res.json(data);
  } catch (err) {
    if (err instanceof FMPError) {
      res.status(err.statusCode).json({ error: err.message, ticker: req.params.ticker });
      return;
    }
    next(err);
  }
});
