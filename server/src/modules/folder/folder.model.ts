import { Schema, model, Document, Types } from "mongoose";

export interface IFolder extends Document {
  spaceId: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<IFolder>(
  {
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const FolderModel = model<IFolder>("Folder", folderSchema);
