async function writeLog(db, { organisation_id = null, user_id = null, action = '', meta = {} } = {}) {
  const metaStr = JSON.stringify(meta || {});
  const stmt = await db.prepare(`INSERT INTO logs (organisation_id, user_id, action, meta) VALUES (?, ?, ?, ?)`);
  await stmt.run(organisation_id, user_id, action, metaStr);
  await stmt.finalize();
}

module.exports = { writeLog };
