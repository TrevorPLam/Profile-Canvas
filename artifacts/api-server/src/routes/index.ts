import { Router, type IRouter } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import profileRouter from './profiles';
import postsRouter from './posts';
import mediaRouter from './media';
import commentsRouter from './comments';
import engagementRouter from './engagement';
import friendsRouter from './friends';
import feedRouter from './feed';
import discoverRouter from './discover';
import notificationsRouter from './notifications';
import messagesRouter from './messages';
import storiesRouter from './stories';
import safetyRouter from './safety';
import liveRouter from './live';
import audienceRouter from './audience';

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(postsRouter);
router.use(mediaRouter);
router.use(commentsRouter);
router.use(engagementRouter);
router.use(friendsRouter);
router.use(feedRouter);
router.use(discoverRouter);
router.use(notificationsRouter);
router.use(messagesRouter);
router.use(storiesRouter);
router.use(safetyRouter);
router.use(liveRouter);
router.use(audienceRouter);

export default router;
