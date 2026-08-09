import { Router } from "express";
import { goalController } from "./goal.controller";
import { authMiddleware } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validation";
import { createGoalSchema, updateGoalSchema } from "./goal.validation";

const router = Router();

// Apply auth middleware to protect all goals actions
router.use(authMiddleware);

router.post("/", validateRequest(createGoalSchema), goalController.create);
router.get("/workspace/:workspaceId", goalController.list);
router.put("/:goalId", validateRequest(updateGoalSchema), goalController.update);
router.delete("/:goalId", goalController.delete);

export default router;
