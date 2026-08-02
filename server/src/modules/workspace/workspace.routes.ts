import { Router } from "express";
import { workspaceController } from "./workspace.controller";
import { authMiddleware } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validation";
import { createWorkspaceSchema, inviteMemberSchema, updateMemberRoleSchema } from "./workspace.validation";

const router = Router();

// Secure all workspace operations with JWT Auth Middleware
router.use(authMiddleware);

router.post("/", validateRequest(createWorkspaceSchema), workspaceController.create);
router.get("/", workspaceController.list);
router.get("/slug/:slug", workspaceController.getBySlug);
router.get("/:workspaceId/members", workspaceController.getMembers);
router.post("/:workspaceId/invite", validateRequest(inviteMemberSchema), workspaceController.invite);
router.put("/:workspaceId/members", validateRequest(updateMemberRoleSchema), workspaceController.updateMemberRole);

export default router;
