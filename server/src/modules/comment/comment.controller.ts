import { Request, Response, NextFunction } from "express";
import { commentService } from "./comment.service";

export class CommentController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId, content, mentions } = req.body;
      const userId = req.user!.userId;

      const comment = await commentService.createComment(taskId, userId, content, mentions);

      res.status(201).json({
        success: true,
        message: "Comment created successfully",
        data: { comment },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.userId;

      const comments = await commentService.getTaskComments(taskId, userId);

      res.status(200).json({
        success: true,
        data: { comments },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const commentController = new CommentController();
