
const { writeLog } = require('../utils/logger');

async function listEmployees(req, res, db) {
  const orgId = req.user.organisation_id;
  const employees = await db.all(`SELECT * FROM employees WHERE organisation_id = ? ORDER BY id DESC`, [orgId]);
  
  const empIds = employees.map(e => e.id);
  let teamsMap = {};
  if (empIds.length) {
    const placeholders = empIds.map(() => '?').join(',');
    const rows = await db.all(
      `SELECT et.employee_id, t.id as team_id, t.name as team_name
       FROM employee_teams et
       JOIN teams t ON t.id = et.team_id
       WHERE et.employee_id IN (${placeholders})`, empIds);
    rows.forEach(r => {
      teamsMap[r.employee_id] = teamsMap[r.employee_id] || [];
      teamsMap[r.employee_id].push({ team_id: r.team_id, team_name: r.team_name });
    });
  }
  const payload = employees.map(e => ({ ...e, teams: teamsMap[e.id] || [] }));
  res.json(payload);
}

async function createEmployee(req, res, db) {
  const orgId = req.user.organisation_id;
  const { first_name, last_name, email, phone } = req.body;
  const stmt = await db.prepare(`INSERT INTO employees (organisation_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?)`);
  const result = await stmt.run(orgId, first_name, last_name, email, phone);
  await stmt.finalize();
  const employeeId = result.lastID;

  await writeLog(db, {
    organisation_id: orgId,
    user_id: req.user.id,
    action: 'employee_created',
    meta: { employeeId, first_name, last_name, email, phone }
  });

  const emp = await db.get(`SELECT * FROM employees WHERE id = ?`, [employeeId]);
  res.status(201).json(emp);
}

async function getEmployee(req, res, db) {
  const orgId = req.user.organisation_id;
  const id = req.params.id;
  const emp = await db.get(`SELECT * FROM employees WHERE id = ? AND organisation_id = ?`, [id, orgId]);
  if (!emp) return res.status(404).json({ error: 'not found' });

  const teams = await db.all(
    `SELECT t.id, t.name FROM employee_teams et JOIN teams t ON t.id = et.team_id WHERE et.employee_id = ?`, [id]);
  emp.teams = teams;
  res.json(emp);
}

async function updateEmployee(req, res, db) {
  const orgId = req.user.organisation_id;
  const id = req.params.id;
  const { first_name, last_name, email, phone } = req.body;

  const existing = await db.get(`SELECT * FROM employees WHERE id = ? AND organisation_id = ?`, [id, orgId]);
  if (!existing) return res.status(404).json({ error: 'not found' });

  const stmt = await db.prepare(`UPDATE employees SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE id = ? AND organisation_id = ?`);
  await stmt.run(first_name, last_name, email, phone, id, orgId);
  await stmt.finalize();

  await writeLog(db, {
    organisation_id: orgId,
    user_id: req.user.id,
    action: 'employee_updated',
    meta: { employeeId: Number(id), before: existing, after: { first_name, last_name, email, phone } }
  });

  const emp = await db.get(`SELECT * FROM employees WHERE id = ?`, [id]);
  res.json(emp);
}

async function deleteEmployee(req, res, db) {
  const orgId = req.user.organisation_id;
  const id = req.params.id;
  const existing = await db.get(`SELECT * FROM employees WHERE id = ? AND organisation_id = ?`, [id, orgId]);
  if (!existing) return res.status(404).json({ error: 'not found' });

  
  const stmt = await db.prepare(`DELETE FROM employees WHERE id = ? AND organisation_id = ?`);
  await stmt.run(id, orgId);
  await stmt.finalize();

  await writeLog(db, {
    organisation_id: orgId,
    user_id: req.user.id,
    action: 'employee_deleted',
    meta: { employeeId: Number(id), employee: existing }
  });

  res.json({ ok: true });
}

module.exports = { listEmployees, createEmployee, getEmployee, updateEmployee, deleteEmployee };
