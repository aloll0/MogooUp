require('dotenv').config();
const m=require('mongoose');
(async()=>{await m.connect(process.env.MONGODB_URI);const db=m.connection.db;
console.log('total',await db.collection('tasks').countDocuments(),'withAssignees',await db.collection('tasks').countDocuments({'assignees.0':{$exists:true}}));
const a=await db.collection('activities').find({}).sort({_id:-1}).limit(8).toArray();
console.log(JSON.stringify(a.map(x=>({act:x.action||x.type,d:x.details||x.changes||x.message}))).slice(0,1500));
process.exit(0)})()
