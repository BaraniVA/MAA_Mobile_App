import { useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { InlineToast } from "@/components/InlineToast";
import { PregnancyIllustration } from "@/components/PregnancyIllustration";
import { colors, borders, shadows, radius, spacing } from "@/constants/theme";

const welcomeNotes = ["Daily check-ins", "Prenatal support", "Calm reminders"];

export default function OnboardingScreen() {
  const { upsertProfile } = useApp();
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const begin = async () => {
    if (!name.trim() || !dueDate.trim()) {
      setError("Please enter your name and due date (YYYY-MM-DD).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await upsertProfile({ name: name.trim(), dueDate: dueDate.trim() });
      router.replace("/(tabs)");
    } catch {
      setError("Could not save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brandPill}>
          <Text style={styles.brandPillText}>Maa</Text>
        </View>
        <Text style={styles.title}>Welcome, mama</Text>
        <Text style={styles.subtitle}>
          A soft, steady space for pregnancy tracking, reassurance, and daily care that feels human instead of clinical.
        </Text>

        <View style={styles.heroArt}>
          <PregnancyIllustration variant="compact" />
        </View>

        <View style={styles.noteRow}>
          {welcomeNotes.map((item) => (
            <View key={item} style={styles.noteChip}>
              <Text style={styles.noteText}>{item}</Text>
            </View>
          ))}
        </View>

        {error ? <InlineToast type="error" message={error} /> : null}

        <Text style={styles.label}>Your first name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Priya"
          placeholderTextColor="#7A7A7A"
          style={styles.input}
        />

        <Text style={styles.label}>Due date</Text>
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#7A7A7A"
          style={styles.input}
        />

        <TouchableOpacity onPress={begin} disabled={loading} style={styles.button}>
          <Text style={styles.buttonText}>{loading ? "Saving..." : "Begin"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.xl
  },
  scrollContent: {
    paddingVertical: spacing.xxxl
  },
  brandPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.roseDeep,
    ...borders.default,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md
  },
  brandPillText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  title: {
    color: colors.charcoal,
    fontSize: 34,
    fontFamily: "PlayfairDisplay_600SemiBold",
    marginBottom: spacing.sm
  },
  subtitle: {
    color: colors.charcoalSoft,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.xl
  },
  heroArt: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    ...borders.default,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.default
  },
  noteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl
  },
  noteChip: {
    backgroundColor: colors.blush,
    ...borders.default,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  noteText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 11
  },
  label: {
    color: colors.charcoalSoft,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginBottom: spacing.xs
  },
  input: {
    backgroundColor: colors.white,
    ...borders.default,
    borderRadius: radius.md,
    color: colors.charcoal,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontFamily: "Inter_400Regular"
  },
  button: {
    backgroundColor: colors.rose,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    ...shadows.default,
    ...borders.default
  },
  buttonText: {
    color: colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16
  }
});
