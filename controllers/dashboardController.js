
async function getDashboardStats(req, res, db) {
  const orgId = req.user.organisation_id;
  const empCountRow = await db.get(
    `SELECT COUNT(*) AS count FROM employees WHERE organisation_id = ?`,
    [orgId]
  );

  const teamCountRow = await db.get(
    `SELECT COUNT(*) AS count FROM teams WHERE organisation_id = ?`,
    [orgId]
  );

  const deptCount = 0;

  console.log("Dashboard Stats:", {
    employees: empCountRow?.count,
    teams: teamCountRow?.count,
    departments: deptCount,
  });

  return res.json({
    employees: empCountRow.count,
    teams: teamCountRow.count,
    departments: deptCount,
  });
}

module.exports = { getDashboardStats };
