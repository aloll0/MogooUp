import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/mogoo",
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "mogoo_access_secret_key_change_me_in_prod",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "mogoo_refresh_secret_key_change_me_in_prod",
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || "15m",
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || "7d",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};

// Quick verification for production environments
if (config.env === "production") {
  const missingConfigs = [];
  if (!process.env.MONGODB_URI) missingConfigs.push("MONGODB_URI");
  if (!process.env.JWT_ACCESS_SECRET) missingConfigs.push("JWT_ACCESS_SECRET");
  if (!process.env.JWT_REFRESH_SECRET) missingConfigs.push("JWT_REFRESH_SECRET");
  
  if (missingConfigs.length > 0) {
    throw new Error(`Production environment error: Missing keys [${missingConfigs.join(", ")}] in environment.`);
  }
}
