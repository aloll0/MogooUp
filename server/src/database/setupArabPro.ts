import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { WorkspaceModel } from "../modules/workspace/workspace.model";
import { MembershipModel, DEFAULT_ROLE_PERMISSIONS } from "../modules/workspace/membership.model";
import { SpaceModel } from "../modules/space/space.model";
import { ListModel } from "../modules/list/list.model";
import { UserModel } from "../modules/user/user.model";

async function setup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");

  // 1. Find Admin user
  const adminUser =
    (await UserModel.findOne({ isSystemAdmin: true })) ||
    (await UserModel.findOne({ email: "admin@arabpro.com" })) ||
    (await UserModel.findOne({ email: "yassin@gmail.com" })) ||
    (await UserModel.findOne({}));

  if (!adminUser) {
    console.error("No admin user found");
    process.exit(1);
  }
  console.log("Admin user:", adminUser.email);

  // 2. Setup Arab Pro Workspace
  let arabPro = await WorkspaceModel.findOne({
    $or: [{ name: "Arab Pro" }, { name: "عرب برو" }, { slug: "arab-pro" }],
  });

  if (!arabPro) {
    // Check if Test workspace exists and rename it
    const testWs = await WorkspaceModel.findOne({ name: "Test" });
    if (testWs) {
      testWs.name = "Arab Pro";
      testWs.slug = "arab-pro";
      arabPro = await testWs.save();
      console.log("Renamed 'Test' workspace to 'Arab Pro'");
    } else {
      arabPro = await WorkspaceModel.create({
        name: "Arab Pro",
        slug: "arab-pro",
        ownerId: adminUser._id,
      });
      console.log("Created 'Arab Pro' workspace");
    }
  } else {
    arabPro.name = "Arab Pro";
    arabPro.slug = "arab-pro";
    await arabPro.save();
  }

  // Ensure Admin is owner in Arab Pro
  await MembershipModel.findOneAndUpdate(
    { workspaceId: arabPro._id, userId: adminUser._id },
    {
      role: "owner",
      status: "active",
      permissions: DEFAULT_ROLE_PERMISSIONS.owner,
    },
    { upsert: true, new: true }
  );

  // Departments for Arab Pro
  const arabProDepartments = [
    { name: "قسم السيلز (Sales)", color: "#10b981", desc: "قسم المبيعات وإدارة العملاء والصفقات" },
    { name: "قسم الميديا والتسويق (Media)", color: "#f59e0b", desc: "قسم التسويق وصناعة المحتوى والتصميم" },
    { name: "قسم البرمجة والتطوير (Development)", color: "#6366f1", desc: "قسم التطوير البرمجي والتقنيات والمواقع" },
    { name: "القسم العام (General Space)", color: "#8b5cf6", desc: "مساحة المهام العامة لشركة عرب برو" },
  ];

  for (const dept of arabProDepartments) {
    let space = await SpaceModel.findOne({
      workspaceId: arabPro._id,
      name: dept.name,
    });

    if (!space) {
      space = await SpaceModel.create({
        workspaceId: arabPro._id,
        name: dept.name,
        description: dept.desc,
        color: dept.color,
        isPrivate: false,
        allowedMembers: [],
      });
      console.log(`Created space '${dept.name}' in Arab Pro`);
    }

    // Ensure 4 standard lists
    const existingLists = await ListModel.find({ spaceId: space._id });
    if (existingLists.length === 0) {
      await ListModel.create([
        { spaceId: space._id, name: "To Do", position: 1000 },
        { spaceId: space._id, name: "In Progress", position: 2000 },
        { spaceId: space._id, name: "Review", position: 3000 },
        { spaceId: space._id, name: "Done", position: 4000 },
      ]);
      console.log(`Created default lists for '${dept.name}'`);
    }
  }

  // 3. Setup Second Company "Madar (مدار)"
  let madar = await WorkspaceModel.findOne({
    $or: [{ name: "Madar" }, { name: "مدار" }, { slug: "madar" }],
  });

  if (!madar) {
    madar = await WorkspaceModel.create({
      name: "Madar",
      slug: "madar",
      ownerId: adminUser._id,
    });
    console.log("Created 'Madar' workspace");
  }

  // Ensure Admin is owner in Madar
  await MembershipModel.findOneAndUpdate(
    { workspaceId: madar._id, userId: adminUser._id },
    {
      role: "owner",
      status: "active",
      permissions: DEFAULT_ROLE_PERMISSIONS.owner,
    },
    { upsert: true, new: true }
  );

  // Departments for Madar
  const madarDepartments = [
    { name: "قسم المبيعات (Sales)", color: "#06b6d4", desc: "فريق مبيعات شركة مدار" },
    { name: "قسم العمليات واللوجستيات (Operations)", color: "#ec4899", desc: "فريق التشغيل والدعم اللوجستي" },
    { name: "القسم العام (General Space)", color: "#8b5cf6", desc: "المهام العامة لشركة مدار" },
  ];

  for (const dept of madarDepartments) {
    let space = await SpaceModel.findOne({
      workspaceId: madar._id,
      name: dept.name,
    });

    if (!space) {
      space = await SpaceModel.create({
        workspaceId: madar._id,
        name: dept.name,
        description: dept.desc,
        color: dept.color,
        isPrivate: false,
        allowedMembers: [],
      });
      console.log(`Created space '${dept.name}' in Madar`);
    }

    const existingLists = await ListModel.find({ spaceId: space._id });
    if (existingLists.length === 0) {
      await ListModel.create([
        { spaceId: space._id, name: "To Do", position: 1000 },
        { spaceId: space._id, name: "In Progress", position: 2000 },
        { spaceId: space._id, name: "Review", position: 3000 },
        { spaceId: space._id, name: "Done", position: 4000 },
      ]);
      console.log(`Created default lists for '${dept.name}' in Madar`);
    }
  }

  console.log("Setup completed successfully!");
  process.exit(0);
}

setup().catch((e) => {
  console.error("Error during setup:", e);
  process.exit(1);
});
