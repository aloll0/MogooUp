import { Request, Response, NextFunction } from "express";
import { workspaceService } from "./workspace.service";
import { userRepository } from "../user/user.repository";

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
      const { email, role, permissions, allowedSpaces } = req.body;
      const userId = req.user!.userId;
      
      const membership = await workspaceService.inviteMember(workspaceId, email, role, userId, permissions, allowedSpaces);
      
      res.status(200).json({
        success: true,
        message: "Member invited successfully",
        data: { membership },
      });
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const { userId: targetUserId, role, permissions, allowedSpaces } = req.body;
      const requestorId = req.user!.userId;
      
      const membership = await workspaceService.updateMemberRoleAndPermissions(
        workspaceId,
        targetUserId,
        requestorId,
        role,
        permissions,
        allowedSpaces
      );
      
      res.status(200).json({
        success: true,
        message: "Member role and permissions updated successfully",
        data: { membership },
      });
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId, userId: targetUserId } = req.params;
      const requestorId = req.user!.userId;
      
      await workspaceService.removeMember(workspaceId, targetUserId, requestorId);
      
      res.status(200).json({
        success: true,
        message: "Member removed from workspace successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  deleteWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;

      await workspaceService.deleteWorkspace(workspaceId, userId);

      res.status(200).json({
        success: true,
        message: "Workspace deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = (req.query.q as string) || "";
      const users = await userRepository.searchUsers(query);
      
      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const workspaceController = new WorkspaceController();
