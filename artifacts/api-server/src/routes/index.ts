import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import musicRouter from "./music.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(musicRouter);

export default router;
