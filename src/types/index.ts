export type Profile = {
  id: number;
  name: string;
  due_date: string;
  blood_type: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  preferred_voice: string | null;
  created_at: string;
};

export type Entry = {
  id: number;
  date: string;
  mood: string;
  energy: number;
  symptoms: string;
  notes: string;
  water_glasses: number;
  weight: number | null;
  created_at: string;
};

export type Reminder = {
  id: number;
  title: string;
  remind_at: string;
  repeat: "none" | "daily" | "weekly";
  created_at: string;
};

export type SessionLog = {
  id: number;
  date: string;
  poses_completed: string;
  duration_seconds: number;
  created_at: string;
};

export type FeedActivity = {
  slug: string;
  liked: number;
  saved: number;
  updated_at: string;
};

export type SymptomLog = {
  id: number;
  date: string;
  symptom: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  notes: string | null;
  created_at: string;
};

export type KickLog = {
  date: string;
  kicks: number;
  updated_at: string;
};
