import { useCallback, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  Check,
  Heart,
  Mic,
  Plus,
  Trash2,
  Volume2,
  X,
} from "lucide-react-native";
import { LanguageSelector } from "@/components/LanguageSelector";

import { colors, fonts } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { addSymptomLog, getKickCount, getSymptomLogsByDate, getTodayEntry, setKickCount, upsertEntry } from "@/db/helpers";
import { formatToday } from "@/services/date";

const severities = ["MILD", "MODERATE", "SEVERE"] as const;

function parseSymptomEntry(value: string) {
  const match = value.match(/^(.*)\s\((MILD|MODERATE|SEVERE)\)$/i);
  if (!match) {
    return { label: value, level: "MILD" as (typeof severities)[number] };
  }

  return {
    label: match[1].trim(),
    level: match[2].toUpperCase() as (typeof severities)[number],
  };
}

export default function HealthScreen() {
  const router = useRouter();
  const { db } = useApp();

  const [kicks, setKicks] = useState(0);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [symptomType, setSymptomType] = useState("");
  const [severity, setSeverity] = useState<(typeof severities)[number]>("MILD");
  const [notes, setNotes] = useState("");
  const [symptomLogs, setSymptomLogs] = useState<Array<{ symptom: string; severity: (typeof severities)[number]; notes: string }>>([]);

  const today = formatToday();
  const dateDisplay = new Date().toLocaleDateString("en-US");

  const load = useCallback(async () => {
    const [entry, logs, kicksCount] = await Promise.all([
      getTodayEntry(db, today),
      getSymptomLogsByDate(db, today),
      getKickCount(db, today),
    ]);

    setKicks(kicksCount);

    if (logs.length > 0) {
      setSymptomLogs(
        logs.map((item) => ({
          symptom: item.symptom,
          severity: item.severity,
          notes: item.notes ?? "",
        }))
      );
      setSymptoms(logs.map((item) => `${item.symptom} (${item.severity})`));
      return;
    }

    if (entry?.symptoms) {
      try {
        const parsedSymptoms = JSON.parse(entry.symptoms) as string[];
        setSymptoms(parsedSymptoms);
        setSymptomLogs(
          parsedSymptoms.map((item) => {
            const parsed = parseSymptomEntry(item);
            return {
              symptom: parsed.label,
              severity: parsed.level,
              notes: entry.notes ?? "",
            };
          })
        );
      } catch {
        setSymptoms([]);
        setSymptomLogs([]);
      }
    } else {
      setSymptoms([]);
      setSymptomLogs([]);
    }
  }, [db, today]);

  const persistKickCount = (nextCount: number) => {
    setKicks(nextCount);
    setKickCount(db, today, nextCount).catch(() => undefined);
  };

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  const saveSymptom = async () => {
    const value = symptomType.trim();
    if (!value) return;

    const entry = await getTodayEntry(db, today);
    const existingSymptoms: string[] = entry?.symptoms ? JSON.parse(entry.symptoms) : [];
    const nextSymptoms = [...existingSymptoms, `${value} (${severity})`];

    const nextNote = notes.trim() || entry?.notes || "";

    await upsertEntry(db, {
      date: today,
      mood: entry?.mood ?? "😌",
      energy: entry?.energy ?? 3,
      symptoms: nextSymptoms,
      notes: nextNote,
      waterGlasses: entry?.water_glasses ?? 0,
      weight: entry?.weight ?? null,
    });

    await addSymptomLog(db, {
      date: today,
      symptom: value,
      severity,
      notes: notes.trim(),
    });

    setSymptoms(nextSymptoms);
    setSymptomLogs((prev) => [{ symptom: value, severity, notes: notes.trim() }, ...prev]);
    setSymptomType("");
    setNotes("");
    setSeverity("MILD");
    setShowModal(false);
  };

  const symptomCards = symptomLogs.slice(0, 4).map((item, idx) => ({
    id: `${item.symptom}-${idx}`,
    label: item.symptom,
    level: item.severity,
    notes: item.notes,
  }));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Symptom Tracker</Text>
            <Text style={styles.subtitle}>MONITOR YOUR WELL-BEING</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Plus size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.kickCard}>
          <View style={styles.kickTopRow}>
            <View>
              <Text style={styles.kickTitle}>Kick Counter</Text>
              <Text style={styles.kickSub}>TRACK BABY'S MOVEMENTS</Text>
            </View>
            <Text style={styles.kickCount}>{kicks} KICKS</Text>
          </View>

          <View style={styles.kickActionsRow}>
            <TouchableOpacity style={styles.recordKickBtn} onPress={() => persistKickCount(kicks + 1)}>
              <Heart size={16} color={colors.white} fill={colors.white} />
              <Text style={styles.recordKickText}>Record a Kick</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetKickBtn} onPress={() => persistKickCount(0)}>
              <Trash2 size={16} color="#C7D2E7" />
            </TouchableOpacity>
          </View>
        </View>

        {symptoms.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Activity size={20} color="#D0D9EA" />
            </View>
            <Text style={styles.emptyText}>No symptoms tracked yet</Text>
            <TouchableOpacity onPress={() => setShowModal(true)}>
              <Text style={styles.emptyLink}>Log your first symptom</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.journalWrap}>
            <View style={styles.journalHead}>
              <Text style={styles.journalTitle}>TODAY'S JOURNAL ENTRIES</Text>
              <Text style={styles.journalCount}>{symptoms.length} logged</Text>
            </View>
            <View style={styles.journalList}>
              {symptomCards.map((item) => {
                const badgeStyle =
                  item.level === "SEVERE"
                    ? styles.severeBadge
                    : item.level === "MODERATE"
                    ? styles.moderateBadge
                    : styles.mildBadge;

                return (
                  <View key={item.id} style={styles.journalCard}>
                    <View style={styles.journalIconWrap}>
                      <AlertCircle size={16} color="#7B8FB6" />
                    </View>
                    <View style={styles.journalBody}>
                      <Text style={styles.journalSymptom}>{item.label}</Text>
                      <Text style={styles.journalMeta}>Logged today</Text>
                      {item.notes ? <Text style={styles.journalNote}>{item.notes}</Text> : null}
                    </View>
                    <View style={[styles.severityBadge, badgeStyle]}>
                      <Text style={styles.severityBadgeText}>{item.level}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={showModal} animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalPinkBar} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Symptom</Text>
                <Text style={styles.modalSub}>TRACK HOW YOU'RE FEELING</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <X size={18} color="#A2AFC7" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>SYMPTOM TYPE</Text>
            <View style={styles.inputWrap}>
              <Activity size={16} color="#CBD5E8" />
              <TextInput
                value={symptomType}
                onChangeText={setSymptomType}
                placeholder="e.g. Nausea, Fatigue"
                placeholderTextColor="#C3CCDE"
                style={styles.inlineInput}
              />
              <Mic size={14} color="#C3CCDE" />
            </View>

            <Text style={styles.fieldLabel}>SEVERITY</Text>
            <View style={styles.severityRow}>
              {severities.map((item) => {
                const active = item === severity;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.severityBtn, active && styles.severityBtnActive]}
                    onPress={() => setSeverity(item)}
                  >
                    <Text style={[styles.severityText, active && styles.severityTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>DATE</Text>
            <View style={styles.dateInputWrap}>
              <CalendarDays size={16} color="#C3CCDE" />
              <Text style={styles.dateText}>{dateDisplay}</Text>
              <CalendarDays size={14} color="#111827" />
            </View>

            <View style={styles.notesHeader}>
              <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
              <Text style={styles.voiceInputText}>VOICE INPUT</Text>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any details..."
              placeholderTextColor="#B9C3D7"
              style={styles.notesInput}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={() => saveSymptom().catch(() => undefined)}>
              <Check size={15} color={colors.white} />
              <Text style={styles.saveBtnText}>Save Symptom</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  content: {
    paddingTop: 18,
    paddingHorizontal: 16,
    gap: 14,
    paddingBottom: 24,
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
    fontSize: 16,
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
    position: "relative",
    zIndex: 140,
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
  titleRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: fonts.serif,
    color: "#1D2E52",
    fontSize: 34 / 2,
    fontStyle: "italic",
  },
  subtitle: {
    marginTop: 6,
    color: "#8EA0C2",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  kickCard: {
    backgroundColor: colors.white,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    padding: 18,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  kickTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  kickTitle: {
    fontFamily: fonts.serif,
    color: "#1F2B4D",
    fontSize: 31 / 2,
    fontStyle: "italic",
  },
  kickSub: {
    marginTop: 6,
    color: "#8FA1C1",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  kickCount: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  kickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recordKickBtn: {
    flex: 1,
    height: 52,
    borderRadius: 24,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  recordKickText: {
    color: colors.white,
    fontSize: 22 / 2,
    fontWeight: "800",
  },
  resetKickBtn: {
    width: 52,
    height: 52,
    borderRadius: 24,
    backgroundColor: "#F7FAFF",
    borderWidth: 1,
    borderColor: "#ECF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    gap: 8,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F7FAFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyText: {
    color: "#9DAAC4",
    fontSize: 15 / 1.1,
    textAlign: "center",
  },
  emptyLink: {
    color: colors.brand,
    fontSize: 15 / 1.1,
    fontWeight: "700",
    textAlign: "center",
  },
  symptomItemText: {
    color: "#4B5E86",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  journalWrap: {
    marginTop: 8,
    gap: 10,
  },
  journalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  journalTitle: {
    color: "#8EA0C2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  journalCount: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "800",
  },
  journalList: {
    gap: 10,
  },
  journalCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9EEF7",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  journalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F7FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  journalBody: {
    flex: 1,
    gap: 2,
  },
  journalSymptom: {
    color: "#243456",
    fontSize: 15,
    fontWeight: "800",
  },
  journalMeta: {
    color: "#8FA1C1",
    fontSize: 11,
    fontWeight: "700",
  },
  journalNote: {
    marginTop: 4,
    color: "#64789E",
    fontSize: 12,
    lineHeight: 17,
    fontStyle: "italic",
  },
  severityBadge: {
    minWidth: 76,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  mildBadge: {
    backgroundColor: "#ECF8F2",
    borderColor: "#CFEEDC",
  },
  moderateBadge: {
    backgroundColor: "#FFF6E9",
    borderColor: "#F4E2BF",
  },
  severeBadge: {
    backgroundColor: "#FFF0F4",
    borderColor: "#FFD3DF",
  },
  severityBadgeText: {
    color: "#5A6F97",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(67, 76, 98, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 36,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    overflow: "hidden",
  },
  modalPinkBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "#FF8BAA",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 6,
  },
  modalTitle: {
    fontFamily: fonts.serif,
    color: "#1D2E52",
    fontSize: 36 / 2,
    fontStyle: "italic",
  },
  modalSub: {
    marginTop: 5,
    color: "#8EA0C2",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    marginTop: 8,
    marginBottom: 8,
    color: "#8EA0C2",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  inputWrap: {
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E7EDF8",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineInput: {
    flex: 1,
    color: "#3F5074",
    fontSize: 15 / 1.08,
    fontWeight: "600",
  },
  severityRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  severityBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7EDF8",
    backgroundColor: "#F8FBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  severityBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  severityText: {
    color: "#8EA0C2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  severityTextActive: {
    color: colors.white,
  },
  dateInputWrap: {
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E7EDF8",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateText: {
    flex: 1,
    color: "#3F5074",
    fontSize: 14,
    fontWeight: "700",
  },
  notesHeader: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voiceInputText: {
    color: "#8EA0C2",
    fontSize: 11,
    fontWeight: "800",
  },
  notesInput: {
    minHeight: 86,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E7EDF8",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#3F5074",
    fontSize: 14,
    marginBottom: 14,
  },
  saveBtn: {
    height: 50,
    borderRadius: 21,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },
});