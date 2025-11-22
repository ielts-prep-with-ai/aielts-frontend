import { StyleSheet, ScrollView, View, Text, Pressable, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { QuestionsService, QuestionDetail, AnswersService } from '@/services';
import { useAudioRecorder, useAudioRecorderState, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, AudioQuality, IOSOutputFormat } from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import { AuthService } from '@/services/auth.service';

const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.webm',
  sampleRate: 48000,
  numberOfChannels: 1,
  bitRate: 128000,
  isMeteringEnabled: true,
  android: { extension: '.webm', outputFormat: 'webm', audioEncoder: 'aac', sampleRate: 48000 },
  ios: { extension: '.m4a', outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.HIGH, sampleRate: 48000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
  web: { mimeType: 'audio/ogg;codecs=opus', bitsPerSecond: 128000 },
};

export default function SpeakingPracticeScreen() {
  const router = useRouter();
  const { questionId, topic } = useLocalSearchParams();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [recordsCount, setRecordsCount] = useState(0);

  const audioRecorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder, 100);
  const [time, setTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecordingSession, setIsRecordingSession] = useState(false);
  const [isPausedManual, setIsPausedManual] = useState(false);

  const [audioSource, setAudioSource] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(audioSource);
  const playerStatus = useAudioPlayerStatus(audioPlayer);

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const topicTitle = question?.topic_name || 'Practice Questions';

  useEffect(() => {
    fetchQuestion();
    loadRecordsCount();
  }, [questionId]);

  const fetchQuestion = async () => {
    if (!questionId) { setError('No question ID provided'); setIsLoading(false); return; }
    try {
      setIsLoading(true); setError(null);
      const data = await QuestionsService.getQuestion(Number(questionId));
      setQuestion(data);
    } catch (err: any) {
      const msg = err?.message || '';
      setError(msg.includes('not found') || msg.includes('404') ? 'This question does not exist.' : 'Failed to load question.');
    } finally { setIsLoading(false); }
  };

  const loadRecordsCount = async () => {
    try {
      const data = await AnswersService.getUserAnswers(Number(questionId));
      setRecordsCount(Array.isArray(data) ? data.length : 0);
    } catch { setRecordsCount(0); }
  };

  useEffect(() => {
    if (isRecordingSession && !isPausedManual) {
      timerRef.current = setInterval(() => setTime(p => p + 1), 1000);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecordingSession, isPausedManual]);

  useEffect(() => {
    return () => { if (recorderState.isRecording) audioRecorder.stop().then(() => setAudioModeAsync({ allowsRecording: false })).catch(() => {}); };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const handleRecordToggle = async () => {
    if (!isRecordingSession && !recordingUri) {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) { Alert.alert('Permission Required', 'Please grant microphone permission.'); return; }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await audioRecorder.prepareToRecordAsync();
        await audioRecorder.record();
        setIsRecordingSession(true);
      } catch { Alert.alert('Error', 'Failed to start recording.'); }
    } else if (isRecordingSession) {
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (!uri) { Alert.alert('Error', 'Failed to get recording.'); setIsRecordingSession(false); return; }
        setRecordingUri(uri); setIsRecordingSession(false);
        await setAudioModeAsync({ allowsRecording: false });
        setAudioSource(uri);
      } catch { Alert.alert('Error', 'Failed to stop recording.'); setIsRecordingSession(false); }
    }
  };

  const handlePause = async () => {
    if (!isRecordingSession) return;
    try {
      if (isPausedManual) { await audioRecorder.record(); setIsPausedManual(false); }
      else { await audioRecorder.pause(); setIsPausedManual(true); }
    } catch { Alert.alert('Error', 'Failed to pause/resume.'); }
  };

  const handleReset = async () => {
    try {
      if (audioSource && playerStatus.playing) try { audioPlayer.pause(); } catch {}
      setAudioSource(null);
      if (isRecordingSession) { try { await audioRecorder.stop(); } catch {} try { await setAudioModeAsync({ allowsRecording: false }); } catch {} }
    } catch {}
    setTime(0); setRecordingUri(null); setIsRecordingSession(false); setIsPausedManual(false);
  };

  const handlePlayPause = async () => {
    if (!recordingUri || !audioSource) return;
    try {
      if (playerStatus.playing) audioPlayer.pause();
      else { if (playerStatus.didJustFinish) audioPlayer.seekTo(0); audioPlayer.play(); }
    } catch { Alert.alert('Error', 'Failed to play recording.'); }
  };

  const handleSave = async () => {
    if (!recordingUri) { Alert.alert('No Recording', 'Please record first.'); return; }
    if (!questionId) { Alert.alert('Error', 'Question ID missing.'); return; }
    if (audioSource && playerStatus.playing) try { audioPlayer.pause(); } catch {}

    const ext = recordingUri.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'ogg' ? 'audio/ogg' : ext === 'webm' ? 'audio/webm' : ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg';

    try {
      const token = await AuthService.getToken();
      if (!token) { Alert.alert('Error', 'Please login.'); return; }

      const formData = new FormData();
      formData.append('audio_file', { uri: recordingUri, type: mimeType, name: `recording_${Date.now()}.${ext}` } as any);

      const response = await fetch(`http://192.168.1.67:8301/api/v1/questions/${questionId}/answers`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData,
      });

      if (!response.ok) { const txt = await response.text(); Alert.alert('Failed', txt); return; }
      const result = await response.json();
      Alert.alert('Success!', `Submitted! ID: ${result.user_answer_id}`, [{ text: 'OK', onPress: () => { handleReset(); loadRecordsCount(); } }]);
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to submit.'); }
  };

  if (isLoading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}><IconSymbol name="chevron.left" size={28} color="#000" /></Pressable>
        <View style={styles.headerText}><Text style={styles.headerTitle}>{topicTitle}</Text><Text style={styles.headerSubtitle}>Practice questions</Text></View>
      </View>
      <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3BB9F0" /><Text style={styles.loadingText}>Loading...</Text></View>
    </View>
  );

  if (error || !question) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}><IconSymbol name="chevron.left" size={28} color="#000" /></Pressable>
        <View style={styles.headerText}><Text style={styles.headerTitle}>{topicTitle}</Text><Text style={styles.headerSubtitle}>Practice questions</Text></View>
      </View>
      <View style={styles.loadingContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error || 'Question not found'}</Text>
        <Pressable style={styles.retryButton} onPress={() => router.back()}><Text style={styles.retryButtonText}>Go Back</Text></Pressable>
      </View>
    </View>
  );

  if (showRecording) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => setShowRecording(false)}><IconSymbol name="chevron.left" size={28} color="#000" /></Pressable>
        <View style={styles.headerText}><Text style={styles.headerTitle}>{topicTitle}</Text><Text style={styles.headerSubtitle}>Practice questions</Text></View>
        <Pressable style={styles.infoButton} onPress={() => setShowInstructions(true)}><IconSymbol name="info.circle" size={28} color="#3BB9F0" /></Pressable>
      </View>
      <Modal animationType="fade" transparent visible={showInstructions} onRequestClose={() => setShowInstructions(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowInstructions(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Speaking Instructions</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>• Think about your answer for a few seconds</Text>
              <Text style={styles.instructionItem}>• Speak clearly and naturally</Text>
              <Text style={styles.instructionItem}>• Aim for 1-2 minutes response</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={() => setShowInstructions(false)}><Text style={styles.closeButtonText}>Got it</Text></Pressable>
          </View>
        </Pressable>
      </Modal>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.partBadge}><Text style={styles.partBadgeText}>Part {question.part}</Text></View>
            <Pressable style={styles.audioButton}><IconSymbol name="speaker.wave.2.fill" size={20} color="#3BB9F0" /></Pressable>
          </View>
          <Text style={styles.questionText}>{question.question_text}</Text>
        </View>
        <View style={styles.recordingCard}>
          {!isRecordingSession && !recordingUri && (
            <View style={styles.initialState}>
              <Text style={styles.instructionText}>Tap the microphone to start</Text>
              <Pressable style={styles.bigMicButton} onPress={handleRecordToggle}><IconSymbol name="mic.fill" size={64} color="#fff" /></Pressable>
              <Text style={styles.hintText}>Speak clearly</Text>
            </View>
          )}
          {isRecordingSession && !recordingUri && (
            <View style={styles.recordingState}>
              <View style={styles.recordingHeader}>
                <View style={styles.recordingIndicator}><View style={[styles.redDot, isPausedManual && styles.pausedDot]} /><Text style={[styles.recordingText, isPausedManual && styles.pausedTextHeader]}>{isPausedManual ? 'Paused' : 'Recording...'}</Text></View>
                <Text style={styles.recordingTimer}>{formatTime(time)}</Text>
              </View>
              <View style={styles.recordingWaveform}>
                {isPausedManual ? <View style={styles.pausedIndicator}><IconSymbol name="pause.fill" size={32} color="#999" /><Text style={styles.pausedText}>Paused</Text></View>
                : <View style={styles.waveformBars}>{[...Array(30)].map((_, i) => <View key={i} style={[styles.waveformBar, styles.recordingWaveformBarActive, { height: `${Math.random()*60+40}%` }]} />)}</View>}
              </View>
              <View style={styles.recordingControls}>
                <Pressable style={styles.cancelButton} onPress={handleReset}><IconSymbol name="xmark.circle.fill" size={32} color="#FF6B6B" /><Text style={styles.cancelButtonText}>Cancel</Text></Pressable>
                <Pressable style={styles.pauseRecordButton} onPress={handlePause}><IconSymbol name={isPausedManual ? 'play.circle.fill' : 'pause.circle.fill'} size={40} color="#3BB9F0" /></Pressable>
                <Pressable style={styles.stopButton} onPress={handleRecordToggle}><IconSymbol name="stop.circle.fill" size={32} color="#4CAF50" /><Text style={styles.stopButtonText}>Done</Text></Pressable>
              </View>
            </View>
          )}
          {recordingUri && !isRecordingSession && (
            <View style={styles.playbackState}>
              <View style={styles.audioMessageContainer}>
                <Pressable style={[styles.playPauseButton, playerStatus.playing && styles.playPauseButtonPlaying]} onPress={handlePlayPause}><IconSymbol name={playerStatus.playing ? "pause.fill" : "play.fill"} size={28} color="#fff" /></Pressable>
                <View style={styles.audioInfo}>
                  <View style={styles.playbackWaveform}><View style={styles.waveformBars}>{[...Array(40)].map((_, i) => <View key={i} style={[styles.playbackWaveformBar, playerStatus.playing && i%3===0 && styles.playbackWaveformBarActive, { height: `${Math.random()*50+30}%` }]} />)}</View></View>
                  <Text style={styles.audioDuration}>{playerStatus.playing ? `${Math.floor(playerStatus.currentTime)}s / ${Math.floor(playerStatus.duration||0)}s` : `${Math.floor(playerStatus.duration||0)}s`}</Text>
                </View>
                <Pressable style={styles.deleteButton} onPress={handleReset}><IconSymbol name="trash.fill" size={22} color="#FF6B6B" /></Pressable>
              </View>
              <Pressable style={styles.sendButton} onPress={handleSave}><Text style={styles.sendButtonText}>Submit to AI Analysis</Text><IconSymbol name="arrow.right.circle.fill" size={24} color="#fff" /></Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}><IconSymbol name="chevron.left" size={28} color="#000" /></Pressable>
        <View style={styles.headerText}><Text style={styles.headerTitle}>{topicTitle}</Text><Text style={styles.headerSubtitle}>Practice questions</Text></View>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.partBadge}><Text style={styles.partBadgeText}>Part {question.part}</Text></View>
            <Pressable style={styles.audioButton}><IconSymbol name="speaker.wave.2.fill" size={20} color="#3BB9F0" /></Pressable>
          </View>
          <Text style={styles.questionText}>{question.question_text}</Text>
        </View>
        <Pressable style={styles.startPracticeButton} onPress={() => setShowRecording(true)}>
          <IconSymbol name="mic.fill" size={24} color="#fff" /><Text style={styles.startPracticeText}>Start New Practice</Text>
        </Pressable>
        <Pressable style={styles.recordsSummaryCard} onPress={() => router.push(`/speaking/my-records?questionId=${questionId}&topicName=${encodeURIComponent(topicTitle)}`)}>
          <View style={styles.recordsSummaryLeft}>
            <View style={styles.recordsIconContainer}><IconSymbol name="waveform" size={24} color="#3BB9F0" /></View>
            <View><Text style={styles.recordsSummaryTitle}>Your Records</Text><Text style={styles.recordsSummaryCount}>{recordsCount} {recordsCount === 1 ? 'recording' : 'recordings'} for this question</Text></View>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#999" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  backButton: { marginRight: 12, padding: 4 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  headerSubtitle: { fontSize: 14, color: '#666' },
  infoButton: { padding: 4 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  errorText: { fontSize: 16, color: '#FF6B6B', marginTop: 16, marginBottom: 24, textAlign: 'center' },
  retryButton: { backgroundColor: '#3BB9F0', borderRadius: 25, paddingHorizontal: 32, paddingVertical: 12 },
  retryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 16, textAlign: 'center' },
  instructionsList: { gap: 8, marginBottom: 4 },
  instructionItem: { fontSize: 15, color: '#333', lineHeight: 22 },
  closeButton: { backgroundColor: '#3BB9F0', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 24, marginTop: 20, alignItems: 'center' },
  closeButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  questionCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  partBadge: { backgroundColor: '#FF8C00', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
  partBadgeText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  audioButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F6FC', justifyContent: 'center', alignItems: 'center' },
  questionText: { fontSize: 18, fontWeight: '600', color: '#000', textAlign: 'center', lineHeight: 26, marginBottom: 12 },
  startPracticeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF6B6B', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 24, marginBottom: 16, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  startPracticeText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  recordsSummaryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  recordsSummaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordsIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F6FC', justifyContent: 'center', alignItems: 'center' },
  recordsSummaryTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  recordsSummaryCount: { fontSize: 14, color: '#666', marginTop: 2 },
  recordingCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, minHeight: 300, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5 },
  initialState: { alignItems: 'center', gap: 24 },
  instructionText: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  bigMicButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  hintText: { fontSize: 14, color: '#999', textAlign: 'center' },
  recordingState: { gap: 24 },
  recordingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  redDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF6B6B' },
  pausedDot: { backgroundColor: '#FF9800' },
  recordingText: { fontSize: 16, fontWeight: '600', color: '#FF6B6B' },
  pausedTextHeader: { color: '#FF9800' },
  recordingTimer: { fontSize: 24, fontWeight: 'bold', color: '#000', letterSpacing: 1 },
  recordingWaveform: { height: 100, justifyContent: 'center', backgroundColor: '#F8F9FA', borderRadius: 16, paddingHorizontal: 16 },
  recordingWaveformBarActive: { backgroundColor: '#FF6B6B' },
  pausedIndicator: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  pausedText: { fontSize: 14, color: '#999', fontWeight: '500' },
  recordingControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cancelButton: { alignItems: 'center', gap: 6 },
  cancelButtonText: { fontSize: 13, fontWeight: '600', color: '#FF6B6B' },
  pauseRecordButton: { padding: 8 },
  stopButton: { alignItems: 'center', gap: 6 },
  stopButtonText: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  playbackState: { gap: 20 },
  audioMessageContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', borderRadius: 20, padding: 16, gap: 12 },
  playPauseButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3BB9F0', justifyContent: 'center', alignItems: 'center', shadowColor: '#3BB9F0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  playPauseButtonPlaying: { backgroundColor: '#2196F3' },
  audioInfo: { flex: 1, gap: 8 },
  playbackWaveform: { height: 40, justifyContent: 'center' },
  playbackWaveformBar: { width: 3, backgroundColor: '#B3D9F2', borderRadius: 2 },
  playbackWaveformBarActive: { backgroundColor: '#3BB9F0' },
  audioDuration: { fontSize: 12, fontWeight: '600', color: '#666' },
  deleteButton: { padding: 8 },
  sendButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', borderRadius: 28, paddingVertical: 18, paddingHorizontal: 24, gap: 12, shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sendButtonText: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  waveformBars: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: '100%' },
  waveformBar: { width: 3, backgroundColor: '#E0E0E0', borderRadius: 2 },
});