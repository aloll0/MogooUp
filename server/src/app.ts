import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { errorHandler } from "./middlewares/error";
import { NotFoundError } from "./utils/errors";
import authRoutes from "./modules/auth/auth.routes";
import workspaceRoutes from "./modules/workspace/workspace.routes";
import spaceRoutes from "./modules/space/space.routes";
import folderRoutes from "./modules/folder/folder.routes";
import listRoutes from "./modules/list/list.routes";
import taskRoutes from "./modules/task/task.routes";
import commentRoutes from "./modules/comment/comment.routes";
import notificationRoutes from "./modules/notification/notification.routes";
import scratchpadRoutes from "./modules/scratchpad/scratchpad.routes";
import goalRoutes from "./modules/goal/goal.routes";
import activityRoutes from "./modules/activity/activity.routes";
import clientProjectRoutes from "./modules/clientProject/clientProject.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
const allowedOrigins = typeof config.cors.origin === "string"
  ? config.cors.origin.split(",").map(o => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      const isDev = config.env === "development";
      const isAllowed = allowedOrigins.includes(origin) || (isDev && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Compress response bodies
app.use(compression());

// Health Check API
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Taskflow API is online 🚀",
    timestamp: new Date().toISOString(),
    env: config.env,
  });
});

// Root API Endpoint
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Taskflow REST API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/spaces", spaceRoutes);
app.use("/api/v1/folders", folderRoutes);
app.use("/api/v1/lists", listRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/scratchpad", scratchpadRoutes);
app.use("/api/v1/goals", goalRoutes);
app.use("/api/v1/activities", activityRoutes);
app.use("/api/v1/workspaces/:workspaceId/clients", clientProjectRoutes);
app.use("/api/v1/admin", adminRoutes);

// Catch 404 and forward to error handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError("The requested endpoint does not exist"));
});

// Global Error Handler
app.use(errorHandler);

export default app;
