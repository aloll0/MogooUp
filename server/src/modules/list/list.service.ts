import { listRepository } from "./list.repository";
import { spaceRepository } from "../space/space.repository";
import { workspaceRepository } from "../workspace/workspace.repository";
import { IList } from "./list.model";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

export class ListService {
  async createList(
    spaceId: string,
    folderId: string | null,
    name: string,
    position: number,
    userId: string
  ): Promise<IList> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    // Verify workspace membership with edit access
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      throw new ForbiddenError("Insufficient permissions to create lists in this space");
    }

    return listRepository.createList(spaceId, folderId, name, position);
  }

  async getSpaceLists(spaceId: string, userId: string): Promise<IList[]> {
    const space = await spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError("Space not found");
    }

    // Verify workspace membership
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    return listRepository.findBySpace(spaceId);
  }

  async updateList(listId: string, updateData: Partial<IList>, userId: string): Promise<IList> {
    const list = await listRepository.findById(listId);
    if (!list) {
      throw new NotFoundError("List not found");
    }

    const space = await spaceRepository.findById(list.spaceId.toString());
    if (!space) {
      throw new NotFoundError("Associated Space not found");
    }

    // Verify membership permissions
    const membership = await workspaceRepository.findMembership(space.workspaceId.toString(), userId);
    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      throw new ForbiddenError("Insufficient permissions to modify lists");
    }

    const updatedList = await listRepository.updateList(listId, updateData);
    if (!updatedList) {
      throw new NotFoundError("List could not be updated");
    }

    return updatedList;
  }
}

export const listService = new ListService();
