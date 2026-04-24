import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import packagesRouter from "./packages";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(packagesRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(reviewsRouter);

export default router;
