
import { ObjectId } from "mongodb";
import { getTeamsCollection, initDB } from "../../config/db";


export async function createTeam(ownerId, { name }) {
await initDB();
const Teams = getTeamsCollection();
  const doc = { name, ownerId, members: [], createdAt: new Date() };
  const r = await Teams.insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

export async function addMember(ownerId, teamId, { name, role, capacity }) {
  await initDB();
  const Teams = getTeamsCollection();
  const team = await Teams.findOne({ _id: new ObjectId(teamId), ownerId });
  if (!team) throw new Error("Team not found");
  const member = { _id: new ObjectId(), name, role: role || "", capacity: Math.max(0, Math.min(5, Number(capacity ?? 3))) };
  await Teams.updateOne({ _id: team._id }, { $push: { members: member } });
  return member;
}

export async function listTeams(ownerId) {
 await initDB();
 const Teams = getTeamsCollection();
  return Teams.find({ ownerId }).toArray();
}
