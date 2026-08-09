import { Request, Response, NextFunction } from "express";
import { scratchpadService } from "./scratchpad.service";

export class ScratchpadController {
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const scratchpad = await scratchpadService.getScratchpad(userId);
      
      res.status(200).json({
        success: true,
        data: { scratchpad },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const { content } = req.body;
      const scratchpad = await scratchpadService.updateScratchpad(userId, content);
      
      res.status(200).json({
        success: true,
        message: "Scratchpad updated successfully",
        data: { scratchpad },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const scratchpadController = new ScratchpadController();
