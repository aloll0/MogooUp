import { GoalModel, IGoal } from "./goal.model";
import { workspaceRepository } from "../workspace/workspace.repository";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import mongoose from "mongoose";

export class GoalService {
  async getWorkspaceGoals(workspaceId: string, userId: string): Promise<IGoal[]> {
    const membership = await workspaceRepository.findMembership(workspaceId, userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have access to this workspace's goals");
    }

    return GoalModel.find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) }).sort({ createdAt: -1 });
  }

  async createGoal(goalData: Partial<IGoal> & { workspaceId: string }, userId: string): Promise<IGoal> {
    const membership = await workspaceRepository.findMembership(goalData.workspaceId, userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You are not authorized to create goals in this workspace");
    }

    const completeGoalData = {
      ...goalData,
      ownerId: new mongoose.Types.ObjectId(userId),
      keyResults: goalData.keyResults?.map(kr => ({
        ...kr,
        _id: kr._id ? new mongoose.Types.ObjectId(kr._id.toString()) : new mongoose.Types.ObjectId(),
      })) || [],
    };

    return GoalModel.create(completeGoalData);
  }

  async updateGoal(goalId: string, updateData: Partial<IGoal>, userId: string): Promise<IGoal> {
    const goal = await GoalModel.findById(goalId);
    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    const membership = await workspaceRepository.findMembership(goal.workspaceId.toString(), userId);
    if (!membership || membership.status !== "active") {
      throw new ForbiddenError("You do not have permission to modify this goal");
    }

    // Map new keyResults if provided to ensure proper mongoose ObjectIds
    if (updateData.keyResults) {
      updateData.keyResults = updateData.keyResults.map(kr => ({
        ...kr,
        _id: kr._id ? new mongoose.Types.ObjectId(kr._id.toString()) : new mongoose.Types.ObjectId(),
      }));
    }

    const updatedGoal = await GoalModel.findByIdAndUpdate(goalId, updateData, { new: true });
    if (!updatedGoal) {
      throw new NotFoundError("Goal could not be updated");
    }

    return updatedGoal;
  }

  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const goal = await GoalModel.findById(goalId);
    if (!goal) {
      throw new NotFoundError("Goal not found");
    }

    const membership = await workspaceRepository.findMembership(goal.workspaceId.toString(), userId);
    // Limit goal deletion to owner, admin or manager roles
    if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
      throw new ForbiddenError("Only workspace managers, admins or owners can delete goals");
    }

    await GoalModel.findByIdAndDelete(goalId);
  }
}

export const goalService = new GoalService();
