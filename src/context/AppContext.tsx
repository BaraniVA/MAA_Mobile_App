import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import * as Notifications from "expo-notifications";
import { deleteReminder, getProfile, getReminders, saveProfile, saveReminder } from "@/db/helpers";
import { Profile, Reminder } from "@/types";

type AppState = {
  db: SQLiteDatabase;
  profile: Profile | null;
  reminders: Reminder[];
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>;
  upsertProfile: (payload: {
    name: string;
    dueDate: string;
    bloodType?: string;
    doctorName?: string;
    doctorPhone?: string;
    preferredVoice?: string;
  }) => Promise<void>;
  refreshReminders: () => Promise<void>;
  upsertReminder: (payload: { id?: number; title: string; remindAt: string; repeat: "none" | "daily" | "weekly" }) => Promise<void>;
  removeReminder: (id: number) => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => undefined);
  }, []);

  const refreshProfile = useCallback(async () => {
    const next = await getProfile(db);
    setProfile(next);
  }, [db]);

  const refreshReminders = useCallback(async () => {
    const next = await getReminders(db);
    setReminders(next);
  }, [db]);

  useEffect(() => {
    const load = async () => {
      setLoadingProfile(true);
      await Promise.all([refreshProfile(), refreshReminders()]);
      setLoadingProfile(false);
    };

    load().catch(() => setLoadingProfile(false));
  }, [db]);

  const upsertProfile = async (payload: {
    name: string;
    dueDate: string;
    bloodType?: string;
    doctorName?: string;
    doctorPhone?: string;
    preferredVoice?: string;
  }) => {
    await saveProfile(db, payload);
    await refreshProfile();
  };

  const scheduleReminderNotification = async (reminder: { title: string; remindAt: string; repeat: "none" | "daily" | "weekly" }) => {
    const triggerDate = new Date(reminder.remindAt);
    if (Number.isNaN(triggerDate.getTime())) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Maa Reminder",
        body: reminder.title
      },
      trigger:
        reminder.repeat === "none"
          ? {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate
            }
          : {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour: triggerDate.getHours(),
              minute: triggerDate.getMinutes(),
              weekday: reminder.repeat === "weekly" ? triggerDate.getDay() + 1 : undefined,
              repeats: true
            }
    });
  };

  const upsertReminder = async (payload: { id?: number; title: string; remindAt: string; repeat: "none" | "daily" | "weekly" }) => {
    await saveReminder(db, payload);
    await scheduleReminderNotification(payload);
    await refreshReminders();
  };

  const removeReminder = async (id: number) => {
    await deleteReminder(db, id);
    await refreshReminders();
  };

  const value = useMemo(
    () => ({
      db,
      profile,
      reminders,
      loadingProfile,
      refreshProfile,
      upsertProfile,
      refreshReminders,
      upsertReminder,
      removeReminder
    }),
    [db, profile, reminders, loadingProfile, refreshProfile, refreshReminders]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return context;
}
