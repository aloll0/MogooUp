import { config } from "../config";

type LogLevel = "info" | "warn" | "error" | "debug";

const formatMessage = (level: LogLevel, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
};

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(formatMessage("info", message, meta));
  },
  warn: (message: string, meta?: any) => {
    console.warn(formatMessage("warn", message, meta));
  },
  error: (message: string, meta?: any) => {
    console.error(formatMessage("error", message, meta));
  },
  debug: (message: string, meta?: any) => {
    if (config.env !== "production") {
      console.debug(formatMessage("debug", message, meta));
    }
  },
};
