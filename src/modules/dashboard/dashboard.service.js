import {
  getActivityCollection,
  getProjectsCollection,
  getTasksCollection,
  getTeamsCollection,
  initDB,
} from "../../config/db.js";


await initDB(); 

const Projects = getProjectsCollection();
const Tasks = getTasksCollection();
const Teams = getTeamsCollection();
const Activity = getActivityCollection();

export async function getDashboard(ownerId) {
  await initDB(); 

  const projects = await Projects.find({ ownerId }).toArray();
  const projectIds = projects.map((p) => p._id.toString());
  const totalProjects = projects.length;
  const totalTasks = await Tasks.countDocuments({ projectId: { $in: projectIds } });

  const teams = await Teams.find({ ownerId }).toArray();
  const teamSummaries = [];

  for (const t of teams) {
    const teamId = t._id.toString();
    const agg = await Tasks.aggregate([
      { $match: { teamId, status: { $in: ["Pending", "In Progress"] } } },
      { $group: { _id: "$assigneeId", count: { $sum: 1 } } },
    ]).toArray();

    const map = Object.fromEntries(agg.map((a) => [a._id, a.count]));
    teamSummaries.push({
      teamId,
      ownerId: ownerId,
      teamName: t.name,
      members: t.members.map((m) => ({
        memberId: m._id.toString(),
        name: m.name,
        load: map[m._id.toString()] || 0,
        capacity: Number(m.capacity ?? 0),
      })),
    });
  }

  const recentLogs = await Activity.find({ownerId }).sort({ createdAt: -1 }).limit(10).toArray();

  return { totalProjects, totalTasks, teams: teamSummaries, recentLogs };
}


async function teamLoadMap(team) {
  const teamId = team._id.toString();
  const agg = await Tasks.aggregate([
    { $match: { teamId, status: { $in: ["Pending", "In Progress"] } } },
    { $group: { _id: "$assigneeId", count: { $sum: 1 } } },
  ]).toArray();

  const map = {};
  for (const a of agg) {
 
    map[a._id ?? "null"] = a.count;
  }


  for (const m of team.members) {
    const id = m._id.toString();
    if (map[id] === undefined) map[id] = 0;
  }

  return map;
}

export async function reassignAll(ownerId) {
  await initDB();

  const teams = await Teams.find({ ownerId }).toArray();
  const allMoves = [];

  for (const team of teams) {
    const teamId = team._id.toString();

  
    const loads = await teamLoadMap(team);

 
    const capMap = Object.fromEntries(team.members.map((m) => [m._id.toString(), Number(m.capacity ?? 0)]));

  
    const movable = await Tasks.find({
      teamId,
      status: { $in: ["Pending", "In Progress"] },
      priority: { $in: ["Low", "Medium"] },
    })
      .sort({ createdAt: 1 })
      .toArray();

    const byAssignee = {};
    for (const t of movable) {
      const aid = t.assigneeId ? String(t.assigneeId) : "null";
      (byAssignee[aid] ||= []).push(t);
    }

   
    let overloaded = Object.keys(loads).filter(
  id => id !== "null" && loads[id] > (capMap[id] ?? 0)
);


if (
  overloaded.length === 0 && 
  (loads["null"] ?? 0) > 0 &&
  Object.keys(loads).some(id => id !== "null" && loads[id] < (capMap[id] ?? 0))
) {
  overloaded = ["null"];   
}

    for (const overId of overloaded) {
   
      while (loads[overId] > (capMap[overId] ?? 0)) {
       
        const candidates = Object.keys(loads).filter((id) => id !== "null" && id !== overId && loads[id] < (capMap[id] ?? 0));

        if (candidates.length === 0) break;

        const list = byAssignee[overId] || [];
        const taskToMove = list.shift();
        if (!taskToMove) break; 

     
        let best = null;
        let bestScore = Infinity;
        for (const c of candidates) {
          const cap = capMap[c] ?? 0;
          const ratio = cap > 0 ? loads[c] / cap : loads[c] + 100;
          if (ratio < bestScore) {
            bestScore = ratio;
            best = c;
          }
        }
        if (!best) break;

  
        loads[overId]--;
        loads[best]++;

    
        await Tasks.updateOne({ _id: taskToMove._id }, { $set: { assigneeId: best } });

   
        const fromName = team.members.find((m) => m._id.toString() === overId)?.name || "Unassigned";
        const toName = team.members.find((m) => m._id.toString() === best)?.name || "Unassigned";

        const message = `${new Date().toLocaleTimeString()} — Task "${taskToMove.title}" reassigned from ${fromName} to ${toName}.`;
const fromMemberIdLog = (overId === "null" || overId == null) ? null : String(overId);
        const log = {
          teamId,
          ownerId: ownerId,
          message,
          createdAt: new Date(),
          taskId: String(taskToMove._id),
          fromMemberId: fromMemberIdLog,
          toMemberId: best,
          taskTitle: taskToMove.title,
          fromMember: fromName,
          toMember: toName,
        };

        await Activity.insertOne(log);
        
        allMoves.push(log);
      }
    }
  }

 
  return allMoves.slice(-5);
}

