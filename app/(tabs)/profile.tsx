import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import { useFocusEffect } from "@react-navigation/native";
import { Card } from "@/components/Card";
import { InlineToast } from "@/components/InlineToast";
import { colors, inkBorder, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getStats } from "@/db/helpers";
import { formatDateTimeLocal, pregnancyWeek } from "@/services/date";

const repeats: Array<"none" | "daily" | "weekly"> = ["none", "daily", "weekly"];

export default function ProfileScreen() {
  const { db, profile, upsertProfile, reminders, upsertReminder, removeReminder } = useApp();

  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [bloodType, setBloodType] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [voices, setVoices] = useState<string[]>([]);
  const [preferredVoice, setPreferredVoice] = useState("default");
  const [showPicker, setShowPicker] = useState(false);
  const [toast, setToast] = useState("");
  const [stats, setStats] = useState({ entriesCount: 0, daysTracked: 0, currentStreak: 0 });

  const [title, setTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [editId, setEditId] = useState<number | undefined>(undefined);

  const loadVoices = async () => {
    try {
      const root = `${FileSystem.bundleDirectory}assets/voices`;
      const files = await FileSystem.readDirectoryAsync(root);
      const onnx = files.filter((f) => f.endsWith(".onnx"));
      setVoices(onnx.length ? onnx : ["default"]);
    } catch {
      setVoices(["default"]);
    }
  };

  const refreshStats = useCallback(async () => {
    const result = await getStats(db);
    setStats(result);
  }, [db]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setDueDate(new Date(profile.due_date));
    setBloodType(profile.blood_type || "");
    setDoctorName(profile.doctor_name || "");
    setDoctorPhone(profile.doctor_phone || "");
    setPreferredVoice(profile.preferred_voice || "default");
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      loadVoices().catch(() => undefined);
      refreshStats().catch(() => undefined);
    }, [refreshStats])
  );

  const saveProfileForm = async () => {
    try {
      await upsertProfile({
        name: name.trim(),
        dueDate: dueDate.toISOString().slice(0, 10),
        bloodType,
        doctorName,
        doctorPhone,
        preferredVoice
      });
      setToast("Profile saved.");
    } catch {
      setToast("Failed to save profile.");
    }
  };

  const saveReminderForm = async () => {
    if (!title || !reminderDate || !reminderTime) {
      setToast("Please fill title, date and time for reminder.");
      return;
    }

    try {
      await upsertReminder({
        id: editId,
        title,
        remindAt: formatDateTimeLocal(reminderDate, reminderTime),
        repeat
      });
      setTitle("");
      setReminderDate("");
      setReminderTime("");
      setRepeat("none");
      setEditId(undefined);
      setToast("Reminder saved.");
    } catch {
      setToast("Unable to save reminder.");
    }
  };

  const week = pregnancyWeek(dueDate.toISOString().slice(0, 10));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {toast ? <InlineToast message={toast} /> : null}

      <Text style={styles.title}>Profile</Text>
      <Card>
        <Text style={styles.label}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your name" placeholderTextColor="#7A7A7A" />

        <Text style={styles.label}>Due date</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.inputButton}>
          <Text style={styles.inputText}>{dueDate.toISOString().slice(0, 10)}</Text>
        </TouchableOpacity>
        {showPicker ? (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, selected) => {
              setShowPicker(Platform.OS === "ios");
              if (selected) setDueDate(selected);
            }}
          />
        ) : null}

        <Text style={styles.weekText}>Pregnancy week: {week}</Text>

        <Text style={styles.label}>Blood type</Text>
        <TextInput value={bloodType} onChangeText={setBloodType} style={styles.input} placeholder="e.g. O+" placeholderTextColor="#7A7A7A" />

        <Text style={styles.label}>Doctor name</Text>
        <TextInput value={doctorName} onChangeText={setDoctorName} style={styles.input} placeholder="Doctor name" placeholderTextColor="#7A7A7A" />

        <Text style={styles.label}>Doctor phone</Text>
        <TextInput value={doctorPhone} onChangeText={setDoctorPhone} style={styles.input} placeholder="Phone" placeholderTextColor="#7A7A7A" keyboardType="phone-pad" />

        <Text style={styles.label}>Preferred voice</Text>
        <View style={styles.voiceList}>
          {voices.length === 0 ? <ActivityIndicator color={colors.charcoal} /> : null}
          {voices.map((voice) => (
            <TouchableOpacity
              key={voice}
              onPress={() => setPreferredVoice(voice)}
              style={[styles.voiceItem, preferredVoice === voice && styles.voiceItemActive]}
            >
              <Text style={styles.voiceText}>{voice}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={saveProfileForm} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save Profile</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.sectionTitle}>Reminders</Text>
      <Card>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Reminder title" placeholderTextColor="#7A7A7A" />
        <View style={styles.row}>
          <TextInput value={reminderDate} onChangeText={setReminderDate} style={[styles.input, { flex: 1 }]} placeholder="YYYY-MM-DD" placeholderTextColor="#7A7A7A" />
          <TextInput value={reminderTime} onChangeText={setReminderTime} style={[styles.input, { flex: 1 }]} placeholder="HH:MM" placeholderTextColor="#7A7A7A" />
        </View>

        <View style={styles.rowWrap}>
          {repeats.map((item) => (
            <TouchableOpacity key={item} onPress={() => setRepeat(item)} style={[styles.repeatBtn, repeat === item && styles.repeatActive]}>
              <Text style={styles.repeatText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={saveReminderForm} style={styles.saveBtn}>
          <Text style={styles.saveText}>{editId ? "Update Reminder" : "Add Reminder"}</Text>
        </TouchableOpacity>
      </Card>

      {reminders.map((reminder) => (
        <Card key={reminder.id}>
          <Text style={styles.remTitle}>{reminder.title}</Text>
          <Text style={styles.remMeta}>{reminder.remind_at}</Text>
          <Text style={styles.remMeta}>Repeat: {reminder.repeat}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => {
                setEditId(reminder.id);
                setTitle(reminder.title);
                const [date, time] = reminder.remind_at.split("T");
                setReminderDate(date);
                setReminderTime(time.slice(0, 5));
                setRepeat(reminder.repeat);
              }}
            >
              <Text style={styles.smallBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, { backgroundColor: colors.blush }]} onPress={() => removeReminder(reminder.id)}>
              <Text style={styles.smallBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      <Text style={styles.sectionTitle}>Data</Text>
      <View style={styles.row}>
        <Card style={styles.metric}><Text style={styles.metricValue}>{stats.entriesCount}</Text><Text style={styles.metricLabel}>Entries</Text></Card>
        <Card style={styles.metric}><Text style={styles.metricValue}>{stats.daysTracked}</Text><Text style={styles.metricLabel}>Days</Text></Card>
        <Card style={styles.metric}><Text style={styles.metricValue}>{stats.currentStreak}</Text><Text style={styles.metricLabel}>Streak</Text></Card>
      </View>
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
  title: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 30,
    marginBottom: spacing.md
  },
  sectionTitle: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 24,
    marginBottom: spacing.sm
  },
  label: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    fontSize: 11,
    marginBottom: spacing.xs
  },
  input: {
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.md
  },
  inputButton: {
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm
  },
  inputText: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular"
  },
  weekText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    marginBottom: spacing.md
  },
  voiceList: {
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  voiceItem: {
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  voiceItemActive: {
    backgroundColor: colors.sage
  },
  voiceText: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 12
  },
  saveBtn: {
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
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center"
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  repeatBtn: {
    ...inkBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  repeatActive: {
    backgroundColor: colors.sage
  },
  repeatText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 12
  },
  remTitle: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold",
    marginBottom: spacing.xs
  },
  remMeta: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginBottom: spacing.xs
  },
  smallBtn: {
    backgroundColor: colors.sage,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs
  },
  smallBtnText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 12
  },
  metric: {
    flex: 1,
    alignItems: "center"
  },
  metricValue: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 26
  },
  metricLabel: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase"
  }
});
