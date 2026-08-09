import { Schema, model, Document, Types } from "mongoose";

export interface IScratchpad extends Document {
  userId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const scratchpadSchema = new Schema<IScratchpad>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ScratchpadModel = model<IScratchpad>("Scratchpad", scratchpadSchema);
