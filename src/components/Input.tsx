import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { colors, borders, shadows, radius, fonts, spacing } from '@/constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
  [key: string]: any;
}

export const Input = ({ label, placeholder, value, onChangeText, style, ...props }: InputProps) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.charcoalMuted}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.charcoalSoft,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 14,
    padding: 10,
    backgroundColor: colors.white,
    color: colors.charcoal,
    borderRadius: radius.sm,
    ...borders.default,
    ...shadows.sm,
  },
});
