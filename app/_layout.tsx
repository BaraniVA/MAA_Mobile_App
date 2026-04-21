import { Slot } from "expo-router";
import { ActivityIndicator, StyleSheet, View, LogBox } from "react-native";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "Expo AV has been deprecated"
]);
import { SQLiteProvider } from "expo-sqlite";
import { useFonts as useDMSansFonts, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { useFonts as usePlayfairFonts, PlayfairDisplay_400Regular, PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/theme";
import { initDatabase } from "@/db/schema";
import { AppProvider } from "@/context/AppContext";

export default function RootLayout() {
  const [dmSansLoaded] = useDMSansFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold
  });

  const [playfairLoaded] = usePlayfairFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold
  });

  if (!dmSansLoaded || !playfairLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.rose} />
      </View>
    );
  }

  return (
    <SQLiteProvider databaseName="maa.db" onInit={initDatabase}>
      <AppProvider>
        <StatusBar style="dark" />
        <Slot />
      </AppProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.ivory,
    alignItems: "center",
    justifyContent: "center"
  }
});

