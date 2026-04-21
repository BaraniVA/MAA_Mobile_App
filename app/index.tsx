import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

export default function IndexRoute() {
  const { loadingProfile, profile } = useApp();

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.rose} />
      </View>
    );
  }

  if (!profile) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ivory,
  },
});
