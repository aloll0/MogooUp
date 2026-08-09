import { Router } from "express";
import { activityController } from "./activity.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Secure all activity operations with JWT Auth Middleware
router.use(authMiddleware);

router.get("/task/:taskId", activityController.getTaskActivities);
router.get("/workspace/:workspaceId", activityController.getWorkspaceActivities);

export default router;
