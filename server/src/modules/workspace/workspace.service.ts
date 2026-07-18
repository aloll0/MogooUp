import { workspaceRepository } from "./workspace.repository";
import { userRepository } from "../user/user.repository";
import { IWorkspace } from "./workspace.model";
import { IMembership, WorkspaceRole } from "./membership.model";
import { ConflictError, NotFoundError, ForbiddenError } from "../../utils/errors";

export class WorkspaceService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

    // Automatically join owner as workspace owner
    await workspaceRepository.createMembership(workspace._id.toString(), ownerId, "owner", "active");

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<IWorkspace[]> {
    return workspaceRepository.findUserWorkspaces(userId);
  }

  async getWorkspaceBySlug(slug: string, userId: string): Promise<IWorkspace> {
    const workspace = await workspaceRepository.findBySlug(slug);
    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    // Verify requesting user is a member of the workspace
    const membership = await workspaceRepository.findMembership(workspace._id.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have access to this workspace");
    }

    return workspace;
  }

  async getWorkspaceMembers(workspaceId: string, userId: string) {
    // Validate requestor is member
    const membership = await workspaceRepository.findMembership(workspaceId, userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("Access denied. You are not a member of this workspace.");
    }

    return workspaceRepository.findWorkspaceMembers(workspaceId);
  }

  async inviteMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRole,
    inviterId: string
  ): Promise<IMembership> {
    // 1. Validate inviter is Owner or Admin
    const inviterMembership = await workspaceRepository.findMembership(workspaceId, inviterId);
    if (!inviterMembership || !["owner", "admin"].includes(inviterMembership.role)) {
      throw new ForbiddenError("Only workspace owners or admins can invite new members");
    }

    // 2. Find target user by email
    const targetUser = await userRepository.findByEmail(email);
    if (!targetUser) {
      throw new NotFoundError(`User with email ${email} is not registered on Mogoo yet.`);
    }

    // 3. Check if target user is already a member
    const existingMembership = await workspaceRepository.findMembership(workspaceId, targetUser._id.toString());
    if (existingMembership) {
      throw new ConflictError("This user is already a member of this workspace");
    }

    // 4. Create membership invitation
    return workspaceRepository.createMembership(workspaceId, targetUser._id.toString(), role, "active"); // auto-active for simplicity in this sprint
  }
}

export const workspaceService = new WorkspaceService();
