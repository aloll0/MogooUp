import { Request, Response, NextFunction } from "express";
import { goalService } from "./goal.service";

export class GoalController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId, title, description, status, startDate, endDate, keyResults } = req.body;
      const userId = req.user!.userId;

      const goal = await goalService.createGoal(
        { workspaceId, title, description, status, startDate, endDate, keyResults },
        userId
      );

      res.status(201).json({
        success: true,
        message: "Goal created successfully",
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;

      const goals = await goalService.getWorkspaceGoals(workspaceId, userId);

      res.status(200).json({
        success: true,
        data: { goals },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = req.params;
      const { title, description, status, startDate, endDate, keyResults } = req.body;
      const userId = req.user!.userId;

      const goal = await goalService.updateGoal(
        goalId,
        { title, description, status, startDate, endDate, keyResults },
        userId
      );

      res.status(200).json({
        success: true,
        message: "Goal updated successfully",
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { goalId } = req.params;
      const userId = req.user!.userId;

      await goalService.deleteGoal(goalId, userId);

      res.status(200).json({
        success: true,
        message: "Goal deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const goalController = new GoalController();
