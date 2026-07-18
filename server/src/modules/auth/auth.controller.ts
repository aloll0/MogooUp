import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { config } from "../../config";

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
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
