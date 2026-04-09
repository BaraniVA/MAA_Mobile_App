import { Redirect } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useApp } from "@/context/AppContext";
import { colors } from "@/constants/theme";

export default function IndexRoute() {
  const { loadingProfile, profile } = useApp();

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.charcoal} />
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
    backgroundColor: colors.ivory,
    alignItems: "center",
    justifyContent: "center"
  }
});
