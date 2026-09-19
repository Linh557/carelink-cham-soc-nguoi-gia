import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carelinkRouter from "./carelink";

const router: IRouter = Router();

router.use(healthRouter);
router.use(carelinkRouter);

export default router;
