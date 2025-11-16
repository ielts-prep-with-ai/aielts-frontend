import { StyleSheet, ScrollView, View, Text, Pressable, Alert, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { useState } from 'react';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const router = useRouter();

  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature coming soon!');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Privacy Settings', 'Privacy settings coming soon!');
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Support page coming soon!');
  };

  const handleRateApp = () => {
    Alert.alert('Rate App', 'Thank you for your interest! This will open the app store.');
  };

  const handleAbout = () => {
    Alert.alert('About', 'AI IELTS v1.0.0\n\nYour personal IELTS preparation companion powered by AI.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      {/* Profile Info Section */}
      <View style={[styles.profileSection, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.avatarContainer}>
          {user?.picture ? (
            <Image
              source={{ uri: user.picture }}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => console.log('Error loading profile image')}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="person.fill" size={60} color={colors.primary} />
            </View>
          )}
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'email@example.com'}</Text>

        <Pressable style={styles.editButton} onPress={handleEditProfile}>
          <IconSymbol name="pencil" size={16} color={colors.primary} />
          <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>142</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Exercises</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>15</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>7.5</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Target Band</Text>
        </View>
      </View>

      {/* Account Settings Section */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>

        <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handleEditProfile}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="person.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Personal Information</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handleChangePassword}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="lock.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Change Password</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handlePrivacySettings}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="hand.raised.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy & Security</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* App Preferences Section */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="bell.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#D1D1D6', true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="speaker.wave.2.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Sound Effects</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#D1D1D6', true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="moon.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#D1D1D6', true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>

        <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handleHelpSupport}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="questionmark.circle.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Help & Support</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handleRateApp}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="star.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>Rate App</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={handleAbout}>
          <View style={styles.menuItemLeft}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>About</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Logout Button */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
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
    paddingBottom: 40,
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
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E8F6FC',
  },
  editButtonText: {
    color: '#3BB9F0',
    fontSize: 15,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3BB9F0',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginTop: 16,
  },
});
