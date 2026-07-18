import { CommentModel, IComment } from "./comment.model";
import mongoose from "mongoose";

export class CommentRepository {
  async createComment(
    taskId: string,
    userId: string,
    content: string,
    mentions: string[] = []
  ): Promise<IComment> {
    const comment = await CommentModel.create({
      taskId: new mongoose.Types.ObjectId(taskId),
      userId: new mongoose.Types.ObjectId(userId),
      content,
      mentions: mentions.map((id) => new mongoose.Types.ObjectId(id)),
    });
    return comment.populate("userId", "fullName email avatarUrl");
  }

  async findByTask(taskId: string): Promise<IComment[]> {
    return CommentModel.find({ taskId: new mongoose.Types.ObjectId(taskId) })
      .sort({ createdAt: 1 })
      .populate("userId", "fullName email avatarUrl")
      .exec();
  }
}

export const commentRepository = new CommentRepository();
