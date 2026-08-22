import mongoose, { Schema, Document } from "mongoose";

export interface IClientService {
  name: string;
  isChecked: boolean;
  note?: string;
}

export interface IClientProject extends Document {
  workspaceId: mongoose.Types.ObjectId;
  clientName: string;
  description?: string;
  services: IClientService[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientProjectSchema = new Schema<IClientProject>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: [true, "Client/Store name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    services: [
      {
        name: { type: String, required: true },
        isChecked: { type: Boolean, default: false },
        note: { type: String, default: "" },
      }
    ],
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const ClientProjectModel = mongoose.model<IClientProject>("ClientProject", ClientProjectSchema);
