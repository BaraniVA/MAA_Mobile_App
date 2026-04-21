import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { colors, shadows, fonts } from "@/constants/theme";
import { Home, MessageSquare, Calendar, Flower2, Activity, User } from "lucide-react-native";

function TabIcon({ label, active, Icon }: { label: string; active: boolean; Icon: any }) {
  return (
    <View style={styles.tabItem}>
      <Icon size={24} color={active ? colors.brand : colors.textMuted} fill={active && label === "HOME" ? colors.brand : "transparent"} />
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {active && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0.5,
          borderTopColor: '#F2F2F7',
          height: 90,
          paddingBottom: 25,
          paddingTop: 15,
          ...shadows.default,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="HOME" Icon={Home} active={focused} />
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="CHAT" Icon={MessageSquare} active={focused} />
        }}
      />
      <Tabs.Screen
        name="entry"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="PLAN" Icon={Calendar} active={focused} />
        }}
      />
      <Tabs.Screen
        name="yoga"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="YOGA" Icon={Flower2} active={focused} />
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="HEALTH" Icon={Activity} active={focused} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="PROFILE" Icon={User} active={focused} />
        }}
      />
      <Tabs.Screen
        name="feed/[slug]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 50,
  },
  tabLabel: {
    width: 56,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: colors.brand,
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.brand,
    marginTop: 2,
  }
});

