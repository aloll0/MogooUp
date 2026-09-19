import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "../config";
import { logger } from "../utils/logger";
import { UserModel } from "../modules/user/user.model";

const initAdmin = async () => {
  try {
    logger.info("Connecting to MongoDB to initialize Super Admin account...");
    await mongoose.connect(config.mongodbUri);

    const existingAdmin = await UserModel.findOne({ email: "admin@arabpro.com" });
    if (existingAdmin) {
      existingAdmin.isApproved = true;
      existingAdmin.isVerified = true;
      existingAdmin.isSystemAdmin = true;
      existingAdmin.passwordHash = await bcrypt.hash("password123", 12);
      await existingAdmin.save();
      logger.info("Super Admin account already exists. Updated password and privileges.");
    } else {
      const passwordHash = await bcrypt.hash("password123", 12);
      await UserModel.create({
        email: "admin@arabpro.com",
        passwordHash,
        fullName: "Arab Pro Admin",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ArabPro",
        isVerified: true,
        isApproved: true,
        isSystemAdmin: true,
        tokenVersion: 0,
      });
      logger.info("Super Admin account (admin@arabpro.com) created successfully!");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("Failed to initialize Super Admin:", error);
    process.exit(1);
  }
};

initAdmin();
