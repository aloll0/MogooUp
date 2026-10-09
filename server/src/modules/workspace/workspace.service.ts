import mongoose from "mongoose";
import { workspaceRepository } from "./workspace.repository";
import { userRepository } from "../user/user.repository";
import { IWorkspace, WorkspaceModel } from "./workspace.model";
import { IMembership, WorkspaceRole, DEFAULT_ROLE_PERMISSIONS, IWorkspacePermissions } from "./membership.model";
import { ConflictError, NotFoundError, ForbiddenError } from "../../utils/errors";

export class WorkspaceService {
  private generateSlug(name: string): string {
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      slug = `workspace-${Math.random().toString(36).substring(2, 8)}`;
    }
    return slug;
  }

  async createWorkspace(name: string, customSlug: string | undefined, ownerId: string): Promise<IWorkspace> {
    const slug = customSlug ? this.generateSlug(customSlug) : this.generateSlug(name);
    
    // Check if slug is already taken
    const existingWorkspace = await workspaceRepository.findBySlug(slug);
    if (existingWorkspace) {
      throw new ConflictError("A workspace with this URL slug already exists");
    }

    // Create Workspace
    const workspace = await workspaceRepository.createWorkspace(name, slug, ownerId);

    // Automatically join owner as workspace owner with owner permissions
    await workspaceRepository.createMembership(
      workspace._id.toString(),
      ownerId,
      "owner",
      "active",
      DEFAULT_ROLE_PERMISSIONS.owner
    );

    // Automatically create a default Space ("General Space") and the 4 default lists
    const SpaceModel = mongoose.model("Space");
    const ListModel = mongoose.model("List");
    
    const defaultSpace = await SpaceModel.create({
      workspaceId: workspace._id,
      name: "General Space",
      description: "Default space for project tasks",
      color: "#8b5cf6",
      isPrivate: false,
      allowedMembers: [],
    });

    await ListModel.create([
      { spaceId: defaultSpace._id, name: "To Do", position: 1000 },
      { spaceId: defaultSpace._id, name: "In Progress", position: 2000 },
      { spaceId: defaultSpace._id, name: "Review", position: 3000 },
      { spaceId: defaultSpace._id, name: "Done", position: 4000 },
    ]);

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<IWorkspace[]> {
    const user = await mongoose.model("User").findById(userId);
    if (user?.isSystemAdmin) {
      return WorkspaceModel.find({}).exec();
    }
    return workspaceRepository.findUserWorkspaces(userId);
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const user = await mongoose.model("User").findById(userId);
    const isSysAdmin = user?.isSystemAdmin;
    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }
    const isOwner = workspace.ownerId?.toString() === userId || (workspace.ownerId as any)?._id?.toString() === userId;
    if (!isSysAdmin && !isOwner) {
      throw new ForbiddenError("Only the workspace owner or system administrator can delete this workspace");
    }

    const SpaceModel = mongoose.model("Space");
    const ListModel = mongoose.model("List");
    const TaskModel = mongoose.model("Task");
    const ClientProjectModel = mongoose.model("ClientProject");
    const MembershipModel = mongoose.model("Membership");

    await TaskModel.deleteMany({ workspaceId });
    const spaces = await SpaceModel.find({ workspaceId }, "_id");
    const spaceIds = spaces.map((s: any) => s._id);
    await ListModel.deleteMany({ spaceId: { $in: spaceIds } });
    await SpaceModel.deleteMany({ workspaceId });
    await ClientProjectModel.deleteMany({ workspaceId });
    await MembershipModel.deleteMany({ workspaceId });
    await WorkspaceModel.findByIdAndDelete(workspaceId);
  }

  async getWorkspaceBySlug(slug: string, userId: string): Promise<IWorkspace> {
    const workspace = await workspaceRepository.findBySlug(slug);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    // Verify requesting user is a member of the workspace or system admin
    const user = await mongoose.model("User").findById(userId);
    const isSysAdmin = user?.isSystemAdmin;
    const membership = await workspaceRepository.findMembership(workspace._id.toString(), userId);
    if (!isSysAdmin && (!membership || membership.status !== "active")) {
      throw new ForbiddenError("You do not have access to this workspace");
    }

    return workspace;
  }

  async getWorkspaceMembers(workspaceId: string, userId: string) {
    // Validate requestor is member or system admin
    const user = await mongoose.model("User").findById(userId);
    const isSysAdmin = user?.isSystemAdmin;
    const membership = await workspaceRepository.findMembership(workspaceId, userId);
    if (!isSysAdmin && (!membership || membership.status !== "active")) {
      throw new ForbiddenError("Access denied. You are not a member of this workspace.");
    }

    return workspaceRepository.findWorkspaceMembers(workspaceId);
  }

  async inviteMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    inviterId: string,
    customPermissions?: Partial<IWorkspacePermissions>,
    allowedSpaces?: string[]
  ): Promise<IMembership> {
    // 1. Validate inviter is Owner or Admin or has canInviteMembers permission or is system admin
    const user = await mongoose.model("User").findById(inviterId);
    const isSysAdmin = user?.isSystemAdmin;
    const inviterMembership = await workspaceRepository.findMembership(workspaceId, inviterId);
    const isOwnerOrAdmin = inviterMembership && ["owner", "admin"].includes(inviterMembership.role);
    const canInvite = inviterMembership?.permissions?.canInviteMembers;

    if (!isSysAdmin && !isOwnerOrAdmin && !canInvite) {
      throw new ForbiddenError("Only workspace owners, admins, or authorized members can invite new members");
    }

    // 2. Find target user by email
    const targetUser = await userRepository.findByEmail(email);
    if (!targetUser) {
      throw new NotFoundError(`User with email ${email} is not registered on the platform yet.`);
    }

    // 3. Check if target user is already a member
    const existingMembership = await workspaceRepository.findMembership(workspaceId, targetUser._id.toString());
    if (existingMembership) {
      throw new ConflictError("This user is already a member of this workspace");
    }

    // 4. Merge permissions
    const permissions: IWorkspacePermissions = {
      ...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.member),
      ...(customPermissions || {}),
    };

    // 5. Create membership
    const newMembership = await workspaceRepository.createMembership(
      workspaceId,
      targetUser._id.toString(),
      role,
      "active",
      permissions
    );

    if (allowedSpaces && allowedSpaces.length > 0) {
      const spaceObjIds = allowedSpaces.map((id) => new mongoose.Types.ObjectId(id));
      await workspaceRepository.updateMembership(workspaceId, targetUser._id.toString(), {
        allowedSpaces: spaceObjIds,
      });

      // Synchronize SpaceModel
      const SpaceModel = mongoose.model("Space");
      await SpaceModel.updateMany(
        { _id: { $in: spaceObjIds }, workspaceId: new mongoose.Types.ObjectId(workspaceId) },
        { $addToSet: { allowedMembers: targetUser._id } }
      );
    }

    return newMembership;
  }

  async updateMemberRoleAndPermissions(
    workspaceId: string,
    targetUserId: string,
    requestorId: string,
    role?: WorkspaceRole,
    permissions?: Partial<IWorkspacePermissions>,
    allowedSpaces?: string[]
  ): Promise<IMembership> {
    const user = await mongoose.model("User").findById(requestorId);
    const isSysAdmin = user?.isSystemAdmin;
    const requestorMembership = await workspaceRepository.findMembership(workspaceId, requestorId);
    const workspace = await workspaceRepository.findById(workspaceId);
    const isOwner = workspace && (workspace.ownerId?.toString() === requestorId || (workspace.ownerId as any)?._id?.toString() === requestorId);

    if (!isSysAdmin && !isOwner && (!requestorMembership || !["owner", "admin"].includes(requestorMembership.role))) {
      throw new ForbiddenError("Only workspace owners or admins can modify member roles and permissions");
    }

    const targetMembership = await workspaceRepository.findMembership(workspaceId, targetUserId);
    if (!targetMembership) {
      throw new NotFoundError("Member not found in workspace");
    }
    if (targetMembership.role === "owner" && !isOwner && !isSysAdmin) {
      throw new ForbiddenError("Cannot modify the workspace owner's role or permissions");
    }

    const updateData: any = {};
    if (role) {
      updateData.role = role;
      if (!permissions) {
        updateData.permissions = DEFAULT_ROLE_PERMISSIONS[role];
      }
    }
    if (permissions) {
      const permsObj = (targetMembership.permissions as any);
      const existingPerms = permsObj?.toObject
        ? permsObj.toObject()
        : targetMembership.permissions || DEFAULT_ROLE_PERMISSIONS[role || targetMembership.role];
      updateData.permissions = {
        ...existingPerms,
        ...permissions,
      };
    }

    if (allowedSpaces !== undefined) {
      const spaceObjIds = allowedSpaces.map((id) => new mongoose.Types.ObjectId(id));
      updateData.allowedSpaces = spaceObjIds;

      // Synchronize SpaceModel allowedMembers
      const SpaceModel = mongoose.model("Space");
      const targetUserObjId = new mongoose.Types.ObjectId(targetUserId);

      if (spaceObjIds.length > 0) {
        await SpaceModel.updateMany(
          { _id: { $in: spaceObjIds }, workspaceId: new mongoose.Types.ObjectId(workspaceId) },
          { $addToSet: { allowedMembers: targetUserObjId } }
        );
      }
      await SpaceModel.updateMany(
        { _id: { $nin: spaceObjIds }, workspaceId: new mongoose.Types.ObjectId(workspaceId) },
        { $pull: { allowedMembers: targetUserObjId } }
      );
    }

    const updated = await workspaceRepository.updateMembership(workspaceId, targetUserId, updateData);
    if (!updated) {
      throw new NotFoundError("Membership record not found");
    }
    return updated;
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    requestorId: string
  ): Promise<void> {
    const user = await mongoose.model("User").findById(requestorId);
    const isSysAdmin = user?.isSystemAdmin;
    const requestorMembership = await workspaceRepository.findMembership(workspaceId, requestorId);
    const workspace = await workspaceRepository.findById(workspaceId);
    const isOwner = workspace && (workspace.ownerId?.toString() === requestorId || (workspace.ownerId as any)?._id?.toString() === requestorId);

    if (!isSysAdmin && !isOwner && (!requestorMembership || !["owner", "admin"].includes(requestorMembership.role))) {
      throw new ForbiddenError("Only workspace owners or admins can remove members");
    }

    const targetMembership = await workspaceRepository.findMembership(workspaceId, targetUserId);
    if (!targetMembership) {
      throw new NotFoundError("Member not found in workspace");
    }
    if (targetMembership.role === "owner") {
      throw new ForbiddenError("The workspace owner cannot be removed from the workspace");
    }

    await workspaceRepository.deleteMembership(workspaceId, targetUserId);
  }
}

export const workspaceService = new WorkspaceService();
