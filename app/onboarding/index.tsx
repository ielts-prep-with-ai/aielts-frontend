import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Dimensions, Pressable } from 'react-native';
import Swiper from 'react-native-swiper';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';
import { UsersService } from '@/services';
import { ScoreCarousel } from '@/components/onboarding/ScoreCarousel';
import { DatePickerButton } from '@/components/onboarding/DatePickerButton';
import { AnimatedButton } from '@/components/onboarding/AnimatedButton';
import { CelebrationOverlay } from '@/components/onboarding/CelebrationOverlay';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const swiperRef = useRef<Swiper>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Form data
  const [username, setUsername] = useState('');
  const [targetScore, setTargetScore] = useState(7);
  const [currentScore, setCurrentScore] = useState(5);
  const [examDate, setExamDate] = useState<Date | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = () => {
    // Validate current screen
    if (currentIndex === 0 && !username.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }

    setErrorMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swiperRef.current?.scrollBy(1);
  };

  const handleComplete = async () => {
    setErrorMessage('');
    setIsSaving(true);

    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[ONBOARDING] Saving user profile...');
      console.log('═══════════════════════════════════════════════════════════');

      const updateData: any = {
        user_name: username.trim(),
        target_score: targetScore,
        current_level: currentScore,
      };

      if (examDate) {
        const formattedDate = examDate.toISOString().split('T')[0];
        updateData.test_date = formattedDate;
      }

      console.log('[ONBOARDING] Update data:', updateData);
      console.log('[ONBOARDING] Data types:', {
        user_name: typeof updateData.user_name,
        target_score: typeof updateData.target_score,
        current_level: typeof updateData.current_level,
      });

      await UsersService.updateProfile(updateData);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[ONBOARDING] ✅ Profile saved successfully');
      console.log('═══════════════════════════════════════════════════════════');

      setShowCelebration(true);
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[ONBOARDING] ❌ Failed to save profile');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[ONBOARDING] Error:', error);

      if (error instanceof Error) {
        console.error('[ONBOARDING] Error message:', error.message);
        console.error('[ONBOARDING] Error stack:', error.stack);
      }

      console.error('═══════════════════════════════════════════════════════════');

      const errorMsg = error instanceof Error ? error.message : 'Failed to save your profile. Please try again.';
      console.error('[ONBOARDING] ⚠️  SHOWING ERROR TO USER:', errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCelebrationComplete = () => {
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={['#6C63FF', '#4A47A3']}
      style={styles.container}
    >
      <Swiper
        ref={swiperRef}
        loop={false}
        showsPagination={false}
        scrollEnabled={false}
        onIndexChanged={setCurrentIndex}
      >
        {/* Screen 1: Username */}
        <View style={styles.slide}>
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(600).delay(200)}
              style={styles.illustrationContainer}
            >
              <View style={styles.iconCircle}>
                <IconSymbol name="person.fill" size={64} color="#6C63FF" />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(600).delay(300)}
              style={styles.title}
            >
              What's your name?
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(600).delay(400)}
              style={styles.subtitle}
            >
              Let's get to know you
            </Animated.Text>

            <Animated.View
              entering={FadeIn.duration(600).delay(500)}
              style={styles.inputContainer}
            >
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <IconSymbol name="exclamationmark.circle" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </View>

        {/* Screen 2: Target Score */}
        <View style={styles.slide}>
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.illustrationContainer}
            >
              <View style={styles.iconCircle}>
                <IconSymbol name="target" size={64} color="#6C63FF" />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(600)}
              style={styles.title}
            >
              Your Target
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(600)}
              style={styles.subtitle}
            >
              What band score are you aiming for?
            </Animated.Text>

            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.carouselContainer}
            >
              <ScoreCarousel
                onScoreSelect={setTargetScore}
                initialScore={targetScore}
                scoreType="target"
                label=""
                minScore={1}
                maxScore={9}
              />
            </Animated.View>
          </View>
        </View>

        {/* Screen 3: Current Score */}
        <View style={styles.slide}>
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.illustrationContainer}
            >
              <View style={styles.iconCircle}>
                <IconSymbol name="chart.bar.fill" size={64} color="#6C63FF" />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(600)}
              style={styles.title}
            >
              Current Level
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(600)}
              style={styles.subtitle}
            >
              What do you think is your current score?
            </Animated.Text>

            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.carouselContainer}
            >
              <ScoreCarousel
                onScoreSelect={setCurrentScore}
                initialScore={currentScore}
                scoreType="current"
                label=""
                minScore={0}
                maxScore={9}
              />
            </Animated.View>
          </View>
        </View>

        {/* Screen 4: Exam Date */}
        <View style={styles.slide}>
          <View style={styles.content}>
            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.illustrationContainer}
            >
              <View style={styles.iconCircle}>
                <IconSymbol name="calendar" size={64} color="#6C63FF" />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInDown.duration(600)}
              style={styles.title}
            >
              Test Date
            </Animated.Text>

            <Animated.Text
              entering={FadeInDown.duration(600)}
              style={styles.subtitle}
            >
              When is your IELTS exam? (Optional)
            </Animated.Text>

            <Animated.View
              entering={FadeIn.duration(600)}
              style={styles.dateContainer}
            >
              <DatePickerButton
                value={examDate}
                onChange={setExamDate}
                label=""
                helperText="We'll help you prepare better"
              />
              {errorMessage && (
                <View style={styles.errorContainer}>
                  <IconSymbol name="exclamationmark.circle" size={16} color="#FF6B6B" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </View>
      </Swiper>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                currentIndex === index && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <View style={styles.buttonContainer}>
          {currentIndex < 3 ? (
            <AnimatedButton
              onPress={handleNext}
              style={styles.nextButton}
            >
              <Text style={styles.buttonText}>Next</Text>
              <IconSymbol name="arrow.right" size={20} color="#fff" />
            </AnimatedButton>
          ) : (
            <AnimatedButton
              onPress={handleComplete}
              disabled={isSaving}
              loading={isSaving}
              style={styles.getStartedButton}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </AnimatedButton>
          )}
        </View>
      </View>

      <CelebrationOverlay
        visible={showCelebration}
        onComplete={handleCelebrationComplete}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    width,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    alignItems: 'center',
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    gap: 16,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  carouselContainer: {
    width: '100%',
    marginTop: 20,
  },
  dateContainer: {
    width: '100%',
    gap: 16,
    marginTop: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  buttonContainer: {
    alignItems: 'flex-end',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  getStartedButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
});
