import { commentRepository } from "./comment.repository";
import { taskRepository } from "../task/task.repository";
import { workspaceRepository } from "../workspace/workspace.repository";
import { IComment } from "./comment.model";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

export class CommentService {
  async createComment(
    taskId: string,
    userId: string,
    content: string,
    mentions: string[] = []
  ): Promise<IComment> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Verify workspace membership
    const membership = await workspaceRepository.findMembership(task.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You are not authorized to post comments in this workspace");
    }

    return commentRepository.createComment(taskId, userId, content, mentions);
  }

  async getTaskComments(taskId: string, userId: string): Promise<IComment[]> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    // Verify workspace membership
    const membership = await workspaceRepository.findMembership(task.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You are not authorized to view comments in this workspace");
    }

    return commentRepository.findByTask(taskId);
  }
}

export const commentService = new CommentService();
