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

export type ClinicianDraft = {
  id: number;
  medications: string | null;
  questions: string | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  temperature_c: number | null;
  glucose_mg_dl: number | null;
  updated_at: string;
};

export type InsurancePolicy = {
  id: number;
  provider: string;
  policy_number: string;
  maternity_coverage_percent: number;
  deductible: number | null;
  out_of_pocket_limit: number | null;
  maternity_cover_limit: number | null;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ClaimStatus = "draft" | "submitted" | "in_review" | "approved" | "rejected";

export type InsuranceClaim = {
  id: number;
  policy_id: number | null;
  title: string;
  status: ClaimStatus;
  estimated_amount: number | null;
  submission_deadline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InsuranceClaimDocument = {
  id: number;
  claim_id: number;
  name: string;
  uri: string;
  mime_type: string | null;
  created_at: string;
};
