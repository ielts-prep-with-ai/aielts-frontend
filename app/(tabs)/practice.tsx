import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

interface PracticeCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  gradientColors: string[];
  onPress: () => void;
}

function PracticeCard({ title, description, icon, color, gradientColors, onPress }: PracticeCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.practiceCard,
        pressed && styles.practiceCardPressed
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardIconContainer}>
          <IconSymbol name={icon} size={48} color="#fff" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <View style={styles.cardArrow}>
          <IconSymbol name="chevron.right" size={24} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function PracticeScreen() {
  const router = useRouter();

  const practiceModules = [
    {
      title: 'Listening',
      description: 'Practice with diverse audio recordings and accents',
      icon: 'headphones',
      color: '#3BB9F0',
      gradientColors: ['#3BB9F0', '#2A8CC7'],
      route: '/listening',
    },
    {
      title: 'Reading',
      description: 'Enhance comprehension with academic texts',
      icon: 'book.fill',
      color: '#4CAF50',
      gradientColors: ['#4CAF50', '#388E3C'],
      route: '/reading',
    },
    {
      title: 'Writing',
      description: 'Improve essay and report writing skills',
      icon: 'pencil.and.list.clipboard',
      color: '#FF9800',
      gradientColors: ['#FF9800', '#F57C00'],
      route: '/writing',
    },
    {
      title: 'Speaking',
      description: 'Build confidence with AI-powered practice',
      icon: 'mic.fill',
      color: '#E91E63',
      gradientColors: ['#E91E63', '#C2185B'],
      route: '/speaking',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Practice</Text>
            <Text style={styles.headerSubtitle}>Choose a skill to practice</Text>
          </View>
        </View>

        {/* Practice Cards */}
        <View style={styles.cardsContainer}>
          {practiceModules.map((module, index) => (
            <PracticeCard
              key={index}
              title={module.title}
              description={module.description}
              icon={module.icon}
              color={module.color}
              gradientColors={module.gradientColors}
              onPress={() => router.push(module.route)}
            />
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <IconSymbol name="star.fill" size={24} color="#3BB9F0" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Track Your Progress</Text>
              <Text style={styles.infoDescription}>
                Monitor your performance across all four skills with detailed analytics
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <IconSymbol name="brain" size={24} color="#4CAF50" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>AI-Powered Feedback</Text>
              <Text style={styles.infoDescription}>
                Get instant, personalized feedback to improve faster
              </Text>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  practiceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  practiceCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 120,
  },
  cardIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  cardArrow: {
    marginLeft: 12,
  },
  infoSection: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
