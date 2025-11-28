import { AuthService } from './auth.service';

const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';

export interface UserProfile {
  id: string;
  email: string;
  user_name: string;
  picture?: string;
  phone?: string;
  bio?: string;
  target_band?: string;
  test_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateUserProfile {
  user_name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  target_band?: string;
  test_date?: string;
  picture?: string;
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
      formData.append('avatar', avatarFile, avatarFile instanceof File ? avatarFile.name : 'avatar.jpg');

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

      const profile = await response.json();

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] ✅ PROFILE FETCHED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] PROFILE DATA:');
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
      console.log('[UsersService] Making PUT request...');

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

      const updatedProfile = await response.json();

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] ✅ PROFILE UPDATED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[UsersService] UPDATED PROFILE DATA:');
      console.log(JSON.stringify(updatedProfile, null, 2));
      console.log('═══════════════════════════════════════════════════════════');

      return updatedProfile;
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