import { Request, Response, NextFunction } from "express";
import { ClientProjectModel } from "./clientProject.model";
import { workspaceRepository } from "../workspace/workspace.repository";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

export class ClientProjectController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;

      // Verify user belongs to workspace
      const membership = await workspaceRepository.findMembership(workspaceId, userId);
      if (!membership || membership.status !== "active") {
        throw new ForbiddenError("You do not have access to this workspace");
      }

      const clients = await ClientProjectModel.find({ workspaceId }).sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        data: { clients },
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user!.userId;
      const { clientName, description, services, notes } = req.body;

      // Verify privileges (Only Owner, Admin, Manager)
      const membership = await workspaceRepository.findMembership(workspaceId, userId);
      if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
        throw new ForbiddenError("Only workspace managers, admins, or owners can create client profiles");
      }

      // Setup default services
      const defaultServices = [
        { name: "برمجة وتطوير (Programming & Dev)", isChecked: false },
        { name: "تهيئة محركات البحث (SEO)", isChecked: false },
        { name: "تصميم جرافيك (Graphic Design)", isChecked: false },
        { name: "موشن جرافيك (Motion Graphics)", isChecked: false },
        { name: "تسويق رقمي (Digital Marketing)", isChecked: false },
        { name: "حملات إعلانية ممولة (Paid Ads)", isChecked: false },
      ];

      const initialServices = services && services.length > 0 ? services : defaultServices;

      const client = await ClientProjectModel.create({
        workspaceId,
        clientName,
        description: description || "",
        services: initialServices,
        notes: notes || "",
      });

      res.status(201).json({
        success: true,
        message: "Client profile created successfully",
        data: { client },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId, clientId } = req.params;
      const userId = req.user!.userId;

      // Verify privileges
      const membership = await workspaceRepository.findMembership(workspaceId, userId);
      if (!membership || !["owner", "admin", "manager"].includes(membership.role)) {
        throw new ForbiddenError("Only workspace managers, admins, or owners can modify client profiles");
      }

      const client = await ClientProjectModel.findOneAndUpdate(
        { _id: clientId, workspaceId },
        req.body,
        { new: true }
      );

      if (!client) {
        throw new NotFoundError("Client profile not found");
      }

      res.status(200).json({
        success: true,
        message: "Client profile updated successfully",
        data: { client },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { workspaceId, clientId } = req.params;
      const userId = req.user!.userId;

      // Verify privileges
      const membership = await workspaceRepository.findMembership(workspaceId, userId);
      if (!membership || !["owner", "admin"].includes(membership.role)) {
        throw new ForbiddenError("Only workspace owners or admins can delete client profiles");
      }

      const client = await ClientProjectModel.findOneAndDelete({ _id: clientId, workspaceId });
      if (!client) {
        throw new NotFoundError("Client profile not found");
      }

      res.status(200).json({
        success: true,
        message: "Client profile deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const clientProjectController = new ClientProjectController();
