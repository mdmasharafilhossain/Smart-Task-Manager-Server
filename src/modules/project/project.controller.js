import * as projectService from "./project.service.js";

export async function createProject(req, res) {
  try {
    const doc = await projectService.createProject(req.user.id, req.body);
    res.json(doc);
  } catch (e) {
    res.status(400).json({ message: e.message || "Failed to create project" });
  }
}

export async function listProjects(req, res) {
  try {
    const projects = await projectService.listProjects(req.user.id);
    res.json(projects);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to list projects" });
  }
}
