import { commentRepository } from "./comment.repository";
import { taskRepository } from "../task/task.repository";
import { workspaceRepository } from "../workspace/workspace.repository";
import { IComment } from "./comment.model";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { notificationService } from "../notification/notification.service";

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

    const comment = await commentRepository.createComment(taskId, userId, content, mentions);

    // Trigger Notification for mentions
    if (mentions && mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== userId) {
          await notificationService.createNotification(
            mentionedUserId,
            "New Mention",
            `You were mentioned in a comment on task: "${task.title}"`,
            "comment_mentioned",
            userId,
            task._id.toString(),
            "task"
          );
        }
      }
    }

    return comment;
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
