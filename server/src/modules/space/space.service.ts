import { spaceRepository } from "./space.repository";
import { workspaceRepository } from "../workspace/workspace.repository";
import { ISpace } from "./space.model";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import mongoose from "mongoose";

export class SpaceService {
  async createSpace(
    workspaceId: string,
    name: string,
    description: string | undefined,
    color: string | undefined,
    isPrivate: boolean | undefined,
    allowedMembers: string[] | undefined,
    userId: string
  ): Promise<ISpace> {
    // 1. Verify user membership in workspace and roles (Managers/Admins/Owners only)
    const membership = await workspaceRepository.findMembership(workspaceId, userId);
    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      throw new ForbiddenError("Insufficient privileges to create a Space in this workspace");
    }

    // 2. Prepare allowed members list if private
    const allowedUserIds: mongoose.Types.ObjectId[] = [];
    if (isPrivate) {
      // Creator is always allowed
      allowedUserIds.push(new mongoose.Types.ObjectId(userId));
      
      // Push invited list
      if (allowedMembers && allowedMembers.length > 0) {
        allowedMembers.forEach((id) => {
          if (id !== userId) {
            allowedUserIds.push(new mongoose.Types.ObjectId(id));
          }
        });
      }
    }

    return spaceRepository.createSpace({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      name,
      description,
      color,
      isPrivate: !!isPrivate,
      allowedMembers: allowedUserIds,
    });
  }

  async getWorkspaceSpaces(workspaceId: string, userId: string): Promise<ISpace[]> {
    // Verify membership in workspace
    const membership = await workspaceRepository.findMembership(workspaceId, userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("Access denied. You are not a member of this workspace.");
    }

    return spaceRepository.findSpacesByWorkspace(workspaceId, userId);
  }

  async deleteSpace(spaceId: string, userId: string): Promise<void> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    // Verify requesting user is owner or admin in the workspace
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ForbiddenError("Only workspace owners or admins can delete project spaces");
    }

    await spaceRepository.deleteSpace(spaceId);
  }
}

export const spaceService = new SpaceService();
