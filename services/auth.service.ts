import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = 'aielts_auth_token';
const REFRESH_TOKEN_KEY = 'aielts_refresh_token';
const USER_DATA_KEY = 'aielts_user_data';

const API_BASE_URL = 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1';
// const API_BASE_URL = 'http://localhost:8301/api/v1';

export interface AuthData {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export type OAuthProvider = 'Google' | 'Facebook' | 'Apple';

export const AuthService = {
  /**
   * Open OAuth in browser for specified provider
   */
  async loginWithOAuth(provider: OAuthProvider): Promise<string | null> {
    // Generate redirect URI that works with Expo Go
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'ielts',
      path: 'oauth-callback',
    });

    const providerLower = provider.toLowerCase();
    const authUrl = `${API_BASE_URL}/auth/${providerLower}?redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🔐 [AUTH SERVICE] Starting ${provider} OAuth Login Flow`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 [AUTH SERVICE] Redirect URI:', redirectUri);
    console.log('🔐 [AUTH SERVICE] Backend URL:', authUrl);
    console.log('═══════════════════════════════════════════════════════════');

    try {
      console.log('🌐 [AUTH SERVICE] Opening browser for authentication...');

      // Open the OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('📥 [AUTH SERVICE] BACKEND RESPONSE RECEIVED');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📥 [AUTH SERVICE] Result type:', result.type);
      console.log('📥 [AUTH SERVICE] Result URL:', result.url);
      console.log('───────────────────────────────────────────────────────────');
      console.log('📥 [AUTH SERVICE] FULL RESULT OBJECT:');
      console.log(JSON.stringify(result, null, 2));
      console.log('───────────────────────────────────────────────────────────');

      // Log all properties of result
      console.log('📥 [AUTH SERVICE] ALL PROPERTIES:');
      for (const key in result) {
        console.log(`   - ${key}:`, result[key]);
      }
      console.log('═══════════════════════════════════════════════════════════');

      if (result.type === 'success') {
        console.log('✅ [AUTH SERVICE] OAuth redirect received successfully!');
        console.log('✅ [AUTH SERVICE] Result URL:', result.url);

        // Parse the URL to see what parameters we got
        if (result.url) {
          console.log('───────────────────────────────────────────────────────────');
          console.log('🔍 [AUTH SERVICE] PARSING RESULT URL:');

          try {
            const urlObj = new URL(result.url);
            console.log('🔍 [AUTH SERVICE] URL Protocol:', urlObj.protocol);
            console.log('🔍 [AUTH SERVICE] URL Host:', urlObj.host);
            console.log('🔍 [AUTH SERVICE] URL Pathname:', urlObj.pathname);
            console.log('🔍 [AUTH SERVICE] URL Search:', urlObj.search);

            console.log('🔍 [AUTH SERVICE] ALL URL PARAMETERS:');
            urlObj.searchParams.forEach((value, key) => {
              console.log(`   - ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
            });

            console.log('───────────────────────────────────────────────────────────');
          } catch (e) {
            console.log('⚠️ [AUTH SERVICE] Could not parse URL as standard URL');
            console.log('⚠️ [AUTH SERVICE] Raw URL:', result.url);
          }
        }

        console.log('✅ [AUTH SERVICE] Checking if URL contains data parameter...');

        // In Expo Go, the result.url contains the callback with data
        // We can process it directly here
        if (result.url && result.url.includes('data=')) {
          console.log('✅ [AUTH SERVICE] Data found in result URL, processing directly...');
          console.log('✅ [AUTH SERVICE] Returning URL for processing:', result.url);
          return result.url; // Return URL so we can process it
        } else {
          console.log('⚠️ [AUTH SERVICE] No data parameter found in URL!');
          console.log('⚠️ [AUTH SERVICE] URL content:', result.url);
          console.log('⚠️ [AUTH SERVICE] Backend may not be redirecting correctly');
          console.log('⚠️ [AUTH SERVICE] Expected format: <scheme>://callback?data=<base64>');
        }

        console.log('✅ [AUTH SERVICE] Waiting for deep link handler to process...');
        // The deep link will be handled by the app
      } else if (result.type === 'cancel') {
        console.log('⚠️ [AUTH SERVICE] User cancelled the OAuth flow');
        console.log('⚠️ [AUTH SERVICE] Browser was closed before completing authentication');
      } else if (result.type === 'dismiss') {
        console.log('⚠️ [AUTH SERVICE] Browser was dismissed');
      } else {
        console.log('❌ [AUTH SERVICE] OAuth flow failed with type:', result.type);
        console.log('❌ [AUTH SERVICE] Full result:', JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH SERVICE] CRITICAL ERROR in OAuth flow');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH SERVICE] Error opening OAuth browser:', error);
      if (error instanceof Error) {
        console.error('❌ [AUTH SERVICE] Error name:', error.name);
        console.error('❌ [AUTH SERVICE] Error message:', error.message);
        console.error('❌ [AUTH SERVICE] Error stack:', error.stack);
      }
      throw error;
    }

    return null;
  },

  /**
   * Backward compatibility: Login with Google
   */
  async loginWithGoogle(): Promise<string | null> {
    return this.loginWithOAuth('Google');
  },

  /**
   * Process the callback from OAuth
   * Decodes base64 data from the deep link
   */
  async handleCallback(url: string): Promise<AuthData> {
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   📱 OAUTH CALLBACK - PROCESSING BACKEND RESPONSE        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('\n🔗 FULL CALLBACK URL:');
    console.log(url);
    console.log('\n');

    try {
      console.log('🔍 Parsing URL...');
      const urlObj = new URL(url);

      console.log('\n📋 URL COMPONENTS:');
      console.log('  Protocol:', urlObj.protocol);
      console.log('  Host:', urlObj.host);
      console.log('  Pathname:', urlObj.pathname);
      console.log('  Search:', urlObj.search);

      const encodedData = urlObj.searchParams.get('data');

      console.log('\n📦 BASE64 ENCODED DATA FROM BACKEND:');
      console.log('  Length:', encodedData?.length || 0, 'characters');
      if (encodedData) {
        console.log('  Full encoded string:', encodedData);
      } else {
        console.log('  ❌ NO DATA PARAMETER FOUND');
      }
      console.log('');

      if (!encodedData) {
        console.error('❌ No data parameter found in URL!');
        console.error('❌ Available params:', Array.from(urlObj.searchParams.keys()));
        throw new Error('No data received in callback');
      }

      // Decode base64 data
      console.log('🔓 Decoding base64...\n');
      const decodedString = atob(encodedData);

      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║          🎯 RAW BACKEND DATA (DECODED)                   ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log(decodedString);
      console.log('\n');

      console.log('🔄 Parsing JSON...\n');
      const rawData = JSON.parse(decodedString);

      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║          📊 BACKEND RESPONSE (PARSED JSON)               ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log(JSON.stringify(rawData, null, 2));
      console.log('\n');

      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║          📋 ALL FIELDS FROM BACKEND                      ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      Object.keys(rawData).forEach(key => {
        const value = rawData[key];
        const displayValue = typeof value === 'string' && value.length > 50
          ? value.substring(0, 50) + '...'
          : value;
        console.log(`  📌 ${key}:`, displayValue);
      });
      console.log('\n');

      // Transform backend response (snake_case/PascalCase) to our format (camelCase)
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║          🔄 TRANSFORMING TO APP FORMAT                   ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');

      const extractedToken = rawData.access_token || rawData.AccessToken || rawData.token || rawData.accessToken;
      const extractedRefreshToken = rawData.refresh_token || rawData.RefreshToken || rawData.refreshToken;
      const extractedUserId = rawData.user_id || rawData.ID || rawData.id || rawData.UserId || rawData.userId || '';
      const extractedEmail = rawData.email || rawData.Email || rawData.user_email || `user_${rawData.user_id}@aielts.app`;
      const extractedName = rawData.username || rawData.name || rawData.Name || rawData.DisplayName || rawData.displayName || rawData.email || `User ${rawData.user_id}`;
      const extractedPicture = rawData.picture || rawData.Picture || rawData.profile_picture || rawData.ProfilePicture || rawData.profilePicture;

      console.log('  🔑 token:', extractedToken ? '✅ Found' : '❌ NOT FOUND');
      console.log('  🔄 refreshToken:', extractedRefreshToken ? '✅ Found' : '❌ NOT FOUND');
      console.log('  👤 user.id:', extractedUserId || '❌ NOT FOUND');
      console.log('  📧 user.email:', extractedEmail);
      console.log('  📝 user.name:', extractedName);
      console.log('  🖼️  user.picture:', extractedPicture ? '✅ Found' : '❌ NOT FOUND');
      console.log('\n');

      const authData: AuthData = {
        token: extractedToken,
        refreshToken: extractedRefreshToken,
        user: {
          id: extractedUserId,
          email: extractedEmail,
          name: extractedName,
          picture: extractedPicture,
        },
      };

      // Validate that we have the required fields
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║          ✅ VALIDATION & STORAGE                         ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');

      if (!authData.token) {
        console.error('❌ VALIDATION FAILED: Missing access token!');
        console.error('Available fields:', Object.keys(rawData).join(', '));
        throw new Error('No access token received from authentication server');
      }

      if (!authData.user.id) {
        console.error('❌ VALIDATION FAILED: Missing user ID!');
        throw new Error('No user ID received from authentication server');
      }

      // If name is empty, use email or "User" as fallback
      if (!authData.user.name) {
        console.log('⚠️  No username, using fallback');
        authData.user.name = authData.user.email || 'User';
      }

      console.log('✅ Validation passed');
      console.log('💾 Storing tokens in secure storage...');
      await this.storeAuthData(authData);
      console.log('✅ Tokens stored successfully!');
      console.log('\n✨ LOGIN COMPLETE ✨\n');

      return authData;
    } catch (error) {
      console.error('\n');
      console.error('╔═══════════════════════════════════════════════════════════╗');
      console.error('║          ❌ ERROR PROCESSING BACKEND RESPONSE            ║');
      console.error('╚═══════════════════════════════════════════════════════════╝');
      if (error instanceof Error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
      } else {
        console.error('Error:', error);
      }
      console.error('\n');
      throw error;
    }
  },

  /**
   * Store authentication data in SecureStore
   */
  async storeAuthData(authData: AuthData): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💾 [STORAGE SERVICE] Step 3: Storing Auth Data');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💾 [STORAGE SERVICE] Attempting to store in SecureStore...');
    console.log('💾 [STORAGE SERVICE] Token key:', AUTH_TOKEN_KEY);
    console.log('💾 [STORAGE SERVICE] User data key:', USER_DATA_KEY);

    try {
      console.log('💾 [STORAGE SERVICE] Storing token...');
      console.log('💾 [STORAGE SERVICE] Token length:', authData.token.length, 'characters');
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authData.token);
      console.log('✅ [STORAGE SERVICE] Token stored successfully');

      // Store refresh token if available
      if (authData.refreshToken) {
        console.log('💾 [STORAGE SERVICE] Storing refresh token...');
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, authData.refreshToken);
        console.log('✅ [STORAGE SERVICE] Refresh token stored successfully');
      }

      console.log('───────────────────────────────────────────────────────────');
      console.log('💾 [STORAGE SERVICE] Storing user data...');
      const userDataString = JSON.stringify(authData.user);
      console.log('💾 [STORAGE SERVICE] User data JSON length:', userDataString.length, 'characters');
      console.log('💾 [STORAGE SERVICE] User data:', userDataString);
      await SecureStore.setItemAsync(USER_DATA_KEY, userDataString);
      console.log('✅ [STORAGE SERVICE] User data stored successfully');

      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ [STORAGE SERVICE] All auth data stored successfully!');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [STORAGE SERVICE] CRITICAL ERROR storing auth data');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [STORAGE SERVICE] Error:', error);
      if (error instanceof Error) {
        console.error('❌ [STORAGE SERVICE] Error message:', error.message);
        console.error('❌ [STORAGE SERVICE] Error stack:', error.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  },

  /**
   * Get stored authentication token
   */
  async getToken(): Promise<string | null> {
    console.log('🔑 [STORAGE] Retrieving token from SecureStore...');
    console.log('🔑 [STORAGE] Token key:', AUTH_TOKEN_KEY);
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      console.log('🔑 [STORAGE] Token retrieved:', token ? `Present (${token.length} chars)` : 'Not found');
      return token;
    } catch (error) {
      console.error('❌ [STORAGE] Error getting token:', error);
      return null;
    }
  },

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ [STORAGE] Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Get stored user data
   */
  async getUserData(): Promise<AuthData['user'] | null> {
    console.log('👤 [STORAGE] Retrieving user data from SecureStore...');
    console.log('👤 [STORAGE] User data key:', USER_DATA_KEY);
    try {
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      console.log('👤 [STORAGE] Raw user data retrieved:', userData ? 'Present' : 'Not found');

      if (userData) {
        const parsedData = JSON.parse(userData);
        console.log('👤 [STORAGE] User data parsed successfully');
        console.log('👤 [STORAGE] User name:', parsedData.name);
        console.log('👤 [STORAGE] User email:', parsedData.email);
        return parsedData;
      }

      return null;
    } catch (error) {
      console.error('❌ [STORAGE] Error getting user data:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    console.log('───────────────────────────────────────────────────────────');
    console.log('🔍 [AUTH CHECK] Checking authentication status...');
    const token = await this.getToken();
    const isAuth = !!token;
    console.log('🔍 [AUTH CHECK] Result:', isAuth ? '✅ Authenticated' : '❌ Not authenticated');
    console.log('───────────────────────────────────────────────────────────');
    return isAuth;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚪 [LOGOUT] Starting logout process...');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚪 [LOGOUT] Removing keys:', [AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      console.log('✅ [LOGOUT] Auth data removed successfully');
      console.log('✅ [LOGOUT] User logged out');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [LOGOUT] Error during logout:', error);
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 [REFRESH TOKEN] Starting token refresh...');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        console.log('❌ [REFRESH TOKEN] No refresh token found');
        return null;
      }

      console.log('🔄 [REFRESH TOKEN] Calling refresh endpoint...');
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('❌ [REFRESH TOKEN] Failed to refresh token:', response.status);
        // If refresh fails, clear all auth data
        await this.logout();
        return null;
      }

      const data = await response.json();
      console.log('✅ [REFRESH TOKEN] New access token received');

      // Store new access token
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.accessToken);

      // Update refresh token if a new one was provided
      if (data.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      }

      console.log('═══════════════════════════════════════════════════════════');
      return data.accessToken;
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [REFRESH TOKEN] Error refreshing token:', error);
      console.error('═══════════════════════════════════════════════════════════');
      // On error, clear all auth data
      await this.logout();
      return null;
    }
  },
};
