import { Request, Response, NextFunction } from "express";
import { folderService } from "./folder.service";

export class FolderController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { spaceId, name } = req.body;
      const userId = req.user!.userId;
      
      const folder = await folderService.createFolder(spaceId, name, userId);
      
      res.status(201).json({
        success: true,
        message: "Folder created successfully",
        data: { folder },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { spaceId } = req.params;
      const userId = req.user!.userId;
      
      const folders = await folderService.getSpaceFolders(spaceId, userId);
      
      res.status(200).json({
        success: true,
        data: { folders },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const folderController = new FolderController();
