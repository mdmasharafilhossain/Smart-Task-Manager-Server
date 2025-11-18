import { getActivityCollection, getProjectsCollection, getTasksCollection, getTeamsCollection, initDB } from "../../config/db.js";
await initDB()
const Projects = getProjectsCollection()
const Tasks = getTasksCollection()
const Teams = getTeamsCollection()
const Activity = getActivityCollection()
export async function getDashboard(ownerId) {
  await initDB()
  const projects = await Projects.find({ ownerId }).toArray();
  const projectIds = projects.map(p => p._id.toString());
  const totalProjects = projects.length;
  const totalTasks = await Tasks.countDocuments({ projectId: { $in: projectIds } });

  const teams = await Teams.find({ ownerId }).toArray();
  const teamSummaries = [];
  for (const t of teams) {
    const teamId = t._id.toString();
    const agg = await Tasks.aggregate([
      { $match: { teamId, status: { $in: ["Pending", "In Progress"] } } },
      { $group: { _id: "$assigneeId", count: { $sum: 1 } } }
    ]).toArray();
    const map = Object.fromEntries(agg.map(a => [a._id, a.count]));
    teamSummaries.push({
      teamId,
      teamName: t.name,
      members: t.members.map(m => ({
        memberId: m._id.toString(),
        name: m.name,
        load: map[m._id.toString()] || 0,
        capacity: Number(m.capacity ?? 0)
      }))
    });
  }

  const recentLogs = await Activity.find({}).sort({ createdAt: -1 }).limit(10).toArray();

  return { totalProjects, totalTasks, teams: teamSummaries, recentLogs };
}

async function teamLoadMap(db, team) {
  const teamId = team._id.toString();
  const agg = await Tasks.aggregate([
    { $match: { teamId, status: { $in: ["Pending", "In Progress"] } } },
    { $group: { _id: "$assigneeId", count: { $sum: 1 } } }
  ]).toArray();
  const map = {};
  for (const a of agg) map[a._id] = a.count;
 
  for (const m of team.members) if (map[m._id.toString()] === undefined) map[m._id.toString()] = 0;
  return map;
}

export async function reassignAll(ownerId) {
  await initDB()
  const teams = await Teams.find({ ownerId }).toArray();
  const allMoves = [];

  for (const team of teams) {
    const teamId = team._id.toString();
    const loads = await teamLoadMap(db, team);
    const capMap = Object.fromEntries(team.members.map(m => [m._id.toString(), Number(m.capacity ?? 0)]));

    
    const movable = await Tasks.find({
      teamId,
      status: { $in: ["Pending", "In Progress"] },
      priority: { $in: ["Low", "Medium"] }
    }).sort({ createdAt: 1 }).toArray();

 
    const byAssignee = {};
    for (const t of movable) {
      const aid = t.assigneeId || "null";
      (byAssignee[aid] ||= []).push(t);
    }

    const overloaded = Object.keys(loads).filter(id => loads[id] > capMap[id]);
    for (const overId of overloaded) {
      while (loads[overId] > capMap[overId]) {
        const candidates = Object.keys(loads).filter(id => loads[id] < capMap[id] && id !== overId);
        if (candidates.length === 0) break;
        const list = byAssignee[overId] || [];
        const taskToMove = list.shift();
        if (!taskToMove) break;

        
        let best = null, bestScore = Infinity;
        for (const c of candidates) {
          const ratio = capMap[c] > 0 ? loads[c] / capMap[c] : loads[c] + 100;
          if (ratio < bestScore) { bestScore = ratio; best = c; }
        }
        if (!best) break;

       
        loads[overId]--; loads[best]++;
        await Tasks.updateOne({ _id: taskToMove._id }, { $set: { assigneeId: best } });

        const fromName = team.members.find(m => m._id.toString() === overId)?.name || "Unassigned";
        const toName = team.members.find(m => m._id.toString() === best)?.name || "Unassigned";
        const message = `${new Date().toLocaleTimeString()} — Task "${taskToMove.title}" reassigned from ${fromName} to ${toName}.`;
        const log = { teamId, message, createdAt: new Date(), taskId: taskToMove._id.toString(), fromMemberId: overId, toMemberId: best };
        await Activity.insertOne(log);
        allMoves.push(log);
      }
    }
  }

 
  return allMoves.slice(-5);
}
