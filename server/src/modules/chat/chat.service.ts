import { Types } from "mongoose";
import { ConversationModel, ChatMessageModel, IConversation, IChatMessage } from "./chat.model";
import { UserModel } from "../user/user.model";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { getIo } from "../../utils/socket";

export class ChatService {
  /**
   * Ensures the singleton General Chat room exists and returns it.
   */
  async getOrCreateGeneralChat(): Promise<IConversation> {
    let general = await ConversationModel.findOne({ type: "GENERAL" })
      .populate("lastMessage")
      .exec();

    if (!general) {
      general = await ConversationModel.create({
        type: "GENERAL",
        title: "المحادثة العامة (General)",
        description: "غرفة المحادثة المفتوحة لجميع أعضاء الفريق للتواصل العام والمناقشات السريعة",
        participants: [],
      });
    }

    return general;
  }

  /**
   * Returns all conversations available to the user:
   * 1. The Global GENERAL conversation
   * 2. Direct Messages (1-on-1) where user is a participant
   * 3. Group conversations where user is a participant
   */
  async getUserConversations(userId: string): Promise<IConversation[]> {
    const userObjectId = new Types.ObjectId(userId);

    // Make sure General Chat exists
    await this.getOrCreateGeneralChat();

    const conversations = await ConversationModel.find({
      $or: [
        { type: "GENERAL" },
        { "participants.user": userObjectId },
      ],
    })
      .sort({ updatedAt: -1 })
      .populate("participants.user", "fullName email avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "fullName email avatarUrl" },
      })
      .exec();

    return conversations;
  }

  /**
   * Get an existing Direct Chat with a user or create a new one.
   */
  async getOrCreateDirectChat(userId: string, targetUserId: string): Promise<IConversation> {
    if (userId === targetUserId) {
      throw new BadRequestError("لا يمكنك فتح محادثة مباشرة مع نفسك");
    }

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("المستخدم غير موجود");
    }

    const userObjectId = new Types.ObjectId(userId);
    const targetObjectId = new Types.ObjectId(targetUserId);

    let directChat = await ConversationModel.findOne({
      type: "DIRECT",
      $and: [
        { "participants.user": userObjectId },
        { "participants.user": targetObjectId },
      ],
    })
      .populate("participants.user", "fullName email avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "fullName email avatarUrl" },
      })
      .exec();

    if (!directChat) {
      directChat = await ConversationModel.create({
        type: "DIRECT",
        participants: [
          { user: userObjectId, role: "member", joinedAt: new Date() },
          { user: targetObjectId, role: "member", joinedAt: new Date() },
        ],
      });

      directChat = await ConversationModel.findById(directChat._id)
        .populate("participants.user", "fullName email avatarUrl")
        .exec();
    }

    return directChat!;
  }

  /**
   * Create a new custom group chat.
   */
  async createGroupChat(
    creatorId: string,
    title: string,
    description: string = "",
    memberIds: string[] = []
  ): Promise<IConversation> {
    if (!title || !title.trim()) {
      throw new BadRequestError("اسم المجموعة مطلوب");
    }

    const creatorObjectId = new Types.ObjectId(creatorId);
    
    // Deduplicate and filter out creator
    const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id && id !== creatorId)));
    
    const participants = [
      {
        user: creatorObjectId,
        role: "admin" as const,
        joinedAt: new Date(),
        lastReadAt: new Date(),
      },
      ...uniqueMemberIds.map((id) => ({
        user: new Types.ObjectId(id),
        role: "member" as const,
        joinedAt: new Date(),
        lastReadAt: new Date(),
      })),
    ];

    const group = await ConversationModel.create({
      type: "GROUP",
      title: title.trim(),
      description: description.trim(),
      creator: creatorObjectId,
      participants,
    });

    const populatedGroup = await ConversationModel.findById(group._id)
      .populate("participants.user", "fullName email avatarUrl")
      .exec();

    // Broadcast conversation created event via socket
    try {
      const io = getIo();
      participants.forEach((p) => {
        io.to(`user:${p.user.toString()}`).emit("conversation-created", populatedGroup);
      });
    } catch {
      // Socket not ready or outside context
    }

    return populatedGroup!;
  }

  /**
   * Get message history for a conversation with pagination.
   */
  async getMessageHistory(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: IChatMessage[]; total: number; page: number; totalPages: number }> {
    const convObjectId = new Types.ObjectId(conversationId);
    const conversation = await ConversationModel.findById(convObjectId);
    if (!conversation) {
      throw new NotFoundError("المحادثة غير موجودة");
    }

    // Security check: if not GENERAL, ensure user is participant
    if (conversation.type !== "GENERAL") {
      const isParticipant = conversation.participants.some(
        (p) => p.user.toString() === userId
      );
      if (!isParticipant) {
        throw new BadRequestError("ليس لديك صلاحية الوصول لهذه المحادثة");
      }
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessageModel.find({ conversationId: convObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "fullName email avatarUrl")
        .exec(),
      ChatMessageModel.countDocuments({ conversationId: convObjectId }),
    ]);

    return {
      messages: messages.reverse(), // Return in chronological order
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Send a new message to a conversation.
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    attachments?: { fileUrl: string; fileType: "image" | "file"; fileName: string }[]
  ): Promise<IChatMessage> {
    if (!content || !content.trim()) {
      throw new BadRequestError("محتوى الرسالة مطلوب");
    }

    const convObjectId = new Types.ObjectId(conversationId);
    const senderObjectId = new Types.ObjectId(senderId);

    const conversation = await ConversationModel.findById(convObjectId);
    if (!conversation) {
      throw new NotFoundError("المحادثة غير موجودة");
    }

    // If not GENERAL, ensure sender is participant
    if (conversation.type !== "GENERAL") {
      const isParticipant = conversation.participants.some(
        (p) => p.user.toString() === senderId
      );
      if (!isParticipant) {
        throw new BadRequestError("أنت لست عضواً في هذه المحادثة");
      }
    }

    const newMessage = await ChatMessageModel.create({
      conversationId: convObjectId,
      sender: senderObjectId,
      content: content.trim(),
      attachments: attachments || [],
    });

    // Update conversation lastMessage & updatedAt
    await ConversationModel.findByIdAndUpdate(convObjectId, {
      lastMessage: newMessage._id,
      updatedAt: new Date(),
    });

    const populatedMessage = await ChatMessageModel.findById(newMessage._id)
      .populate("sender", "fullName email avatarUrl")
      .exec();

    // Broadcast message via socket to conversation room
    try {
      const io = getIo();
      io.to(`conv:${conversationId}`).emit("new-chat-message", populatedMessage);

      // Notify individual participants for direct messages and groups (for unread counters)
      if (conversation.type !== "GENERAL") {
        conversation.participants.forEach((p) => {
          if (p.user.toString() !== senderId) {
            io.to(`user:${p.user.toString()}`).emit("chat-notification", {
              conversationId,
              message: populatedMessage,
            });
          }
        });
      }
    } catch {
      // Socket not ready
    }

    return populatedMessage!;
  }

  /**
   * Fetch approved users in the system to start direct chats or form groups.
   */
  async getChatUsers(currentUserId: string): Promise<any[]> {
    return UserModel.find(
      { _id: { $ne: new Types.ObjectId(currentUserId) }, isApproved: true },
      "fullName email avatarUrl createdAt"
    )
      .sort({ fullName: 1 })
      .lean()
      .exec();
  }
}

export const chatService = new ChatService();
