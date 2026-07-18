import { Router } from "express";
import { commentController } from "./comment.controller";
import { authMiddleware } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validation";
import { createCommentSchema } from "./comment.validation";

const router = Router();

// Secure all comment operations with JWT Auth Middleware
router.use(authMiddleware);

router.post("/", validateRequest(createCommentSchema), commentController.create);
router.get("/task/:taskId", commentController.list);

export default router;
