import { WorkspaceModel, IWorkspace } from "./workspace.model";
import { MembershipModel, IMembership, WorkspaceRole, DEFAULT_ROLE_PERMISSIONS, IWorkspacePermissions } from "./membership.model";
import mongoose from "mongoose";

export class WorkspaceRepository {
  async findById(id: string): Promise<IWorkspace | null> {
    return WorkspaceModel.findById(id).exec();
  }

  async findBySlug(slug: string): Promise<IWorkspace | null> {
    return WorkspaceModel.findOne({ slug }).exec();
  }

  async createWorkspace(name: string, slug: string, ownerId: string): Promise<IWorkspace> {
    return WorkspaceModel.create({
      name,
      slug,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });
  }

  async updateWorkspace(id: string, updateData: Partial<IWorkspace>): Promise<IWorkspace | null> {
    return WorkspaceModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async findUserWorkspaces(userId: string): Promise<IWorkspace[]> {
    // Find all memberships of this user
    const memberships = await MembershipModel.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "active",
    }).exec();

    const workspaceIds = memberships.map((m) => m.workspaceId);

    // Fetch the workspaces
    return WorkspaceModel.find({ _id: { $in: workspaceIds } }).exec();
  }

  // Membership helpers
  async createMembership(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    status: IMembership["status"] = "active",
    permissions?: Partial<IWorkspacePermissions>
  ): Promise<IMembership> {
    const finalPermissions = {
      ...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.member),
      ...(permissions || {}),
    };

    return MembershipModel.create({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
      role,
      status,
      permissions: finalPermissions,
    });
  }

  async findMembership(workspaceId: string, userId: string): Promise<IMembership | null> {
    const membership = await MembershipModel.findOne({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();

    if (membership) return membership;

    // Grant virtual owner membership to System Administrators for any workspace
    try {
      const UserModel = mongoose.model("User");
      const user = await UserModel.findById(userId).lean().exec() as any;
      if (user && user.isSystemAdmin) {
        return {
          _id: new mongoose.Types.ObjectId(),
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
          userId: new mongoose.Types.ObjectId(userId),
          role: "owner" as WorkspaceRole,
          status: "active",
          permissions: DEFAULT_ROLE_PERMISSIONS.owner,
        } as any;
      }
    } catch {
      // Fallback
    }

    return null;
  }

  async findWorkspaceMembers(workspaceId: string) {
    const rawMembers = await MembershipModel.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    })
      .populate("userId", "fullName email avatarUrl")
      .lean()
      .exec();

    return rawMembers.map((m: any) => {
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[m.role as WorkspaceRole] || DEFAULT_ROLE_PERMISSIONS.member;
      return {
        ...m,
        allowedSpaces: m.allowedSpaces ? m.allowedSpaces.map((id: any) => id.toString()) : [],
        permissions: {
          ...defaultPerms,
          ...(m.permissions || {}),
        },
      };
    });
  }

  async updateMembership(
    workspaceId: string,
    userId: string,
    updateData: Partial<IMembership>
  ): Promise<IMembership | null> {
    return MembershipModel.findOneAndUpdate(
      {
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      updateData,
      { new: true }
    ).exec();
  }

  async deleteMembership(workspaceId: string, userId: string): Promise<IMembership | null> {
    return MembershipModel.findOneAndDelete({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
  }
}

export const workspaceRepository = new WorkspaceRepository();
