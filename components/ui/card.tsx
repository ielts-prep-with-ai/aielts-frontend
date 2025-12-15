import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  highlighted?: boolean;
}

export function Card({ children, onPress, style, highlighted = false }: CardProps) {
  const Component = onPress ? Pressable : View;

  return (
    <Component
      style={[styles.card, highlighted && styles.highlighted, style]}
      onPress={onPress}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  highlighted: {
    backgroundColor: '#3BB9F0',
  },
});
