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

    const newSpace = await spaceRepository.createSpace({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      name,
      description,
      color,
      isPrivate: !!isPrivate,
      allowedMembers: allowedUserIds,
    });

    // Automatically initialize 4 default lists for the space
    const ListModel = mongoose.model("List");
    await ListModel.create([
      { spaceId: newSpace._id, name: "To Do", position: 1000 },
      { spaceId: newSpace._id, name: "In Progress", position: 2000 },
      { spaceId: newSpace._id, name: "Review", position: 3000 },
      { spaceId: newSpace._id, name: "Done", position: 4000 },
    ]);

    return newSpace;
  }

  async getWorkspaceSpaces(workspaceId: string, userId: string): Promise<any[]> {
    const user = await mongoose.model("User").findById(userId);
    const isSysAdmin = user?.isSystemAdmin;

    const workspace = await workspaceRepository.findById(workspaceId);
    const isOwner = workspace && (workspace.ownerId?.toString() === userId || (workspace.ownerId as any)?._id?.toString() === userId);

    const membership = await workspaceRepository.findMembership(workspaceId, userId);
    if (!isSysAdmin && !isOwner && (!membership || membership.status !== "active")) {
      throw new ForbiddenError("Access denied. You are not a member of this workspace.");
    }

    const isAdmin = membership && ["owner", "admin"].includes(membership.role);
    const allSpaces = await spaceRepository.findAllByWorkspace(workspaceId);

    return allSpaces.map((sp: any) => {
      const spObj = sp.toObject ? sp.toObject() : { ...sp };

      if (isSysAdmin || isOwner || isAdmin) {
        return {
          ...spObj,
          isLocked: false,
          hasAccess: true,
        };
      }

      const allowedInSpace = sp.allowedMembers && sp.allowedMembers.some(
        (mId: any) => mId.toString() === userId
      );

      const memberAllowedSpaces = membership?.allowedSpaces || [];
      const allowedInMembership = memberAllowedSpaces.some(
        (sId: any) => sId.toString() === sp._id.toString()
      );

      const hasAccess = !!(allowedInSpace || allowedInMembership);

      return {
        ...spObj,
        isLocked: !hasAccess,
        hasAccess,
      };
    });
  }

  async requestAccessToSpace(spaceId: string, userId: string): Promise<void> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    const requestingUser = await mongoose.model("User").findById(userId);
    if (!requestingUser) {
      throw new NotFoundError("User not found");
    }

    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You must be an active member of this workspace to request access");
    }

    const workspace = await workspaceRepository.findById(space.workspaceId.toString());
    const ownerId = workspace?.ownerId?.toString() || (workspace?.ownerId as any)?._id?.toString();

    const adminMemberships = await mongoose.model("Membership").find({
      workspaceId: space.workspaceId,
      role: { $in: ["owner", "admin"] },
      status: "active",
    });

    const recipientIds = new Set<string>();
    if (ownerId && ownerId !== userId) {
      recipientIds.add(ownerId);
    }
    adminMemberships.forEach((m: any) => {
      const mUserId = m.userId?.toString();
      if (mUserId && mUserId !== userId) {
        recipientIds.add(mUserId);
      }
    });

    const { notificationService } = await import("../notification/notification.service");
    for (const recipientId of recipientIds) {
      await notificationService.createNotification(
        recipientId,
        "طلب إذن دخول إلى قسم",
        `المستخدم ${requestingUser.fullName} يطلب إذن الوصول إلى قسم "${space.name}"`,
        "space_access_request" as any,
        userId,
        space._id.toString(),
        "space" as any
      );
    }
  }

  async deleteSpace(spaceId: string, userId: string): Promise<void> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    const workspace = await workspaceRepository.findById(space.workspaceId.toString());
    const isOwner = workspace && (workspace.ownerId?.toString() === userId || (workspace.ownerId as any)?._id?.toString() === userId);
    // Verify requesting user is owner or admin in the workspace
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!isOwner && (!membership || !["owner", "admin"].includes(membership.role))) {
      throw new ForbiddenError("Only workspace owners or admins can delete project spaces");
    }

    const ListModel = mongoose.model("List");
    const TaskModel = mongoose.model("Task");
    const lists = await ListModel.find({ spaceId });
    const listIds = lists.map((l: any) => l._id);
    await TaskModel.deleteMany({ listId: { $in: listIds } });
    await ListModel.deleteMany({ spaceId });
    await spaceRepository.deleteSpace(spaceId);
  }
}

export const spaceService = new SpaceService();
