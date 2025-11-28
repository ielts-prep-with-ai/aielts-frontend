import { AuthData, AuthService, OAuthProvider } from '@/services/auth.service';
import { useRouter } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface AuthContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthData['user'] | null;
  token: string | null;
  login: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  handleAuthCallback: (url: string) => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthData['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 [AUTH CONTEXT] Checking Authentication Status on Mount');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 [AUTH CONTEXT] State before check:');
    console.log('   - isLoading:', isLoading);
    console.log('   - isAuthenticated:', isAuthenticated);
    console.log('   - user:', user?.username || 'null');

    try {
      console.log('🔄 [AUTH CONTEXT] Calling AuthService.isAuthenticated()...');
      const authenticated = await AuthService.isAuthenticated();
      console.log('🔄 [AUTH CONTEXT] Authentication result:', authenticated);
      console.log('🔄 [AUTH CONTEXT] Updating isAuthenticated state to:', authenticated);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        console.log('✅ [AUTH CONTEXT] User is authenticated, loading user data...');
        console.log('🔄 [AUTH CONTEXT] Fetching user data from storage...');
        const userData = await AuthService.getUserData();
        console.log('🔄 [AUTH CONTEXT] Fetching token from storage...');
        const userToken = await AuthService.getToken();

        console.log('───────────────────────────────────────────────────────────');
        console.log('👤 [AUTH CONTEXT] Loaded data:');
        console.log('   - User name:', userData?.name || 'null');
        console.log('   - User email:', userData?.email || 'null');
        console.log('   - Token:', userToken ? `Present (${userToken.length} chars)` : 'null');
        console.log('───────────────────────────────────────────────────────────');

        console.log('🔄 [AUTH CONTEXT] Setting user state...');
        setUser(userData);
        console.log('🔄 [AUTH CONTEXT] Setting token state...');
        setToken(userToken);
        console.log('✅ [AUTH CONTEXT] User state updated successfully');
      } else {
        console.log('ℹ️ [AUTH CONTEXT] User not authenticated, skipping data load');
      }
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error checking auth status');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error:', error);
      if (error instanceof Error) {
        console.error('❌ [AUTH CONTEXT] Error message:', error.message);
      }
    } finally {
      console.log('🔄 [AUTH CONTEXT] Setting isLoading to false...');
      setIsLoading(false);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ [AUTH CONTEXT] Auth check complete');
      console.log('═══════════════════════════════════════════════════════════');
    }
  };

  const login = async (provider: OAuthProvider) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🚀 [AUTH CONTEXT] User Initiated ${provider} Login`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🚀 [AUTH CONTEXT] Calling AuthService.loginWithOAuth('${provider}')...`);

    try {
      const callbackUrl = await AuthService.loginWithOAuth(provider);

      if (callbackUrl) {
        console.log('✅ [AUTH CONTEXT] Received callback URL directly from browser');
        console.log('🔄 [AUTH CONTEXT] Processing callback...');
        await handleAuthCallback(callbackUrl);
      } else {
        console.log('✅ [AUTH CONTEXT] Login flow initiated successfully');
        console.log('ℹ️ [AUTH CONTEXT] Waiting for OAuth callback...');
      }

      console.log('═══════════════════════════════════════════════════════════');
      // The actual login will be completed in handleAuthCallback
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error during login initiation');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error:', error);
      if (error instanceof Error) {
        console.error('❌ [AUTH CONTEXT] Error message:', error.message);
      }
      throw error;
    }
  };

  const handleAuthCallback = async (url: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 [AUTH CONTEXT] Handling OAuth Callback');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 [AUTH CONTEXT] Callback URL received:', url);
    console.log('🎯 [AUTH CONTEXT] Current state before processing:');
    console.log('   - isLoading:', isLoading);
    console.log('   - isAuthenticated:', isAuthenticated);

    try {
      console.log('🔄 [AUTH CONTEXT] Setting isLoading to true...');
      setIsLoading(true);

      console.log('🔄 [AUTH CONTEXT] Calling AuthService.handleCallback()...');
      const authData = await AuthService.handleCallback(url);

      console.log('───────────────────────────────────────────────────────────');
      console.log('✅ [AUTH CONTEXT] Auth data received from service');
      console.log('👤 [AUTH CONTEXT] User data to set in state:');
      console.log('   - Username:', authData.user.username);
      console.log('   - Email:', authData.user.email);
      console.log('   - ID:', authData.user.id);
      console.log('   - Token length:', authData.token.length);
      console.log('───────────────────────────────────────────────────────────');

      console.log('🔄 [AUTH CONTEXT] Updating context state...');
      console.log('🔄 [AUTH CONTEXT] Setting user...');
      setUser(authData.user);
      console.log('🔄 [AUTH CONTEXT] Setting token...');
      setToken(authData.token);
      console.log('🔄 [AUTH CONTEXT] Setting isAuthenticated to true...');
      setIsAuthenticated(true);

      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ [AUTH CONTEXT] Auth state updated successfully!');
      console.log('✅ [AUTH CONTEXT] User is now logged in');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error handling auth callback');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error:', error);
      if (error instanceof Error) {
        console.error('❌ [AUTH CONTEXT] Error message:', error.message);
        console.error('❌ [AUTH CONTEXT] Error stack:', error.stack);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    } finally {
      console.log('🔄 [AUTH CONTEXT] Setting isLoading to false...');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚪 [AUTH CONTEXT] User Initiated Logout');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚪 [AUTH CONTEXT] Current state before logout:');
    console.log('   - User:', user?.username || 'null');
    console.log('   - isAuthenticated:', isAuthenticated);

    try {
      console.log('🔄 [AUTH CONTEXT] Calling AuthService.logout()...');
      await AuthService.logout();

      console.log('🔄 [AUTH CONTEXT] Clearing context state...');
      console.log('🔄 [AUTH CONTEXT] Setting user to null...');
      setUser(null);
      console.log('🔄 [AUTH CONTEXT] Setting token to null...');
      setToken(null);
      console.log('🔄 [AUTH CONTEXT] Setting isAuthenticated to false...');
      setIsAuthenticated(false);

      // Clear session check interval
      if (sessionCheckIntervalRef.current) {
        console.log('🔄 [AUTH CONTEXT] Clearing session check interval...');
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ [AUTH CONTEXT] Logged out successfully');
      console.log('═══════════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error during logout');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error:', error);
      if (error instanceof Error) {
        console.error('❌ [AUTH CONTEXT] Error message:', error.message);
      }
      console.error('═══════════════════════════════════════════════════════════');
      throw error;
    }
  };

  /**
   * Check if the current session is still valid
   * Returns true if valid, false if expired
   * Automatically logs out and redirects to login if session is invalid
   */
  const checkSession = async (): Promise<boolean> => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 [AUTH CONTEXT] Checking Session Validity');
    console.log('═══════════════════════════════════════════════════════════');

    try {
      // If not authenticated, no need to check
      if (!isAuthenticated) {
        console.log('ℹ️ [AUTH CONTEXT] User not authenticated, skipping session check');
        console.log('═══════════════════════════════════════════════════════════');
        return false;
      }

      console.log('🔍 [AUTH CONTEXT] Validating token...');
      const isValid = await AuthService.validateToken();

      if (!isValid) {
        console.log('⚠️ [AUTH CONTEXT] Session expired or invalid!');
        console.log('🚪 [AUTH CONTEXT] Logging out user...');

        // Clear state
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);

        // Clear session check interval
        if (sessionCheckIntervalRef.current) {
          clearInterval(sessionCheckIntervalRef.current);
          sessionCheckIntervalRef.current = null;
        }

        console.log('🧭 [AUTH CONTEXT] Redirecting to login...');
        router.replace('/login');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('❌ [AUTH CONTEXT] Session expired - user redirected to login');
        console.log('═══════════════════════════════════════════════════════════');
        return false;
      }

      console.log('✅ [AUTH CONTEXT] Session is valid');
      console.log('═══════════════════════════════════════════════════════════');
      return true;
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error checking session');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ [AUTH CONTEXT] Error:', error);
      console.error('═══════════════════════════════════════════════════════════');
      return false;
    }
  };

  // Set up periodic session checking when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⏰ [AUTH CONTEXT] Setting up periodic session check');
      console.log('⏰ [AUTH CONTEXT] Check interval: every 30 minutes');
      console.log('═══════════════════════════════════════════════════════════');

      // Check session immediately
      checkSession();

      // Then check every 30 minutes (1800000 ms)
      sessionCheckIntervalRef.current = setInterval(() => {
        console.log('⏰ [AUTH CONTEXT] Periodic session check triggered');
        checkSession();
      }, 1800000); // 30 minutes

      return () => {
        if (sessionCheckIntervalRef.current) {
          console.log('🧹 [AUTH CONTEXT] Cleaning up session check interval');
          clearInterval(sessionCheckIntervalRef.current);
          sessionCheckIntervalRef.current = null;
        }
      };
    }
  }, [isAuthenticated, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        token,
        login,
        logout,
        handleAuthCallback,
        checkSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
