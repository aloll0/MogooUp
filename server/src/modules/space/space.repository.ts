import { SpaceModel, ISpace } from "./space.model";
import mongoose from "mongoose";

export class SpaceRepository {
  async findById(id: string): Promise<ISpace | null> {
    return SpaceModel.findById(id).exec();
  }

  async findAllByWorkspace(workspaceId: string): Promise<ISpace[]> {
    return SpaceModel.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findSpacesByWorkspace(workspaceId: string, userId: string): Promise<ISpace[]> {
    try {
      const UserModel = mongoose.model("User");
      const user = await UserModel.findById(userId).lean().exec() as any;
      if (user && user.isSystemAdmin) {
        return SpaceModel.find({
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
        }).exec();
      }
    } catch {
      // Fallback
    }

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
