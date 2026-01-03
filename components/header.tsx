import { Pressable, StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showHome?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export function Header({
  title,
  subtitle,
  showBack = true,
  showHome = false,
  rightIcon = 'brain',
  onRightIconPress,
}: HeaderProps) {
  const router = useRouter();

  const handleHomePress = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && (
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={28} color="#000" />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rightSection}>
        {showHome && (
          <Pressable style={styles.homeButton} onPress={handleHomePress}>
            <IconSymbol name="house.fill" size={24} color="#3BB9F0" />
          </Pressable>
        )}
        {rightIcon && (
          <Pressable style={styles.iconContainer} onPress={onRightIconPress}>
            <IconSymbol name={rightIcon} size={30} color="#3BB9F0" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F6FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
