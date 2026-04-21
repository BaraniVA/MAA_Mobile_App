import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ArrowLeft, Heart, Bookmark } from "lucide-react-native";

import { colors, fonts } from "@/constants/theme";
import { getHealthFeedItemBySlug } from "@/data/healthFeed";
import { useApp } from "@/context/AppContext";

export default function FeedDetailScreen() {
  const router = useRouter();
  const { feedActivity, toggleFeedLike, toggleFeedSave } = useApp();
  const params = useLocalSearchParams<{ slug?: string }>();

  const slug = typeof params.slug === "string" ? params.slug : "";
  const item = getHealthFeedItemBySlug(slug);
  const activity = feedActivity.find((entry) => entry.slug === slug);
  const isLiked = activity?.liked === 1;
  const isSaved = activity?.saved === 1;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color="#7483A3" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => toggleFeedLike(slug).catch(() => undefined)}>
              <Heart size={16} color={isLiked ? colors.brand : "#BBC4D9"} fill={isLiked ? colors.brand : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => toggleFeedSave(slug).catch(() => undefined)}>
              <Bookmark size={16} color={isSaved ? colors.brand : "#BBC4D9"} fill={isSaved ? colors.brand : "transparent"} />
            </TouchableOpacity>
          </View>
        </View>

        {!item ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Article not found</Text>
            <Text style={styles.emptyText}>This feed item is unavailable.</Text>
            <TouchableOpacity style={styles.backCta} onPress={() => router.back()}>
              <Text style={styles.backCtaText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Image source={{ uri: item.image }} style={styles.heroImage} />

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.section}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaAccent}>{item.stage}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>

            <View style={styles.card}>
              {item.body.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Key Tips</Text>
              {item.bulletPoints.map((point) => (
                <Text key={point} style={styles.bullet}>• {point}</Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  headerRow: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7EBF4",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7EBF4",
  },
  emptyWrap: {
    marginTop: 40,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E7EBF4",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    color: "#1E2A49",
    fontSize: 19,
  },
  emptyText: {
    color: "#8795B4",
    fontSize: 14,
  },
  backCta: {
    marginTop: 6,
    backgroundColor: colors.brand,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backCtaText: {
    color: colors.white,
    fontWeight: "700",
  },
  heroImage: {
    marginTop: 8,
    width: "100%",
    height: 220,
    borderRadius: 28,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#8D9AB6",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  metaDot: {
    color: "#CAD1E0",
    fontSize: 10,
  },
  metaAccent: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    marginTop: 2,
    color: "#1E2A49",
    fontFamily: fonts.serif,
    fontSize: 30 / 1.5,
    lineHeight: 30,
  },
  subtitle: {
    color: "#7385AA",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9EDF5",
    gap: 10,
  },
  paragraph: {
    color: "#3A4A6C",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  sectionTitle: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bullet: {
    color: "#304061",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
});
