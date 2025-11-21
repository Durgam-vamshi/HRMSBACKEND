
async function getLogs(req, res, db) {
  const orgId = req.user.organisation_id;
 
  const { user_id, action, from, to, limit = 200 } = req.query;

  let sql = `SELECT * FROM logs WHERE organisation_id = ?`;
  const params = [orgId];

  if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
  if (action) { sql += ' AND action = ?'; params.push(action); }
  if (from) { sql += ' AND timestamp >= ?'; params.push(from); } 
  if (to) { sql += ' AND timestamp <= ?'; params.push(to); }

  sql += ' ORDER BY id DESC LIMIT ?';
  params.push(Number(limit) || 200);

  const rows = await db.all(sql, params);
  rows.forEach(r => {
    try { r.meta = JSON.parse(r.meta || '{}'); } catch (e) { r.meta = r.meta; }
  });
  res.json(rows);
}

module.exports = { getLogs };
