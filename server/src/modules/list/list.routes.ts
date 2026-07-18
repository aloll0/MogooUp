import { Router } from "express";
import { listController } from "./list.controller";
import { authMiddleware } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validation";
import { createListSchema, updateListSchema } from "./list.validation";

const router = Router();

// Secure all list operations with JWT Auth Middleware
router.use(authMiddleware);

router.post("/", validateRequest(createListSchema), listController.create);
router.get("/space/:spaceId", listController.list);
router.put("/:listId", validateRequest(updateListSchema), listController.update);

export default router;
