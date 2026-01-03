import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CELEBRATION_CONFIG } from './styles';

interface CelebrationOverlayProps {
  visible: boolean;
  onComplete: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate checkmark
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 100 }),
        withSpring(1, { damping: 8, stiffness: 150 })
      );

      rotate.value = withSequence(
        withTiming(360, { duration: 600 }),
        withTiming(0, { duration: 0 })
      );

      opacity.value = withTiming(1, { duration: 300 });

      // Auto-dismiss after animation
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        setTimeout(onComplete, 300);
      }, CELEBRATION_CONFIG.duration);

      return () => clearTimeout(timer);
    } else {
      scale.value = 0;
      rotate.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` }
    ],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, animatedOverlayStyle]}>
      <Animated.View
        entering={ZoomIn.springify().damping(10)}
        style={styles.content}
      >
        {/* Success checkmark icon */}
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
          <View style={styles.iconBackground}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={CELEBRATION_CONFIG.iconSize}
              color="#4CAF50"
            />
          </View>
        </Animated.View>

        {/* Success text */}
        <Animated.Text
          entering={FadeInUp.delay(300).springify()}
          style={styles.successText}
        >
          All Set!
        </Animated.Text>

        <Animated.Text
          entering={FadeInUp.delay(400).springify()}
          style={styles.messageText}
        >
          Let's start your IELTS journey
        </Animated.Text>

        {/* Confetti particles */}
        {[...Array(8)].map((_, index) => (
          <ConfettiParticle key={index} index={index} />
        ))}
      </Animated.View>
    </Animated.View>
  );
};

interface ConfettiParticleProps {
  index: number;
}

const ConfettiParticle: React.FC<ConfettiParticleProps> = ({ index }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD700', '#FF69B4', '#7FDBFF'];
  const color = colors[index % colors.length];

  useEffect(() => {
    const angle = (index / 8) * Math.PI * 2;
    const distance = 100 + Math.random() * 50;

    opacity.value = withDelay(
      200 + index * 50,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 400 }))
      )
    );

    translateX.value = withDelay(
      200 + index * 50,
      withSpring(Math.cos(angle) * distance, { damping: 10, stiffness: 50 })
    );

    translateY.value = withDelay(
      200 + index * 50,
      withSpring(Math.sin(angle) * distance, { damping: 10, stiffness: 50 })
    );

    rotate.value = withDelay(
      200 + index * 50,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 1000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.confetti, animatedStyle, { backgroundColor: color }]} />
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    backgroundColor: '#fff',
    borderRadius: 60,
    padding: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  successText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
