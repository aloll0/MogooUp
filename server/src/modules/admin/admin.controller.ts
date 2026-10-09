import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";
import { ForbiddenError } from "../../utils/errors";

export class AdminController {
  private async verifyAdmin(userId: string): Promise<void> {
    const userModel = require("../user/user.model").UserModel;
    const user = await userModel.findById(userId);
    if (!user || !user.isSystemAdmin) {
      throw new ForbiddenError("Only system administrators can access this console");
    }
  }

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.verifyAdmin(req.user!.userId);
      const stats = await adminService.getGlobalStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  getPerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.verifyAdmin(req.user!.userId);
      const performance = await adminService.getEmployeePerformance();
      res.status(200).json({
        success: true,
        data: { performance }
      });
    } catch (error) {
      next(error);
    }
  };

  getDeletedTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.verifyAdmin(req.user!.userId);
      const { workspaceId } = req.query;
      const tasks = await adminService.getDeletedTasks(workspaceId as string | undefined);
      res.status(200).json({
        success: true,
        data: { tasks }
      });
    } catch (error) {
      next(error);
    }
  };

  restoreTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.verifyAdmin(req.user!.userId);
      const { taskId } = req.params;
      const task = await adminService.restoreTask(taskId);
      res.status(200).json({
        success: true,
        message: "Task restored successfully",
        data: { task }
      });
    } catch (error) {
      next(error);
    }
  };

  permanentlyDeleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.verifyAdmin(req.user!.userId);
      const { taskId } = req.params;
      await adminService.permanentlyDeleteTask(taskId);
      res.status(200).json({
        success: true,
        message: "Task permanently deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.verifyAdmin(req.user!.userId);
      const companies = await adminService.getCompaniesAnalytics();
      res.status(200).json({
        success: true,
        data: { companies }
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.verifyAdmin(req.user!.userId);
      const { userId } = req.params;
      const { timeframe } = req.query;
      const report = await adminService.getEmployeeActivityReport(userId, timeframe as string);
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
