import { api } from "./api";

export interface ChatUser {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface ChatParticipant {
  user: ChatUser;
  role: "admin" | "member";
  joinedAt: string;
  lastReadAt?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: ChatUser;
  content: string;
  attachments?: {
    fileUrl: string;
    fileType: "image" | "file";
    fileName: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  type: "GENERAL" | "DIRECT" | "GROUP";
  title?: string;
  description?: string;
  avatarUrl?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  createdAt: string;
  updatedAt: string;
}

export const chatService = {
  /**
   * Fetch all conversations for the authenticated user.
   */
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get("/chat/conversations");
    return response.data.data.conversations;
  },

  /**
   * Fetch or initialize the General Chat room.
   */
  getGeneralChat: async (): Promise<Conversation> => {
    const response = await api.get("/chat/conversations/general");
    return response.data.data.conversation;
  },

  /**
   * Get or create a 1-on-1 direct conversation with another user.
   */
  getOrCreateDirectChat: async (recipientId: string): Promise<Conversation> => {
    const response = await api.post("/chat/conversations/direct", { recipientId });
    return response.data.data.conversation;
  },

  /**
   * Create a new group conversation.
   */
  createGroup: async (data: {
    title: string;
    description?: string;
    memberIds: string[];
  }): Promise<Conversation> => {
    const response = await api.post("/chat/conversations/group", data);
    return response.data.data.conversation;
  },

  /**
   * Fetch message history with pagination.
   */
  getMessages: async (
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: ChatMessage[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit },
    });
    return response.data.data;
  },

  /**
   * Send a new message to a conversation.
   */
  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<ChatMessage> => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data.data.message;
  },

  /**
   * Fetch all users available to start a conversation with.
   */
  getChatUsers: async (): Promise<ChatUser[]> => {
    const response = await api.get("/chat/users");
    return response.data.data.users;
  },
};
