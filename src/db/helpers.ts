import { SQLiteDatabase } from "expo-sqlite";
import {
  ClinicianDraft,
  Entry,
  FeedActivity,
  InsuranceClaim,
  InsuranceClaimDocument,
  InsurancePolicy,
  KickLog,
  Profile,
  Reminder,
  SymptomLog,
} from "@/types";

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

export async function getFeedActivity(db: SQLiteDatabase): Promise<FeedActivity[]> {
  return db.getAllAsync<FeedActivity>("SELECT * FROM feed_activity ORDER BY updated_at DESC");
}

export async function setFeedLike(db: SQLiteDatabase, slug: string, liked: boolean) {
  await db.runAsync(
    `INSERT INTO feed_activity (slug, liked, saved, updated_at)
     VALUES (?, ?, COALESCE((SELECT saved FROM feed_activity WHERE slug = ?), 0), CURRENT_TIMESTAMP)
     ON CONFLICT(slug) DO UPDATE SET
       liked = excluded.liked,
       updated_at = CURRENT_TIMESTAMP`,
    slug,
    liked ? 1 : 0,
    slug
  );
}

export async function setFeedSave(db: SQLiteDatabase, slug: string, saved: boolean) {
  await db.runAsync(
    `INSERT INTO feed_activity (slug, liked, saved, updated_at)
     VALUES (?, COALESCE((SELECT liked FROM feed_activity WHERE slug = ?), 0), ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slug) DO UPDATE SET
       saved = excluded.saved,
       updated_at = CURRENT_TIMESTAMP`,
    slug,
    slug,
    saved ? 1 : 0
  );
}

export async function addSymptomLog(
  db: SQLiteDatabase,
  payload: {
    date: string;
    symptom: string;
    severity: "MILD" | "MODERATE" | "SEVERE";
    notes?: string;
  }
) {
  await db.runAsync(
    "INSERT INTO symptom_logs (date, symptom, severity, notes) VALUES (?, ?, ?, ?)",
    payload.date,
    payload.symptom,
    payload.severity,
    payload.notes?.trim() || null
  );
}

export async function getSymptomLogsByDate(db: SQLiteDatabase, date: string): Promise<SymptomLog[]> {
  return db.getAllAsync<SymptomLog>(
    "SELECT * FROM symptom_logs WHERE date = ? ORDER BY created_at DESC",
    date
  );
}

export async function setKickCount(db: SQLiteDatabase, date: string, kicks: number) {
  await db.runAsync(
    `INSERT INTO kick_logs (date, kicks, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(date) DO UPDATE SET
       kicks = excluded.kicks,
       updated_at = CURRENT_TIMESTAMP`,
    date,
    kicks
  );
}

export async function getKickCount(db: SQLiteDatabase, date: string): Promise<number> {
  const row = await db.getFirstAsync<KickLog>("SELECT * FROM kick_logs WHERE date = ?", date);
  return row?.kicks ?? 0;
}

export async function getClinicianDraft(db: SQLiteDatabase): Promise<ClinicianDraft | null> {
  return db.getFirstAsync<ClinicianDraft>("SELECT * FROM clinician_draft WHERE id = 1");
}

export async function upsertClinicianDraft(
  db: SQLiteDatabase,
  payload: {
    medications: string;
    questions: string;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    temperatureC: number | null;
    glucoseMgDl: number | null;
  }
) {
  await db.runAsync(
    `INSERT INTO clinician_draft
      (id, medications, questions, bp_systolic, bp_diastolic, temperature_c, glucose_mg_dl, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
      medications = excluded.medications,
      questions = excluded.questions,
      bp_systolic = excluded.bp_systolic,
      bp_diastolic = excluded.bp_diastolic,
      temperature_c = excluded.temperature_c,
      glucose_mg_dl = excluded.glucose_mg_dl,
      updated_at = CURRENT_TIMESTAMP`,
    payload.medications.trim() || null,
    payload.questions.trim() || null,
    payload.bpSystolic,
    payload.bpDiastolic,
    payload.temperatureC,
    payload.glucoseMgDl
  );
}

export async function getRecentEntriesForReport(db: SQLiteDatabase, days = 14): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    "SELECT * FROM entries WHERE date >= date('now', ?) ORDER BY date DESC",
    `-${days} day`
  );
}

export async function getRecentSymptomLogs(db: SQLiteDatabase, days = 14): Promise<SymptomLog[]> {
  return db.getAllAsync<SymptomLog>(
    "SELECT * FROM symptom_logs WHERE date >= date('now', ?) ORDER BY date DESC, created_at DESC",
    `-${days} day`
  );
}

export async function getInsurancePolicies(db: SQLiteDatabase): Promise<InsurancePolicy[]> {
  return db.getAllAsync<InsurancePolicy>("SELECT * FROM insurance_policies ORDER BY updated_at DESC");
}

export async function saveInsurancePolicy(
  db: SQLiteDatabase,
  payload: {
    id?: number;
    provider: string;
    policyNumber: string;
    maternityCoveragePercent: number;
    deductible: number | null;
    outOfPocketLimit: number | null;
    maternityCoverLimit: number | null;
    renewalDate: string | null;
  }
) {
  if (payload.id) {
    await db.runAsync(
      `UPDATE insurance_policies SET
        provider = ?,
        policy_number = ?,
        maternity_coverage_percent = ?,
        deductible = ?,
        out_of_pocket_limit = ?,
        maternity_cover_limit = ?,
        renewal_date = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      payload.provider.trim(),
      payload.policyNumber.trim(),
      payload.maternityCoveragePercent,
      payload.deductible,
      payload.outOfPocketLimit,
      payload.maternityCoverLimit,
      payload.renewalDate,
      payload.id
    );
    return;
  }

  await db.runAsync(
    `INSERT INTO insurance_policies
      (provider, policy_number, maternity_coverage_percent, deductible, out_of_pocket_limit, maternity_cover_limit, renewal_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    payload.provider.trim(),
    payload.policyNumber.trim(),
    payload.maternityCoveragePercent,
    payload.deductible,
    payload.outOfPocketLimit,
    payload.maternityCoverLimit,
    payload.renewalDate
  );
}

export async function getInsuranceClaims(db: SQLiteDatabase): Promise<InsuranceClaim[]> {
  return db.getAllAsync<InsuranceClaim>("SELECT * FROM insurance_claims ORDER BY updated_at DESC");
}

export async function saveInsuranceClaim(
  db: SQLiteDatabase,
  payload: {
    id?: number;
    policyId: number | null;
    title: string;
    status: InsuranceClaim["status"];
    estimatedAmount: number | null;
    submissionDeadline: string | null;
    notes: string;
  }
) {
  if (payload.id) {
    await db.runAsync(
      `UPDATE insurance_claims SET
        policy_id = ?,
        title = ?,
        status = ?,
        estimated_amount = ?,
        submission_deadline = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      payload.policyId,
      payload.title.trim(),
      payload.status,
      payload.estimatedAmount,
      payload.submissionDeadline,
      payload.notes.trim() || null,
      payload.id
    );
    return;
  }

  await db.runAsync(
    `INSERT INTO insurance_claims
      (policy_id, title, status, estimated_amount, submission_deadline, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    payload.policyId,
    payload.title.trim(),
    payload.status,
    payload.estimatedAmount,
    payload.submissionDeadline,
    payload.notes.trim() || null
  );
}

export async function getInsuranceClaimDocuments(
  db: SQLiteDatabase,
  claimId: number
): Promise<InsuranceClaimDocument[]> {
  return db.getAllAsync<InsuranceClaimDocument>(
    "SELECT * FROM insurance_claim_documents WHERE claim_id = ? ORDER BY created_at DESC",
    claimId
  );
}

export async function addInsuranceClaimDocument(
  db: SQLiteDatabase,
  payload: {
    claimId: number;
    name: string;
    uri: string;
    mimeType: string | null;
  }
) {
  await db.runAsync(
    `INSERT INTO insurance_claim_documents (claim_id, name, uri, mime_type)
     VALUES (?, ?, ?, ?)`,
    payload.claimId,
    payload.name.trim(),
    payload.uri,
    payload.mimeType
  );
}
