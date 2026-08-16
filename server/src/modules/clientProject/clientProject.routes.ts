import { Router } from "express";
import { clientProjectController } from "./clientProject.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get("/", clientProjectController.list);
router.post("/", clientProjectController.create);
router.put("/:clientId", clientProjectController.update);
router.delete("/:clientId", clientProjectController.delete);

export default router;
