
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'hrms.sqlite');

async function initDb() {

  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  
  await db.exec('PRAGMA foreign_keys = ON;');

  await db.exec(`
  CREATE TABLE IF NOT EXISTS organisations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organisation_id INTEGER,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(organisation_id) REFERENCES organisations(id) ON DELETE CASCADE,
    UNIQUE(email, organisation_id)
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organisation_id INTEGER,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organisation_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS employee_teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    team_id INTEGER,
    assigned_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY(team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(employee_id, team_id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organisation_id INTEGER,
    user_id INTEGER,
    action TEXT,
    meta TEXT, -- store JSON string
    timestamp TEXT DEFAULT (datetime('now'))
  );
  `);

  return db;
}

module.exports = { initDb };
