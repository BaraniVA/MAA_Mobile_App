import { View, StyleSheet } from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from "react-native-svg";

import { colors, radius } from "@/constants/theme";

type PregnancyIllustrationProps = {
  variant?: "hero" | "compact";
};

export function PregnancyIllustration({ variant = "hero" }: PregnancyIllustrationProps) {
  const compact = variant === "compact";

  return (
    <View style={[styles.frame, compact ? styles.compactFrame : styles.heroFrame]}>
      <Svg width="100%" height="100%" viewBox="0 0 320 220">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFF7EE" />
            <Stop offset="100%" stopColor="#F6D9D1" />
          </LinearGradient>
          <LinearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#D9E6D7" />
            <Stop offset="100%" stopColor="#C0D2BE" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width="320" height="220" rx="28" fill="url(#sky)" />

        <Circle cx="266" cy="52" r="28" fill="rgba(228, 184, 108, 0.45)" />
        <Circle cx="262" cy="46" r="10" fill="rgba(255,255,255,0.5)" />

        <Path
          d="M0 170 C52 148, 108 156, 150 176 C184 192, 228 196, 320 160 L320 220 L0 220 Z"
          fill="url(#horizon)"
        />

        <Path
          d="M122 165 C106 149, 104 123, 120 103 C136 83, 165 74, 192 80 C218 85, 236 104, 242 129 C248 154, 242 170, 225 180 C200 194, 154 191, 122 165 Z"
          fill="#FFFDFC"
          stroke={colors.charcoal}
          strokeWidth="2.5"
        />

        <Circle cx="155" cy="88" r="22" fill="#F4D5D0" stroke={colors.charcoal} strokeWidth="2.5" />
        <Path
          d="M143 119 C147 110, 165 106, 176 110 C191 115, 197 128, 195 141 C193 157, 184 168, 166 172 C150 176, 131 170, 124 155 C119 144, 122 129, 132 122"
          fill="#FBE9E4"
          stroke={colors.charcoal}
          strokeWidth="2.5"
        />

        <Circle cx="214" cy="142" r="24" fill="#E4B86C" opacity="0.85" stroke={colors.charcoal} strokeWidth="2.5" />
        <Path d="M202 142 C207 133, 220 132, 225 141 C229 148, 223 158, 214 163 C205 158, 198 149, 202 142 Z" fill="#FFFDFC" />

        <Ellipse cx="96" cy="132" rx="21" ry="13" fill="#C9D9C6" opacity="0.82" stroke={colors.charcoal} strokeWidth="2" />
        <Path d="M82 132 C90 118, 104 114, 117 121" fill="none" stroke={colors.charcoal} strokeWidth="2" strokeLinecap="round" />

        <Path
          d="M54 184 C74 174, 92 176, 108 182"
          fill="none"
          stroke={colors.rose}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Path
          d="M112 182 L121 182 L128 170 L137 194 L146 160 L155 182 L164 182"
          fill="none"
          stroke={colors.rose}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Path
          d="M170 182 C188 176, 206 176, 224 182"
          fill="none"
          stroke={colors.rose}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.charcoal,
    backgroundColor: colors.white
  },
  heroFrame: {
    width: "100%",
    height: 220,
    marginBottom: 0
  },
  compactFrame: {
    width: "100%",
    height: 180
  }
});
