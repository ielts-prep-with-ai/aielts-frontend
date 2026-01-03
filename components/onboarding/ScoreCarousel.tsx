import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CAROUSEL_ITEM_WIDTH, CAROUSEL_PADDING } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScoreCarouselProps {
  onScoreSelect: (score: number) => void;
  initialScore?: number;
  scoreType: 'target' | 'current';
  label: string;
  helperText?: string;
  minScore?: number;
  maxScore?: number;
}

const PROFICIENCY_LABELS: Record<'target' | 'current', Record<number, string>> = {
  target: {
    1: 'Very Limited',
    2: 'Very Limited',
    3: 'Beginner',
    4: 'Limited',
    5: 'Moderate',
    6: 'Competent',
    7: 'Good',
    8: 'Advanced',
    9: 'Expert',
  },
  current: {
    0: 'Not Tested Yet',
    1: 'Very Limited',
    2: 'Very Limited',
    3: 'Beginner',
    4: 'Limited',
    5: 'Moderate',
    6: 'Competent',
    7: 'Good',
    8: 'Advanced',
    9: 'Expert',
  },
};

export const ScoreCarousel: React.FC<ScoreCarouselProps> = ({
  onScoreSelect,
  initialScore,
  scoreType,
  label,
  helperText,
  minScore = scoreType === 'current' ? 0 : 1,
  maxScore = 9,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const activeIndex = useSharedValue(
    initialScore !== undefined ? initialScore - minScore : scoreType === 'target' ? 4 : 0
  );
  const scores = Array.from({ length: maxScore - minScore + 1 }, (_, i) => i + minScore);

  useEffect(() => {
    // Scroll to initial position after mount
    const initialIndex = initialScore !== undefined ? initialScore - minScore : scoreType === 'target' ? 4 : 0;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: initialIndex * CAROUSEL_ITEM_WIDTH,
        animated: false,
      });
    }, 100);
  }, []);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleScoreSelect = (index: number) => {
    const score = scores[index];
    onScoreSelect(score);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const newIndex = Math.round(event.contentOffset.x / CAROUSEL_ITEM_WIDTH);
      if (newIndex !== activeIndex.value && newIndex >= 0 && newIndex < scores.length) {
        runOnJS(triggerHaptic)();
        activeIndex.value = newIndex;
      }
    },
  });

  const onMomentumScrollEnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const index = activeIndex.value;
    handleScoreSelect(index);
  };

  const currentScore = scores[Math.round(scrollX.value / CAROUSEL_ITEM_WIDTH)] || scores[0];
  const proficiencyLabel = PROFICIENCY_LABELS[scoreType][currentScore] || '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.carouselContainer}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CAROUSEL_ITEM_WIDTH}
          snapToAlignment="center"
          decelerationRate="fast"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          contentContainerStyle={{
            paddingHorizontal: CAROUSEL_PADDING,
          }}
        >
          {scores.map((score, index) => (
            <ScoreItem
              key={score}
              score={score}
              index={index}
              scrollX={scrollX}
            />
          ))}
        </Animated.ScrollView>

        {/* Selection indicator line */}
        <View style={styles.centerLine} />
      </View>

      {/* Proficiency label */}
      <Animated.View style={styles.proficiencyContainer}>
        <Text style={styles.proficiencyLabel}>{proficiencyLabel}</Text>
      </Animated.View>

      {helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

interface ScoreItemProps {
  score: number;
  index: number;
  scrollX: Animated.SharedValue<number>;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ score, index, scrollX }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];

    // Scale: 0.7 → 1.0 → 0.7
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1.0, 0.7],
      Extrapolation.CLAMP
    );

    // Opacity: 0.3 → 1.0 → 0.3
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1.0, 0.3],
      Extrapolation.CLAMP
    );

    // Translate Y: 20 → 0 → 20
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [20, 0, 20],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CAROUSEL_ITEM_WIDTH,
      index * CAROUSEL_ITEM_WIDTH,
      (index + 1) * CAROUSEL_ITEM_WIDTH,
    ];

    const shadowOpacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 0.6, 0],
      Extrapolation.CLAMP
    );

    const shadowRadius = interpolate(
      scrollX.value,
      inputRange,
      [0, 20, 0],
      Extrapolation.CLAMP
    );

    const borderOpacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 0.8, 0.3],
      Extrapolation.CLAMP
    );

    return {
      shadowOpacity,
      shadowRadius,
      borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
    };
  });

  return (
    <Animated.View style={[styles.scoreItem, animatedStyle]}>
      <Animated.View style={[styles.scoreCircle, glowStyle]}>
        <Text style={styles.scoreText}>{score}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  carouselContainer: {
    height: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  scoreItem: {
    width: CAROUSEL_ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  scoreText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 2,
    height: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ translateX: -1 }, { translateY: -50 }],
  },
  proficiencyContainer: {
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proficiencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
