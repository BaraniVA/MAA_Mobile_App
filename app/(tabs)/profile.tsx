import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { AlertTriangle, Heart, Settings, UserRound, Volume2 } from "lucide-react-native";
import { LanguageSelector } from "@/components/LanguageSelector";

import { colors, fonts } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { healthFeedItems } from "@/data/healthFeed";
import { pregnancyWeek } from "@/services/date";

const milestones = [
  { title: "First Ultrasound", week: "WEEK 12" },
  { title: "Anatomy Scan", week: "WEEK 20" },
  { title: "Glucose Test", week: "WEEK 24" },
  { title: "Third Trimester", week: "WEEK 28" },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, feedActivity } = useApp();
  const [activityTab, setActivityTab] = useState<"liked" | "saved">("liked");

  const week = profile?.due_date ? pregnancyWeek(profile.due_date) : 24;
  const displayName = profile?.name?.trim() ? profile.name : "Mama Bear";

  const progress = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Math.round((week / 40) * 100)));
    return pct;
  }, [week]);

  const likedItems = useMemo(() => {
    const likedSet = new Set(feedActivity.filter((item) => item.liked === 1).map((item) => item.slug));
    return healthFeedItems.filter((item) => likedSet.has(item.slug));
  }, [feedActivity]);

  const savedItems = useMemo(() => {
    const savedSet = new Set(feedActivity.filter((item) => item.saved === 1).map((item) => item.slug));
    return healthFeedItems.filter((item) => savedSet.has(item.slug));
  }, [feedActivity]);

  const visibleActivity = activityTab === "liked" ? likedItems : savedItems;

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

      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <UserRound size={36} color={colors.white} />
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Settings size={14} color="#AAB5CB" />
        </TouchableOpacity>

        <Text style={styles.nameText}>{displayName}</Text>
        <Text style={styles.weekText}>{week} WEEKS PREGNANT</Text>
      </View>

      <View style={styles.journeyHead}>
        <Text style={styles.sectionTitle}>YOUR JOURNEY</Text>
        <Text style={styles.completeText}>% COMPLETE</Text>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.progressMetaRow}>
          <Text style={styles.progressMeta}>WEEK 1</Text>
          <Text style={styles.progressCount}>0 / 40</Text>
          <Text style={styles.progressMeta}>WEEK 40</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarBase} />
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.progressLabelsRow}>
          <Text style={styles.progressLabel}>CONCEPTION</Text>
          <Text style={styles.progressLabel}>TRIMESTER 2</Text>
          <Text style={styles.progressLabel}>DUEDATE</Text>
        </View>

        <View style={styles.trimesterRow}>
          <View style={styles.trimesterIcon}>
            <Heart size={14} color={colors.brand} />
          </View>
          <View style={styles.trimesterTextWrap}>
            <Text style={styles.trimesterTitle}>Third Trimester</Text>
            <Text style={styles.trimesterSub}>WEEK 28 - 40</Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>

        <View style={styles.timelineWrap}>
          {milestones.map((item, idx) => (
            <View key={item.title} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
                {idx < milestones.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineWeek}>{item.week}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.activityHead}>
        <Text style={styles.sectionTitle}>YOUR ACTIVITY</Text>
      </View>

      <View style={styles.activityCard}>
        <View style={styles.activityTabsRow}>
          <TouchableOpacity
            style={[styles.activityTabBtn, activityTab === "liked" && styles.activityTabBtnActive]}
            onPress={() => setActivityTab("liked")}
          >
            <Text style={[styles.activityTabText, activityTab === "liked" && styles.activityTabTextActive]}>LIKED</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.activityTabBtn, activityTab === "saved" && styles.activityTabBtnActive]}
            onPress={() => setActivityTab("saved")}
          >
            <Text style={[styles.activityTabText, activityTab === "saved" && styles.activityTabTextActive]}>SAVED</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {visibleActivity.length === 0 ? (
            <Text style={styles.activityEmptyText}>No {activityTab} feeds yet.</Text>
          ) : (
            visibleActivity.map((item) => (
              <View key={item.slug} style={styles.activityRow}>
                <View style={styles.activityBullet} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityMeta}>{item.section} • {item.stage}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.bottomPad} />
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
  avatarSection: {
    alignItems: "center",
    marginTop: 12,
    position: "relative",
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 7,
  },
  settingsBtn: {
    position: "absolute",
    top: 62,
    right: 118,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EAEFF8",
    alignItems: "center",
    justifyContent: "center",
  },
  nameText: {
    marginTop: 14,
    fontFamily: fonts.serif,
    fontSize: 34 / 2,
    fontStyle: "italic",
    color: "#1D2E52",
  },
  weekText: {
    marginTop: 8,
    color: "#8EA0C2",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  journeyHead: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#8EA0C2",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },
  completeText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  journeyCard: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    overflow: "hidden",
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  progressMetaRow: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressMeta: {
    color: "#8193B3",
    fontSize: 12,
    fontWeight: "800",
  },
  progressCount: {
    color: "#657BA4",
    fontSize: 13,
    fontWeight: "900",
  },
  progressBarTrack: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  progressBarBase: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EFF3F9",
  },
  progressBarFill: {
    position: "absolute",
    left: 20,
    top: 0,
    bottom: 0,
    borderRadius: 7,
    backgroundColor: "#DDE4F1",
    height: 14,
  },
  progressLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
  },
  progressLabel: {
    color: "#C0CADE",
    fontSize: 9,
    fontWeight: "800",
  },
  trimesterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
  },
  trimesterIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E8EDF6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  trimesterTextWrap: {
    flex: 1,
  },
  trimesterTitle: {
    color: "#1F2B4D",
    fontSize: 28 / 2,
    fontWeight: "800",
    marginBottom: 3,
  },
  trimesterSub: {
    color: "#8EA0C2",
    fontSize: 11,
    fontWeight: "800",
  },
  activeBadge: {
    backgroundColor: "#FFE7ED",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadgeText: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "800",
  },
  timelineWrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 56,
  },
  timelineLeft: {
    width: 28,
    alignItems: "center",
    marginRight: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D8DEEB",
    marginTop: 4,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E7ECF5",
    marginTop: 2,
  },
  timelineTitle: {
    color: "#8598BA",
    fontSize: 15 / 1.02,
    fontWeight: "700",
    marginBottom: 2,
  },
  timelineWeek: {
    color: "#A3B1CC",
    fontSize: 11,
    fontWeight: "800",
  },
  activityHead: {
    marginTop: 12,
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    padding: 14,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  activityTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  activityTabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F7F9FF",
    borderWidth: 1,
    borderColor: "#E8EDF8",
    alignItems: "center",
    justifyContent: "center",
  },
  activityTabBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  activityTabText: {
    color: "#8EA0C2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  activityTabTextActive: {
    color: colors.white,
  },
  activityList: {
    gap: 10,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
  },
  activityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  activityTextWrap: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
    paddingBottom: 10,
  },
  activityTitle: {
    color: "#1F2B4D",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  activityMeta: {
    color: "#8EA0C2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  activityEmptyText: {
    color: "#9CA9C4",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 16,
  },
  bottomPad: {
    height: 18,
  },
});
