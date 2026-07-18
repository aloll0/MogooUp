import { Request, Response, NextFunction } from "express";
import { taskService } from "./task.service";

export class TaskController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const task = await taskService.createTask(req.body, userId);
      
      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  listByList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { listId } = req.params;
      const userId = req.user!.userId;
      
      const tasks = await taskService.getTasksByList(listId, userId);
      
      res.status(200).json({
        success: true,
        data: { tasks },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.userId;
      
      const task = await taskService.updateTask(taskId, req.body, userId);
      
      res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      const userId = req.user!.userId;
      
      await taskService.deleteTask(taskId, userId);
      
      res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const taskController = new TaskController();
