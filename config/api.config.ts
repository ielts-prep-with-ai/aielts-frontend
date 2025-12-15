/**
 * API Configuration
 *
 * Switch between local development and production environments
 */

// Environment selection
// Change this to switch between environments
type Environment = 'local' | 'production';
const CURRENT_ENV: Environment = 'production'; // Change to 'local' for local development

// Environment configurations
const environments = {
  local: {
    API_BASE_URL: 'http://localhost:8301/api/v1',
    WS_BASE_URL: 'ws://localhost:8301/api/v1',
    OAUTH_CALLBACK_SCHEME: 'ielts',
    OAUTH_CALLBACK_PATH: 'oauth-callback',
  },
  production: {
    API_BASE_URL: 'https://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1',
    WS_BASE_URL: 'wss://aielts-deployment-image-61097992433.asia-southeast1.run.app/api/v1',
    OAUTH_CALLBACK_SCHEME: 'ielts',
    OAUTH_CALLBACK_PATH: 'oauth-callback',
  },
};

// Export current environment config
export const API_CONFIG = environments[CURRENT_ENV];

// Helper to get full OAuth callback URL
export function getOAuthCallbackUrl(): string {
  return `${API_CONFIG.OAUTH_CALLBACK_SCHEME}://${API_CONFIG.OAUTH_CALLBACK_PATH}`;
}

// Debug helpers
export function logCurrentEnvironment() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⚙️  API CONFIGURATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Environment: ${CURRENT_ENV}`);
  console.log(`API URL: ${API_CONFIG.API_BASE_URL}`);
  console.log(`WebSocket URL: ${API_CONFIG.WS_BASE_URL}`);
  console.log(`OAuth Callback: ${getOAuthCallbackUrl()}`);
  console.log('═══════════════════════════════════════════════════════════');
}
