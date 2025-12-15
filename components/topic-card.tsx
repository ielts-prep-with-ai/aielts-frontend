import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui/card';

interface TopicCardProps {
  title: string;
  description: string;
  questionsCount: number;
  highlighted?: boolean;
  onPress: () => void;
}

export function TopicCard({
  title,
  description,
  questionsCount,
  highlighted = false,
  onPress,
}: TopicCardProps) {
  return (
    <Card onPress={onPress} highlighted={highlighted}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={[styles.title, highlighted && styles.titleHighlighted]}>
            {title}
          </Text>
          <Text style={[styles.description, highlighted && styles.descriptionHighlighted]}>
            {description}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.count, highlighted && styles.countHighlighted]}>
            {questionsCount}
            {'\n'}
            questions
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  titleHighlighted: {
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  descriptionHighlighted: {
    color: '#fff',
    opacity: 0.9,
  },
  right: {
    alignItems: 'flex-end',
  },
  count: {
    fontSize: 13,
    color: '#999',
    textAlign: 'right',
  },
  countHighlighted: {
    color: '#fff',
    opacity: 0.9,
  },
});
