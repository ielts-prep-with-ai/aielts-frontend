import { StyleSheet, ScrollView, View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { QuestionsService } from '@/services/questions.service';
import { ExamsService } from '@/services/exams.service';
import { QuestionDetail } from '@/services/types';

interface RecordingData {
  uri: string;
  questionId: number;
  part: number;
}

export default function TestQuestionScreen() {
  const router = useRouter();
  const {
    testId,
    mode,
    testSessionId,
    part1: part1Param,
    part2: part2Param,
    part3: part3Param,
    timeLimit,
    autoSubmit
  } = useLocalSearchParams<{
    testId: string;
    mode: string;
    testSessionId: string;
    part1: string;
    part2: string;
    part3: string;
    timeLimit: string;
    autoSubmit?: string;
  }>();

  // Parse question IDs from params
  console.log('[TestQuestion] Params received:', {
    testId,
    mode,
    testSessionId,
    part1Param,
    part2Param,
    part3Param,
    timeLimit
  });

  const part1Ids: number[] = part1Param ? JSON.parse(part1Param) : [];
  const part2Ids: number[] = part2Param ? JSON.parse(part2Param) : [];
  const part3Ids: number[] = part3Param ? JSON.parse(part3Param) : [];

  console.log('[TestQuestion] Parsed IDs:', { part1Ids, part2Ids, part3Ids });

  // Determine initial part based on which parts have questions
  const getInitialPart = () => {
    if (part1Ids.length > 0) return 1;
    if (part2Ids.length > 0) return 2;
    if (part3Ids.length > 0) return 3;
    return 1;
  };

  const [currentPart, setCurrentPart] = useState(getInitialPart());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [questions, setQuestions] = useState<Record<number, QuestionDetail>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [part2ThinkingTime, setPart2ThinkingTime] = useState(60);
  const [isThinkingPart2, setIsThinkingPart2] = useState(false);
  const [hasSeenPart2Thinking, setHasSeenPart2Thinking] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const part2ThinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load all questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const allQuestionIds = [...part1Ids, ...part2Ids, ...part3Ids];

        console.log('[TestQuestion] Loading questions:', {
          part1Ids,
          part2Ids,
          part3Ids,
          allQuestionIds
        });

        if (allQuestionIds.length === 0) {
          setError('No questions found for this test');
          setLoading(false);
          return;
        }

        // Load all questions using individual requests in parallel
        const questionPromises = allQuestionIds.map(id => QuestionsService.getQuestion(id));
        const questionDetails = await Promise.all(questionPromises);

        console.log('[TestQuestion] Loaded question details:', questionDetails);

        const questionsMap: Record<number, QuestionDetail> = {};
        questionDetails.forEach((q: any, index) => {
          // Handle both 'id' and 'question_id' field names
          const questionId = q.question_id || q.id;

          if (!q || !questionId) {
            console.error(`[TestQuestion] Invalid question at index ${index}:`, q);
            return;
          }

          // Normalize the question object to always have question_id
          const normalizedQuestion: QuestionDetail = {
            question_id: questionId,
            part: q.part,
            question_text: q.question_text,
            topic_tag_id: q.topic_tag_id,
            topic_id: q.topic_id,
            topic_name: q.topic_name,
            tag_name: q.tag_name
          };

          questionsMap[questionId] = normalizedQuestion;
        });

        setQuestions(questionsMap);
        console.log('[TestQuestion] Loaded', Object.keys(questionsMap).length, 'questions');
        setLoading(false);
      } catch (err: any) {
        console.error('[TestQuestion] Error loading questions:', err);
        setError(err?.message || 'Failed to load questions');
        setLoading(false);
      }
    };

    loadQuestions();
  }, [part1Param, part2Param, part3Param]);

  // Initialize exam timer
  useEffect(() => {
    if (!timeLimit) return;

    // Parse time limit (e.g., "12min" -> 720 seconds, "0min" -> 0 for unlimited)
    const parseTimeLimit = (limit: string): number => {
      const match = limit.match(/(\d+)min/);
      if (match) {
        return parseInt(match[1]) * 60;
      }
      return 0;
    };

    const totalSeconds = parseTimeLimit(timeLimit);
    if (totalSeconds > 0) {
      setTimeRemaining(totalSeconds);
      console.log('[TestQuestion] Exam timer set to', totalSeconds, 'seconds');
    } else {
      console.log('[TestQuestion] No time limit (practice mode)');
      setTimeRemaining(0);
    }
  }, [timeLimit]);

  // Exam countdown timer
  useEffect(() => {
    // Don't start timer until questions are loaded
    if (loading || timeRemaining <= 0 || isSubmitting) {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
      }
      return;
    }

    examTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;

        // Show warning when 2 minutes remaining
        if (newTime === 120 && !showTimeWarning) {
          setShowTimeWarning(true);
        }

        // Auto-submit when time runs out
        if (newTime <= 0) {
          console.log('[TestQuestion] Time expired - auto-submitting test');
          if (examTimerRef.current) {
            clearInterval(examTimerRef.current);
          }
          handleTestComplete();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
      }
    };
  }, [timeRemaining, isSubmitting, loading]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
      }
    };
  }, []);

  const getCurrentQuestionIds = () => {
    if (currentPart === 1) return part1Ids;
    if (currentPart === 2) return part2Ids;
    return part3Ids;
  };

  const currentQuestionIds = getCurrentQuestionIds();
  const currentQuestionId = currentQuestionIds[currentQuestionIndex];
  const currentQuestion = currentQuestionId ? questions[currentQuestionId] : null;

  // Debug current question
  useEffect(() => {
    console.log('[TestQuestion] Current state:', {
      currentPart,
      currentQuestionIndex,
      currentQuestionIds,
      currentQuestionId,
      currentQuestion,
      questionsKeys: Object.keys(questions)
    });
  }, [currentPart, currentQuestionIndex, currentQuestionId, questions]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatExamTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      await handleStopRecording();
    } else {
      // Start recording
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('[TestQuestion] Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      const status = await recordingRef.current.getStatusAsync();
      if (status.canRecord) {
        await recordingRef.current.stopAndUnloadAsync();
      }
      const uri = recordingRef.current.getURI();

      if (uri && currentQuestionId) {
        setRecordings(prev => {
          const filtered = prev.filter(r => r.questionId !== currentQuestionId);
          return [...filtered, { uri, questionId: currentQuestionId, part: currentPart }];
        });
      }

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingTime(0);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (err) {
      console.error('[TestQuestion] Error stopping recording:', err);
      setIsRecording(false);
    }
  };

  const handlePlayRecording = async () => {
    if (isPlaying) {
      await handleStopPlayback();
    } else {
      await handleStartPlayback();
    }
  };

  const handleStartPlayback = async () => {
    try {
      const currentRecording = recordings.find(r => r.questionId === currentQuestionId);
      if (!currentRecording) {
        setError('No recording found for this question');
        return;
      }

      // Stop recording if active
      if (isRecording) {
        await handleStopRecording();
      }

      // Unload any existing sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: currentRecording.uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      console.error('[TestQuestion] Error playing recording:', err);
      setError('Failed to play recording');
    }
  };

  const handleStopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setPlaybackPosition(0);
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    } catch (err) {
      console.error('[TestQuestion] Error stopping playback:', err);
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.durationMillis) {
        setPlaybackDuration(Math.floor(status.durationMillis / 1000));
      }
      if (status.positionMillis) {
        setPlaybackPosition(Math.floor(status.positionMillis / 1000));
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };

  // Cleanup sound on unmount or question change
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      if (part2ThinkingTimerRef.current) {
        clearInterval(part2ThinkingTimerRef.current);
      }
    };
  }, []);

  // Stop playback when changing questions
  useEffect(() => {
    handleStopPlayback();
  }, [currentQuestionId]);

  // Part 2 thinking timer logic
  useEffect(() => {
    // Check if we're on Part 2, first question, and haven't shown thinking timer yet
    if (currentPart === 2 && currentQuestionIndex === 0 && !hasSeenPart2Thinking && !isThinkingPart2) {
      setIsThinkingPart2(true);
      setPart2ThinkingTime(60);
    }
  }, [currentPart, currentQuestionIndex, hasSeenPart2Thinking]);

  // Part 2 thinking countdown
  useEffect(() => {
    if (isThinkingPart2 && part2ThinkingTime > 0) {
      part2ThinkingTimerRef.current = setInterval(() => {
        setPart2ThinkingTime(prev => {
          if (prev <= 1) {
            if (part2ThinkingTimerRef.current) {
              clearInterval(part2ThinkingTimerRef.current);
            }
            setIsThinkingPart2(false);
            setHasSeenPart2Thinking(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (part2ThinkingTimerRef.current) {
          clearInterval(part2ThinkingTimerRef.current);
        }
      };
    }
  }, [isThinkingPart2, part2ThinkingTime]);

  const handleSkipThinking = () => {
    if (part2ThinkingTimerRef.current) {
      clearInterval(part2ThinkingTimerRef.current);
    }
    setIsThinkingPart2(false);
    setHasSeenPart2Thinking(true);
    setPart2ThinkingTime(0);
  };

  const handleDeleteRecording = async () => {
    try {
      // Stop playback if active
      if (isPlaying) {
        await handleStopPlayback();
      }

      // Remove recording for current question
      setRecordings(prev => prev.filter(r => r.questionId !== currentQuestionId));

      Alert.alert(
        'Recording Deleted',
        'You can now record a new answer for this question.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('[TestQuestion] Error deleting recording:', err);
      setError('Failed to delete recording');
    }
  };

  // Handle auto-submit if navigating back from review screen
  useEffect(() => {
    if (autoSubmit === 'true') {
      handleTestComplete();
    }
  }, [autoSubmit]);

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < currentQuestionIds.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsRecording(false);
      setRecordingTime(0);
    } else {
      // Check if we need to move to next part
      const hasNextPart = (currentPart === 1 && part2Ids.length > 0) || (currentPart === 2 && part3Ids.length > 0);

      if (hasNextPart) {
        if (currentPart === 1) {
          setCurrentPart(2);
        } else if (currentPart === 2) {
          setCurrentPart(3);
        }
        setCurrentQuestionIndex(0);
        setIsRecording(false);
        setRecordingTime(0);
      } else {
        // Test complete - navigate to review screen
        const recordedQuestionIds = recordings.map(r => r.questionId);
        router.push({
          pathname: '/mock-test/test-review',
          params: {
            testId,
            mode,
            testSessionId,
            part1: JSON.stringify(part1Ids),
            part2: JSON.stringify(part2Ids),
            part3: JSON.stringify(part3Ids),
            recordings: JSON.stringify(recordedQuestionIds),
            timeLimit
          }
        });
      }
    }
  };

  const handleTestComplete = async () => {
    if (!testSessionId) {
      setError('Test session ID not found');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[TestQuestion] Submitting test...');

      // Step 1: Get upload URLs for all recordings
      const answersByPart: {
        part1?: Record<string, string>;
        part2?: Record<string, string>;
        part3?: Record<string, string>;
      } = {};

      recordings.forEach(rec => {
        const partKey = `part${rec.part}` as 'part1' | 'part2' | 'part3';
        if (!answersByPart[partKey]) {
          answersByPart[partKey] = {};
        }
        answersByPart[partKey]![rec.questionId.toString()] = '';
      });

      console.log('[TestQuestion] Requesting upload URLs...');
      const uploadResponse = await ExamsService.getSimulationUploadUrls({
        test_session_id: testSessionId,
        answers: answersByPart,
      });

      // Step 2: Upload each recording
      console.log('[TestQuestion] Uploading recordings...');
      const uploadedPaths: {
        part1?: Record<string, string>;
        part2?: Record<string, string>;
        part3?: Record<string, string>;
      } = {};

      for (const rec of recordings) {
        const partKey = `part${rec.part}` as 'part1' | 'part2' | 'part3';
        const uploadUrl = uploadResponse.upload_urls[partKey]?.[rec.questionId.toString()];

        if (uploadUrl) {
          // Read the audio file
          const response = await fetch(rec.uri);
          const blob = await response.blob();

          // Upload to presigned URL
          await ExamsService.uploadAudioToR2(uploadUrl, blob);

          // Store the path (extract from presigned URL)
          const url = new URL(uploadUrl);
          const path = url.pathname.substring(1); // Remove leading '/'

          if (!uploadedPaths[partKey]) {
            uploadedPaths[partKey] = {};
          }
          uploadedPaths[partKey]![rec.questionId.toString()] = path;
        }
      }

      // Step 3: Confirm submission
      console.log('[TestQuestion] Confirming submission...');
      await ExamsService.confirmSimulationSubmission({
        test_session_id: testSessionId,
        answers: uploadedPaths,
      });

      console.log('[TestQuestion] Test submitted successfully!');

      // Navigate to completion screen
      router.push({
        pathname: '/mock-test/test-complete',
        params: {
          testId,
          testName: 'IELTS Speaking Mock Test',
        },
      });
    } catch (err: any) {
      console.error('[TestQuestion] Error submitting test:', err);
      setError(err?.message || 'Failed to submit test');
      setIsSubmitting(false);
    }
  };

  const getPartTitle = () => {
    if (currentPart === 1) return 'Introduction and\ninterview';
    if (currentPart === 2) return 'Individual long turn';
    return 'Two-way discussion';
  };

  const handleBackPress = () => {
    if (timeRemaining > 0 && !isSubmitting) {
      Alert.alert(
        'Exit Exam?',
        'Are you sure you want to exit? Your progress will be lost and the test will not be submitted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => router.back()
          }
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Mock Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3BB9F0" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  const handleRetryLoadQuestions = () => {
    setError(null);
    setLoading(true);
    // Reload questions
    const loadQuestions = async () => {
      try {
        const allQuestionIds = [...part1Ids, ...part2Ids, ...part3Ids];

        if (allQuestionIds.length === 0) {
          setError('No questions found for this test');
          setLoading(false);
          return;
        }

        const questionPromises = allQuestionIds.map(id => QuestionsService.getQuestion(id));
        const questionDetails = await Promise.all(questionPromises);

        const questionsMap: Record<number, QuestionDetail> = {};
        questionDetails.forEach(q => {
          questionsMap[q.question_id] = q;
        });

        setQuestions(questionsMap);
        setError(null);
      } catch (err: any) {
        console.error('[TestQuestion] Error loading questions:', err);
        setError(err?.message || 'Failed to load questions. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  };

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>AI Mock Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <Pressable style={styles.retryButton} onPress={handleRetryLoadQuestions}>
              <IconSymbol name="arrow.clockwise" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
            <Pressable style={styles.secondaryRetryButton} onPress={handleBackPress}>
              <Text style={styles.secondaryRetryButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>AI Mock Test</Text>
        </View>
        <View style={styles.headerRight}>
          {timeRemaining > 0 && (
            <View style={[
              styles.timerContainer,
              timeRemaining <= 120 && styles.timerWarning
            ]}>
              <IconSymbol
                name="clock.fill"
                size={20}
                color={timeRemaining <= 120 ? "#FF6B6B" : "#3BB9F0"}
              />
              <Text style={[
                styles.timerText,
                timeRemaining <= 120 && styles.timerTextWarning
              ]}>
                {formatExamTime(timeRemaining)}
              </Text>
            </View>
          )}
          <Pressable style={styles.homeButton} onPress={() => router.push('/(tabs)')}>
            <IconSymbol name="house.fill" size={24} color="#3BB9F0" />
          </Pressable>
        </View>
      </View>

      {/* Time Warning Banner */}
      {showTimeWarning && timeRemaining > 0 && timeRemaining <= 120 && (
        <View style={styles.warningBanner}>
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#FF6B6B" />
          <Text style={styles.warningText}>Only 2 minutes remaining!</Text>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Part Title */}
        <View style={styles.partTitleContainer}>
          <Text style={styles.partNumber}>Part {currentPart}</Text>
          <Text style={styles.partTitle}>{getPartTitle()}</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {currentQuestionIds.length}
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentQuestionIndex + 1) / currentQuestionIds.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Part 2 Thinking Timer Banner */}
        {isThinkingPart2 && (
          <View style={styles.thinkingBanner}>
            <IconSymbol name="brain" size={24} color="#FF8C00" />
            <View style={styles.thinkingContent}>
              <Text style={styles.thinkingTitle}>Time to Think</Text>
              <Text style={styles.thinkingText}>
                Prepare your answer for the next 60 seconds
              </Text>
              <Text style={styles.thinkingTimer}>{formatTime(part2ThinkingTime)}</Text>
            </View>
            <Pressable style={styles.skipButton} onPress={handleSkipThinking}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
          </View>
        )}

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {currentQuestion?.question_text || 'Loading question...'}
          </Text>
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          {/* Recording Line Left */}
          <View style={[styles.recordingLine, isRecording && styles.recordingLineActive]} />

          {/* Microphone Button */}
          <Pressable
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
              isThinkingPart2 && styles.micButtonDisabled
            ]}
            onPress={handleRecord}
            disabled={isThinkingPart2}
          >
            <IconSymbol name="mic.fill" size={32} color={isThinkingPart2 ? "#CCC" : "#FF6B6B"} />
          </Pressable>

          {/* Recording Line Right */}
          <View style={[styles.recordingLine, isRecording && styles.recordingLineActive]} />
        </View>

        {/* Timer */}
        <Text style={styles.timer}>
          {isPlaying ? formatTime(playbackPosition) : formatTime(recordingTime)}
        </Text>

        {/* Playback Controls - Show if recording exists for current question */}
        {recordings.find(r => r.questionId === currentQuestionId) && (
          <View style={styles.playbackContainer}>
            <Pressable
              style={[styles.playbackButton, isPlaying && styles.playbackButtonActive]}
              onPress={handlePlayRecording}
              disabled={isRecording}
            >
              <IconSymbol
                name={isPlaying ? "pause.fill" : "play.fill"}
                size={20}
                color={isRecording ? "#CCC" : "#3BB9F0"}
              />
              <Text style={[styles.playbackButtonText, isRecording && styles.playbackButtonTextDisabled]}>
                {isPlaying ? 'Stop Playback' : 'Play Recording'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.deleteButton}
              onPress={handleDeleteRecording}
              disabled={isRecording || isPlaying}
            >
              <IconSymbol
                name="trash.fill"
                size={20}
                color={isRecording || isPlaying ? "#CCC" : "#FF6B6B"}
              />
              <Text style={[styles.deleteButtonText, (isRecording || isPlaying) && styles.deleteButtonTextDisabled]}>
                Delete & Re-record
              </Text>
            </Pressable>
          </View>
        )}

        {/* Next Question Button */}
        <Pressable
          style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
          onPress={handleNextQuestion}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.nextButtonText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex === currentQuestionIds.length - 1 &&
               (currentPart === 3 || (currentPart === 2 && part3Ids.length === 0) || (currentPart === 1 && part2Ids.length === 0 && part3Ids.length === 0))
                ? 'Submit Test'
                : 'Next question'}
            </Text>
          )}
        </Pressable>

        {/* Part Navigation */}
        <View style={styles.partNavigation}>
          {part1Ids.length > 0 && (
            <Pressable
              style={[styles.partTab, currentPart === 1 && styles.partTabActive]}
              onPress={() => {
                setCurrentPart(1);
                setCurrentQuestionIndex(0);
                setIsRecording(false);
                setRecordingTime(0);
              }}
            >
              <Text style={[styles.partTabText, currentPart === 1 && styles.partTabTextActive]}>
                Part 1
              </Text>
            </Pressable>
          )}

          {part2Ids.length > 0 && (
            <Pressable
              style={[styles.partTab, currentPart === 2 && styles.partTabActive]}
              onPress={() => {
                setCurrentPart(2);
                setCurrentQuestionIndex(0);
                setIsRecording(false);
                setRecordingTime(0);
              }}
            >
              <Text style={[styles.partTabText, currentPart === 2 && styles.partTabTextActive]}>
                Part 2
              </Text>
            </Pressable>
          )}

          {part3Ids.length > 0 && (
            <Pressable
              style={[styles.partTab, currentPart === 3 && styles.partTabActive]}
              onPress={() => {
                setCurrentPart(3);
                setCurrentQuestionIndex(0);
                setIsRecording(false);
                setRecordingTime(0);
              }}
            >
              <Text style={[styles.partTabText, currentPart === 3 && styles.partTabTextActive]}>
                Part 3
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8F6FC',
  },
  timerWarning: {
    backgroundColor: '#FFE8E8',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3BB9F0',
  },
  timerTextWarning: {
    color: '#FF6B6B',
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFE8E8',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  partTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  partNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  partTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  progressIndicator: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3BB9F0',
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  recordingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  recordingLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#FFD0D0',
  },
  recordingLineActive: {
    backgroundColor: '#FF6B6B',
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: '#FFD0D0',
  },
  micButtonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  thinkingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  thinkingContent: {
    flex: 1,
  },
  thinkingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 4,
  },
  thinkingText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  thinkingTimer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  skipButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  timer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  playbackContainer: {
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  playbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playbackButtonActive: {
    backgroundColor: '#BBDEFB',
  },
  playbackButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3BB9F0',
  },
  playbackButtonTextDisabled: {
    color: '#CCC',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  deleteButtonTextDisabled: {
    color: '#CCC',
  },
  nextButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3BB9F0',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorActions: {
    width: '100%',
    paddingHorizontal: 40,
    gap: 12,
  },
  secondaryRetryButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  secondaryRetryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  partNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 32,
  },
  partTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  partTabActive: {
    borderColor: '#FF8C00',
    backgroundColor: '#FFF5E6',
  },
  partTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  partTabTextActive: {
    color: '#FF8C00',
  },
});
