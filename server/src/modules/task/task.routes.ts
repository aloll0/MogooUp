import { Router } from "express";
import { taskController } from "./task.controller";
import { authMiddleware } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validation";
import { createTaskSchema, updateTaskSchema } from "./task.validation";

const router = Router();

// Secure all task operations with JWT Auth Middleware
router.use(authMiddleware);

router.post("/", validateRequest(createTaskSchema), taskController.create);
router.get("/list/:listId", taskController.listByList);
router.get("/workspace/:workspaceId", taskController.listByWorkspace);
router.get("/:taskId", taskController.getById);
router.put("/:taskId", validateRequest(updateTaskSchema), taskController.update);
router.delete("/:taskId", taskController.delete);
router.post("/:taskId/revision", taskController.requestRevision);

export default router;
