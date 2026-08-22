const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;
console.log('Connecting to Mongo URI:', mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected!');
    
    // Import schema definition
    require('../dist/modules/task/task.model');
    const TaskModel = mongoose.model('Task');
    console.log('TaskModel retrieved from mongoose registry');
    
    try {
      const doc = await TaskModel.create({
        workspaceId: new mongoose.Types.ObjectId("6a81f0b43326b34e7305d6a2"),
        spaceId: new mongoose.Types.ObjectId("6a81f0b53326b34e7305d6a4"),
        listId: new mongoose.Types.ObjectId("6a81f0b53326b34e7305d6a5"),
        title: "Test Task",
        description: "Test description",
        status: "to-do",
        priority: "medium",
        reporterId: new mongoose.Types.ObjectId("6a81f0b43326b34e7305d6a1"),
        assignees: [new mongoose.Types.ObjectId("6a81f0b43326b34e7305d6a1")],
        clientProjectId: new mongoose.Types.ObjectId("6a81f0b43326b34e7305d6a2"),
        projectName: "Test service",
        notes: "Test notes",
        dueDate: new Date(),
        statusHistory: [{
          status: "to-do",
          enteredAt: new Date()
        }]
      });
      console.log('Success creating task directly:', doc._id);
    } catch (err) {
      console.error('Error creating task directly:', err);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
