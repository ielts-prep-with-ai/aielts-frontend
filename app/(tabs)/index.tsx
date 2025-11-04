import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Sarah!</Text>
          <Text style={styles.subtitle}>Ready for your IELTS practice?</Text>
        </View>
        <View style={styles.profileIconContainer}>
          <IconSymbol name="person.circle.fill" size={50} color="#000" />
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Your Progress</Text>
        <Text style={styles.aimText}>Your aim: 7.5</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar} />
        </View>
        <Text style={styles.streakText}>15 days streak - 142 exercises completed</Text>
      </View>

      {/* Practice by Skills Section */}
      <Text style={styles.sectionTitle}>Practice by Skills</Text>
      <View style={styles.skillsGrid}>
        {/* Listening */}
        <Pressable style={styles.skillCard}>
          <View style={styles.iconContainer}>
            <IconSymbol name="headphones" size={50} color="#3BB9F0" />
          </View>
          <Text style={styles.skillName}>Listening</Text>
          <Text style={styles.skillPercentage}>85%</Text>
        </Pressable>

        {/* Reading */}
        <Pressable style={styles.skillCard}>
          <View style={styles.iconContainer}>
            <IconSymbol name="book.fill" size={50} color="#3BB9F0" />
          </View>
          <Text style={styles.skillName}>Reading</Text>
          <Text style={styles.skillPercentage}>78%</Text>
        </Pressable>

        {/* Writing */}
        <Pressable style={styles.skillCard}>
          <View style={styles.iconContainer}>
            <IconSymbol name="pencil.and.list.clipboard" size={50} color="#3BB9F0" />
          </View>
          <Text style={styles.skillName}>Writing</Text>
          <Text style={styles.skillPercentage}>72%</Text>
        </Pressable>

        {/* Speaking */}
        <Pressable style={styles.skillCard}>
          <View style={styles.iconContainer}>
            <IconSymbol name="bubble.left.and.text.bubble.right.fill" size={50} color="#3BB9F0" />
          </View>
          <Text style={styles.skillName}>Speaking</Text>
          <Text style={styles.skillPercentage}>80%</Text>
        </Pressable>
      </View>

      {/* Quick Action Section */}
      <Text style={styles.sectionTitle}>Quick Action</Text>
      <View style={styles.quickActionContainer}>
        {/* AI Mock Test */}
        <Pressable style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <IconSymbol name="cpu" size={40} color="#3BB9F0" />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>AI Mock Test</Text>
            <Text style={styles.quickActionPercentage}>72%</Text>
          </View>
        </Pressable>

        {/* Vocabulary Builder */}
        <Pressable style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <IconSymbol name="book.pages.fill" size={40} color="#3BB9F0" />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Vocabulary Builder</Text>
            <Text style={styles.quickActionPercentage}>72%</Text>
          </View>
        </Pressable>

        {/* Speaking Practice */}
        <Pressable style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <IconSymbol name="mic.fill" size={40} color="#3BB9F0" />
          </View>
          <View style={styles.quickActionText}>
            <Text style={styles.quickActionTitle}>Speaking Practice</Text>
            <Text style={styles.quickActionPercentage}>72%</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#000',
  },
  profileIconContainer: {
    // Empty for now
  },
  progressCard: {
    backgroundColor: '#3BB9F0',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  aimText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    width: '75%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  skillCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: '#E8F6FC',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  skillPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3BB9F0',
  },
  quickActionContainer: {
    gap: 12,
    marginBottom: 20,
  },
  quickActionItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  quickActionPercentage: {
    fontSize: 14,
    color: '#666',
  },
});
