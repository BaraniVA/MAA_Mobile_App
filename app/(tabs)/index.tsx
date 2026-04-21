import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { AlertTriangle, Heart, Volume2, CalendarDays, Sparkles, ChevronRight, Heart as HeartOutline, Bookmark } from "lucide-react-native";
import { LanguageSelector } from "@/components/LanguageSelector";

import { useApp } from "@/context/AppContext";
import { cacheAffirmation, getCachedAffirmation, getTodayEntry, upsertEntry } from "@/db/helpers";
import { healthFeedItems } from "@/data/healthFeed";
import { colors, fonts } from "@/constants/theme";
import { displayDate, formatToday, pregnancyWeek, trimesterFromWeek } from "@/services/date";
import { fetchAffirmation } from "@/services/api";

const moods = [
  { emoji: "😊", label: "HAPPY" },
  { emoji: "😌", label: "CALM" },
  { emoji: "😴", label: "TIRED" },
  { emoji: "😰", label: "ANXIOUS" },
  { emoji: "🤩", label: "EXCITED" },
] as const;

const filters = ["All", "Nutrition", "Exercise", "Menth"] as const;

const quickSupportPrompts: Record<string, string> = {
  Nutrition: "What should I eat today for a healthy pregnancy?",
  Exercise: "What are safe exercises I can do today during pregnancy?",
  Sleep: "How can I sleep better and more comfortably during pregnancy?",
  "Mental Health": "How can I manage stress and anxiety during pregnancy?",
};

function formatDateForInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatDateForStorage(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

function parseDueDateInput(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function getBabySizeLabel(week: number) {
  if (week <= 8) return "Blueberry";
  if (week <= 12) return "Lime";
  if (week <= 16) return "Avocado";
  if (week <= 20) return "Banana";
  if (week <= 24) return "Corn";
  if (week <= 28) return "Eggplant";
  if (week <= 32) return "Pineapple";
  if (week <= 36) return "Papaya";
  if (week <= 40) return "Pumpkin";
  return "Watermelon";
}

export default function HomeScreen() {
  const router = useRouter();
  const { db, profile, reminders, refreshProfile, refreshReminders, upsertProfile, feedActivity, toggleFeedLike, toggleFeedSave } = useApp();

  const [todayMood, setTodayMood] = useState<(typeof moods)[number]["emoji"]>("😰");
  const [dueDateInput, setDueDateInput] = useState("");
  const [dueDateValue, setDueDateValue] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [affirmation, setAffirmation] = useState("");
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const todayStr = formatToday();

  const nextAppointment = useMemo(() => {
    const now = new Date();
    const upcoming = reminders
      .map((r) => ({ ...r, remindDate: new Date(r.remind_at) }))
      .filter((r) => r.remindDate >= now)
      .sort((a, b) => a.remindDate.getTime() - b.remindDate.getTime());
    return upcoming[0] ?? null;
  }, [reminders]);

  const load = useCallback(async () => {
    try {
      await Promise.all([refreshReminders(), refreshProfile()]);
      const entry = await getTodayEntry(db, todayStr);
      if (entry?.mood) {
        setTodayMood(entry.mood as (typeof moods)[number]["emoji"]);
      }

      const cached = await getCachedAffirmation(db, todayStr);
      if (cached) {
        setAffirmation(cached);
        return;
      }

      setLoadingAffirmation(true);
      const response = await fetchAffirmation();
      setAffirmation(response.text);
      await cacheAffirmation(db, todayStr, response.text);
    } finally {
      setLoadingAffirmation(false);
    }
  }, [db, refreshProfile, refreshReminders, todayStr]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  const persistMood = async (mood: string) => {
    const existing = await getTodayEntry(db, todayStr);
    await upsertEntry(db, {
      date: todayStr,
      mood,
      energy: existing?.energy ?? 3,
      symptoms: existing ? JSON.parse(existing.symptoms) : [],
      notes: existing?.notes ?? "",
      waterGlasses: existing?.water_glasses ?? 0,
      weight: existing?.weight ?? null,
    });
    setTodayMood(mood as (typeof moods)[number]["emoji"]);
  };

  useEffect(() => {
    if (!profile?.due_date) return;

    const existingDate = new Date(profile.due_date);
    if (Number.isNaN(existingDate.getTime())) return;

    setDueDateValue(existingDate);
    setDueDateInput(formatDateForInput(existingDate));
  }, [profile?.due_date]);

  const persistDueDate = async (date: Date) => {
    setDueDateValue(date);
    setDueDateInput(formatDateForInput(date));

    await upsertProfile({
      name: profile?.name?.trim() || "Mama",
      dueDate: formatDateForStorage(date),
      bloodType: profile?.blood_type ?? undefined,
      doctorName: profile?.doctor_name ?? undefined,
      doctorPhone: profile?.doctor_phone ?? undefined,
      preferredVoice: profile?.preferred_voice ?? undefined,
    });
  };

  const onDueDateInputSubmit = () => {
    const parsed = parseDueDateInput(dueDateInput);
    if (!parsed) return;
    persistDueDate(parsed).catch(() => undefined);
  };

  const onDatePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate || event.type === "dismissed") return;
    persistDueDate(selectedDate).catch(() => undefined);
  };

  const hasDueDate = !!dueDateValue;
  const journeyWeek = hasDueDate ? pregnancyWeek(formatDateForStorage(dueDateValue)) : 0;
  const journeyTrimester = hasDueDate ? trimesterFromWeek(journeyWeek).toUpperCase() : "";
  const babySize = hasDueDate ? getBabySizeLabel(journeyWeek) : "";
  const daysToGo = hasDueDate
    ? Math.max(
        0,
        Math.ceil((dueDateValue.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      )
    : null;
  const journeyProgress = hasDueDate ? Math.max(2, Math.min(100, Math.round((journeyWeek / 40) * 100))) : 0;
  const feedActivityMap = useMemo(() => {
    return new Map(feedActivity.map((item) => [item.slug, item]));
  }, [feedActivity]);

  const onQuickSupportPress = (topic: string) => {
    const question =
      quickSupportPrompts[topic] ?? `I need guidance about ${topic.toLowerCase()} during pregnancy.`;

    router.push({
      pathname: "/(tabs)/chat",
      params: { q: question },
    });
  };

  const lastMoodLabel = moods.find((m) => m.emoji === todayMood)?.label ?? "ANXIOUS";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerWrap}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Heart size={16} color={colors.white} fill={colors.white} />
          </View>
          <View>
            <Text style={styles.logoText}>Maternal</Text>
            <View style={styles.aiRow}>
              <View style={styles.aiDot} />
              <Text style={styles.aiText}>AI ASSISTANT</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <LanguageSelector />
          <TouchableOpacity style={styles.emergencyPillBtn} onPress={() => router.push("/emergency") }>
            <AlertTriangle size={14} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconPillBtn}>
            <Volume2 size={16} color={colors.brand} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>{hasDueDate ? "PREGNANCY JOURNEY" : "WELCOME BACK"}</Text>
        <Text style={styles.heroTitle}>{hasDueDate ? `Week ${journeyWeek}` : "Hello, Mama!"}</Text>
        {hasDueDate ? (
          <>
            <View style={styles.heroJourneyMetaRow}>
              <Text style={styles.heroJourneyLabel}>{journeyTrimester}</Text>
              <Text style={styles.heroJourneyLabel}>{daysToGo} DAYS TO GO</Text>
            </View>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${journeyProgress}%` }]} />
            </View>
            <Text style={styles.heroJourneyText}>
              Baby is the size of a <Text style={styles.heroJourneyTextAccent}>{babySize}</Text>
            </Text>
          </>
        ) : (
          <Text style={styles.heroSubtitle}>Set your due date to track your pregnancy journey.</Text>
        )}

        <View style={styles.heroActionsRow}>
          <View style={styles.dateInputWrap}>
            <TextInput
              value={dueDateInput}
              onChangeText={setDueDateInput}
              onSubmitEditing={onDueDateInputSubmit}
              onEndEditing={onDueDateInputSubmit}
              placeholder="mm/dd/yyyy"
              placeholderTextColor="rgba(255,255,255,0.9)"
              style={styles.dateInput}
            />
            <TouchableOpacity style={styles.dateCalendarBtn} onPress={() => setShowDatePicker(true)}>
              <CalendarDays size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.startChatBtn} onPress={() => router.push("/(tabs)/chat") }>
            <Text style={styles.startChatText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeadRow}>
        <Text style={styles.sectionHeadText}>HOW ARE YOU FEELING?</Text>
        <Text style={styles.sectionHeadLast}>Last: <Text style={styles.sectionHeadLastValue}>{lastMoodLabel}</Text></Text>
      </View>

      <View style={styles.moodRow}>
        {moods.map((m) => {
          const active = m.emoji === todayMood;
          return (
            <View key={m.label} style={styles.moodItem}>
              <TouchableOpacity style={[styles.moodButton, active && styles.moodButtonActive]} onPress={() => persistMood(m.emoji)}>
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
              </TouchableOpacity>
              <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.surfaceCard}>
        <View style={styles.surfaceIconWrap}>
          <Sparkles size={18} color={colors.brand} />
        </View>
        <View style={styles.surfaceTextWrap}>
          <Text style={styles.surfaceTag}>DAILY INSIGHT</Text>
          {loadingAffirmation ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Text style={styles.surfaceBody}>
              "{affirmation || "Trust your body, it knows exactly how to nurture your little one."}"
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.surfaceCard} onPress={() => router.push("/entry") }>
        <View style={[styles.surfaceIconWrap, styles.surfaceIconSoft]}>
          <CalendarDays size={18} color={colors.brand} />
        </View>
        <View style={styles.surfaceTextWrap}>
          <Text style={styles.surfaceTagMuted}>NEXT APPOINTMENT</Text>
          <Text style={styles.surfaceBodyMuted}>{nextAppointment ? displayDate(nextAppointment.remind_at) : "No upcoming visits"}</Text>
        </View>
        <ChevronRight size={16} color="#C7C7CC" />
      </TouchableOpacity>

      <View style={styles.feedHeadWrap}>
        <Text style={styles.feedHeadTitle}>HEALTH FEED</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((f) => {
            const active = f === activeFilter;
            return (
              <TouchableOpacity key={f} style={[styles.filterPill, active && styles.filterPillActive]} onPress={() => setActiveFilter(f)}>
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {healthFeedItems.map((item) => {
        const activity = feedActivityMap.get(item.slug);
        const isLiked = activity?.liked === 1;
        const isSaved = activity?.saved === 1;

        return (
        <TouchableOpacity
          activeOpacity={0.93}
          style={styles.feedCard}
          key={item.slug}
          onPress={() => router.push({ pathname: "/(tabs)/feed/[slug]", params: { slug: item.slug } })}
        >
          <Image source={{ uri: item.image }} style={styles.feedImage} />
          <View style={styles.feedBody}>
            <View style={styles.feedMetaWrap}>
              <Text style={styles.feedMeta}>{item.section}</Text>
              <Text style={styles.feedMetaDot}>·</Text>
              <Text style={styles.feedMetaAccent}>{item.stage}</Text>
            </View>
            <Text style={styles.feedTitle}>{item.title}</Text>
            <Text style={styles.feedSubtitle}>{item.subtitle}</Text>
            <View style={styles.feedBottom}>
              <Text style={styles.readMore}>Read More</Text>
              <View style={styles.feedActions}>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    toggleFeedLike(item.slug).catch(() => undefined);
                  }}
                >
                  <HeartOutline size={14} color={isLiked ? colors.brand : "#D1D1D6"} fill={isLiked ? colors.brand : "transparent"} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    toggleFeedSave(item.slug).catch(() => undefined);
                  }}
                >
                  <Bookmark size={14} color={isSaved ? colors.brand : "#D1D1D6"} fill={isSaved ? colors.brand : "transparent"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.feedBadge}>
            <Text style={styles.feedBadgeText}>{item.tag}</Text>
          </View>
        </TouchableOpacity>
        );
      })}

      <View style={styles.statsRow}>
        <View style={styles.dueDateCard}>
          <Text style={styles.statsKicker}>PREGNANCY</Text>
          <Text style={styles.dueDateTitle}>{hasDueDate ? `Week ${journeyWeek}` : "Set Due Date"}</Text>
          <Text style={styles.dueDateSub}>
            {hasDueDate ? (
              <>
                Baby is the size of a <Text style={styles.dueDateAccent}>{babySize}</Text>
              </>
            ) : (
              "Baby is the size of a ..."
            )}
          </Text>
          <View style={styles.dueDateProgressTrack}>
            <View style={[styles.dueDateProgressFill, { width: `${hasDueDate ? journeyProgress : 0}%` }]} />
          </View>
        </View>

        <View style={styles.kickCard}>
          <View style={styles.kickIcon}>
            <Sparkles size={18} color="#F6A623" />
          </View>
          <Text style={styles.kickCount}>0 Kicks</Text>
          <Text style={styles.kickTitle}>Kick Counter</Text>
          <Text style={styles.kickSub}>Track baby's movement.</Text>
        </View>
      </View>

      <View style={styles.quickWrap}>
        <Text style={styles.quickTitle}>QUICK SUPPORT</Text>
        <View style={styles.quickRow}>
          {["Nutrition", "Exercise", "Sleep", "Mental Health"].map((item) => (
            <TouchableOpacity key={item} style={styles.quickPill} onPress={() => onQuickSupportPress(item)}>
              <Text style={styles.quickPillText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomPad} />

      {showDatePicker ? (
        <DateTimePicker
          value={dueDateValue ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDatePickerChange}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 18,
    gap: 16,
  },
  headerWrap: {
    marginTop: 20,
    position: "relative",
    zIndex: 120,
    elevation: 30,
    overflow: "visible",
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  logoText: {
    fontFamily: fonts.serif,
    fontSize: 33 / 2,
    color: "#252A39",
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  aiDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#25C45E",
  },
  aiText: {
    color: "#8B93AE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 140,
    position: "relative",
  },
  pillBtn: {
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F6FA",
    borderWidth: 1,
    borderColor: "#ECECF1",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillBtnText: {
    color: "#596079",
    fontSize: 11,
    fontWeight: "700",
  },
  iconPillBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE2EA",
  },
  emergencyPillBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#D6285A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D6285A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  languageMenu: {
    position: "absolute",
    top: 38,
    right: 36,
    width: 118,
    backgroundColor: "rgba(255, 239, 245, 0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFDDE8",
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  languageOption: {
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  languageOptionActive: {
    backgroundColor: "#FFEFF4",
  },
  languageOptionText: {
    color: "#1F2B4D",
    fontSize: 12,
    fontWeight: "600",
  },
  languageOptionTextActive: {
    color: colors.brand,
    fontWeight: "800",
  },
  heroCard: {
    borderRadius: 40,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 24,
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.21,
    shadowRadius: 22,
    elevation: 9,
  },
  heroKicker: {
    color: "#FFD5E2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 42 / 1.8,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "#FFF3F7",
    fontSize: 17 / 1.15,
    lineHeight: 21,
    fontWeight: "700",
    marginBottom: 18,
    maxWidth: 240,
  },
  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateInputWrap: {
    flex: 1,
    height: 50,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInput: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  dateCalendarBtn: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  heroJourneyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heroJourneyLabel: {
    color: "#FFD5E2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroProgressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  heroProgressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  heroJourneyText: {
    marginTop: 10,
    marginBottom: 14,
    color: "#FFF3F7",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  heroJourneyTextAccent: {
    color: colors.white,
    fontWeight: "900",
  },
  startChatBtn: {
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  startChatText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "800",
  },
  sectionHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  sectionHeadText: {
    color: "#9AA2BC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  sectionHeadLast: {
    color: "#9AA2BC",
    fontSize: 11,
    fontWeight: "800",
  },
  sectionHeadLastValue: {
    color: colors.brand,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 4,
  },
  moodItem: {
    alignItems: "center",
    gap: 7,
    width: 63,
  },
  moodButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  moodButtonActive: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFC7D7",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    color: "#9AA2BC",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  moodLabelActive: {
    color: colors.brand,
  },
  surfaceCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#1F2B5A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  surfaceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#F1F2F7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  surfaceIconSoft: {
    backgroundColor: "#FFF1F5",
    borderColor: "#FFE3EC",
  },
  surfaceTextWrap: {
    flex: 1,
  },
  surfaceTag: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },
  surfaceTagMuted: {
    color: "#9AA2BC",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },
  surfaceBody: {
    color: "#2F3751",
    fontSize: 16,
    lineHeight: 24,
    fontStyle: "italic",
    fontWeight: "600",
  },
  surfaceBodyMuted: {
    color: "#6980A6",
    fontSize: 29 / 2,
    fontStyle: "italic",
    fontWeight: "800",
  },
  feedHeadWrap: {
    marginTop: 8,
    gap: 10,
  },
  feedHeadTitle: {
    color: "#9AA2BC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  filterRow: {
    gap: 8,
    paddingRight: 18,
  },
  filterPill: {
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9EAF0",
    backgroundColor: colors.white,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A2AAC3",
  },
  filterPillTextActive: {
    color: colors.white,
  },
  feedCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    minHeight: 122,
    shadowColor: "#1F2B5A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
    position: "relative",
  },
  feedImage: {
    width: 108,
    height: "100%",
  },
  feedBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  feedMetaWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  feedMeta: {
    color: "#9AA2BC",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  feedMetaDot: {
    color: "#D9DCE8",
    fontSize: 14,
  },
  feedMetaAccent: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  feedTitle: {
    color: "#1F2B5A",
    fontSize: 28 / 2,
    fontWeight: "800",
    marginBottom: 4,
  },
  feedSubtitle: {
    color: "#8090B0",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  feedBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readMore: {
    color: colors.brand,
    fontWeight: "800",
    fontSize: 13,
  },
  feedActions: {
    flexDirection: "row",
    gap: 8,
    marginRight: 4,
  },
  feedBadge: {
    position: "absolute",
    top: 7,
    left: 8,
    backgroundColor: "#FFE8F0",
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  feedBadgeText: {
    color: colors.brand,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  dueDateCard: {
    flex: 1,
    backgroundColor: "#FFF4F7",
    borderRadius: 30,
    padding: 18,
    minHeight: 145,
    justifyContent: "center",
  },
  statsKicker: {
    color: "#A7AFC8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  dueDateTitle: {
    color: "#EAB9C6",
    fontFamily: fonts.serif,
    fontSize: 34 / 2,
    marginTop: 10,
  },
  dueDateSub: {
    color: "#8C99BC",
    fontSize: 13,
    marginTop: 8,
  },
  dueDateAccent: {
    color: colors.brand,
    fontWeight: "800",
  },
  dueDateProgressTrack: {
    marginTop: 12,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#EADFE5",
    overflow: "hidden",
  },
  dueDateProgressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  kickCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 30,
    padding: 18,
    minHeight: 145,
    justifyContent: "center",
  },
  kickIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF7E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  kickCount: {
    color: "#F6A623",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginTop: -30,
    marginBottom: 16,
  },
  kickTitle: {
    color: "#1F2B5A",
    fontSize: 25 / 2,
    fontWeight: "800",
    marginBottom: 4,
  },
  kickSub: {
    color: "#8090B0",
    fontSize: 12,
    lineHeight: 17,
  },
  quickWrap: {
    marginTop: 8,
    marginBottom: 10,
  },
  quickTitle: {
    color: "#9AA2BC",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickPill: {
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E7EAF2",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickPillText: {
    color: "#526080",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomPad: {
    height: 22,
  },
});
