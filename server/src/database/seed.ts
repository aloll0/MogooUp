import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "../config";
import { logger } from "../utils/logger";
import { UserModel } from "../modules/user/user.model";
import { WorkspaceModel } from "../modules/workspace/workspace.model";
import { MembershipModel } from "../modules/workspace/membership.model";
import { SpaceModel } from "../modules/space/space.model";
import { FolderModel } from "../modules/folder/folder.model";
import { ListModel } from "../modules/list/list.model";
import { TaskModel } from "../modules/task/task.model";

const seedData = async () => {
  try {
    logger.info("Connecting to database for seeding...");
    await mongoose.connect(config.mongodbUri);
    logger.info("Database connected. Cleaning existing collections...");

    // Clean existing data
    await UserModel.deleteMany({});
    await WorkspaceModel.deleteMany({});
    await MembershipModel.deleteMany({});
    await SpaceModel.deleteMany({});
    await FolderModel.deleteMany({});
    await ListModel.deleteMany({});
    await TaskModel.deleteMany({});

    logger.info("Collections cleared. Creating users...");

    // Create Arab Pro System Admin User
    const arabProAdminPasswordHash = await bcrypt.hash("password123", 12);
    const arabProAdmin = await UserModel.create({
      email: "admin@arabpro.com",
      passwordHash: arabProAdminPasswordHash,
      fullName: "Arab Pro Admin",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=ArabPro",
      isVerified: true,
      isApproved: true,
      isSystemAdmin: true,
    });

    // Create Admin User (Workspace manager)
    const adminPasswordHash = await bcrypt.hash("password123", 12);
    const adminUser = await UserModel.create({
      email: "admin@taskflow.com",
      passwordHash: adminPasswordHash,
      fullName: "Taskflow Admin",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Admin",
      isVerified: true,
      isApproved: true,
      isSystemAdmin: false,
    });  

    // Create Developer User
    const devPasswordHash = await bcrypt.hash("password123", 12);
    const devUser = await UserModel.create({
      email: "dev@taskflow.com",
      passwordHash: devPasswordHash,
      fullName: "Taskflow Developer",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Dev",
      isVerified: true,
      isApproved: true,
      isSystemAdmin: false,
    });

    // Create UI Designer User
    const designerPasswordHash = await bcrypt.hash("password123", 12);
    const designerUser = await UserModel.create({
      email: "maryam@taskflow.com",
      passwordHash: designerPasswordHash,
      fullName: "Maryam UI Designer",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Maryam",
      isVerified: true,
      isApproved: true,
      isSystemAdmin: false,
    });

    logger.info(`Users created successfully: ${adminUser.email}, ${devUser.email}, ${designerUser.email}, ${arabProAdmin.email}`);

    // Create Workspace
    const workspace = await WorkspaceModel.create({
      name: "Acme Software",
      slug: "acme-software",
      logoUrl: "",
      ownerId: adminUser._id as mongoose.Types.ObjectId,
    });

    logger.info(`Workspace created: ${workspace.name} (${workspace.slug})`);

    // Create Memberships
    await MembershipModel.create([
      {
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        userId: adminUser._id as mongoose.Types.ObjectId,
        role: "owner",
        status: "active",
      },
      {
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        userId: devUser._id as mongoose.Types.ObjectId,
        role: "member",
        status: "active",
      },
      {
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        userId: designerUser._id as mongoose.Types.ObjectId,
        role: "member",
        status: "active",
      },
      {
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        userId: arabProAdmin._id as mongoose.Types.ObjectId,
        role: "admin",
        status: "active",
      },
    ]);

    logger.info("Memberships registered.");

    // Create Space
    const space = await SpaceModel.create({
      workspaceId: workspace._id as mongoose.Types.ObjectId,
      name: "Engineering",
      description: "Software engineering tasks and pipeline",
      color: "#aa3bff",
      isPrivate: false,
      allowedMembers: [],
    });

    logger.info(`Space created: ${space.name}`);

    // Create Folder
    const folder = await FolderModel.create({
      spaceId: space._id as mongoose.Types.ObjectId,
      name: "Sprint 1 Development",
    });

    logger.info(`Folder created: ${folder.name}`);

    // Create Lists
    const listTodo = await ListModel.create({
      spaceId: space._id as mongoose.Types.ObjectId,
      folderId: folder._id as mongoose.Types.ObjectId,
      name: "To Do",
      position: 1000,
    });

    const listInProgress = await ListModel.create({
      spaceId: space._id as mongoose.Types.ObjectId,
      folderId: folder._id as mongoose.Types.ObjectId,
      name: "In Progress",
      position: 2000,
    });

    const listDone = await ListModel.create({
      spaceId: space._id as mongoose.Types.ObjectId,
      folderId: folder._id as mongoose.Types.ObjectId,
      name: "Done",
      position: 3000,
    });

    logger.info("Lists created (To Do, In Progress, Done).");

    // Create Tasks
    await TaskModel.create([
      {
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        spaceId: space._id as mongoose.Types.ObjectId,
        listId: listTodo._id as mongoose.Types.ObjectId,
        title: "Setup typescript backend and folder structure",
        description: "Configure tsconfig.json, error routing handlers, and package details.",
        status: "to-do",
        priority: "high",
        assignees: [adminUser._id as mongoose.Types.ObjectId],
        reporterId: adminUser._id as mongoose.Types.ObjectId,
        position: 1000,
      },
      {
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        spaceId: space._id as mongoose.Types.ObjectId,
        listId: listInProgress._id as mongoose.Types.ObjectId,
        title: "Design MongoDB data schemas",
        description: "Specify User, Workspace, Space, List, Task model structure.",
        status: "in-progress",
        priority: "medium",
        assignees: [devUser._id as mongoose.Types.ObjectId],
        reporterId: adminUser._id as mongoose.Types.ObjectId,
        position: 1000,
      },
      {
        workspaceId: workspace._id as mongoose.Types.ObjectId,
        spaceId: space._id as mongoose.Types.ObjectId,
        listId: listDone._id as mongoose.Types.ObjectId,
        title: "Initialize client Vite React application",
        description: "Create standard components and register routers.",
        status: "done",
        priority: "low",
        assignees: [devUser._id as mongoose.Types.ObjectId],
        reporterId: adminUser._id as mongoose.Types.ObjectId,
        position: 1000,
      },
    ]);

    logger.info("Sample tasks populated successfully.");
    logger.info("Database seeding completed!");
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed with error:", error);
    process.exit(1);
  }
};

seedData();
