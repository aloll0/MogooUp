import { Schema, model, Document, Types } from "mongoose";

export type ConversationType = "GENERAL" | "DIRECT" | "GROUP";

export interface IParticipant {
  user: Types.ObjectId;
  role: "admin" | "member";
  joinedAt: Date;
  lastReadAt?: Date;
}

export interface IConversation extends Document {
  type: ConversationType;
  title?: string;
  description?: string;
  avatarUrl?: string;
  creator?: Types.ObjectId;
  participants: IParticipant[];
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const participantSchema = new Schema<IParticipant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["GENERAL", "DIRECT", "GROUP"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    participants: [participantSchema],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "ChatMessage",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

conversationSchema.index({ "participants.user": 1 });
conversationSchema.index({ type: 1, updatedAt: -1 });

export const ConversationModel = model<IConversation>("Conversation", conversationSchema);

// Message Schema
export interface IChatMessage extends Document {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  attachments?: {
    fileUrl: string;
    fileType: "image" | "file";
    fileName: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IChatMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        fileType: { type: String, enum: ["image", "file"], default: "file" },
        fileName: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const ChatMessageModel = model<IChatMessage>("ChatMessage", messageSchema);
