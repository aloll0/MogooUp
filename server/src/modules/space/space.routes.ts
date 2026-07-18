import { Router } from "express";
import { spaceController } from "./space.controller";
import { authMiddleware } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validation";
import { createSpaceSchema } from "./space.validation";

const router = Router();

// Secure all space operations with JWT Auth Middleware
router.use(authMiddleware);

router.post("/", validateRequest(createSpaceSchema), spaceController.create);
router.get("/workspace/:workspaceId", spaceController.list);
router.delete("/:spaceId", spaceController.delete);

export default router;
