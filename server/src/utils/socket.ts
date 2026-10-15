import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "./logger";

let io: SocketServer | null = null;

/**
 * Initialize Socket.io Server attached to the Http server instance.
 */
export const initSocket = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: "*", // Adjust origins as appropriate for production safety
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Client registers subscription to a workspace channel
    socket.on("join-workspace", (workspaceId: string) => {
      logger.info(`Socket ${socket.id} joined workspace: ${workspaceId}`);
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on("leave-workspace", (workspaceId: string) => {
      logger.info(`Socket ${socket.id} left workspace: ${workspaceId}`);
      socket.leave(`workspace:${workspaceId}`);
    });

    // Chat: User room for direct notifications
    socket.on("join-user", (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on("leave-user", (userId: string) => {
      if (userId) {
        socket.leave(`user:${userId}`);
      }
    });

    // Chat: Join specific conversation room
    socket.on("join-conversation", (conversationId: string) => {
      if (conversationId) {
        socket.join(`conv:${conversationId}`);
      }
    });

    socket.on("leave-conversation", (conversationId: string) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
      }
    });

    // Chat: Typing indicator
    socket.on("chat-typing", (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (data?.conversationId) {
        socket.to(`conv:${data.conversationId}`).emit("user-typing", data);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info("Socket.io server initialized successfully!");
  return io;
};

/**
 * Returns the active Socket.io Server instance.
 */
export const getIo = (): SocketServer => {
  if (!io) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return io;
};

/**
 * Broadcasts an event with payload to all sockets joined in a workspace room.
 */
export const broadcastToWorkspace = (workspaceId: string, event: string, data: any): void => {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
};
