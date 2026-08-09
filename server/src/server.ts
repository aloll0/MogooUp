import mongoose from "mongoose";
import app from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { initSocket } from "./utils/socket";

// Catch uncaught exception errors immediately
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

const startServer = async () => {
  try {
    logger.info("Connecting to MongoDB Database...");
    mongoose.set("strictQuery", true);
    
    // Connect database
    await mongoose.connect(config.mongodbUri);
    logger.info("MongoDB database connected successfully!");

    const server = app.listen(config.port, () => {
      logger.info(`Taskflow Backend server running in [${config.env}] mode on port ${config.port}`);
    });

    // Initialize WebSocket Server
    initSocket(server);

    // Catch unhandled promise rejections
    process.on("unhandledRejection", (err: any) => {
      logger.error("UNHANDLED REJECTION! Shutting down server...", {
        message: err?.message || err,
        stack: err?.stack,
      });
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdowns
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} signal received. Closing HTTP server...`);
      server.close(() => {
        logger.info("HTTP server closed.");
        mongoose.connection.close().then(() => {
          logger.info("MongoDB database connection closed.");
          process.exit(0);
        });
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error: any) {
    logger.error("Server initialization aborted due to database connection error", {
      message: error?.message,
      stack: error?.stack,
    });
    process.exit(1);
  }
};

startServer();
