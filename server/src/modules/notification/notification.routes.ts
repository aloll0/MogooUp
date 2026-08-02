import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/mark-all-read", notificationController.markAllAsRead);

export default router;
