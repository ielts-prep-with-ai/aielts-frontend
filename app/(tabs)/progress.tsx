import { StyleSheet, ScrollView, View, Text } from 'react-native';

export default function ProgressScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Progress Screen</Text>
        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
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
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
  },
});
