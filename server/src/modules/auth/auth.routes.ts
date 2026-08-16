import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validation";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";
import { authMiddleware } from "../../middlewares/auth";
import { adminMiddleware } from "../../middlewares/admin";

const router = Router();

router.post("/register", validateRequest(registerSchema), authController.register);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.me);
router.post("/forgot-password", validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordSchema), authController.resetPassword);

// System Administration Endpoints
router.get("/admin/users", authMiddleware, adminMiddleware, authController.getAdminUsers);
router.put("/admin/users/:userId/approve", authMiddleware, adminMiddleware, authController.approveUser);
router.put("/admin/users/:userId/suspend", authMiddleware, adminMiddleware, authController.suspendUser);
router.get("/admin/workspaces", authMiddleware, adminMiddleware, authController.getAdminWorkspaces);

export default router;
