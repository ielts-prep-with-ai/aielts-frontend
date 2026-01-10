import { AuthService } from './auth.service';

const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';

export interface UserProfile {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  target_score?: number;
  current_level?: number;
  // Optional fields that may not be in the API yet
  email?: string;
  phone?: string;
  bio?: string;
  test_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserProfile {
  user_name?: string;
  target_score?: number;
  current_level?: number; // Deprecated - use current_score
  current_score?: number; // Backend expects this
  // Optional fields for future use
  email?: string;
  phone?: string;
  bio?: string;
  test_date?: string;
}

export interface AvatarResponse {
  avatar_url: string;
  message?: string;
}

/**
 * Users Service - Handles user profile API calls
 */
class UsersServiceClass {
  /**
   * Get current user's avatar
   * GET /users/me/avatar
   */
  async getAvatar(): Promise<AvatarResponse> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[UsersService] Fetching user avatar...');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      console.log('[UsersService] Token retrieved, making request...');

      const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[UsersService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] ❌ FAILED TO FETCH AVATAR');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] Status:', response.status);
        console.error('[UsersService] Error response:', errorText);
        console.error('═══════════════════════════════════════════════════════════');

        let errorMessage = `Failed to fetch avatar: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const avatarData = await response.json();

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] ✅ AVATAR FETCHED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] Avatar URL:', avatarData.avatar_url);
      console.log('═══════════════════════════════════════════════════════════');

      return avatarData;
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] ❌ ERROR FETCHING AVATAR');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] Error:', error);
      if (error instanceof Error) {
        console.error('[UsersService] Error message:', error.message);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  }

  /**
   * Upload/update current user's avatar
   * POST /users/me/avatar
   * 
   * Note: This endpoint requires multipart/form-data for file upload
   */
  async uploadAvatar(avatarFile: File | Blob): Promise<AvatarResponse> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[UsersService] Uploading user avatar...');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[UsersService] File type:', avatarFile.type);
    console.log('[UsersService] File size:', avatarFile.size, 'bytes');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      console.log('[UsersService] Token retrieved');
      console.log('[UsersService] Creating FormData...');

      // Create FormData
      const formData = new FormData();
      formData.append('AvatarFile', avatarFile, avatarFile instanceof File ? avatarFile.name : 'avatar.jpg');

      console.log('[UsersService] Making POST request with multipart/form-data...');

      // Make request with multipart/form-data
      const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let the browser set it with boundary
        },
        body: formData,
      });

      console.log('[UsersService] Response status:', response.status);
      console.log('[UsersService] Response status text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to upload avatar: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] ❌ ERROR UPLOADING AVATAR');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] Error:', error);
      if (error instanceof Error) {
        console.error('[UsersService] Error message:', error.message);
        console.error('[UsersService] Error stack:', error.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  }

  /**
   * Get current user profile
   * GET /users/me
   */
  async getProfile(): Promise<UserProfile> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[UsersService] Fetching user profile...');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      console.log('[UsersService] Token retrieved, making request...');

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[UsersService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();

        // Handle 404 specifically - user profile doesn't exist yet (expected for new users)
        if (response.status === 404) {
          console.log('═══════════════════════════════════════════════════════════');
          console.log('[UsersService] ℹ️  Profile not found (404) - new user');
          console.log('═══════════════════════════════════════════════════════════');
          throw new Error('user information not found');
        }

        // For other errors, log the details
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] ❌ FAILED TO FETCH PROFILE');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] Status:', response.status);
        console.error('[UsersService] Error response:', errorText);
        console.error('═══════════════════════════════════════════════════════════');

        let errorMessage = `Failed to fetch profile: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const rawProfile = await response.json();

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] ✅ PROFILE FETCHED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] RAW PROFILE DATA FROM BACKEND:');
      console.log(JSON.stringify(rawProfile, null, 2));
      console.log('═══════════════════════════════════════════════════════════');

      // Map backend fields to frontend expected fields
      // Backend might use different field names, so we handle common variations

      // Debug: Log what we're checking for current_level
      console.log('[UsersService] Checking current_level fields:');
      console.log('  - current_level:', rawProfile.current_level);
      console.log('  - currentLevel:', rawProfile.currentLevel);
      console.log('  - current_band:', rawProfile.current_band);
      console.log('  - currentBand:', rawProfile.currentBand);
      console.log('  - current_score:', rawProfile.current_score);
      console.log('  - currentScore:', rawProfile.currentScore);

      const profile: UserProfile = {
        user_id: rawProfile.user_id || rawProfile.userId,
        user_name: rawProfile.user_name || rawProfile.userName || rawProfile.username,
        avatar_url: rawProfile.avatar_url || rawProfile.avatarUrl,
        email: rawProfile.email,
        phone: rawProfile.phone,
        bio: rawProfile.bio,
        test_date: rawProfile.test_date || rawProfile.testDate,
        created_at: rawProfile.created_at || rawProfile.createdAt,
        updated_at: rawProfile.updated_at || rawProfile.updatedAt,
        // Handle common field name variations for scores/levels
        // Use ?? instead of || to properly handle 0 values
        current_level: rawProfile.current_level ?? rawProfile.currentLevel ?? rawProfile.current_band ?? rawProfile.currentBand ?? rawProfile.current_score ?? rawProfile.currentScore,
        target_score: rawProfile.target_score ?? rawProfile.targetScore ?? rawProfile.target_band ?? rawProfile.targetBand,
      };

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] MAPPED PROFILE DATA:');
      console.log(JSON.stringify(profile, null, 2));
      console.log('═══════════════════════════════════════════════════════════');

      return profile;
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] ❌ ERROR FETCHING PROFILE');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] Error:', error);
      if (error instanceof Error) {
        console.error('[UsersService] Error message:', error.message);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  }

  /**
   * Update current user profile
   * PUT /users/me or PATCH /users/me
   */
  async updateProfile(data: UpdateUserProfile): Promise<UserProfile> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[UsersService] Updating user profile...');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[UsersService] UPDATE DATA:');
    console.log(JSON.stringify(data, null, 2));
    console.log('═══════════════════════════════════════════════════════════');

    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      console.log('[UsersService] Token retrieved');
      console.log('[UsersService] Token length:', token.length);
      console.log('[UsersService] Making PUT request to:', `${API_BASE_URL}/users/me`);
      console.log('[UsersService] Request body:', JSON.stringify(data));

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('[UsersService] Response status:', response.status);
      console.log('[UsersService] Response status text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] ❌ UPDATE FAILED');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] Status:', response.status);
        console.error('[UsersService] Error response:', errorText);
        console.error('═══════════════════════════════════════════════════════════');

        let errorMessage = `Failed to update profile: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const rawProfile = await response.json();

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] ✅ PROFILE UPDATED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] RAW UPDATED PROFILE DATA:');
      console.log(JSON.stringify(rawProfile, null, 2));
      console.log('═══════════════════════════════════════════════════════════');

      // Map backend fields to frontend expected fields
      const profile: UserProfile = {
        user_id: rawProfile.user_id || rawProfile.userId,
        user_name: rawProfile.user_name || rawProfile.userName || rawProfile.username,
        avatar_url: rawProfile.avatar_url || rawProfile.avatarUrl,
        email: rawProfile.email,
        phone: rawProfile.phone,
        bio: rawProfile.bio,
        test_date: rawProfile.test_date || rawProfile.testDate,
        created_at: rawProfile.created_at || rawProfile.createdAt,
        updated_at: rawProfile.updated_at || rawProfile.updatedAt,
        // Handle common field name variations
        // Use ?? instead of || to properly handle 0 values
        current_level: rawProfile.current_level ?? rawProfile.currentLevel ?? rawProfile.current_band ?? rawProfile.currentBand ?? rawProfile.current_score ?? rawProfile.currentScore,
        target_score: rawProfile.target_score ?? rawProfile.targetScore ?? rawProfile.target_band ?? rawProfile.targetBand,
      };

      return profile;
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] ❌ ERROR UPDATING PROFILE');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] Error:', error);
      if (error instanceof Error) {
        console.error('[UsersService] Error message:', error.message);
        console.error('[UsersService] Error stack:', error.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  }

  /**
   * Delete current user account
   * DELETE /users/me
   */
  async deleteAccount(): Promise<{ message: string }> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[UsersService] ⚠️  DELETING USER ACCOUNT');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      const token = await AuthService.getToken();
      if (!token) {
        throw new Error('No authentication token found. Please login.');
      }

      console.log('[UsersService] Token retrieved');
      console.log('[UsersService] Making DELETE request...');

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[UsersService] Response status:', response.status);
      console.log('[UsersService] Response status text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] ❌ DELETE FAILED');
        console.error('═══════════════════════════════════════════════════════════');
        console.error('[UsersService] Status:', response.status);
        console.error('[UsersService] Error response:', errorText);
        console.error('═══════════════════════════════════════════════════════════');

        let errorMessage = `Failed to delete account: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (errorText) errorMessage = errorText;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] ✅ ACCOUNT DELETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] RESPONSE:');
      console.log(JSON.stringify(result, null, 2));
      console.log('═══════════════════════════════════════════════════════════');

      return result;
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] ❌ ERROR DELETING ACCOUNT');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[UsersService] Error:', error);
      if (error instanceof Error) {
        console.error('[UsersService] Error message:', error.message);
        console.error('[UsersService] Error stack:', error.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  }
}

export const UsersService = new UsersServiceClass();