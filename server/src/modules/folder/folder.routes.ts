import { Router } from "express";
import { folderController } from "./folder.controller";
import { authMiddleware } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validation";
import { createFolderSchema } from "./folder.validation";

const router = Router();

// Secure all folder operations with JWT Auth Middleware
router.use(authMiddleware);

router.post("/", validateRequest(createFolderSchema), folderController.create);
router.get("/space/:spaceId", folderController.list);

export default router;
