import * as dashboardService from "./dashboard.service.js";

export async function getDashboard(req, res) {
  try {
    const data = await dashboardService.getDashboard(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to load dashboard" });
  }
}

export async function reassignTasks(req, res) {
  try {
    const moves = await dashboardService.reassignAll(req.user.id);
    res.json({ moves });
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to reassign" });
  }
}
