import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { AlertTriangle } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

type EmergencySupportButtonProps = {
  onPress: () => void;
};

export function EmergencySupportButton({ onPress }: EmergencySupportButtonProps) {
  const { t } = useApp();

  return (
    <Pressable
      style={styles.emergencyPillBtn}
      onPress={onPress}
      onLongPress={() => Alert.alert(t("sos_alert_title"), t("sos_alert_body"), [{ text: "OK" }])}
      delayLongPress={250}
      pressRetentionOffset={12}
      accessibilityRole="button"
      accessibilityLabel={t("sos_alert_title")}
      accessibilityHint={t("sos_alert_body")}
      hitSlop={10}
    >
      <AlertTriangle size={14} color={colors.white} />
      <Text style={styles.emergencyPillText}>SOS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  emergencyPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: colors.brand,
    maxWidth: 84,
    overflow: "hidden",
  },
  emergencyPillText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    maxWidth: 44,
    overflow: "hidden",
  },
});