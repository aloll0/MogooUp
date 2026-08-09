import { Router } from "express";
import { scratchpadController } from "./scratchpad.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Apply auth middleware to protect all scratchpad actions
router.use(authMiddleware);

router.get("/", scratchpadController.get);
router.put("/", scratchpadController.update);

export default router;
