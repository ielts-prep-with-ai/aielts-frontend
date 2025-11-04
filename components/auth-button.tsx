import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type AuthButtonProps = PressableProps & {
  title: string;
  lightColor?: string;
  darkColor?: string;
};

export function AuthButton({
  title,
  lightColor,
  darkColor,
  style,
  ...rest
}: AuthButtonProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'tint'
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        pressed && styles.pressed,
        style,
      ]}
      {...rest}>
      <ThemedText
        style={styles.text}
        lightColor="#fff"
        darkColor="#000">
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
