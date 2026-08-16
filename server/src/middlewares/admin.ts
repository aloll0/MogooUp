import { Request, Response, NextFunction } from "express";
import { UserModel } from "../modules/user/user.model";
import { ForbiddenError, UnauthorizedError } from "../utils/errors";

export const adminMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      throw new UnauthorizedError("Unauthorized access");
    }
    const user = await UserModel.findById(req.user.userId);
    if (!user || !user.isSystemAdmin) {
      throw new ForbiddenError("Only system administrators can access this resource.");
    }
    next();
  } catch (error) {
    next(error);
  }
};
