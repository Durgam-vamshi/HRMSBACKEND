
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { writeLog } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '8h';
const SALT_ROUNDS = 10;

async function register(req, res, db) {
  const { orgName, adminName, email, password } = req.body;
  if (!orgName || !email || !password) return res.status(400).json({ error: 'orgName, email and password required' });


  const createOrgStmt = await db.prepare(`INSERT INTO organisations (name) VALUES (?)`);
  const orgResult = await createOrgStmt.run(orgName);
  await createOrgStmt.finalize();
  const orgId = orgResult.lastID;

  
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const createUserStmt = await db.prepare(`INSERT INTO users (organisation_id, email, password_hash, name) VALUES (?, ?, ?, ?)`);
  const userResult = await createUserStmt.run(orgId, email, password_hash, adminName || null);
  await createUserStmt.finalize();
  const userId = userResult.lastID;


  await writeLog(db, {
    organisation_id: orgId,
    user_id: userId,
    action: 'organisation_created',
    meta: { orgName, userId }
  });


  const token = jwt.sign({ userId, orgId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token, user: { id: userId, email, name: adminName, organisation_id: orgId } });
}

async function login(req, res, db) {
  const { orgId, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  
  const row = await db.get(`SELECT * FROM users WHERE email = ? ${orgId ? 'AND organisation_id = ?' : ''}`, orgId ? [email, orgId] : [email]);
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: row.id, orgId: row.organisation_id, email: row.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  await writeLog(db, {
    organisation_id: row.organisation_id,
    user_id: row.id,
    action: 'user_logged_in',
    meta: { email: row.email }
  });

  res.json({ token, user: { id: row.id, email: row.email, name: row.name, organisation_id: row.organisation_id } });
}

async function logout(req, res, db) {
  const user = req.user;
  await writeLog(db, {
    organisation_id: user.organisation_id,
    user_id: user.id,
    action: 'user_logged_out',
    meta: {}
  });
  res.json({ ok: true });
}

module.exports = { register, login, logout};
