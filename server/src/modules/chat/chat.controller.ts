import { Request, Response, NextFunction } from "express";
import { chatService } from "./chat.service";

export class ChatController {
  /**
   * Get all conversations accessible to the authenticated user.
   */
  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const conversations = await chatService.getUserConversations(userId);

      res.status(200).json({
        success: true,
        data: { conversations },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get or initialize the global general chat.
   */
  getGeneralChat = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const general = await chatService.getOrCreateGeneralChat();

      res.status(200).json({
        success: true,
        data: { conversation: general },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get or create a 1-on-1 direct chat.
   */
  getOrCreateDirectChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { recipientId } = req.body;

      const conversation = await chatService.getOrCreateDirectChat(userId, recipientId);

      res.status(200).json({
        success: true,
        data: { conversation },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new group chat.
   */
  createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { title, description, memberIds } = req.body;

      const conversation = await chatService.createGroupChat(userId, title, description, memberIds);

      res.status(201).json({
        success: true,
        message: "تم إنشاء المجموعة بنجاح",
        data: { conversation },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get message history for a conversation.
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await chatService.getMessageHistory(conversationId, userId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a new message to a conversation.
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { conversationId } = req.params;
      const { content, attachments } = req.body;

      const message = await chatService.sendMessage(conversationId, userId, content, attachments);

      res.status(201).json({
        success: true,
        message: "تم إرسال الرسالة بنجاح",
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch users available for messaging in the dashboard.
   */
  getChatUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const users = await chatService.getChatUsers(userId);

      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const chatController = new ChatController();
