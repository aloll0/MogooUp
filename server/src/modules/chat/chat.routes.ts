import { Router } from "express";
import { chatController } from "./chat.controller";
import { authMiddleware } from "../../middlewares/auth";

const router = Router();

// Protect all chat endpoints with authMiddleware
router.use(authMiddleware);

// Conversations
router.get("/conversations", chatController.getConversations);
router.get("/conversations/general", chatController.getGeneralChat);
router.post("/conversations/direct", chatController.getOrCreateDirectChat);
router.post("/conversations/group", chatController.createGroup);

// Messages
router.get("/conversations/:conversationId/messages", chatController.getMessages);
router.post("/conversations/:conversationId/messages", chatController.sendMessage);

// Chat Users Directory
router.get("/users", chatController.getChatUsers);

export default router;
