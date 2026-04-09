import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

function Icon({ label, active }: { label: string; active: boolean }) {
  return <Text style={[styles.icon, active && styles.iconActive]}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white
        },
        headerTitleStyle: {
          color: colors.charcoal,
          fontFamily: "PlayfairDisplay_500Medium"
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1.5,
          borderTopColor: colors.charcoal,
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: colors.charcoal,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <Icon label="🏠" active={focused} />
        }}
      />
      <Tabs.Screen
        name="entry"
        options={{
          title: "Entry",
          tabBarIcon: ({ focused }) => <Icon label="📓" active={focused} />
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => <Icon label="✦" active={focused} />
        }}
      />
      <Tabs.Screen
        name="yoga"
        options={{
          title: "Yoga",
          tabBarIcon: ({ focused }) => <Icon label="🧘" active={focused} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <Icon label="👤" active={focused} />
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 16,
    color: colors.charcoal
  },
  iconActive: {
    color: colors.rose
  }
});
