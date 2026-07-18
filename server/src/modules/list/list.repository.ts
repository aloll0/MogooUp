import { ListModel, IList } from "./list.model";
import mongoose from "mongoose";

export class ListRepository {
  async findById(id: string): Promise<IList | null> {
    return ListModel.findById(id).exec();
  }

  async findBySpace(spaceId: string): Promise<IList[]> {
    return ListModel.find({ spaceId: new mongoose.Types.ObjectId(spaceId) })
      .sort({ position: 1 })
      .exec();
  }

  async findByFolder(folderId: string): Promise<IList[]> {
    return ListModel.find({ folderId: new mongoose.Types.ObjectId(folderId) })
      .sort({ position: 1 })
      .exec();
  }

  async createList(spaceId: string, folderId: string | null, name: string, position: number): Promise<IList> {
    return ListModel.create({
      spaceId: new mongoose.Types.ObjectId(spaceId),
      folderId: folderId ? new mongoose.Types.ObjectId(folderId) : undefined,
      name,
      position,
    });
  }

  async updateList(id: string, updateData: Partial<IList>): Promise<IList | null> {
    return ListModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteList(id: string): Promise<IList | null> {
    return ListModel.findByIdAndDelete(id).exec();
  }
}

export const listRepository = new ListRepository();
