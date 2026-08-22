import { Router } from "express";
import { adminController } from "./admin.controller";
import { authMiddleware } from "../../middlewares/auth";
import { adminMiddleware } from "../../middlewares/admin";

const router = Router();

// Protect all admin endpoints
router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", adminController.getStats);
router.get("/performance", adminController.getPerformance);
router.get("/deleted-tasks", adminController.getDeletedTasks);
router.put("/deleted-tasks/:taskId/restore", adminController.restoreTask);
router.get("/companies", adminController.getCompanies);

export default router;
