import { useState } from "react";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { InlineToast } from "@/components/InlineToast";
import { colors, inkBorder, inkShadow, radius, spacing } from "@/constants/theme";

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
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to Maa</Text>
        <Text style={styles.subtitle}>Your calm companion through every week of this beautiful journey.</Text>

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
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
    justifyContent: "center",
    padding: spacing.xxl
  },
  card: {
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.md,
    ...inkShadow,
    padding: spacing.xxl
  },
  title: {
    color: colors.charcoal,
    fontSize: 30,
    fontFamily: "PlayfairDisplay_600SemiBold",
    marginBottom: spacing.sm
  },
  subtitle: {
    color: colors.charcoal,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    marginBottom: spacing.xl
  },
  label: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginBottom: spacing.xs
  },
  input: {
    backgroundColor: colors.white,
    color: colors.charcoal,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontFamily: "Inter_400Regular"
  },
  button: {
    backgroundColor: colors.rose,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm
  },
  buttonText: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16
  }
});
