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
        transports: ["websocket"],
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
};
