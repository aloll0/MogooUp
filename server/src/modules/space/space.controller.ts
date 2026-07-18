import { Request, Response, NextFunction } from "express";
import { spaceService } from "./space.service";

export class SpaceController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId, name, description, color, isPrivate, allowedMembers } = req.body;
      const userId = req.user!.userId;
      
      const space = await spaceService.createSpace(
        workspaceId,
        name,
        description,
        color,
        isPrivate,
        allowedMembers,
        userId
      );
      
      res.status(201).json({
        success: true,
        message: "Space created successfully",
        data: { space },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;
      
      const spaces = await spaceService.getWorkspaceSpaces(workspaceId, userId);
      
      res.status(200).json({
        success: true,
        data: { spaces },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { spaceId } = req.params;
      const userId = req.user!.userId;
      
      await spaceService.deleteSpace(spaceId, userId);
      
      res.status(200).json({
        success: true,
        message: "Space deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const spaceController = new SpaceController();
