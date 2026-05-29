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
import { Heart, Volume2, VolumeX, CalendarDays, Sparkles, ChevronRight, Heart as HeartOutline, Bookmark } from "lucide-react-native";
import { LanguageSelector } from "@/components/LanguageSelector";
import { EmergencySupportButton } from "@/components/EmergencySupportButton";
import { speakText, stopSpeaking, localeForLanguage } from "../../src/utils/tts";

import { useApp } from "@/context/AppContext";
import { cacheAffirmation, getCachedAffirmation, getTodayEntry, upsertEntry } from "@/db/helpers";
import { healthFeedItems } from "@/data/healthFeed";
import { colors, fonts } from "@/constants/theme";
import { displayDate, formatToday, pregnancyWeek, trimesterFromWeek } from "@/services/date";
import { fetchAffirmation } from "@/services/api";

type HomeCopy = {
  heroKicker: string;
  welcomeTitle: string;
  dueWeekTitle: (week: number) => string;
  heroSubtitle: string;
  datePlaceholder: string;
  startChat: string;
  howAreYouFeeling: string;
  lastMoodPrefix: string;
  dailyInsight: string;
  nextAppointment: string;
  noUpcomingVisits: string;
  healthFeed: string;
  readMore: string;
  pregnancy: string;
  setDueDate: string;
  babySizePrefix: string;
  babySizeFallback: string;
  filterLabels: Record<string, string>;
  moodLabels: Record<string, string>;
  trimesterLabel: (week: number) => string;
};

const homeCopy: Record<string, HomeCopy> = {
  English: {
    heroKicker: "PREGNANCY JOURNEY",
    welcomeTitle: "Hello, Mama!",
    dueWeekTitle: (week: number) => `Week ${week}`,
    heroSubtitle: "Set your due date to track your pregnancy journey.",
    datePlaceholder: "mm/dd/yyyy",
    startChat: "Start Chat",
    howAreYouFeeling: "HOW ARE YOU FEELING?",
    lastMoodPrefix: "Last:",
    dailyInsight: "DAILY INSIGHT",
    nextAppointment: "NEXT APPOINTMENT",
    noUpcomingVisits: "No upcoming visits",
    healthFeed: "HEALTH FEED",
    readMore: "Read More",
    pregnancy: "PREGNANCY",
    setDueDate: "Set Due Date",
    babySizePrefix: "Baby is the size of a",
    babySizeFallback: "Baby is the size of a ...",
    filterLabels: {
      All: "All",
      Nutrition: "Nutrition",
      Exercise: "Exercise",
      Menth: "Mental",
    },
    moodLabels: {
      HAPPY: "HAPPY",
      CALM: "CALM",
      TIRED: "TIRED",
      ANXIOUS: "ANXIOUS",
      EXCITED: "EXCITED",
    },
    trimesterLabel: (week: number) => trimesterFromWeek(week).toUpperCase(),
  },
  தமிழ்: {
    heroKicker: "கர்ப்ப பயணம்",
    welcomeTitle: "வணக்கம், அம்மா!",
    dueWeekTitle: (week: number) => `வாரம் ${week}`,
    heroSubtitle: "உங்கள் கர்ப்ப முன்னேற்றத்தை கண்காணிக்க due date-ஐ அமைக்கவும்.",
    datePlaceholder: "mm/dd/yyyy",
    startChat: "உரையாடல் தொடங்கு",
    howAreYouFeeling: "நீங்கள் எப்படி உணர்கிறீர்கள்?",
    lastMoodPrefix: "கடைசி:",
    dailyInsight: "இன்றைய குறிப்புரை",
    nextAppointment: "அடுத்த சந்திப்பு",
    noUpcomingVisits: "வரவிருக்கும் சந்திப்புகள் இல்லை",
    healthFeed: "ஆரோக்கிய செய்தி",
    readMore: "மேலும் படிக்க",
    pregnancy: "கர்ப்பம்",
    setDueDate: "Due date அமைக்கவும்",
    babySizePrefix: "குழந்தையின் அளவு போல",
    babySizeFallback: "குழந்தையின் அளவு போல ...",
    filterLabels: {
      All: "அனைத்தும்",
      Nutrition: "உணவு",
      Exercise: "உடற்பயிற்சி",
      Menth: "மனம்",
    },
    moodLabels: {
      HAPPY: "மகிழ்ச்சி",
      CALM: "அமைதி",
      TIRED: "சோர்வு",
      ANXIOUS: "கவலை",
      EXCITED: "உற்சாகம்",
    },
    trimesterLabel: (week: number) => trimesterFromWeek(week).toUpperCase(),
  },
  हिन्दी: {
    heroKicker: "गर्भावस्था यात्रा",
    welcomeTitle: "नमस्ते, मामा!",
    dueWeekTitle: (week: number) => `सप्ताह ${week}`,
    heroSubtitle: "अपनी गर्भावस्था यात्रा ट्रैक करने के लिए due date सेट करें।",
    datePlaceholder: "mm/dd/yyyy",
    startChat: "चैट शुरू करें",
    howAreYouFeeling: "आप कैसा महसूस कर रही हैं?",
    lastMoodPrefix: "अंतिम:",
    dailyInsight: "दैनिक सुझाव",
    nextAppointment: "अगली अपॉइंटमेंट",
    noUpcomingVisits: "कोई आगामी विज़िट नहीं",
    healthFeed: "स्वास्थ्य फ़ीड",
    readMore: "और पढ़ें",
    pregnancy: "गर्भावस्था",
    setDueDate: "Due date सेट करें",
    babySizePrefix: "बच्चा आकार में है",
    babySizeFallback: "बच्चा आकार में है ...",
    filterLabels: {
      All: "सभी",
      Nutrition: "पोषण",
      Exercise: "व्यायाम",
      Menth: "मानसिक",
    },
    moodLabels: {
      HAPPY: "खुश",
      CALM: "शांत",
      TIRED: "थका",
      ANXIOUS: "चिंतित",
      EXCITED: "उत्साहित",
    },
    trimesterLabel: (week: number) => trimesterFromWeek(week),
  },
  తెలుగు: {
    heroKicker: "గర్భధారణ ప్రయాణం",
    welcomeTitle: "హలో, మామా!",
    dueWeekTitle: (week: number) => `వారం ${week}`,
    heroSubtitle: "మీ గర్భధారణ ప్రయాణాన్ని ట్రాక్ చేయడానికి due date ను సెట్ చేయండి.",
    datePlaceholder: "mm/dd/yyyy",
    startChat: "చాట్ ప్రారంభించండి",
    howAreYouFeeling: "మీరు ఎలా ఉన్నారు?",
    lastMoodPrefix: "చివరి:",
    dailyInsight: "రోజువారీ సూచన",
    nextAppointment: "తదుపరి అపాయింట్‌మెంట్",
    noUpcomingVisits: "రాబోయే సందర్శనలు లేవు",
    healthFeed: "ఆరోగ్య ఫీడ్",
    readMore: "మరింత చదవండి",
    pregnancy: "గర్భధారణ",
    setDueDate: "Due date సెట్ చేయండి",
    babySizePrefix: "బిడ్డ పరిమాణం",
    babySizeFallback: "బిడ్డ పరిమాణం ...",
    filterLabels: {
      All: "అన్నీ",
      Nutrition: "పోషణ",
      Exercise: "వ్యాయామం",
      Menth: "మానసిక",
    },
    moodLabels: {
      HAPPY: "సంతోషంగా",
      CALM: "ప్రశాంతంగా",
      TIRED: "అలసటగా",
      ANXIOUS: "ఆందోళనగా",
      EXCITED: "ఉత్సాహంగా",
    },
    trimesterLabel: (week: number) => trimesterFromWeek(week),
  },
  मराठी: {
    heroKicker: "गर्भावस्था प्रवास",
    welcomeTitle: "नमस्कार, मामा!",
    dueWeekTitle: (week: number) => `आठवडा ${week}`,
    heroSubtitle: "तुमचा गर्भावस्था प्रवास ट्रॅक करण्यासाठी due date सेट करा.",
    datePlaceholder: "mm/dd/yyyy",
    startChat: "चॅट सुरू करा",
    howAreYouFeeling: "तुम्हाला कसे वाटते?",
    lastMoodPrefix: "शेवटचे:",
    dailyInsight: "दैनिक सूचना",
    nextAppointment: "पुढची भेट",
    noUpcomingVisits: "कोणतीही आगामी भेट नाही",
    healthFeed: "आरोग्य फीड",
    readMore: "अधिक वाचा",
    pregnancy: "गर्भावस्था",
    setDueDate: "Due date सेट करा",
    babySizePrefix: "बाळाचा आकार",
    babySizeFallback: "बाळाचा आकार ...",
    filterLabels: {
      All: "सर्व",
      Nutrition: "पोषण",
      Exercise: "व्यायाम",
      Menth: "मानसिक",
    },
    moodLabels: {
      HAPPY: "आनंदी",
      CALM: "शांत",
      TIRED: "थकलेले",
      ANXIOUS: "चिंताग्रस्त",
      EXCITED: "उत्साही",
    },
    trimesterLabel: (week: number) => trimesterFromWeek(week),
  },
  മലയാളം: {
    heroKicker: "ഗർഭധാരണ യാത്ര",
    welcomeTitle: "ഹലോ, മാമാ!",
    dueWeekTitle: (week: number) => `ആഴ്ച ${week}`,
    heroSubtitle: "നിങ്ങളുടെ ഗർഭധാരണ യാത്ര ട്രാക്ക് ചെയ്യാൻ due date സജ്ജമാക്കുക.",
    datePlaceholder: "mm/dd/yyyy",
    startChat: "ചാറ്റ് ആരംഭിക്കുക",
    howAreYouFeeling: "നിങ്ങൾക്ക് എങ്ങനെയുണ്ട്?",
    lastMoodPrefix: "അവസാനം:",
    dailyInsight: "ദൈനംദിന സൂചന",
    nextAppointment: "അടുത്ത അപ്പോയിന്റ്മെന്റ്",
    noUpcomingVisits: "വരാനിരിക്കുന്ന സന്ദർശനങ്ങൾ ഇല്ല",
    healthFeed: "ആരോഗ്യ ഫീഡ്",
    readMore: "കൂടുതൽ വായിക്കുക",
    pregnancy: "ഗർഭധാരണം",
    setDueDate: "Due date സജ്ജമാക്കുക",
    babySizePrefix: "കുഞ്ഞിന്റെ വലുപ്പം",
    babySizeFallback: "കുഞ്ഞിന്റെ വലുപ്പം ...",
    filterLabels: {
      All: "എല്ലാം",
      Nutrition: "പോഷണം",
      Exercise: "വ്യായാമം",
      Menth: "മാനസികം",
    },
    moodLabels: {
      HAPPY: "സന്തോഷം",
      CALM: "ശാന്തം",
      TIRED: "ക്ലാന്തി",
      ANXIOUS: "ആശങ്ക",
      EXCITED: "ആവേശം",
    },
    trimesterLabel: (week: number) => trimesterFromWeek(week),
  },
};

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
  const { db, profile, reminders, refreshProfile, refreshReminders, upsertProfile, feedActivity, toggleFeedLike, toggleFeedSave, selectedLanguage } = useApp();

  const [todayMood, setTodayMood] = useState<(typeof moods)[number]["emoji"]>("😰");
  const [dueDateInput, setDueDateInput] = useState("");
  const [dueDateValue, setDueDateValue] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [affirmation, setAffirmation] = useState("");
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const copy = homeCopy[selectedLanguage] ?? homeCopy.English;

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
  const journeyTrimester = hasDueDate ? copy.trimesterLabel(journeyWeek) : "";
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

  const visibleFeedItems = useMemo(() => {
    if (activeFilter === "All") {
      return healthFeedItems;
    }

    if (activeFilter === "Menth") {
      return healthFeedItems.filter((item) => item.section === "MENTAL HEALTH");
    }

    return healthFeedItems.filter((item) => item.section === activeFilter.toUpperCase());
  }, [activeFilter]);

  const onQuickSupportPress = (topic: string) => {
    const question =
      quickSupportPrompts[topic] ?? `I need guidance about ${topic.toLowerCase()} during pregnancy.`;

    router.push({
      pathname: "/(tabs)/chat",
      params: { q: question },
    });
  };

  const lastMoodKey = moods.find((m) => m.emoji === todayMood)?.label ?? "ANXIOUS";
  const lastMoodLabel = copy.moodLabels[lastMoodKey] ?? lastMoodKey;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakHomeSummary = async () => {
    const locale = localeForLanguage(selectedLanguage);
    const hasDueDate = !!dueDateValue;
    const summary = hasDueDate
      ? `Welcome to Maternal. You are ${copy.dueWeekTitle(journeyWeek)}. ${babySize ? `Baby is the size of ${babySize}.` : ""}`
      : `Welcome to Maternal. Set your due date to track your pregnancy journey.`;

    if (isSpeaking) {
      await stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      await speakText(summary, locale);
    } catch (err) {
      console.debug("TTS failed on Home", err);
    } finally {
      setIsSpeaking(false);
    }
  };

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
          <EmergencySupportButton onPress={() => router.push("/emergency")} />
          <TouchableOpacity style={styles.iconPillBtn} onPress={() => speakHomeSummary().catch(() => undefined)}>
            {isSpeaking ? <VolumeX size={16} color={colors.brand} /> : <Volume2 size={16} color={colors.brand} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>{hasDueDate ? copy.heroKicker : copy.welcomeTitle}</Text>
        <Text style={styles.heroTitle}>{hasDueDate ? copy.dueWeekTitle(journeyWeek) : copy.welcomeTitle}</Text>
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
          <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
        )}

        <View style={styles.heroActionsRow}>
          <View style={styles.dateInputWrap}>
            <TextInput
              value={dueDateInput}
              onChangeText={setDueDateInput}
              onSubmitEditing={onDueDateInputSubmit}
              onEndEditing={onDueDateInputSubmit}
              placeholder={copy.datePlaceholder}
              placeholderTextColor="rgba(255,255,255,0.9)"
              style={styles.dateInput}
            />
            <TouchableOpacity style={styles.dateCalendarBtn} onPress={() => setShowDatePicker(true)}>
              <CalendarDays size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.startChatBtn} onPress={() => router.push("/(tabs)/chat") }>
            <Text style={styles.startChatText}>{copy.startChat}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeadRow}>
        <Text style={styles.sectionHeadText}>{copy.howAreYouFeeling}</Text>
        <Text style={styles.sectionHeadLast}>{copy.lastMoodPrefix} <Text style={styles.sectionHeadLastValue}>{lastMoodLabel}</Text></Text>
      </View>

      <View style={styles.moodRow}>
        {moods.map((m) => {
          const active = m.emoji === todayMood;
          const moodLabel = copy.moodLabels[m.label] ?? m.label;
          return (
            <View key={m.label} style={styles.moodItem}>
              <TouchableOpacity style={[styles.moodButton, active && styles.moodButtonActive]} onPress={() => persistMood(m.emoji)}>
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
              </TouchableOpacity>
              <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{moodLabel}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.surfaceCard}>
        <View style={styles.surfaceIconWrap}>
          <Sparkles size={18} color={colors.brand} />
        </View>
        <View style={styles.surfaceTextWrap}>
          <Text style={styles.surfaceTag}>{copy.dailyInsight}</Text>
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
          <Text style={styles.surfaceTagMuted}>{copy.nextAppointment}</Text>
          <Text style={styles.surfaceBodyMuted}>{nextAppointment ? displayDate(nextAppointment.remind_at) : copy.noUpcomingVisits}</Text>
        </View>
        <ChevronRight size={16} color="#C7C7CC" />
      </TouchableOpacity>

      <View style={styles.feedHeadWrap}>
        <Text style={styles.feedHeadTitle}>{copy.healthFeed}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((f) => {
            const active = f === activeFilter;
            return (
              <TouchableOpacity key={f} style={[styles.filterPill, active && styles.filterPillActive]} onPress={() => setActiveFilter(f)}>
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{copy.filterLabels[f] ?? f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {visibleFeedItems.map((item) => {
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
              <Text style={styles.readMore}>{copy.readMore}</Text>
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
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.dueDateCard}
          onPress={() => router.push("/(tabs)/profile")}
          accessibilityRole="button"
          accessibilityLabel="Open set due date"
          accessibilityHint="Opens profile settings where you can update your due date"
        >
          <Text style={styles.statsKicker}>{copy.pregnancy}</Text>
          <Text style={styles.dueDateTitle}>{hasDueDate ? copy.dueWeekTitle(journeyWeek) : copy.setDueDate}</Text>
          <Text style={styles.dueDateSub}>
            {hasDueDate ? (
              <>
                {copy.babySizePrefix} <Text style={styles.dueDateAccent}>{babySize}</Text>
              </>
            ) : (
              copy.babySizeFallback
            )}
          </Text>
          <View style={styles.dueDateProgressTrack}>
            <View style={[styles.dueDateProgressFill, { width: `${hasDueDate ? journeyProgress : 0}%` }]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.kickCard}
          onPress={() => router.push("/(tabs)/health")}
          accessibilityRole="button"
          accessibilityLabel="Open kick counter"
          accessibilityHint="Opens health screen to track baby kicks"
        >
          <View style={styles.kickIcon}>
            <Sparkles size={18} color="#F6A623" />
          </View>
          <Text style={styles.kickCount}>0 Kicks</Text>
          <Text style={styles.kickTitle}>Kick Counter</Text>
          <Text style={styles.kickSub}>Track baby's movement.</Text>
        </TouchableOpacity>
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
