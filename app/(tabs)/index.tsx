import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "@/context/AppContext";
import { cacheAffirmation, getCachedAffirmation, getTodayEntry, upsertEntry } from "@/db/helpers";
import { colors, inkBorder, inkShadow, radius, spacing } from "@/constants/theme";
import { Card } from "@/components/Card";
import { InlineToast } from "@/components/InlineToast";
import { displayDate, formatToday, pregnancyWeek, trimesterFromWeek } from "@/services/date";
import { fetchAffirmation } from "@/services/api";

const moods = ["😊", "🙂", "😐", "😔", "🤒"];

export default function HomeScreen() {
  const { db, profile, reminders, refreshReminders } = useApp();
  const [todayMood, setTodayMood] = useState("🙂");
  const [water, setWater] = useState(0);
  const [affirmation, setAffirmation] = useState("");
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [error, setError] = useState("");

  const today = formatToday();
  const week = profile?.due_date ? pregnancyWeek(profile.due_date) : 1;
  const trimester = trimesterFromWeek(week);

  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = reminders
      .map((r) => ({ ...r, remindDate: new Date(r.remind_at) }))
      .filter((r) => r.remindDate >= now)
      .sort((a, b) => a.remindDate.getTime() - b.remindDate.getTime());
    return upcoming[0] ?? null;
  }, [reminders]);

  const persistToday = async (partial: { mood?: string; water?: number }) => {
    const existing = await getTodayEntry(db, today);
    await upsertEntry(db, {
      date: today,
      mood: partial.mood ?? existing?.mood ?? "🙂",
      energy: existing?.energy ?? 3,
      symptoms: existing ? JSON.parse(existing.symptoms) : [],
      notes: existing?.notes ?? "",
      waterGlasses: partial.water ?? existing?.water_glasses ?? 0,
      weight: existing?.weight ?? null
    });
  };

  const load = useCallback(async () => {
    setError("");
    try {
      await refreshReminders();
      const existing = await getTodayEntry(db, today);
      if (existing) {
        setTodayMood(existing.mood);
        setWater(existing.water_glasses);
      }

      const cached = await getCachedAffirmation(db, today);
      if (cached) {
        setAffirmation(cached);
        return;
      }

      setLoadingAffirmation(true);
      const response = await fetchAffirmation();
      setAffirmation(response.text);
      await cacheAffirmation(db, today, response.text);
    } catch {
      setError("Unable to refresh home insights. You can continue using local features.");
    } finally {
      setLoadingAffirmation(false);
    }
  }, [db, refreshReminders, today]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hello {profile?.name ?? "Mama"}</Text>
      <Text style={styles.meta}>{displayDate(today)}</Text>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.weekText}>Week {week}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{trimester}</Text>
          </View>
        </View>
      </Card>

      {error ? <InlineToast type="error" message={error} /> : null}

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Next appointment</Text>
          <Text style={styles.statValue}>
            {nextAppointment ? displayDate(nextAppointment.remind_at) : "None"}
          </Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Water</Text>
          <View style={styles.waterRow}>
            {Array.from({ length: 8 }).map((_, idx) => {
              const filled = idx < water;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={async () => {
                    const next = idx + 1;
                    setWater(next);
                    await persistToday({ water: next });
                  }}
                  style={[styles.glass, filled && styles.glassFilled]}
                />
              );
            })}
          </View>
          <Text style={styles.muted}>{water}/8 glasses</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.sectionLabel}>Mood</Text>
        <View style={styles.moodRow}>
          {moods.map((emoji) => {
            const active = emoji === todayMood;
            return (
              <TouchableOpacity
                key={emoji}
                onPress={async () => {
                  setTodayMood(emoji);
                  await persistToday({ mood: emoji });
                }}
                style={[styles.moodBtn, active && styles.moodBtnActive]}
              >
                <Text style={styles.moodText}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      <Card style={styles.affirmationCard}>
        <Text style={styles.quoteMark}>"</Text>
        {loadingAffirmation ? (
          <ActivityIndicator color={colors.charcoal} />
        ) : (
          <Text style={styles.affirmationText}>{affirmation || "You are doing beautifully, one day at a time."}</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Upcoming reminders</Text>
        {reminders.length === 0 ? <Text style={styles.muted}>No reminders yet.</Text> : null}
        {reminders.slice(0, 5).map((reminder) => (
          <View key={reminder.id} style={styles.reminderRow}>
            <Text style={styles.reminderTitle}>{reminder.title}</Text>
            <Text style={styles.muted}>{displayDate(reminder.remind_at)}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory
  },
  content: {
    padding: spacing.lg
  },
  greeting: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    color: colors.charcoal,
    fontSize: 30,
    marginBottom: spacing.xs
  },
  meta: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.md
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  weekText: {
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 24,
    color: colors.charcoal
  },
  badge: {
    backgroundColor: colors.sage,
    ...inkBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  badgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: colors.charcoal
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  statCard: {
    flex: 1
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    color: colors.charcoal,
    fontSize: 11,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  statValue: {
    fontFamily: "Inter_600SemiBold",
    color: colors.charcoal,
    fontSize: 13
  },
  waterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  glass: {
    width: 18,
    height: 24,
    ...inkBorder,
    borderRadius: 4,
    backgroundColor: colors.white
  },
  glassFilled: {
    backgroundColor: colors.blush
  },
  moodRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  moodBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    ...inkBorder,
    ...inkShadow,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  moodBtnActive: {
    backgroundColor: colors.blush
  },
  moodText: {
    fontSize: 20
  },
  affirmationCard: {
    backgroundColor: colors.ivory
  },
  quoteMark: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 36,
    color: colors.rose,
    lineHeight: 40
  },
  affirmationText: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_400Regular",
    fontSize: 18,
    lineHeight: 30
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    color: colors.charcoal,
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: spacing.sm
  },
  reminderRow: {
    ...inkBorder,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    padding: spacing.sm,
    marginBottom: spacing.sm
  },
  reminderTitle: {
    fontFamily: "Inter_500Medium",
    color: colors.charcoal,
    marginBottom: spacing.xs
  },
  muted: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 12
  }
});
