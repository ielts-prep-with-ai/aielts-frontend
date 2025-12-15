import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/card';

interface QuestionCardProps {
  questionText: string;
  part: number;
  tagName?: string;
  onPress: () => void;
}

export function QuestionCard({ questionText, part, tagName, onPress }: QuestionCardProps) {
  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Part {part}</Text>
        </View>
        {tagName && (
          <View style={[styles.badge, styles.tagBadge]}>
            <Text style={styles.tagText}>{tagName}</Text>
          </View>
        )}
      </View>
      <Text style={styles.questionText}>{questionText}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#3BB9F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tagBadge: {
    backgroundColor: '#E8F6FC',
  },
  tagText: {
    color: '#3BB9F0',
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
});
