export const colors = {
  white: "#FFFFFF",
  ivory: "#FEFBFB",
  brand: "#F92B5F",
  brandSoft: "rgba(249, 43, 95, 0.1)",
  brandGradient: ["#FF5F81", "#F92B5F"] as const,
  textPrimary: "#333333",
  textSecondary: "#8E8E93",
  textMuted: "#AEAEB2",
  bgFaint: "#F2F2F7",
  success: "#4CD964",
  border: "#E5E5EA",

  // Legacy tokens kept for existing screens.
  blush: "#F2D4CC",
  blushDeep: "#E8B9AD",
  sage: "#C8D8C0",
  sageDeep: "#A8C09A",
  rose: "#F92B5F",
  roseDeep: "#B06A60",
  charcoal: "#2C2C2C",
  charcoalSoft: "#4A4A4A",
  charcoalMuted: "#7A7A7A",
};

export const shadows = {
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  soft: {
    shadowColor: "#F92B5F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  inner: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  }
};

export const borders = {
  default: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  none: {
    borderWidth: 0,
  }
};

export const fonts = {
  serif: "PlayfairDisplay_600SemiBold", // Assuming these are loaded
  sans: "DMSans_400Regular",
  sansMedium: "DMSans_500Medium",
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
  lg: 16,
  pill: 100
};

export const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.md,
  ...borders.default,
  ...shadows.default,
} as const;

import Constants from "expo-constants";
const ip = Constants.expoConfig?.hostUri?.split(":")[0] || "10.0.2.2";
export const apiBaseUrl = `http://${ip}:8000`;
