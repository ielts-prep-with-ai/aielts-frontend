import React from 'react';
import { Pressable, ActivityIndicator, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface AnimatedButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  loadingColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  disabled = false,
  loading = false,
  children,
  style,
  hapticStyle = Haptics.ImpactFeedbackStyle.Medium,
  loadingColor = '#6C63FF',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled || loading) return;

    Haptics.impactAsync(hapticStyle);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: (disabled || loading) ? 0.5 : opacity.value,
  }));

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={loadingColor} /> : children}
    </AnimatedPressable>
  );
};
