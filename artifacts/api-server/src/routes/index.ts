import { Router, type IRouter } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import profileRouter from './profiles';
import postsRouter from './posts';
import mediaRouter from './media';

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(postsRouter);
router.use(mediaRouter);

export default router;
