import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Card } from "@/components/Card";
import { InlineToast } from "@/components/InlineToast";
import { colors, inkBorder, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getEntries, getTodayEntry, upsertEntry } from "@/db/helpers";
import { Entry } from "@/types";
import { formatToday } from "@/services/date";

const baseSymptoms = ["nausea", "backache", "headache", "swelling", "heartburn", "cramps", "fatigue"];
const moods = ["😊", "🙂", "😐", "😔", "🤒"];

export default function EntryScreen() {
  const { db } = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [detail, setDetail] = useState<Entry | null>(null);
  const [mood, setMood] = useState("🙂");
  const [energy, setEnergy] = useState(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [notes, setNotes] = useState("");
  const [water, setWater] = useState(0);
  const [weight, setWeight] = useState("");
  const [toast, setToast] = useState("");

  const allSymptoms = useMemo(() => {
    const set = new Set([...baseSymptoms, ...symptoms.filter((s) => !baseSymptoms.includes(s))]);
    return Array.from(set);
  }, [symptoms]);

  const load = useCallback(async () => {
    const [history, today] = await Promise.all([getEntries(db), getTodayEntry(db, formatToday())]);
    setEntries(history);

    if (today) {
      setMood(today.mood);
      setEnergy(today.energy);
      setSymptoms(JSON.parse(today.symptoms));
      setNotes(today.notes ?? "");
      setWater(today.water_glasses);
      setWeight(today.weight ? String(today.weight) : "");
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => setToast("Unable to load entries."));
    }, [load])
  );

  const toggleSymptom = (value: string) => {
    setSymptoms((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const save = async () => {
    try {
      await upsertEntry(db, {
        date: formatToday(),
        mood,
        energy,
        symptoms,
        notes,
        waterGlasses: water,
        weight: weight ? Number(weight) : null
      });
      setToast("Entry saved.");
      await load();
    } catch {
      setToast("Failed to save entry.");
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {toast ? <InlineToast message={toast} /> : null}

      <Card>
        <Text style={styles.sectionTitle}>Today&apos;s log</Text>

        <Text style={styles.label}>Mood</Text>
        <View style={styles.rowWrap}>
          {moods.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.moodBtn, mood === emoji && styles.selected]}
              onPress={() => setMood(emoji)}
            >
              <Text style={styles.moodText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Energy</Text>
        <View style={styles.rowWrap}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.dot, energy >= value && styles.dotActive]}
              onPress={() => setEnergy(value)}
            />
          ))}
        </View>

        <Text style={styles.label}>Symptoms</Text>
        <View style={styles.rowWrap}>
          {allSymptoms.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleSymptom(item)}
              style={[styles.chip, symptoms.includes(item) && styles.chipActive]}
            >
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customRow}>
          <TextInput
            value={customSymptom}
            onChangeText={setCustomSymptom}
            placeholder="Add custom symptom"
            placeholderTextColor="#7A7A7A"
            style={[styles.input, { flex: 1 }]}
          />
          <TouchableOpacity
            onPress={() => {
              const next = customSymptom.trim().toLowerCase();
              if (!next) return;
              if (!symptoms.includes(next)) {
                setSymptoms((prev) => [...prev, next]);
              }
              setCustomSymptom("");
            }}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          style={[styles.input, styles.notes]}
          placeholder="How are you feeling today..."
          placeholderTextColor="#7A7A7A"
        />

        <View style={styles.rowSplit}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Water glasses</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity onPress={() => setWater((n) => Math.max(0, n - 1))} style={styles.stepperBtn}>
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{water}</Text>
              <TouchableOpacity onPress={() => setWater((n) => Math.min(8, n + 1))} style={styles.stepperBtn}>
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Weight (optional)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              style={styles.input}
              placeholder="kg"
              placeholderTextColor="#7A7A7A"
            />
          </View>
        </View>

        <TouchableOpacity onPress={save} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save Entry</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.sectionTitle}>History</Text>
      {entries.map((item) => {
        const parsed: string[] = JSON.parse(item.symptoms || "[]");
        return (
          <TouchableOpacity key={item.id} onPress={() => setDetail(item)} style={styles.historyCard}>
            <View style={styles.historyTop}>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text>{item.mood}</Text>
            </View>
            <View style={styles.rowWrap}>
              {parsed.slice(0, 3).map((symptom) => (
                <View key={symptom} style={styles.historyChip}>
                  <Text style={styles.historyChipText}>{symptom}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.historyNote}>{item.notes?.slice(0, 80) || "No notes"}</Text>
          </TouchableOpacity>
        );
      })}

      {detail ? (
        <Card>
          <View style={styles.historyTop}>
            <Text style={styles.sectionTitle}>Entry Detail</Text>
            <TouchableOpacity onPress={() => setDetail(null)}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.detailText}>Date: {detail.date}</Text>
          <Text style={styles.detailText}>Mood: {detail.mood}</Text>
          <Text style={styles.detailText}>Energy: {detail.energy}/5</Text>
          <Text style={styles.detailText}>Symptoms: {JSON.parse(detail.symptoms).join(", ") || "None"}</Text>
          <Text style={styles.detailText}>Notes: {detail.notes || "-"}</Text>
          <Text style={styles.detailText}>Water: {detail.water_glasses}</Text>
          <Text style={styles.detailText}>Weight: {detail.weight ?? "-"}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  sectionTitle: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 24,
    marginBottom: spacing.md
  },
  label: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    fontSize: 11,
    marginBottom: spacing.sm
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  moodBtn: {
    width: 40,
    height: 40,
    ...inkBorder,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white
  },
  moodText: {
    fontSize: 18
  },
  selected: {
    backgroundColor: colors.blush
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    ...inkBorder,
    backgroundColor: colors.white
  },
  dotActive: {
    backgroundColor: colors.sage
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...inkBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.white
  },
  chipActive: {
    backgroundColor: colors.sage
  },
  chipText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 12
  },
  customRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.md
  },
  addBtn: {
    backgroundColor: colors.sage,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  addBtnText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium"
  },
  input: {
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md
  },
  notes: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  rowSplit: {
    flexDirection: "row",
    gap: spacing.md
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  stepperBtn: {
    width: 32,
    height: 32,
    ...inkBorder,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white
  },
  stepperText: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    lineHeight: 20
  },
  stepperValue: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16
  },
  saveBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.rose,
    ...inkBorder,
    borderRadius: radius.sm,
    alignItems: "center",
    paddingVertical: spacing.md
  },
  saveText: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold"
  },
  historyCard: {
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm
  },
  historyDate: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium"
  },
  historyChip: {
    ...inkBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.blush
  },
  historyChipText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 10
  },
  historyNote: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 13
  },
  close: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline"
  },
  detailText: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.xs
  }
});
