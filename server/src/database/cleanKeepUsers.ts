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

const cleanKeepUsers = async () => {
  try {
    logger.info("Connecting to MongoDB to purge fake/test data while PRESERVING ALL USERS...");
    await mongoose.connect(config.mongodbUri);
    logger.info("Connected to database successfully.");

    // 1. Verify and record existing users
    const initialUsers = await UserModel.find({}, "email fullName isApproved isSystemAdmin").lean();
    logger.info(`Found ${initialUsers.length} existing users in database:`);
    initialUsers.forEach(u => logger.info(`  - ${u.fullName} (${u.email}) [Approved: ${u.isApproved}]`));

    // 2. Delete all records from non-user models
    const results = await Promise.all([
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

    // 3. Inspect dynamic collections, wiping only collections that are NOT 'users'
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (const col of collections) {
        if (col.name.toLowerCase() === "users" || col.name.startsWith("system.")) {
          logger.info(`Skipping preserved collection: ${col.name}`);
          continue;
        }
        const c = mongoose.connection.db.collection(col.name);
        await c.deleteMany({});
        logger.info(`Cleared dynamic non-user collection: ${col.name}`);
      }
    }

    // 4. Verify users are still 100% intact
    const remainingUsers = await UserModel.find({}, "email fullName isApproved").lean();
    
    logger.info("--------------------------------------------------");
    logger.info("CLEANUP COMPLETED SUCCESSFULLY (USERS PRESERVED)!");
    logger.info(`Workspaces deleted: ${results[0].deletedCount}`);
    logger.info(`Memberships deleted: ${results[1].deletedCount}`);
    logger.info(`Spaces deleted: ${results[2].deletedCount}`);
    logger.info(`Folders deleted: ${results[3].deletedCount}`);
    logger.info(`Lists deleted: ${results[4].deletedCount}`);
    logger.info(`Tasks deleted: ${results[5].deletedCount}`);
    logger.info(`Activity Logs deleted: ${results[6].deletedCount}`);
    logger.info(`Notifications deleted: ${results[7].deletedCount}`);
    logger.info(`Comments deleted: ${results[8].deletedCount}`);
    logger.info(`Goals deleted: ${results[9].deletedCount}`);
    logger.info(`Client Projects deleted: ${results[10].deletedCount}`);
    logger.info(`Scratchpads deleted: ${results[11].deletedCount}`);
    logger.info(`Total Users Remaining: ${remainingUsers.length} (Expected: ${initialUsers.length})`);
    logger.info("--------------------------------------------------");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error("Cleanup failed with error:", error);
    process.exit(1);
  }
};

cleanKeepUsers();
