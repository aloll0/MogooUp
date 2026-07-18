import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { config } from "../config";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal server error";
  let details: any = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Database validation failed";
    details = Object.keys(err.errors).reduce((acc: any, key: string) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for path: ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "Resource already exists";
    const field = Object.keys(err.keyValue || {})[0];
    details = field ? { [field]: `${field} already exists` } : null;
  }

  // Log the complete error information
  logger.error(`${req.method} ${req.originalUrl} - status: ${statusCode} - message: ${err.message}`, {
    stack: config.env !== "production" ? err.stack : undefined,
    details,
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details && { details }),
      ...(config.env !== "production" && { stack: err.stack }),
    },
  });
};
