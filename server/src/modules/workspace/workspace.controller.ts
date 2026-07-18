import { Request, Response, NextFunction } from "express";
import { workspaceService } from "./workspace.service";

export class WorkspaceController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, slug } = req.body;
      const userId = req.user!.userId;
      
      const workspace = await workspaceService.createWorkspace(name, slug, userId);
      
      res.status(201).json({
        success: true,
        message: "Workspace created successfully",
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const workspaces = await workspaceService.getUserWorkspaces(userId);
      
      res.status(200).json({
        success: true,
        data: { workspaces },
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const userId = req.user!.userId;
      
      const workspace = await workspaceService.getWorkspaceBySlug(slug, userId);
      
      res.status(200).json({
        success: true,
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  };

  getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;
      
      const members = await workspaceService.getWorkspaceMembers(workspaceId, userId);
      
      res.status(200).json({
        success: true,
        data: { members },
      });
    } catch (error) {
      next(error);
    }
  };

  invite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const { email, role } = req.body;
      const userId = req.user!.userId;
      
      const membership = await workspaceService.inviteMember(workspaceId, email, role, userId);
      
      res.status(200).json({
        success: true,
        message: "Member invited successfully",
        data: { membership },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const workspaceController = new WorkspaceController();
