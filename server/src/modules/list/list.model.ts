import { Schema, model, Document, Types } from "mongoose";

export interface IList extends Document {
  spaceId: Types.ObjectId;
  folderId?: Types.ObjectId;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const listSchema = new Schema<IList>(
  {
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: "Space",
      required: true,
      index: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, "List name is required"],
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ListModel = model<IList>("List", listSchema);
