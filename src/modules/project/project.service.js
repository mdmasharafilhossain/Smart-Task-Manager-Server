import { ObjectId } from "mongodb";
import { getProjectsCollection, getTeamsCollection, initDB } from "../../config/db";


export async function createProject(ownerId, { name, teamId }) {
 await initDB();
 const Teams = getTeamsCollection()
 const Projects = getProjectsCollection()
  const team = await Teams.findOne({ _id: new ObjectId(teamId), ownerId });
  if (!team) throw new Error("Team not found");
  const doc = { name, teamId: team._id.toString(), ownerId, createdAt: new Date() };
  const r = await Projects.insertOne(doc);
  return { ...doc, _id: r.insertedId };
}

export async function listProjects(ownerId) {
  await initDB();
  const Projects = getProjectsCollection()
  return Projects.find({ ownerId }).toArray();
}
