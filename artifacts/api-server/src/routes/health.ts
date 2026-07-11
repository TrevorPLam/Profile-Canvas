import { Router, type IRouter } from 'express';
import { HealthCheckResponseSchema } from '@workspace/api-zod';

const router: IRouter = Router();

router.get('/healthz', (_req, res) => {
  const data = HealthCheckResponseSchema.parse({ status: 'ok' });
  res.json(data);
});

export default router;
