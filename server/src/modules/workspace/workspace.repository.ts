import { WorkspaceModel, IWorkspace } from "./workspace.model";
import { MembershipModel, IMembership, WorkspaceRole } from "./membership.model";
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
    status: IMembership["status"] = "active"
  ): Promise<IMembership> {
    return MembershipModel.create({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
      role,
      status,
    });
  }

  async findMembership(workspaceId: string, userId: string): Promise<IMembership | null> {
    return MembershipModel.findOne({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      userId: new mongoose.Types.ObjectId(userId),
    }).exec();
  }

  async findWorkspaceMembers(workspaceId: string) {
    return MembershipModel.find({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
    })
      .populate("userId", "fullName email avatarUrl")
      .exec();
  }
}

export const workspaceRepository = new WorkspaceRepository();
