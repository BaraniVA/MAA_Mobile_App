export const colors = {
  white: "#FFFFFF",
  ivory: "#FAF7F2",
  blush: "#F2D4CC",
  sage: "#C8D8C0",
  charcoal: "#2C2C2C",
  rose: "#C9847A"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const radius = {
  sm: 8,
  md: 12,
  pill: 100
};

export const inkBorder = {
  borderWidth: 1.5,
  borderColor: colors.charcoal
} as const;

export const inkShadow = {
  shadowColor: colors.charcoal,
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2
} as const;

export const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.md,
  borderWidth: 1.5,
  borderColor: colors.charcoal,
  shadowColor: colors.charcoal,
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2
} as const;

import Constants from "expo-constants";
const ip = Constants.expoConfig?.hostUri?.split(":")[0] || "10.0.2.2";
export const apiBaseUrl = `http://${ip}:8000`;
