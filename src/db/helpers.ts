import { SQLiteDatabase } from "expo-sqlite";
import { Entry, Profile, Reminder } from "@/types";

export async function getProfile(db: SQLiteDatabase): Promise<Profile | null> {
  return db.getFirstAsync<Profile>("SELECT * FROM profile ORDER BY id DESC LIMIT 1");
}

export async function saveProfile(
  db: SQLiteDatabase,
  payload: {
    name: string;
    dueDate: string;
    bloodType?: string;
    doctorName?: string;
    doctorPhone?: string;
    preferredVoice?: string;
  }
) {
  const existing = await getProfile(db);
  if (!existing) {
    await db.runAsync(
      `INSERT INTO profile (name, due_date, blood_type, doctor_name, doctor_phone, preferred_voice)
       VALUES (?, ?, ?, ?, ?, ?)`,
      payload.name,
      payload.dueDate,
      payload.bloodType ?? null,
      payload.doctorName ?? null,
      payload.doctorPhone ?? null,
      payload.preferredVoice ?? null
    );
    return;
  }

  await db.runAsync(
    `UPDATE profile SET
      name = ?,
      due_date = ?,
      blood_type = ?,
      doctor_name = ?,
      doctor_phone = ?,
      preferred_voice = ?
     WHERE id = ?`,
    payload.name,
    payload.dueDate,
    payload.bloodType ?? null,
    payload.doctorName ?? null,
    payload.doctorPhone ?? null,
    payload.preferredVoice ?? null,
    existing.id
  );
}

export async function upsertEntry(
  db: SQLiteDatabase,
  entry: {
    date: string;
    mood: string;
    energy: number;
    symptoms: string[];
    notes: string;
    waterGlasses: number;
    weight: number | null;
  }
) {
  await db.runAsync(
    `INSERT INTO entries (date, mood, energy, symptoms, notes, water_glasses, weight)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       mood = excluded.mood,
       energy = excluded.energy,
       symptoms = excluded.symptoms,
       notes = excluded.notes,
       water_glasses = excluded.water_glasses,
       weight = excluded.weight`,
    entry.date,
    entry.mood,
    entry.energy,
    JSON.stringify(entry.symptoms),
    entry.notes,
    entry.waterGlasses,
    entry.weight
  );
}

export async function getEntries(db: SQLiteDatabase): Promise<Entry[]> {
  return db.getAllAsync<Entry>("SELECT * FROM entries ORDER BY date DESC");
}

export async function getTodayEntry(db: SQLiteDatabase, date: string): Promise<Entry | null> {
  return db.getFirstAsync<Entry>("SELECT * FROM entries WHERE date = ?", date);
}

export async function getReminders(db: SQLiteDatabase): Promise<Reminder[]> {
  return db.getAllAsync<Reminder>("SELECT * FROM reminders ORDER BY remind_at ASC");
}

export async function saveReminder(
  db: SQLiteDatabase,
  payload: { id?: number; title: string; remindAt: string; repeat: "none" | "daily" | "weekly" }
) {
  if (payload.id) {
    await db.runAsync(
      "UPDATE reminders SET title = ?, remind_at = ?, repeat = ? WHERE id = ?",
      payload.title,
      payload.remindAt,
      payload.repeat,
      payload.id
    );
    return;
  }

  await db.runAsync(
    "INSERT INTO reminders (title, remind_at, repeat) VALUES (?, ?, ?)",
    payload.title,
    payload.remindAt,
    payload.repeat
  );
}

export async function deleteReminder(db: SQLiteDatabase, id: number) {
  await db.runAsync("DELETE FROM reminders WHERE id = ?", id);
}

export async function addSession(db: SQLiteDatabase, payload: { date: string; posesCompleted: string[]; durationSeconds: number }) {
  await db.runAsync(
    "INSERT INTO sessions (date, poses_completed, duration_seconds) VALUES (?, ?, ?)",
    payload.date,
    JSON.stringify(payload.posesCompleted),
    payload.durationSeconds
  );
}

export async function getWeeklyStreak(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ streak: number }>(
    `SELECT COUNT(DISTINCT date) as streak
     FROM sessions
     WHERE date >= date('now', '-6 day')`
  );
  return result?.streak ?? 0;
}

export async function getStats(db: SQLiteDatabase) {
  const entries = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM entries");
  const tracked = await db.getFirstAsync<{ days: number }>("SELECT COUNT(DISTINCT date) as days FROM entries");

  const streak = await db.getFirstAsync<{ streak: number }>(
    `WITH ordered AS (
      SELECT date,
             julianday(date) - ROW_NUMBER() OVER (ORDER BY date) AS grp
      FROM (SELECT DISTINCT date FROM entries)
    )
    SELECT COALESCE(MAX(cnt), 0) as streak
    FROM (SELECT COUNT(*) as cnt FROM ordered GROUP BY grp)`
  );

  return {
    entriesCount: entries?.count ?? 0,
    daysTracked: tracked?.days ?? 0,
    currentStreak: streak?.streak ?? 0
  };
}

export async function getCachedAffirmation(db: SQLiteDatabase, date: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ text: string }>("SELECT text FROM affirmations WHERE date = ?", date);
  return row?.text ?? null;
}

export async function cacheAffirmation(db: SQLiteDatabase, date: string, text: string) {
  await db.runAsync(
    `INSERT INTO affirmations (date, text) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET text = excluded.text`,
    date,
    text
  );
}
