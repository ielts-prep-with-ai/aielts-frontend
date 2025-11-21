import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Language = 'en' | 'vi';

const instructions = {
  en: [
    'The exam is divided into 3 parts. The name of each part is mentioned on the top of the page.',
    'There will be an active timer to remind you of how much time is left.',
    'You will use a computer and headset to read and respond to questions.',
    'Submit your test after you finish by clicking on "SUBMIT TEST". Make sure you have attempt maximum number of questions.',
    'You can also review your recording and record again to change your responses after completing and before submission.',
    'You can check required browser settings for recording.',
  ],
  vi: [
    'Bài thi được chia thành 3 phần. Tên của mỗi phần được hiển thị ở đầu trang.',
    'Sẽ có đồng hồ đếm ngược để nhắc bạn còn bao nhiêu thời gian.',
    'Bạn sẽ sử dụng máy tính và tai nghe để đọc và trả lời câu hỏi.',
    'Nộp bài sau khi hoàn thành bằng cách nhấn "NỘP BÀI". Hãy đảm bảo bạn đã trả lời tối đa số câu hỏi.',
    'Bạn cũng có thể xem lại bản ghi âm và ghi lại để thay đổi câu trả lời trước khi nộp bài.',
    'Bạn có thể kiểm tra cài đặt trình duyệt cần thiết để ghi âm.',
  ],
};

const labels = {
  en: { title: 'GENERAL INSTRUCTIONS', next: 'Next step' },
  vi: { title: 'HƯỚNG DẪN CHUNG', next: 'Bước tiếp theo' },
};

export default function MockTestInstructionsScreen() {
  const router = useRouter();
  const { testId, testConfig } = useLocalSearchParams<{ testId: string; testConfig: string }>();
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'vi' : 'en');
  };

  const handleNextStep = () => {
    router.push({
      pathname: '/mock-test/microphone-test',
      params: { testId, testConfig },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={28} color="#000" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Mock Test</Text>
        
        {/* Language Toggle */}
        <Pressable style={styles.langToggle} onPress={toggleLanguage}>
          <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
          <Text style={styles.langDivider}>|</Text>
          <Text style={[styles.langText, language === 'vi' && styles.langTextActive]}>VI</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.pageTitle}>{labels[language].title}</Text>

        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          {instructions[language].map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}

          {/* Next Step Button */}
          <Pressable style={styles.nextButton} onPress={handleNextStep}>
            <Text style={styles.nextButtonText}>{labels[language].next}</Text>
          </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  langTextActive: {
    color: '#3BB9F0',
  },
  langDivider: {
    fontSize: 13,
    color: '#CCC',
    marginHorizontal: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 18,
    color: '#000',
    marginRight: 12,
    marginTop: 2,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#FF8C00',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});