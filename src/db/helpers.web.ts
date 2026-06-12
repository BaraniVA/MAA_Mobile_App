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
  SessionLog,
  SymptomLog,
} from "@/types";
import { isValidProfileName, parseDueDateInput } from "@/services/date";

type WebDatabase = Record<string, never>;

type WebStore = {
  profile: Profile | null;
  entries: Entry[];
  reminders: Reminder[];
  sessions: SessionLog[];
  affirmations: Record<string, string>;
  feedActivity: FeedActivity[];
  symptomLogs: SymptomLog[];
  kickLogs: KickLog[];
  clinicianDraft: ClinicianDraft | null;
  insurancePolicies: InsurancePolicy[];
  insuranceClaims: InsuranceClaim[];
  insuranceClaimDocuments: InsuranceClaimDocument[];
};

const STORAGE_KEY = "maa:web-store";

const defaultStore: WebStore = {
  profile: null,
  entries: [],
  reminders: [],
  sessions: [],
  affirmations: {},
  feedActivity: [],
  symptomLogs: [],
  kickLogs: [],
  clinicianDraft: null,
  insurancePolicies: [],
  insuranceClaims: [],
  insuranceClaimDocuments: []
};

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function cloneStore(store: WebStore): WebStore {
  return {
    profile: store.profile ? { ...store.profile } : null,
    entries: store.entries.map((item) => ({ ...item })),
    reminders: store.reminders.map((item) => ({ ...item })),
    sessions: store.sessions.map((item) => ({ ...item })),
    affirmations: { ...store.affirmations },
    feedActivity: store.feedActivity.map((item) => ({ ...item })),
    symptomLogs: store.symptomLogs.map((item) => ({ ...item })),
    kickLogs: store.kickLogs.map((item) => ({ ...item })),
    clinicianDraft: store.clinicianDraft ? { ...store.clinicianDraft } : null,
    insurancePolicies: store.insurancePolicies.map((item) => ({ ...item })),
    insuranceClaims: store.insuranceClaims.map((item) => ({ ...item })),
    insuranceClaimDocuments: store.insuranceClaimDocuments.map((item) => ({ ...item }))
  };
}

function readStore(): WebStore {
  const storage = getStorage();
  if (!storage) {
    return cloneStore(defaultStore);
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneStore(defaultStore);
    }

    const parsed = JSON.parse(raw) as Partial<WebStore>;
    return {
      profile: parsed.profile ?? null,
      entries: parsed.entries ?? [],
      reminders: parsed.reminders ?? [],
      sessions: parsed.sessions ?? [],
      affirmations: parsed.affirmations ?? {},
      feedActivity: parsed.feedActivity ?? [],
      symptomLogs: parsed.symptomLogs ?? [],
      kickLogs: parsed.kickLogs ?? [],
      clinicianDraft: parsed.clinicianDraft ?? null,
      insurancePolicies: parsed.insurancePolicies ?? [],
      insuranceClaims: parsed.insuranceClaims ?? [],
      insuranceClaimDocuments: parsed.insuranceClaimDocuments ?? []
    };
  } catch {
    return cloneStore(defaultStore);
  }
}

function writeStore(store: WebStore) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function updateStore(mutator: (store: WebStore) => void) {
  const store = readStore();
  mutator(store);
  writeStore(store);
}

function nextId<T extends { id: number }>(items: T[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function now() {
  return new Date().toISOString();
}

function normalizeDateRangeCutoff(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

function sortByDateDesc<T extends { date: string }>(items: T[]) {
  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

function sortByUpdatedAtDesc<T extends { updated_at?: string; created_at?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftStamp = left.updated_at ?? left.created_at ?? "";
    const rightStamp = right.updated_at ?? right.created_at ?? "";
    return rightStamp.localeCompare(leftStamp);
  });
}

function calculateStreak(dates: string[]) {
  const uniqueDates = [...new Set(dates)].sort();
  if (uniqueDates.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let index = uniqueDates.length - 1; index > 0; index -= 1) {
    const current = new Date(`${uniqueDates[index]}T00:00:00`);
    const previous = new Date(`${uniqueDates[index - 1]}T00:00:00`);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / 86400000);
    if (diffDays !== 1) {
      break;
    }
    streak += 1;
  }

  return streak;
}

export async function getProfile(_: WebDatabase): Promise<Profile | null> {
  return readStore().profile;
}

export async function saveProfile(
  _: WebDatabase,
  payload: {
    name: string;
    dueDate: string;
    bloodType?: string;
    doctorName?: string;
    doctorPhone?: string;
    preferredVoice?: string;
  }
) {
  if (!isValidProfileName(payload.name)) {
    throw new Error("Invalid profile name.");
  }

  if (!parseDueDateInput(payload.dueDate)) {
    throw new Error("Invalid due date.");
  }

  updateStore((store) => {
    const current = store.profile;
    const nextProfile: Profile = {
      id: current?.id ?? 1,
      name: payload.name.trim(),
      due_date: payload.dueDate.trim(),
      blood_type: payload.bloodType ?? null,
      doctor_name: payload.doctorName ?? null,
      doctor_phone: payload.doctorPhone ?? null,
      preferred_voice: payload.preferredVoice ?? null,
      created_at: current?.created_at ?? now()
    };

    store.profile = nextProfile;
  });
}

export async function upsertEntry(
  _: WebDatabase,
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
  updateStore((store) => {
    const current = store.entries.find((item) => item.date === entry.date);
    const nextEntry: Entry = {
      id: current?.id ?? nextId(store.entries),
      date: entry.date,
      mood: entry.mood,
      energy: entry.energy,
      symptoms: JSON.stringify(entry.symptoms),
      notes: entry.notes,
      water_glasses: entry.waterGlasses,
      weight: entry.weight,
      created_at: current?.created_at ?? now()
    };

    store.entries = store.entries.filter((item) => item.date !== entry.date);
    store.entries.push(nextEntry);
  });
}

export async function getEntries(_: WebDatabase): Promise<Entry[]> {
  return sortByDateDesc(readStore().entries);
}

export async function getTodayEntry(_: WebDatabase, date: string): Promise<Entry | null> {
  return readStore().entries.find((item) => item.date === date) ?? null;
}

export async function getReminders(_: WebDatabase): Promise<Reminder[]> {
  return sortByUpdatedAtDesc(readStore().reminders);
}

export async function saveReminder(
  _: WebDatabase,
  payload: { id?: number; title: string; remindAt: string; repeat: "none" | "daily" | "weekly" }
) {
  updateStore((store) => {
    const existing = payload.id ? store.reminders.find((item) => item.id === payload.id) : undefined;
    const nextReminder: Reminder = {
      id: existing?.id ?? payload.id ?? nextId(store.reminders),
      title: payload.title,
      remind_at: payload.remindAt,
      repeat: payload.repeat,
      created_at: existing?.created_at ?? now()
    };

    store.reminders = store.reminders.filter((item) => item.id !== nextReminder.id);
    store.reminders.push(nextReminder);
  });
}

export async function deleteReminder(_: WebDatabase, id: number) {
  updateStore((store) => {
    store.reminders = store.reminders.filter((item) => item.id !== id);
  });
}

export async function addSession(_: WebDatabase, payload: { date: string; posesCompleted: string[]; durationSeconds: number }) {
  updateStore((store) => {
    store.sessions.push({
      id: nextId(store.sessions),
      date: payload.date,
      poses_completed: JSON.stringify(payload.posesCompleted),
      duration_seconds: payload.durationSeconds,
      created_at: now()
    });
  });
}

export async function getWeeklyStreak(_: WebDatabase): Promise<number> {
  const cutoff = normalizeDateRangeCutoff(6);
  const dates = readStore().sessions.filter((item) => item.date >= cutoff).map((item) => item.date);
  return new Set(dates).size;
}

export async function getStats(_: WebDatabase) {
  const entries = readStore().entries;
  const trackedDates = new Set(entries.map((entry) => entry.date));

  return {
    entriesCount: entries.length,
    daysTracked: trackedDates.size,
    currentStreak: calculateStreak([...trackedDates])
  };
}

export async function getCachedAffirmation(_: WebDatabase, date: string): Promise<string | null> {
  return readStore().affirmations[date] ?? null;
}

export async function cacheAffirmation(_: WebDatabase, date: string, text: string) {
  updateStore((store) => {
    store.affirmations[date] = text;
  });
}

export async function getFeedActivity(_: WebDatabase): Promise<FeedActivity[]> {
  return sortByUpdatedAtDesc(readStore().feedActivity);
}

export async function setFeedLike(_: WebDatabase, slug: string, liked: boolean) {
  updateStore((store) => {
    const existing = store.feedActivity.find((item) => item.slug === slug);
    const saved = existing?.saved ?? 0;
    store.feedActivity = store.feedActivity.filter((item) => item.slug !== slug);
    store.feedActivity.push({
      slug,
      liked: liked ? 1 : 0,
      saved,
      updated_at: now()
    });
  });
}

export async function setFeedSave(_: WebDatabase, slug: string, saved: boolean) {
  updateStore((store) => {
    const existing = store.feedActivity.find((item) => item.slug === slug);
    const liked = existing?.liked ?? 0;
    store.feedActivity = store.feedActivity.filter((item) => item.slug !== slug);
    store.feedActivity.push({
      slug,
      liked,
      saved: saved ? 1 : 0,
      updated_at: now()
    });
  });
}

export async function addSymptomLog(
  _: WebDatabase,
  payload: {
    date: string;
    symptom: string;
    severity: "MILD" | "MODERATE" | "SEVERE";
    notes?: string;
  }
) {
  updateStore((store) => {
    store.symptomLogs.push({
      id: nextId(store.symptomLogs),
      date: payload.date,
      symptom: payload.symptom,
      severity: payload.severity,
      notes: payload.notes?.trim() || null,
      created_at: now()
    });
  });
}

export async function getSymptomLogsByDate(_: WebDatabase, date: string): Promise<SymptomLog[]> {
  return sortByUpdatedAtDesc(readStore().symptomLogs.filter((item) => item.date === date));
}

export async function setKickCount(_: WebDatabase, date: string, kicks: number) {
  updateStore((store) => {
    const next: KickLog = {
      date,
      kicks,
      updated_at: now()
    };

    store.kickLogs = store.kickLogs.filter((item) => item.date !== date);
    store.kickLogs.push(next);
  });
}

export async function getKickCount(_: WebDatabase, date: string): Promise<number> {
  return readStore().kickLogs.find((item) => item.date === date)?.kicks ?? 0;
}

export async function getClinicianDraft(_: WebDatabase): Promise<ClinicianDraft | null> {
  return readStore().clinicianDraft;
}

export async function upsertClinicianDraft(
  _: WebDatabase,
  payload: {
    medications: string;
    questions: string;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    temperatureC: number | null;
    glucoseMgDl: number | null;
  }
) {
  updateStore((store) => {
    store.clinicianDraft = {
      id: 1,
      medications: payload.medications.trim() || null,
      questions: payload.questions.trim() || null,
      bp_systolic: payload.bpSystolic,
      bp_diastolic: payload.bpDiastolic,
      temperature_c: payload.temperatureC,
      glucose_mg_dl: payload.glucoseMgDl,
      updated_at: now()
    };
  });
}

export async function getRecentEntriesForReport(_: WebDatabase, days = 14): Promise<Entry[]> {
  const cutoff = normalizeDateRangeCutoff(days);
  return sortByDateDesc(readStore().entries.filter((item) => item.date >= cutoff));
}

export async function getRecentSymptomLogs(_: WebDatabase, days = 14): Promise<SymptomLog[]> {
  const cutoff = normalizeDateRangeCutoff(days);
  return sortByUpdatedAtDesc(readStore().symptomLogs.filter((item) => item.date >= cutoff));
}

export async function getInsurancePolicies(_: WebDatabase): Promise<InsurancePolicy[]> {
  return sortByUpdatedAtDesc(readStore().insurancePolicies);
}

export async function saveInsurancePolicy(
  _: WebDatabase,
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
  updateStore((store) => {
    const existing = payload.id ? store.insurancePolicies.find((item) => item.id === payload.id) : undefined;
    const next: InsurancePolicy = {
      id: existing?.id ?? payload.id ?? nextId(store.insurancePolicies),
      provider: payload.provider.trim(),
      policy_number: payload.policyNumber.trim(),
      maternity_coverage_percent: payload.maternityCoveragePercent,
      deductible: payload.deductible,
      out_of_pocket_limit: payload.outOfPocketLimit,
      maternity_cover_limit: payload.maternityCoverLimit,
      renewal_date: payload.renewalDate,
      created_at: existing?.created_at ?? now(),
      updated_at: now()
    };

    store.insurancePolicies = store.insurancePolicies.filter((item) => item.id !== next.id);
    store.insurancePolicies.push(next);
  });
}

export async function getInsuranceClaims(_: WebDatabase): Promise<InsuranceClaim[]> {
  return sortByUpdatedAtDesc(readStore().insuranceClaims);
}

export async function saveInsuranceClaim(
  _: WebDatabase,
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
  updateStore((store) => {
    const existing = payload.id ? store.insuranceClaims.find((item) => item.id === payload.id) : undefined;
    const next: InsuranceClaim = {
      id: existing?.id ?? payload.id ?? nextId(store.insuranceClaims),
      policy_id: payload.policyId,
      title: payload.title.trim(),
      status: payload.status,
      estimated_amount: payload.estimatedAmount,
      submission_deadline: payload.submissionDeadline,
      notes: payload.notes.trim() || null,
      created_at: existing?.created_at ?? now(),
      updated_at: now()
    };

    store.insuranceClaims = store.insuranceClaims.filter((item) => item.id !== next.id);
    store.insuranceClaims.push(next);
  });
}

export async function getInsuranceClaimDocuments(_: WebDatabase, claimId: number): Promise<InsuranceClaimDocument[]> {
  return sortByUpdatedAtDesc(readStore().insuranceClaimDocuments.filter((item) => item.claim_id === claimId));
}

export async function addInsuranceClaimDocument(
  _: WebDatabase,
  payload: {
    claimId: number;
    name: string;
    uri: string;
    mimeType: string | null;
  }
) {
  updateStore((store) => {
    store.insuranceClaimDocuments.push({
      id: nextId(store.insuranceClaimDocuments),
      claim_id: payload.claimId,
      name: payload.name.trim(),
      uri: payload.uri,
      mime_type: payload.mimeType,
      created_at: now()
    });
  });
}