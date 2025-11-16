import { StyleSheet, ScrollView, View, Text, Pressable } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export default function ListeningScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
          <View>
            <Text style={styles.title}>Listening Practice</Text>
            <Text style={styles.subtitle}>Choose a topic to practice</Text>
          </View>
        </View>
        <Pressable style={styles.aiIconContainer}>
          <IconSymbol name="brain" size={30} color="#3BB9F0" />
        </Pressable>
      </View>

      {/* Coming Soon Message */}
      <View style={styles.comingSoonContainer}>
        <IconSymbol name="headphones" size={80} color="#3BB9F0" />
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonText}>Listening practice will be available soon!</Text>
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
