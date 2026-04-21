import { View, Text, StyleSheet } from "react-native";
import { colors, borders, radius, spacing } from "@/constants/theme";

type Props = {
  message: string;
  type?: "error" | "info";
};

export function InlineToast({ message, type = "info" }: Props) {
  return (
    <View
      style={[
        styles.container,
        type === "error" ? styles.errorContainer : styles.infoContainer
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...borders.default,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md
  },
  errorContainer: {
    backgroundColor: colors.blush,
    borderStyle: "dashed"
  },
  infoContainer: {
    backgroundColor: colors.ivory
  },
  text: {
    color: colors.charcoal,
    fontSize: 12
  }
});
