require('dotenv').config();
const m=require('mongoose');
(async()=>{
await m.connect(process.env.MONGODB_URI);
const db=m.connection.db;
const u=await db.collection('users').findOne({email:/ebrahimsalah576/i});
console.log('user',u&&u._id,u&&u.fullName);
const sp=await db.collection('spaces').find({name:/حملات/}).toArray();
console.log('spaces',sp.map(s=>({id:s._id,name:s.name,priv:s.isPrivate,allowed:s.allowedMembers})));
const ms=await db.collection('workspacememberships').find({userId:u._id}).toArray();
console.log('memberships',JSON.stringify(ms.map(x=>({ws:x.workspaceId,role:x.role,status:x.status,allowedSpaces:x.allowedSpaces}))));
for(const s of sp){const t=await db.collection('tasks').find({spaceId:s._id}).toArray();
console.log(s.name,t.map(x=>({title:x.title,assignees:x.assignees,reporter:x.reporterId,deleted:x.deleted,list:x.listId})));}
process.exit(0)})().catch(e=>{console.error(e.message);process.exit(1)});
