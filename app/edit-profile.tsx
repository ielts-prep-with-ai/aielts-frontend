import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { UsersService } from '@/services';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [targetBand, setTargetBand] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [testDate, setTestDate] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<{ uri: string; type: string; name: string } | null>(null);

  // Load existing profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[EDIT PROFILE] Loading existing profile...');
      console.log('═══════════════════════════════════════════════════════════');

      const profile = await UsersService.getProfile();

      // Populate form with existing data
      setName(profile.user_name || '');
      setEmail(profile.email || user?.email || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setTargetBand(profile.target_score?.toString() || '');
      setCurrentLevel(profile.current_level?.toString() || '');
      setTestDate(profile.test_date || '');
      setProfileImage(profile.avatar_url || null);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[EDIT PROFILE] ✅ Profile loaded successfully');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[EDIT PROFILE] Profile:', profile);
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      // Check if it's a "user not found" error (new user without profile)
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      const isUserNotFound = errorMessage.includes('user information not found') ||
                             errorMessage.includes('not found') ||
                             errorMessage.includes('404');

      if (isUserNotFound) {
        // This is expected for new users - don't log as error
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[EDIT PROFILE] ℹ️  New user - profile not yet created');
        console.log('[EDIT PROFILE] Initializing with user data from auth context');
        console.log('═══════════════════════════════════════════════════════════');

        // Initialize with user data from auth context if available
        if (user) {
          setName(user.name || '');
          setEmail(user.email || '');
          // Other fields remain empty for new profile creation
        }
      } else {
        // Unexpected error - log it and show alert
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[EDIT PROFILE] ❌ Failed to load profile');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[EDIT PROFILE] Error:', error);
        console.error('═══════════════════════════════════════════════════════════');

        Alert.alert(
          'Error',
          'Failed to load profile. Please try again.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);

    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[EDIT PROFILE] Updating profile...');
      console.log('═══════════════════════════════════════════════════════════');

      // Step 1: Upload avatar if changed
      if (avatarFile) {
        console.log('[EDIT PROFILE] Uploading new avatar...');
        
        try {
          // Convert URI to Blob
          const response = await fetch(avatarFile.uri);
          const blob = await response.blob();
          
          // Upload avatar
          const avatarResponse = await UsersService.uploadAvatar(blob);
          
          console.log('[EDIT PROFILE] ✅ Avatar uploaded:', avatarResponse.avatar_url);
          
          // Use the uploaded avatar URL
          setProfileImage(avatarResponse.avatar_url);
        } catch (avatarError) {
          console.error('[EDIT PROFILE] ⚠️  Avatar upload failed:', avatarError);
          Alert.alert(
            'Warning',
            'Failed to upload avatar, but profile will still be updated. Try uploading the avatar again later.'
          );
        }
      }

      // Step 2: Update profile data
      const updateData: any = {
        user_name: name.trim(),
      };

      // Add optional fields only if they have values
      if (email.trim()) updateData.email = email.trim();
      if (phone.trim()) updateData.phone = phone.trim();
      if (bio.trim()) updateData.bio = bio.trim();
      if (targetBand.trim()) {
        const targetScore = parseInt(targetBand.trim());
        if (!isNaN(targetScore)) {
          updateData.target_score = targetScore;
        }
      }
      if (currentLevel.trim()) {
        const currentLevelNum = parseInt(currentLevel.trim());
        if (!isNaN(currentLevelNum)) {
          updateData.current_level = currentLevelNum;
        }
      }
      if (testDate.trim()) updateData.test_date = testDate.trim();

      console.log('[EDIT PROFILE] Update data:', updateData);

      // Call the API
      const updatedProfile = await UsersService.updateProfile(updateData);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[EDIT PROFILE] ✅ PROFILE UPDATED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[EDIT PROFILE] Updated profile:', updatedProfile);
      console.log('═══════════════════════════════════════════════════════════');

      setIsSaving(false);

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[EDIT PROFILE] ❌ FAILED TO UPDATE PROFILE');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[EDIT PROFILE] Error:', error);
      if (error instanceof Error) {
        console.error('[EDIT PROFILE] Error message:', error.message);
      }
      console.error('═══════════════════════════════════════════════════════════');

      setIsSaving(false);

      Alert.alert(
        'Update Failed',
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        {
          text: 'Keep Editing',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleChangeProfilePicture = () => {
    const options: any[] = [
      {
        text: 'Take Photo',
        onPress: takePhoto,
      },
      {
        text: 'Choose from Gallery',
        onPress: pickImage,
      },
    ];

    // Add remove option if there's a profile image
    if (profileImage) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => {
          setProfileImage(null);
          setAvatarFile(null);
        },
      });
    }

    options.push({
      text: 'Cancel',
      style: 'cancel',
    });

    Alert.alert('Change Profile Picture', 'Choose an option', options);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProfileImage(asset.uri);
      
      // Store file info for upload
      setAvatarFile({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `avatar_${Date.now()}.jpg`,
      });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to choose photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProfileImage(asset.uri);
      
      // Store file info for upload
      setAvatarFile({
        uri: asset.uri,
        type: asset.type === 'image' ? 'image/jpeg' : 'image/jpeg',
        name: `avatar_${Date.now()}.jpg`,
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <IconSymbol name="chevron.left" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Profile Picture Section */}
      <View style={[styles.avatarSection, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <IconSymbol name="person.fill" size={60} color={colors.primary} />
            </View>
          )}
        </View>
        <Pressable style={styles.changePhotoButton} onPress={handleChangeProfilePicture}>
          <IconSymbol name="camera.fill" size={18} color={colors.primary} />
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
        </Pressable>
      </View>

      {/* Form Section */}
      <View style={[styles.formSection, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>

        {/* Name Input */}
        <KeyboardAvoidingView>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        </KeyboardAvoidingView>

        {/* Email Input */}
        {/* <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Email Address *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View> */}

        {/* Phone Input */}
        {/* <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View> */}

        {/* Bio Input */}
        {/* <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View> */}
      </View>

      {/* IELTS Goals Section */}
      <View style={[styles.formSection, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>IELTS Goals</Text>

        {/* Target Band Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Target IELTS Score</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={targetBand}
            onChangeText={setTargetBand}
            placeholder="e.g., 7 or 8"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
        </View>

        {/* Current Level Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Current IELTS Level</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={currentLevel}
            onChangeText={setCurrentLevel}
            placeholder="e.g., 5 or 6"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
        </View>

        {/* Test Date Input */}
        <KeyboardAvoidingView>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Test Date</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            value={testDate}
            onChangeText={setTestDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Format: YYYY-MM-DD (e.g., 2024-12-31)
          </Text>
        </View>
        </KeyboardAvoidingView>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable 
          style={[styles.cancelButton, { borderColor: colors.border, opacity: isSaving ? 0.6 : 1 }]} 
          onPress={handleCancel}
          disabled={isSaving}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
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
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 13,
    marginTop: 4,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#3BB9F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});