import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borders, shadows, radius, fonts } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({ title, onPress, type = 'primary', style, textStyle }: ButtonProps) => {
  const getStyles = () => {
    switch (type) {
      case 'secondary':
        return {
          container: { backgroundColor: colors.sage },
          text: { color: colors.charcoal },
        };
      case 'ghost':
        return {
          container: { backgroundColor: colors.white },
          text: { color: colors.charcoal },
        };
      default:
        return {
          container: { backgroundColor: colors.rose },
          text: { color: colors.white },
        };
    }
  };

  const currentStyle = getStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.base, currentStyle.container, style]}
    >
      <Text style={[styles.text, currentStyle.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.sm,
    ...borders.default,
    ...shadows.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
  },
});
