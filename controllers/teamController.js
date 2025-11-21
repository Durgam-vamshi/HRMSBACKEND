const { writeLog } = require('../utils/logger');

async function listTeams(req, res, db) {
  const orgId = req.user.organisation_id;
  const teams = await db.all(`SELECT * FROM teams WHERE organisation_id = ? ORDER BY id DESC`, [orgId]);

  for (const t of teams) {
    const members = await db.all(
      `SELECT e.id, e.first_name, e.last_name, e.email FROM employee_teams et JOIN employees e ON e.id = et.employee_id WHERE et.team_id = ?`, [t.id]);
    t.members = members;
    t.member_count = members.length;
  }
  res.json(teams);
}

async function createTeam(req, res, db) {
  const orgId = req.user.organisation_id;
  const { name, description } = req.body;
  const stmt = await db.prepare(`INSERT INTO teams (organisation_id, name, description) VALUES (?, ?, ?)`);
  const result = await stmt.run(orgId, name, description || null);
  await stmt.finalize();
  const teamId = result.lastID;

  await writeLog(db, {
    organisation_id: orgId,
    user_id: req.user.id,
    action: 'team_created',
    meta: { teamId, name, description }
  });

  const team = await db.get(`SELECT * FROM teams WHERE id = ?`, [teamId]);
  res.status(201).json(team);
}

async function getTeam(req, res, db) {
  const orgId = req.user.organisation_id;
  const id = req.params.id;
  const team = await db.get(`SELECT * FROM teams WHERE id = ? AND organisation_id = ?`, [id, orgId]);
  if (!team) return res.status(404).json({ error: 'not found' });

  const members = await db.all(
    `SELECT e.id, e.first_name, e.last_name FROM employee_teams et JOIN employees e ON e.id = et.employee_id WHERE et.team_id = ?`, [id]);
  team.members = members;
  res.json(team);
}

async function updateTeam(req, res, db) {
  const orgId = req.user.organisation_id;
  const id = req.params.id;
  const { name, description } = req.body;
  const existing = await db.get(`SELECT * FROM teams WHERE id = ? AND organisation_id = ?`, [id, orgId]);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const stmt = await db.prepare(`UPDATE teams SET name = ?, description = ? WHERE id = ? AND organisation_id = ?`);
  await stmt.run(name, description, id, orgId);
  await stmt.finalize();

  await writeLog(db, {
    organisation_id: orgId,
    user_id: req.user.id,
    action: 'team_updated',
    meta: { teamId: Number(id), before: existing, after: { name, description } }
  });

  const team = await db.get(`SELECT * FROM teams WHERE id = ?`, [id]);
  res.json(team);
}

async function deleteTeam(req, res, db) {
  const orgId = req.user.organisation_id;
  const id = req.params.id;
  const existing = await db.get(`SELECT * FROM teams WHERE id = ? AND organisation_id = ?`, [id, orgId]);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const stmt = await db.prepare(`DELETE FROM teams WHERE id = ? AND organisation_id = ?`);
  await stmt.run(id, orgId);
  await stmt.finalize();

  await writeLog(db, {
    organisation_id: orgId,
    user_id: req.user.id,
    action: 'team_deleted',
    meta: { teamId: Number(id), team: existing }
  });

  res.json({ ok: true });
}


async function assignToTeam(req, res, db) {
  const orgId = req.user.organisation_id;
  const teamId = req.params.teamId;
  const { employeeId, employeeIds } = req.body;
  const ids = employeeIds && Array.isArray(employeeIds) ? employeeIds : employeeId ? [employeeId] : [];


  const team = await db.get(`SELECT * FROM teams WHERE id = ? AND organisation_id = ?`, [teamId, orgId]);
  if (!team) return res.status(404).json({ error: 'team not found' });


  const assigned = [];
  for (const id of ids) {
    const emp = await db.get(`SELECT * FROM employees WHERE id = ? AND organisation_id = ?`, [id, orgId]);
    if (!emp) continue;
    try {
      const stmt = await db.prepare(`INSERT OR IGNORE INTO employee_teams (employee_id, team_id) VALUES (?, ?)`);
      await stmt.run(id, teamId);
      await stmt.finalize();
      assigned.push(id);

      await writeLog(db, {
        organisation_id: orgId,
        user_id: req.user.id,
        action: 'employee_assigned_to_team',
        meta: { employeeId: Number(id), teamId: Number(teamId) }
      });
    } catch (err) {
      // ignore duplicates, others bubble up
    }
  }

  res.json({ assigned });
}


async function unassignFromTeam(req, res, db) {
  const orgId = req.user.organisation_id;
  const teamId = req.params.teamId;
  const { employeeId } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

  
  const emp = await db.get(`SELECT * FROM employees WHERE id = ? AND organisation_id = ?`, [employeeId, orgId]);
  if (!emp) return res.status(404).json({ error: 'employee not found' });

 
  const team = await db.get(`SELECT * FROM teams WHERE id = ? AND organisation_id = ?`, [teamId, orgId]);
  if (!team) return res.status(404).json({ error: 'team not found' });

  const stmt = await db.prepare(`DELETE FROM employee_teams WHERE employee_id = ? AND team_id = ?`);
  await stmt.run(employeeId, teamId);
  await stmt.finalize();

  await writeLog(db, {
    organisation_id: orgId,
    user_id: req.user.id,
    action: 'employee_unassigned_from_team',
    meta: { employeeId: Number(employeeId), teamId: Number(teamId) }
  });

  res.json({ ok: true });
}

module.exports = {
  listTeams, createTeam, getTeam, updateTeam, deleteTeam, assignToTeam, unassignFromTeam
};
