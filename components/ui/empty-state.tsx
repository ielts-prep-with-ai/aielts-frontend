import { StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { Button } from './button';

interface EmptyStateProps {
  message: string;
  icon?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({ message, icon = 'tray', actionTitle, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <IconSymbol name={icon} size={64} color="#999" />
      <Text style={styles.text}>{message}</Text>
      {actionTitle && onAction && <Button title={actionTitle} onPress={onAction} variant="outline" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  text: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
