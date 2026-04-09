import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Card } from "@/components/Card";
import { colors, inkBorder, radius, spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { addSession, getWeeklyStreak } from "@/db/helpers";
import { formatToday } from "@/services/date";

type Pose = {
  id: string;
  name: string;
  trimester: string;
  durationSeconds: number;
  description: string;
};

const poses: Pose[] = [
  { id: "butterfly", name: "Butterfly Pose", trimester: "1, 2, 3", durationSeconds: 300, description: "Sit upright, soles together, breathe and soften hips." },
  { id: "catcow", name: "Cat Cow", trimester: "1, 2, 3", durationSeconds: 180, description: "On all fours, alternate arching and rounding your spine." },
  { id: "child", name: "Supported Child Pose", trimester: "1, 2, 3", durationSeconds: 240, description: "Use pillows for belly support and rest your forehead." },
  { id: "warrior2", name: "Gentle Warrior II", trimester: "2, 3", durationSeconds: 180, description: "Widen stance, soften shoulders, breathe steadily." },
  { id: "sideangle", name: "Bound Side Angle", trimester: "2", durationSeconds: 180, description: "Use a block for support and keep torso long." },
  { id: "squat", name: "Yogi Squat Support", trimester: "2, 3", durationSeconds: 240, description: "Heels grounded with a block under hips if needed." },
  { id: "legsup", name: "Legs Up the Wall", trimester: "1, 2", durationSeconds: 300, description: "Relax and reduce swelling with calm breaths." },
  { id: "savasana", name: "Side-Lying Savasana", trimester: "2, 3", durationSeconds: 360, description: "Rest on left side with pillow support." }
];

function BreathingGuide({ title, inhale, hold, exhale, hold2 }: { title: string; inhale: number; hold: number; exhale: number; hold2: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: inhale * 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.25, duration: hold * 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: exhale * 1000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: hold2 * 1000, useNativeDriver: true })
      ])
    );

    cycle.start();
    return () => cycle.stop();
  }, [exhale, hold, hold2, inhale, scale]);

  return (
    <Card>
      <Text style={styles.breathTitle}>{title}</Text>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
      <Text style={styles.breathMeta}>Inhale {inhale}s · Hold {hold}s · Exhale {exhale}s · Hold {hold2}s</Text>
    </Card>
  );
}

export default function YogaScreen() {
  const { db } = useApp();
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [activePose, setActivePose] = useState<Pose | null>(null);
  const [remaining, setRemaining] = useState(0);

  const load = useCallback(async () => {
    const streak = await getWeeklyStreak(db);
    setWeeklyStreak(streak);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => undefined);
    }, [load])
  );

  useEffect(() => {
    if (!activePose || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activePose, remaining]);

  useEffect(() => {
    if (!activePose || remaining > 0) return;

    addSession(db, {
      date: formatToday(),
      posesCompleted: [activePose.name],
      durationSeconds: activePose.durationSeconds
    })
      .then(load)
      .catch(() => undefined)
      .finally(() => setActivePose(null));
  }, [activePose, db, load, remaining]);

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Prenatal Yoga</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{weeklyStreak} day streak</Text>
          </View>
        </View>

        {poses.map((pose) => (
          <Card key={pose.id}>
            <View style={styles.poseHeader}>
              <View style={styles.poseIcon}><Text>🧘</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.poseName}>{pose.name}</Text>
                <Text style={styles.poseMeta}>Trimester {pose.trimester} · {Math.round(pose.durationSeconds / 60)} min</Text>
              </View>
              <TouchableOpacity
                style={styles.beginBtn}
                onPress={() => {
                  setActivePose(pose);
                  setRemaining(pose.durationSeconds);
                }}
              >
                <Text style={styles.beginText}>Begin</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.poseDescription}>{pose.description}</Text>
          </Card>
        ))}

        <Text style={styles.section}>Breathing Exercise</Text>
        <BreathingGuide title="4-7-8 breath" inhale={4} hold={7} exhale={8} hold2={0} />
        <BreathingGuide title="Box breathing" inhale={4} hold={4} exhale={4} hold2={4} />
      </ScrollView>

      <Modal visible={!!activePose} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>{activePose?.name}</Text>
            <Text style={styles.modalTimer}>{remaining}s</Text>
            <Text style={styles.modalDesc}>{activePose?.description}</Text>
            <TouchableOpacity onPress={() => setActivePose(null)} style={styles.endBtn}>
              <Text style={styles.endText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  title: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 30,
    color: colors.charcoal
  },
  streakBadge: {
    backgroundColor: colors.sage,
    ...inkBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  streakText: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 11
  },
  poseHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm
  },
  poseIcon: {
    width: 52,
    height: 52,
    backgroundColor: colors.sage,
    ...inkBorder,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  poseName: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 18
  },
  poseMeta: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 12
  },
  beginBtn: {
    backgroundColor: colors.rose,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  beginText: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold"
  },
  poseDescription: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20
  },
  section: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_500Medium",
    fontSize: 22,
    marginVertical: spacing.md
  },
  breathTitle: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textTransform: "uppercase",
    marginBottom: spacing.md
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    ...inkBorder,
    backgroundColor: colors.sage,
    alignSelf: "center",
    marginBottom: spacing.md
  },
  breathMeta: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    textAlign: "center"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,44,44,0.25)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  modalPanel: {
    width: "100%",
    backgroundColor: colors.sage,
    ...inkBorder,
    borderRadius: radius.md,
    padding: spacing.xl
  },
  modalTitle: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 30,
    marginBottom: spacing.md
  },
  modalTimer: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold",
    fontSize: 46,
    marginBottom: spacing.md
  },
  modalDesc: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: spacing.lg
  },
  endBtn: {
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    alignItems: "center",
    paddingVertical: spacing.md
  },
  endText: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold"
  }
});
