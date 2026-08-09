import { ScratchpadModel, IScratchpad } from "./scratchpad.model";
import mongoose from "mongoose";

export class ScratchpadService {
  async getScratchpad(userId: string): Promise<IScratchpad> {
    let scratchpad = await ScratchpadModel.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    // If not found, create an empty one for the user
    if (!scratchpad) {
      scratchpad = await ScratchpadModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        content: "",
      });
    }
    
    return scratchpad;
  }

  async updateScratchpad(userId: string, content: string): Promise<IScratchpad> {
    const scratchpad = await ScratchpadModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { content },
      { new: true, upsert: true }
    );
    return scratchpad;
  }
}

export const scratchpadService = new ScratchpadService();
