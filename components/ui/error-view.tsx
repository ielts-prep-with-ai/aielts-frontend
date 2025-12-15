import { StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { Button } from './button';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
      <Text style={styles.text}>{message}</Text>
      {onRetry && <Button title="Retry" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
  },
});
