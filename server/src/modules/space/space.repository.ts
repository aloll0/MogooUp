import { SpaceModel, ISpace } from "./space.model";
import mongoose from "mongoose";

export class SpaceRepository {
  async findById(id: string): Promise<ISpace | null> {
    return SpaceModel.findById(id).exec();
  }

  async findSpacesByWorkspace(workspaceId: string, userId: string): Promise<ISpace[]> {
    // Find public spaces OR private spaces where user is allowed
    return SpaceModel.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      $or: [
        { isPrivate: false },
        { allowedMembers: new mongoose.Types.ObjectId(userId) },
      ],
    }).exec();
  }

  async createSpace(spaceData: Partial<ISpace>): Promise<ISpace> {
    return SpaceModel.create(spaceData);
  }

  async updateSpace(id: string, updateData: Partial<ISpace>): Promise<ISpace | null> {
    return SpaceModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteSpace(id: string): Promise<ISpace | null> {
    return SpaceModel.findByIdAndDelete(id).exec();
  }
}

export const spaceRepository = new SpaceRepository();
