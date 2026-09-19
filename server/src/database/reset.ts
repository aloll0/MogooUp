import mongoose from "mongoose";
import { config } from "../config";
import { logger } from "../utils/logger";
import { UserModel } from "../modules/user/user.model";
import { WorkspaceModel } from "../modules/workspace/workspace.model";
import { MembershipModel } from "../modules/workspace/membership.model";
import { SpaceModel } from "../modules/space/space.model";
import { FolderModel } from "../modules/folder/folder.model";
import { ListModel } from "../modules/list/list.model";
import { TaskModel } from "../modules/task/task.model";
import { ActivityLogModel } from "../modules/activity/activity.model";
import { NotificationModel } from "../modules/notification/notification.model";
import { CommentModel } from "../modules/comment/comment.model";
import { GoalModel } from "../modules/goal/goal.model";
import { ClientProjectModel } from "../modules/clientProject/clientProject.model";
import { ScratchpadModel } from "../modules/scratchpad/scratchpad.model";

const resetDatabase = async () => {
  try {
    logger.info("Connecting to MongoDB to perform a clean database wipe...");
    await mongoose.connect(config.mongodbUri);
    logger.info("Connected to database. Commencing complete purge of test & mock data...");

    // Delete all records from every model
    const results = await Promise.all([
      UserModel.deleteMany({}),
      WorkspaceModel.deleteMany({}),
      MembershipModel.deleteMany({}),
      SpaceModel.deleteMany({}),
      FolderModel.deleteMany({}),
      ListModel.deleteMany({}),
      TaskModel.deleteMany({}),
      ActivityLogModel.deleteMany({}),
      NotificationModel.deleteMany({}),
      CommentModel.deleteMany({}),
      GoalModel.deleteMany({}),
      ClientProjectModel.deleteMany({}),
      ScratchpadModel.deleteMany({}),
    ]);

    // Also inspect any additional collections dynamically in the database
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const col of collections) {
        const c = mongoose.connection.db.collection(col.name);
        await c.deleteMany({});
        logger.info(`Cleared dynamic collection: ${col.name}`);
      }
    }

    logger.info("--------------------------------------------------");
    logger.info("DATABASE PURGE COMPLETE!");
    logger.info(`Users deleted: ${results[0].deletedCount}`);
    logger.info(`Workspaces deleted: ${results[1].deletedCount}`);
    logger.info(`Memberships deleted: ${results[2].deletedCount}`);
    logger.info(`Spaces deleted: ${results[3].deletedCount}`);
    logger.info(`Folders deleted: ${results[4].deletedCount}`);
    logger.info(`Lists deleted: ${results[5].deletedCount}`);
    logger.info(`Tasks deleted: ${results[6].deletedCount}`);
    logger.info(`Activity Logs deleted: ${results[7].deletedCount}`);
    logger.info(`Notifications deleted: ${results[8].deletedCount}`);
    logger.info(`Comments deleted: ${results[9].deletedCount}`);
    logger.info(`Goals deleted: ${results[10].deletedCount}`);
    logger.info(`Client Projects deleted: ${results[11].deletedCount}`);
    logger.info(`Scratchpads deleted: ${results[12].deletedCount}`);
    logger.info("--------------------------------------------------");
    logger.info("The database is now 100% clean and ready for real users!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("Database reset failed with error:", error);
    process.exit(1);
  }
};

resetDatabase();
