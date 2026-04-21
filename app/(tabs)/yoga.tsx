import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { AlertTriangle, Heart, Play, RotateCcw, Volume2, Activity, VolumeX } from "lucide-react-native";
import { LanguageSelector } from "@/components/LanguageSelector";

import { addSession } from "@/db/helpers";
import { useApp } from "@/context/AppContext";
import { formatToday } from "@/services/date";
import { colors, fonts } from "@/constants/theme";

type PoseItem = {
  id: string;
  title: string;
  seconds: number;
  image: string;
  benefit: string;
};

const poses: PoseItem[] = [
  {
    id: "strength-builder",
    title: "Strength Builder",
    seconds: 300,
    image: "https://images.unsplash.com/photo-1593810450967-f9c42742e326?auto=format&fit=crop&w=1200&q=80",
    benefit: "Improves overall body strength and flexibility for easy labor.",
  },
  {
    id: "side-stretch",
    title: "Side Stretch",
    seconds: 240,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
    benefit: "Relieves back pressure and opens your rib cage for deeper breathing.",
  },
];

export default function YogaScreen() {
  const router = useRouter();
  const { db } = useApp();

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(poses[0].seconds);
  const [running, setRunning] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);

  const pose = poses[index];

  useEffect(() => {
    setRemaining(pose.seconds);
    setRunning(false);
  }, [pose.id, pose.seconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((value) => value - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running, remaining]);

  useEffect(() => {
    if (remaining !== 0) return;
    setRunning(false);

    addSession(db, {
      date: formatToday(),
      posesCompleted: [pose.title],
      durationSeconds: pose.seconds,
    }).catch(() => undefined);
  }, [db, pose.seconds, pose.title, remaining]);

  const timerText = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  const onPrimaryAction = () => {
    if (remaining <= 0) {
      setRemaining(pose.seconds);
      setRunning(true);
      return;
    }
    setRunning((value) => !value);
  };

  const onReset = () => {
    setRunning(false);
    setRemaining(pose.seconds);
  };

  const onNextPose = () => {
    const next = index + 1;
    if (next >= poses.length) return;
    setIndex(next);
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
          <TouchableOpacity style={styles.emergencyPillBtn} onPress={() => router.push("/emergency") }>
            <AlertTriangle size={14} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconPillBtn}>
            <Volume2 size={16} color={colors.brand} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.pageTitle}>Pregnancy Yoga</Text>

      <View style={styles.cardWrap}>
        <View style={styles.poseHead}>
          <Text style={styles.poseTitle}>🧘  {pose.title}{"\n"}(Step {index + 1})</Text>

          <View style={styles.timerPill}>
            <Activity size={16} color={colors.brand} />
            <Text style={styles.timerPillText}>{timerText}</Text>
          </View>
        </View>

        <View style={styles.videoWrap}>
          <Image source={{ uri: pose.image }} style={styles.videoImage} />
          {!running && (
            <TouchableOpacity style={styles.playOverlayBtn} onPress={onPrimaryAction}>
              <Play size={30} color={colors.brand} fill={colors.brand} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.benefitCard}>
          <Text style={styles.benefitText}>{pose.benefit}</Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.startBtn} onPress={onPrimaryAction}>
            {running ? <VolumeX size={22} color={colors.white} /> : <Play size={22} color={colors.white} fill={colors.white} />}
            <Text style={styles.startBtnText}>{running ? "Pause" : "Start"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onReset}>
            <RotateCcw size={18} color="#8CA0C2" />
            <Text style={styles.secondaryBtnTitle}>RESET</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setVoiceOn((v) => !v)}>
            <Volume2 size={18} color={voiceOn ? colors.brand : "#8CA0C2"} />
            <Text style={[styles.secondaryBtnTitle, voiceOn && styles.voiceOnText]}>VOICE</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextPoseBtn} onPress={onNextPose}>
          <Text style={styles.nextPoseText}>Next Pose</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  pageTitle: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: fonts.serif,
    color: "#1D2E52",
    fontSize: 22,
    fontStyle: "italic",
  },
  cardWrap: {
    backgroundColor: colors.white,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  poseHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  poseTitle: {
    color: "#13284E",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 27,
    flex: 1,
    paddingRight: 8,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: "#FFE1EA",
    borderRadius: 18,
    height: 36,
    paddingHorizontal: 11,
  },
  timerPillText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  videoWrap: {
    height: 170,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    marginBottom: 12,
  },
  videoImage: {
    width: "100%",
    height: "100%",
  },
  playOverlayBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F4E9EE",
    backgroundColor: "#FFFCFD",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  benefitText: {
    color: colors.brand,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  startBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 7,
  },
  startBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryBtn: {
    width: 64,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#F5F8FF",
    borderWidth: 1,
    borderColor: "#E7EDF8",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  secondaryBtnTitle: {
    color: "#90A2C1",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  voiceOnText: {
    color: colors.brand,
  },
  nextPoseBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF7",
    backgroundColor: "#F9FBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  nextPoseText: {
    color: "#2A416A",
    fontSize: 15,
    fontWeight: "800",
  },
});
