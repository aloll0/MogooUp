import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { userRepository } from "../user/user.repository";
import { IUser } from "../user/user.model";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from "../../utils/errors";
import crypto from "crypto";

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private generateTokens(user: IUser): ITokens {
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiration as jwt.SignOptions["expiresIn"] }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, tokenVersion: user.tokenVersion },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiration as jwt.SignOptions["expiresIn"] }
    );

    return { accessToken, refreshToken };
  }

  async register(email: string, fullName: string, password: string): Promise<IUser> {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    return userRepository.create({
      email,
      fullName,
      passwordHash,
      verificationToken,
      isVerified: false, // will require verification (or mock in demo)
      tokenVersion: 0,
    });
  }

  async login(email: string, password: string): Promise<{ user: IUser; tokens: ITokens }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = this.generateTokens(user);
    return { user, tokens };
  }

  async refresh(token: string): Promise<ITokens> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as {
        userId: string;
        tokenVersion: number;
      };

      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedError("Invalid session credentials");
      }

      // Check if this refresh token version matches user's current version
      if (user.tokenVersion !== decoded.tokenVersion) {
        throw new UnauthorizedError("Session has expired or token is revoked");
      }

      // Rotate token: increment tokenVersion to invalidate the old refresh token
      user.tokenVersion += 1;
      await user.save();

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Invalid or expired session token");
      }
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (user) {
      // Increment token version to invalidate all active refresh tokens for this user
      user.tokenVersion += 1;
      await user.save();
    }
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("No user registered with this email");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 1 hour
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.update(user._id.toString(), {
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires,
    });

    return resetToken; // We return the plain token to be sent to user (via email or direct response in development)
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await userRepository.findOne({
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError("Reset token is invalid or has expired");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await userRepository.update(user._id.toString(), {
      passwordHash,
      resetPasswordToken: "",
      resetPasswordExpires: undefined,
      // Force log out of all active devices after password reset
      $inc: { tokenVersion: 1 },
    });
  }

  async getMe(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }
}

export const authService = new AuthService();
