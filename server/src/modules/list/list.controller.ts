import { Request, Response, NextFunction } from "express";
import { listService } from "./list.service";

export class ListController {
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { spaceId, folderId, name, position } = req.body;
      const userId = req.user!.userId;
      
      const list = await listService.createList(spaceId, folderId, name, position || 0, userId);
      
      res.status(201).json({
        success: true,
        message: "List created successfully",
        data: { list },
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { spaceId } = req.params;
      const userId = req.user!.userId;
      
      const lists = await listService.getSpaceLists(spaceId, userId);
      
      res.status(200).json({
        success: true,
        data: { lists },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { listId } = req.params;
      const userId = req.user!.userId;
      
      const list = await listService.updateList(listId, req.body, userId);
      
      res.status(200).json({
        success: true,
        message: "List updated successfully",
        data: { list },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const listController = new ListController();
