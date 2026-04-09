import { SQLiteDatabase } from "expo-sqlite";

export async function initDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      due_date TEXT NOT NULL,
      blood_type TEXT,
      doctor_name TEXT,
      doctor_phone TEXT,
      preferred_voice TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      mood TEXT NOT NULL,
      energy INTEGER NOT NULL,
      symptoms TEXT NOT NULL,
      notes TEXT,
      water_glasses INTEGER NOT NULL,
      weight REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      repeat TEXT NOT NULL DEFAULT 'none',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      poses_completed TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS affirmations (
      date TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
