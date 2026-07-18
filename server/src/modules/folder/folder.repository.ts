import { FolderModel, IFolder } from "./folder.model";
import mongoose from "mongoose";

export class FolderRepository {
  async findById(id: string): Promise<IFolder | null> {
    return FolderModel.findById(id).exec();
  }

  async findBySpace(spaceId: string): Promise<IFolder[]> {
    return FolderModel.find({ spaceId: new mongoose.Types.ObjectId(spaceId) }).exec();
  }

  async createFolder(spaceId: string, name: string): Promise<IFolder> {
    return FolderModel.create({
      spaceId: new mongoose.Types.ObjectId(spaceId),
      name,
    });
  }

  async deleteFolder(id: string): Promise<IFolder | null> {
    return FolderModel.findByIdAndDelete(id).exec();
  }
}

export const folderRepository = new FolderRepository();
