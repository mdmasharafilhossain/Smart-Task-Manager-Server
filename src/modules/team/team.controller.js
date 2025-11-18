import * as teamService from "./team.service.js";

export async function createTeam(req, res) {
  try {
    const doc = await teamService.createTeam(req.user.id, req.body);
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to create team" });
  }
}

export async function addMember(req, res) {
  try {
    const { teamId } = req.params;
    const member = await teamService.addMember(req.user.id, teamId, req.body);
    res.json(member);
  } catch (e) {
    res.status(400).json({ message: e.message || "Failed to add member" });
  }
}

export async function listTeams(req, res) {
  try {
    const teams = await teamService.listTeams(req.user.id);
    res.json(teams);
  } catch (e) {
    res.status(500).json({ message: e.message || "Failed to list teams" });
  }
}
