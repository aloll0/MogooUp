const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const TaskSchema = new mongoose.Schema({}, { strict: false });
const Task = mongoose.model('Task', TaskSchema, 'tasks');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("DB Connected.");

  const tasks = await Task.find({});
  console.log("Tasks in Database:");
  tasks.forEach(t => {
    console.log({
      id: t._id,
      title: t.title,
      workspaceId: t.workspaceId,
      listId: t.listId,
      creatorId: t.creatorId
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
