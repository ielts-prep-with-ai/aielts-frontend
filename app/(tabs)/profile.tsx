import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <IconSymbol name="person.circle.fill" size={100} color="#3BB9F0" />
        </View>
        <Text style={styles.name}>Sarah</Text>
        <Text style={styles.email}>sarah@example.com</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Profile details coming soon...</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  placeholder: {
    alignItems: 'center',
    marginTop: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
});
