import { ObjectId } from "mongodb";
import { getProjectsCollection, getTasksCollection, getTeamsCollection, initDB } from "../../config/db.js";


export async function getProjectAndTeam(ownerId, projectId) {
 await initDB();
 const Projects = getProjectsCollection()
 const Teams = getTeamsCollection()
  const project = await Projects.findOne({ _id: new ObjectId(projectId), ownerId });
  if (!project) return null;
  const team = await Teams.findOne({ _id: new ObjectId(project.teamId), ownerId });
  if (!team) return null;
  return { project, team };
}

export async function createTask(ownerId, payload) {
 await initDB();

 const Tasks = getTasksCollection()
  const { projectId, title, description, assigneeId, priority, status, autoAssign } = payload;
  if (!projectId || !title) throw new Error("projectId and title required");
  const pack = await getProjectAndTeam(ownerId, projectId);
  if (!pack) throw new Error("Project or team not found");
  const { project, team } = pack;


  let finalAssignee = assigneeId || null;
  if (autoAssign) {
    
    const loadsAgg = await Tasks.aggregate([
      { $match: { teamId: team._id.toString(), status: { $in: ["Pending", "In Progress"] } } },
      { $group: { _id: "$assigneeId", count: { $sum: 1 } } }
    ]).toArray();
    const loads = Object.fromEntries(loadsAgg.map(a => [a._id, a.count]));
    let best = null, bestScore = Infinity;
    for (const m of team.members) {
      const id = m._id.toString();
      const load = loads[id] || 0;
      const cap = Math.max(0, Number(m.capacity ?? 0));
      const ratio = cap > 0 ? load / cap : load + 100;
      const score = ratio + load * 0.01;
      if (score < bestScore) { bestScore = score; best = id; }
    }
    finalAssignee = best;
  }

  const doc = {
    projectId: project._id.toString(),
    teamId: team._id.toString(),
    title,
    description: description || "",
    assigneeId: finalAssignee || null,
    priority: ["Low", "Medium", "High"].includes(priority) ? priority : "Medium",
    status: ["Pending", "In Progress", "Done"].includes(status) ? status : "Pending",
    createdAt: new Date()
  };
  const r = await Tasks.insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

export async function updateTask(ownerId, taskId, updates) {
  await initDB();
  const Tasks = getTasksCollection()
  const Projects = getProjectsCollection()
  const task = await Tasks.findOne({ _id: new ObjectId(taskId) });
  if (!task) throw new Error("Task not found");
  const project = await Projects.findOne({ _id: new ObjectId(task.projectId), ownerId });
  if (!project) throw new Error("Forbidden");
  const allowed = ["title", "description", "assigneeId", "priority", "status"];
  const $set = {};
  for (const k of allowed) if (k in updates) $set[k] = updates[k];
  await Tasks.updateOne({ _id: task._id }, { $set });
  return Tasks.findOne({ _id: task._id });
}

export async function deleteTask(ownerId, taskId) {
  await initDB();
  const Tasks = getTasksCollection()
  const Projects = getProjectsCollection()
  const task = await Tasks.findOne({ _id: new ObjectId(taskId) });
  if (!task) throw new Error("Task not found");
  const project = await Projects.findOne({ _id: new ObjectId(task.projectId), ownerId });
  if (!project) throw new Error("Forbidden");
  await Tasks.deleteOne({ _id: task._id });
  return true;
}

export async function listTasks(ownerId, { projectId, assigneeId }) {
 await initDB();
  const Tasks = getTasksCollection()
 const Projects = getProjectsCollection()
  const projects = await Projects.find({ ownerId }).toArray();
  const projectIds = new Set(projects.map(p => p._id.toString()));

  const query = {};
  if (projectId) {
    if (!projectIds.has(projectId)) return [];
    query.projectId = projectId;
  } else {
    query.projectId = { $in: [...projectIds] };
    
  }
  if (assigneeId === "Unassigned") query.assigneeId = null;
  else if (assigneeId) query.assigneeId = assigneeId;

  return Tasks.find(query).sort({ createdAt: -1 }).toArray();
}

export async function memberLoadsForProject(ownerId, projectId) {
  const pack = await getProjectAndTeam(ownerId, projectId);
  if (!pack) throw new Error("Project or team not found");
  const { team } = pack;
   await initDB();
   const Tasks = getTasksCollection()
 
  const agg = await Tasks.aggregate([
    { $match: { teamId: team._id.toString(), status: { $in: ["Pending", "In Progress"] } } },
    { $group: { _id: "$assigneeId", count: { $sum: 1 } } }
  ]).toArray();
  const map = Object.fromEntries(agg.map(a => [a._id, a.count]));
  return team.members.map(m => ({ memberId: m._id.toString(), name: m.name, capacity: Number(m.capacity ?? 0), load: map[m._id.toString()] || 0 }));
}
