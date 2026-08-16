import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { config } from "../../config";
import { UserModel } from "../user/user.model";
import { WorkspaceModel } from "../workspace/workspace.model";
import mongoose from "mongoose";

export class AuthController {
  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: config.env === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching token lifespan
    });
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, fullName, password } = req.body;
      const user = await authService.register(email, fullName, password);
      
      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        data: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);
      
      this.setRefreshTokenCookie(res, tokens.refreshToken);
      
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            isApproved: user.isApproved,
            isSystemAdmin: user.isSystemAdmin,
          },
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: { message: "Access denied. Refresh token missing." },
        });
        return;
      }
      
      const tokens = await authService.refresh(refreshToken);
      this.setRefreshTokenCookie(res, tokens.refreshToken);
      
      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      // Clear cookie if session is invalid or revoked
      res.clearCookie("refreshToken");
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.user will be populated by authMiddleware
      if (req.user?.userId) {
        await authService.logout(req.user.userId);
      }
      
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: "lax",
      });
      
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      const resetToken = await authService.forgotPassword(email);
      
      // In production, send email with resetToken. For dev, we send token back in response
      res.status(200).json({
        success: true,
        message: "Password reset link sent to your email.",
        ...(config.env !== "production" && { data: { resetToken } }),
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      
      res.status(200).json({
        success: true,
        message: "Password updated successfully. You can now log in.",
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { message: "Unauthorized access" } });
        return;
      }
      const user = await authService.getMe(userId);
      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            isApproved: user.isApproved,
            isSystemAdmin: user.isSystemAdmin,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAdminUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await UserModel.find({}, "email fullName avatarUrl isVerified isApproved isSystemAdmin createdAt");
      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  };

  approveUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await UserModel.findByIdAndUpdate(userId, { isApproved: true }, { new: true });
      res.status(200).json({
        success: true,
        message: "User approved successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  suspendUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await UserModel.findByIdAndUpdate(userId, { isApproved: false }, { new: true });
      res.status(200).json({
        success: true,
        message: "User suspended successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  getAdminWorkspaces = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const workspaces = await WorkspaceModel.find({})
        .populate("ownerId", "fullName email")
        .exec();

      const populatedWorkspaces = await Promise.all(
        workspaces.map(async (ws) => {
          const spaces = await mongoose.model("Space").find({ workspaceId: ws._id }, "name color");
          const members = await mongoose.model("Membership").find({ workspaceId: ws._id })
            .populate("userId", "fullName email avatarUrl");
          return {
            _id: ws._id,
            name: ws.name,
            slug: ws.slug,
            owner: ws.ownerId,
            spaces,
            members,
            createdAt: ws.createdAt,
          };
        })
      );

      res.status(200).json({
        success: true,
        data: { workspaces: populatedWorkspaces },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
