import { folderRepository } from "./folder.repository";
import { spaceRepository } from "../space/space.repository";
import { workspaceRepository } from "../workspace/workspace.repository";
import { IFolder } from "./folder.model";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

export class FolderService {
  async createFolder(spaceId: string, name: string, userId: string): Promise<IFolder> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    // Verify user can write to space (Manager, Admin, Owner in workspace)
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      throw new ForbiddenError("Insufficient permissions to create folders in this space");
    }

    return folderRepository.createFolder(spaceId, name);
  }

  async getSpaceFolders(spaceId: string, userId: string): Promise<IFolder[]> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    // Verify workspace membership
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    return folderRepository.findBySpace(spaceId);
  }
}

export const folderService = new FolderService();
