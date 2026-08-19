import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'TradeSlot API v1 Endpoint',
  });
});

export default router;
