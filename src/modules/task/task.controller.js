import * as taskService from "./task.service.js";

export async function createTask(req, res) {
  try {
    const data = await taskService.createTask(req.user.id, req.body);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message || "Failed to create task" });
  }
}

export async function updateTask(req, res) {
  try {
    const updated = await taskService.updateTask(req.user.id, req.params.taskId, req.body);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message || "Failed to update task" });
  }
}

export async function deleteTask(req, res) {
  try {
    await taskService.deleteTask(req.user.id, req.params.taskId);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message || "Failed to delete task" });
  }
}

export async function listTasks(req, res) {
  try {
    const list = await taskService.listTasks(req.user.id, req.query);
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to list tasks" });
  }
}

export async function memberLoads(req, res) {
  try {
    const loads = await taskService.memberLoadsForProject(req.user.id, req.params.projectId);
    res.json(loads);
  } catch (e) {
    res.status(400).json({ message: e.message || "Failed to get member loads" });
  }
}
