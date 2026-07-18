import { WorkspaceRole } from "../modules/workspace/membership.model";

declare global {
  namespace Express {
    export interface Request {
      user?: {
        userId: string;
        email: string;
      };
      membership?: {
        workspaceId: string;
        userId: string;
        role: WorkspaceRole;
      };
    }
  }
}
