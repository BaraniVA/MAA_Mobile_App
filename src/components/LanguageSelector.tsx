import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Globe } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { supportedLanguages, useApp } from "@/context/AppContext";

export function LanguageSelector() {
  const { selectedLanguage, setSelectedLanguage } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pillBtn} onPress={() => setOpen((v) => !v)}>
        <Globe size={13} color={colors.brand} />
        <Text style={styles.pillBtnText}>{selectedLanguage}</Text>
      </TouchableOpacity>

      {open ? (
        <View style={styles.languageMenu}>
          {supportedLanguages.map((language) => {
            const active = language === selectedLanguage;
            return (
              <TouchableOpacity
                key={language}
                style={[styles.languageOption, active && styles.languageOptionActive]}
                onPress={() => {
                  setSelectedLanguage(language);
                  setOpen(false);
                }}
              >
                <Text style={[styles.languageOptionText, active && styles.languageOptionTextActive]}>{language}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
  },
  pillBtn: {
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F6FA",
    borderWidth: 1,
    borderColor: "#ECECF1",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillBtnText: {
    color: "#596079",
    fontSize: 11,
    fontWeight: "700",
  },
  languageMenu: {
    position: "absolute",
    top: 38,
    right: 0,
    width: 124,
    backgroundColor: "rgba(255, 239, 245, 0.96)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFDDE8",
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 40,
    zIndex: 1200,
  },
  languageOption: {
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  languageOptionActive: {
    backgroundColor: "#FFEFF4",
  },
  languageOptionText: {
    color: "#1F2B4D",
    fontSize: 12,
    fontWeight: "600",
  },
  languageOptionTextActive: {
    color: colors.brand,
    fontWeight: "800",
  },
});
