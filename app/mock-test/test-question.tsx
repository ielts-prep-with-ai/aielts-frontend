import { StyleSheet, ScrollView, View, Text, Pressable, ActivityIndicator, Alert, Animated } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { QuestionsService } from '@/services/questions.service';
import { ExamsService } from '@/services/exams.service';
import { QuestionDetail } from '@/services/types';
import * as Speech from 'expo-speech';

interface RecordingData {
  uri: string;
  questionId: number;
  part: number;
  duration: number; // Duration in seconds
}

// Animated Waveform Component
function AnimatedWaveBar({ isActive, delay = 0 }: { isActive: boolean; delay?: number }) {
  const animatedHeight = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      // Create continuous pulsing animation
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedHeight, {
            toValue: 1,
            duration: 300 + Math.random() * 200,
            delay,
            useNativeDriver: false,
          }),
          Animated.timing(animatedHeight, {
            toValue: 0.3,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      // Reset to base height when not active
      Animated.timing(animatedHeight, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive, delay]);

  const height = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ['20%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.waveBar,
        {
          height,
          backgroundColor: isActive ? '#FF6B6B' : '#FFD0D0',
        },
      ]}
    />
  );
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [part2ThinkingTime, setPart2ThinkingTime] = useState(60);
  const [isThinkingPart2, setIsThinkingPart2] = useState(false);
  const [hasSeenPart2Thinking, setHasSeenPart2Thinking] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [hasListenedToQuestion, setHasListenedToQuestion] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);
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
          // Stop recording if active before submitting
          if (isRecording && recordingRef.current) {
            handleStopRecording().then(() => {
              handleTestComplete();
            });
          } else {
            handleTestComplete();
          }
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
      // If question is playing, stop it first
      if (isPlayingQuestion) {
        Speech.stop();
        setIsPlayingQuestion(false);
        // Small delay to let speech stop
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Start recording
      await handleStartRecording();
    }
  };

  const handleStartRecording = async () => {
    // Just start recording - question auto-plays anyway
    await startRecordingNow();
  };

  const startRecordingNow = async () => {
    try {
      // Clean up any existing recording first
      if (recordingRef.current) {
        try {
          const status = await recordingRef.current.getStatusAsync();
          if (status.canRecord) {
            await recordingRef.current.stopAndUnloadAsync();
          } else {
            await recordingRef.current.stopAndUnloadAsync().catch(() => {});
          }
        } catch (cleanupErr) {
          console.log('[TestQuestion] Cleanup error (non-critical):', cleanupErr);
        }
        recordingRef.current = null;
      }

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
    if (!recordingRef.current) {
      setIsRecording(false);
      return;
    }

    try {
      const status = await recordingRef.current.getStatusAsync();

      // Get URI before stopping
      const uri = recordingRef.current.getURI();

      // Capture the current recording duration
      const duration = recordingTime;

      // Stop the recording if it's still recording
      if (status.canRecord || status.isRecording) {
        await recordingRef.current.stopAndUnloadAsync();
      } else {
        // Already stopped, just unload
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }

      // Save the recording if we have a URI
      if (uri && currentQuestionId) {
        setRecordings(prev => {
          const filtered = prev.filter(r => r.questionId !== currentQuestionId);
          return [...filtered, { uri, questionId: currentQuestionId, part: currentPart, duration }];
        });
      }

      // Clean up reference
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingTime(0);

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      console.error('[TestQuestion] Error stopping recording:', err);
      // Still clean up even if there's an error
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up recording
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      // Clean up timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (part2ThinkingTimerRef.current) {
        clearInterval(part2ThinkingTimerRef.current);
      }
      // Stop speech
      Speech.stop();
    };
  }, []);

  // Reset question listening state and auto-play question when changing questions
  useEffect(() => {
    setHasListenedToQuestion(false);
    setIsPlayingQuestion(false);
    // Stop any ongoing speech
    Speech.stop();

    // Stop recording timer when changing questions
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Auto-play the question after a short delay (unless in Part 2 thinking time)
    if (currentQuestion?.question_text && !isThinkingPart2) {
      const autoPlayTimer = setTimeout(() => {
        handlePlayQuestion();
      }, 500); // Small delay to let the UI settle

      return () => clearTimeout(autoPlayTimer);
    }
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

            // Auto-play question after thinking time ends
            setTimeout(() => {
              if (currentQuestion?.question_text) {
                handlePlayQuestion();
              }
            }, 500);

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

    // Auto-play question after skipping thinking time
    setTimeout(() => {
      if (currentQuestion?.question_text) {
        handlePlayQuestion();
      }
    }, 500);
  };

  const handlePlayQuestion = async () => {
    if (!currentQuestion?.question_text) return;

    if (isPlayingQuestion) {
      // Stop the question playback
      Speech.stop();
      setIsPlayingQuestion(false);
    } else {
      // Play the question
      setIsPlayingQuestion(true);

      Speech.speak(currentQuestion.question_text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9, // Slightly slower for clarity
        onDone: () => {
          setIsPlayingQuestion(false);
          setHasListenedToQuestion(true);
        },
        onStopped: () => {
          setIsPlayingQuestion(false);
        },
        onError: () => {
          setIsPlayingQuestion(false);
          setError('Failed to play question audio');
        },
      });
    }
  };

  // Handle auto-submit if navigating back from review screen
  useEffect(() => {
    if (autoSubmit === 'true') {
      handleTestComplete();
    }
  }, [autoSubmit]);

  const handleNextQuestion = async () => {
    // Stop any playing question audio
    Speech.stop();
    setIsPlayingQuestion(false);

    // If currently recording, stop and save the recording first
    if (isRecording) {
      await handleStopRecording();
      // Wait for state to update after recording is saved
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (currentQuestionIndex < currentQuestionIds.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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
        setRecordingTime(0);
      } else {
        // Test complete - submit directly (no review screen, like real IELTS)
        // Wait a bit more before submitting to ensure recordings state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        handleTestComplete();
      }
    }
  };

  const submitEmptyTest = async () => {
    setIsSubmitting(true);
    try {
      console.log('[TestQuestion] Submitting empty test...');

      // Navigate to completion screen without actual submission
      router.push({
        pathname: '/mock-test/test-complete',
        params: {
          testId,
          testName: 'IELTS Speaking Mock Test',
          testSessionId,
        },
      });
    } catch (err: any) {
      console.error('[TestQuestion] Error:', err);
      setError(err?.message || 'Failed to complete test');
      setIsSubmitting(false);
    }
  };

  const handleTestComplete = async () => {
    if (!testSessionId) {
      setError('Test session ID not found');
      return;
    }

    // If currently recording, stop and save it first
    if (isRecording && recordingRef.current) {
      console.log('[TestQuestion] Stopping active recording before submit...');
      await handleStopRecording();
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Use a callback to get the latest recordings state
    setRecordings(currentRecordings => {
      console.log('[TestQuestion] Final recordings count:', currentRecordings.length);

      // Only show alert if truly no recordings
      if (currentRecordings.length === 0) {
        Alert.alert(
          'No Recordings',
          'You haven\'t recorded any answers. Do you want to submit an empty test?',
          [
            { text: 'Go Back', style: 'cancel' },
            { text: 'Submit Empty', style: 'destructive', onPress: () => submitEmptyTest() }
          ]
        );
        return currentRecordings;
      }

      // Start submission process
      setIsSubmitting(true);
      setUploadProgress(0);
      setUploadStatus('Preparing submission...');

      // Continue with actual submission
      submitTest(currentRecordings);

      return currentRecordings;
    });
  };

  const submitTest = async (recordingsToSubmit: RecordingData[]) => {
    try {
      console.log('[TestQuestion] Submitting test...');
      console.log('[TestQuestion] Total recordings:', recordingsToSubmit.length);

      // Group recordings by part
      const recordingsByPart: {
        part1: RecordingData[];
        part2: RecordingData[];
        part3: RecordingData[];
      } = { part1: [], part2: [], part3: [] };

      recordingsToSubmit.forEach(rec => {
        const partKey = `part${rec.part}` as 'part1' | 'part2' | 'part3';
        recordingsByPart[partKey].push(rec);
      });

      // Determine which parts have recordings and submit in order
      const partsToSubmit: Array<'part1' | 'part2' | 'part3'> = [];
      if (recordingsByPart.part1.length > 0) partsToSubmit.push('part1');
      if (recordingsByPart.part2.length > 0) partsToSubmit.push('part2');
      if (recordingsByPart.part3.length > 0) partsToSubmit.push('part3');

      console.log('[TestQuestion] Parts to submit:', partsToSubmit);

      // Submit each part separately
      for (let i = 0; i < partsToSubmit.length; i++) {
        const partKey = partsToSubmit[i];
        const partRecordings = recordingsByPart[partKey];

        setUploadStatus(`Uploading ${partKey.toUpperCase()} (${i + 1}/${partsToSubmit.length})...`);
        console.log(`[TestQuestion] Submitting ${partKey} with ${partRecordings.length} recordings`);

        // Step 1: Get upload URLs for this part
        const answersByPart: Record<string, string> = {};
        partRecordings.forEach(rec => {
          answersByPart[rec.questionId.toString()] = '';
        });

        const uploadRequest = {
          test_session_id: testSessionId,
          answers: {
            [partKey]: answersByPart
          },
        };

        console.log(`[TestQuestion] Requesting upload URLs for ${partKey}:`, uploadRequest);
        const uploadResponse = await ExamsService.getSimulationUploadUrls(uploadRequest);

        // Backend returns "answers" not "upload_urls"
        const uploadUrls = (uploadResponse as any).answers?.[partKey] || uploadResponse.upload_urls?.[partKey];

        if (!uploadUrls) {
          throw new Error(`No upload URLs received for ${partKey}`);
        }

        console.log(`[TestQuestion] Received ${Object.keys(uploadUrls).length} upload URLs for ${partKey}`);

        // Step 2: Upload each recording for this part
        const uploadedPaths: Record<string, string> = {};

        for (let j = 0; j < partRecordings.length; j++) {
          const rec = partRecordings[j];
          const uploadUrl = uploadUrls[rec.questionId.toString()];

          if (!uploadUrl) {
            console.error(`[TestQuestion] No upload URL for question ${rec.questionId}`);
            continue;
          }

          try {
            setUploadStatus(`Uploading ${partKey.toUpperCase()} - Question ${j + 1}/${partRecordings.length}...`);

            // Read the audio file
            const response = await fetch(rec.uri);
            const blob = await response.blob();

            // Upload to presigned URL
            await ExamsService.uploadAudioToR2(uploadUrl, blob);

            // Store the path (extract from presigned URL)
            const url = new URL(uploadUrl);
            const path = url.pathname.substring(1); // Remove leading '/'
            uploadedPaths[rec.questionId.toString()] = path;

            console.log(`[TestQuestion] Uploaded question ${rec.questionId} successfully`);

            // Update progress
            const totalProgress = ((i * partRecordings.length + j + 1) / recordingsToSubmit.length) * 80; // 80% for uploads
            setUploadProgress(Math.round(totalProgress));
          } catch (uploadErr: any) {
            console.error(`[TestQuestion] Failed to upload question ${rec.questionId}:`, uploadErr);
            throw new Error(`Failed to upload recording for question ${rec.questionId}: ${uploadErr.message}`);
          }
        }

        // Step 3: Confirm submission for this part
        setUploadStatus(`Confirming ${partKey.toUpperCase()}...`);
        console.log(`[TestQuestion] Confirming submission for ${partKey}`);

        await ExamsService.confirmSimulationSubmission({
          test_session_id: testSessionId,
          answers: {
            [partKey]: uploadedPaths
          },
        });

        console.log(`[TestQuestion] ${partKey} submitted successfully!`);
        setUploadProgress(Math.round(((i + 1) / partsToSubmit.length) * 100));
      }

      setUploadStatus('Submission complete!');
      console.log('[TestQuestion] All parts submitted successfully!');

      // Navigate to completion screen
      router.push({
        pathname: '/mock-test/test-complete',
        params: {
          testId,
          testName: 'IELTS Speaking Mock Test',
          testSessionId,
        },
      });
    } catch (err: any) {
      console.error('[TestQuestion] Error submitting test:', err);
      setUploadStatus('');
      setUploadProgress(0);
      Alert.alert(
        'Submission Failed',
        err?.message || 'Failed to submit test. Please check your internet connection and try again.',
        [
          { text: 'OK', onPress: () => setError(err?.message || 'Failed to submit test') }
        ]
      );
      setIsSubmitting(false);
    }
  };

  const getPartTitle = () => {
    if (currentPart === 1) return 'Introduction and\ninterview';
    if (currentPart === 2) return 'Individual long turn';
    return 'Two-way discussion';
  };

  const handleBackPress = () => {
    // Stop speech and recording before exiting
    Speech.stop();
    setIsPlayingQuestion(false);

    if (timeRemaining > 0 && !isSubmitting) {
      Alert.alert(
        'Exit Exam?',
        'Are you sure you want to exit? Your progress will be lost and the test will not be submitted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              // Stop any ongoing recording
              if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => {});
                recordingRef.current = null;
              }
              router.push('/mock-test');
            }
          }
        ]
      );
    } else {
      // Stop any ongoing recording
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      router.push('/mock-test');
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
          <Pressable style={styles.backButton} onPress={() => router.push('/mock-test')}>
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
            <Pressable style={styles.secondaryRetryButton} onPress={() => router.push('/mock-test')}>
              <Text style={styles.secondaryRetryButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Upload Progress Overlay */}
      {isSubmitting && uploadProgress > 0 && (
        <View style={styles.uploadOverlay}>
          <View style={styles.uploadModal}>
            <ActivityIndicator size="large" color="#3BB9F0" />
            <Text style={styles.uploadTitle}>Submitting Test</Text>
            <Text style={styles.uploadStatus}>{uploadStatus}</Text>
            <View style={styles.uploadProgressBarContainer}>
              <View
                style={[
                  styles.uploadProgressBarFill,
                  { width: `${uploadProgress}%` }
                ]}
              />
            </View>
            <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
            <Text style={styles.uploadWarning}>Please don't close the app</Text>
          </View>
        </View>
      )}

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
          <Pressable style={styles.homeButton} onPress={() => {
            Speech.stop();
            setIsPlayingQuestion(false);
            if (recordingRef.current) {
              recordingRef.current.stopAndUnloadAsync().catch(() => {});
              recordingRef.current = null;
            }
            router.push('/(tabs)');
          }}>
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

        {/* Listen to Question Button */}
        <View style={styles.listenSection}>
          <Pressable
            style={[
              styles.listenButton,
              isPlayingQuestion && styles.listenButtonActive,
              hasListenedToQuestion && styles.listenButtonCompleted
            ]}
            onPress={handlePlayQuestion}
            disabled={isThinkingPart2}
          >
            <IconSymbol
              name={isPlayingQuestion ? "speaker.wave.3.fill" : "speaker.wave.2.fill"}
              size={24}
              color={hasListenedToQuestion ? "#4CAF50" : "#3BB9F0"}
            />
            <Text style={[
              styles.listenButtonText,
              hasListenedToQuestion && styles.listenButtonTextCompleted
            ]}>
              {isPlayingQuestion ? 'Playing Question...' : 'Listen Again'}
            </Text>
          </Pressable>
          {isPlayingQuestion && (
            <Text style={styles.listenHint}>Question is being read aloud...</Text>
          )}
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {currentQuestion?.question_text || 'Loading question...'}
          </Text>
        </View>

        {/* Recording Controls */}
        <View style={styles.recordingSection}>
          {/* Animated Waveform Left */}
          <View style={styles.waveformContainer}>
            <AnimatedWaveBar isActive={isRecording} delay={0} />
            <AnimatedWaveBar isActive={isRecording} delay={50} />
            <AnimatedWaveBar isActive={isRecording} delay={100} />
            <AnimatedWaveBar isActive={isRecording} delay={150} />
            <AnimatedWaveBar isActive={isRecording} delay={200} />
          </View>

          {/* Microphone Button */}
          <Pressable
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
              isThinkingPart2 && styles.micButtonDisabled,
              isPlayingQuestion && !isRecording && styles.micButtonPlaying
            ]}
            onPress={handleRecord}
            disabled={isThinkingPart2}
          >
            <IconSymbol
              name="mic.fill"
              size={32}
              color={isThinkingPart2 ? "#CCC" : isPlayingQuestion && !isRecording ? "#FFA500" : "#FF6B6B"}
            />
          </Pressable>

          {/* Animated Waveform Right */}
          <View style={styles.waveformContainer}>
            <AnimatedWaveBar isActive={isRecording} delay={200} />
            <AnimatedWaveBar isActive={isRecording} delay={150} />
            <AnimatedWaveBar isActive={isRecording} delay={100} />
            <AnimatedWaveBar isActive={isRecording} delay={50} />
            <AnimatedWaveBar isActive={isRecording} delay={0} />
          </View>
        </View>

        {/* Timer */}
        <Text style={styles.timer}>
          {formatTime(recordingTime)}
        </Text>

        {/* Recording Hint */}
        {isRecording && (
          <Text style={styles.recordingActiveHint}>
            Recording your answer...
          </Text>
        )}
        {isPlayingQuestion && !isRecording && (
          <Text style={styles.recordingHint}>
            Tap mic to stop question and start recording
          </Text>
        )}
        {recordings.find(r => r.questionId === currentQuestionId) && !isRecording && (
          <View style={styles.recordedBadge}>
            <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
            <View>
              <Text style={styles.recordedBadgeText}>Answer Recorded</Text>
              <Text style={styles.recordedDuration}>
                {formatTime(recordings.find(r => r.questionId === currentQuestionId)?.duration || 0)}
              </Text>
            </View>
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
  listenSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F6FC',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listenButtonActive: {
    backgroundColor: '#BBDEFB',
  },
  listenButtonCompleted: {
    backgroundColor: '#E8F5E9',
  },
  listenButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3BB9F0',
  },
  listenButtonTextCompleted: {
    color: '#4CAF50',
  },
  listenHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
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
    gap: 20,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 4,
    flex: 1,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#FFD0D0',
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
  micButtonPlaying: {
    backgroundColor: '#FFF4E6',
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
    marginBottom: 8,
  },
  recordingHint: {
    fontSize: 13,
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  recordingActiveHint: {
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  recordedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
    alignSelf: 'center',
  },
  recordedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  recordedDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
    marginTop: 2,
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
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadStatus: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  uploadProgressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  uploadProgressBarFill: {
    height: '100%',
    backgroundColor: '#3BB9F0',
    borderRadius: 4,
  },
  uploadProgressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3BB9F0',
    marginBottom: 12,
  },
  uploadWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '600',
  },
});
