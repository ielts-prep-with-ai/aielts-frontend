import { UsersService } from '@/services';

/**
 * Check if user needs to complete onboarding
 * Returns true if user needs onboarding, false if already completed
 */
export async function needsOnboarding(): Promise<boolean> {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[ONBOARDING CHECK] Checking if user needs onboarding...');
    console.log('═══════════════════════════════════════════════════════════');

    const profile = await UsersService.getProfile();

    console.log('[ONBOARDING CHECK] Profile data:', profile);
    console.log('[ONBOARDING CHECK] target_score:', profile.target_score);

    // User needs onboarding if target_score is not set (null, undefined, or 0)
    const needsSetup = !profile.target_score || profile.target_score === 0;

    console.log('═══════════════════════════════════════════════════════════');
    console.log('[ONBOARDING CHECK] Needs onboarding:', needsSetup);
    console.log('═══════════════════════════════════════════════════════════');

    return needsSetup;
  } catch (error) {
    // If profile doesn't exist (404), user definitely needs onboarding
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const isUserNotFound = errorMessage.includes('user information not found') ||
                           errorMessage.includes('not found') ||
                           errorMessage.includes('404');

    if (isUserNotFound) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[ONBOARDING CHECK] New user - needs onboarding');
      console.log('═══════════════════════════════════════════════════════════');
      return true;
    }

    // For other errors, log and assume they need onboarding to be safe
    console.error('═══════════════════════════════════════════════════════════');
    console.error('[ONBOARDING CHECK] Error checking profile:', error);
    console.error('═══════════════════════════════════════════════════════════');
    return true;
  }
}
