import { io, Socket } from "socket.io-client";

const getSocketUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  return apiUrl.replace("/api/v1", "");
};

let socket: Socket | null = null;

export const socketService = {
  /**
   * Establishes a socket connection to the server.
   */
  connect: (): Socket => {
    if (!socket) {
      socket = io(getSocketUrl(), {
        autoConnect: true,
        transports: ["websocket", "polling"],
      });
    } else if (socket.disconnected) {
      socket.connect();
    }
    return socket;
  },

  /**
   * Disconnects the socket.
   */
  disconnect: (): void => {
    if (socket) {
      socket.disconnect();
    }
  },

  /**
   * Joins a specific workspace channel.
   */
  joinWorkspace: (workspaceId: string): void => {
    const s = socketService.connect();
    s.emit("join-workspace", workspaceId);
  },

  /**
   * Leaves a specific workspace channel.
   */
  leaveWorkspace: (workspaceId: string): void => {
    if (socket) {
      socket.emit("leave-workspace", workspaceId);
    }
  },

  /**
   * Returns the current socket instance.
   */
  getSocket: (): Socket | null => {
    return socket;
  },

  /**
   * Joins a specific chat conversation channel.
   */
  joinConversation: (conversationId: string): void => {
    const s = socketService.connect();
    s.emit("join-conversation", conversationId);
  },

  /**
   * Leaves a specific chat conversation channel.
   */
  leaveConversation: (conversationId: string): void => {
    if (socket) {
      socket.emit("leave-conversation", conversationId);
    }
  },

  /**
   * Joins the user's personal channel for direct alerts.
   */
  joinUser: (userId: string): void => {
    const s = socketService.connect();
    s.emit("join-user", userId);
  },

  /**
   * Leaves user's personal channel.
   */
  leaveUser: (userId: string): void => {
    if (socket) {
      socket.emit("leave-user", userId);
    }
  },

  /**
   * Broadcast typing status.
   */
  emitTyping: (conversationId: string, userId: string, userName: string, isTyping: boolean): void => {
    if (socket) {
      socket.emit("chat-typing", { conversationId, userId, userName, isTyping });
    }
  },

  /**
   * Listen for incoming new chat messages.
   */
  onNewChatMessage: (callback: (msg: any) => void): void => {
    const s = socketService.connect();
    s.on("new-chat-message", callback);
  },

  /**
   * Remove listener for new chat messages.
   */
  offNewChatMessage: (callback?: (msg: any) => void): void => {
    if (socket) {
      if (callback) {
        socket.off("new-chat-message", callback);
      } else {
        socket.off("new-chat-message");
      }
    }
  },

  /**
   * Listen for typing indicators.
   */
  onUserTyping: (callback: (data: any) => void): void => {
    const s = socketService.connect();
    s.on("user-typing", callback);
  },

  /**
   * Remove typing indicator listener.
   */
  offUserTyping: (callback?: (data: any) => void): void => {
    if (socket) {
      if (callback) {
        socket.off("user-typing", callback);
      } else {
        socket.off("user-typing");
      }
    }
  },
};
