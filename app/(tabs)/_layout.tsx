import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/contexts/theme.context';
import { useAuth } from '@/contexts/auth.context';
import { needsOnboarding } from '@/utils/onboarding';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { colors } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  // useEffect(() => {
  //   checkOnboardingStatus();
  // }, [isAuthenticated]);

  // const checkOnboardingStatus = async () => {
  //   if (!isAuthenticated || authLoading) {
  //     setCheckingOnboarding(false);
  //     return;
  //   }

  //   try {
  //     const needsSetup = await needsOnboarding();
  //     setShouldShowOnboarding(needsSetup);
  //   } catch (error) {
  //     console.error('[TAB LAYOUT] Error checking onboarding:', error);
  //     // On error, don't force onboarding
  //     setShouldShowOnboarding(false);
  //   } finally {
  //     setCheckingOnboarding(false);
  //   }
  // };

  // Show loading while checking auth or onboarding
  // if (authLoading || checkingOnboarding) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
  //       <ActivityIndicator size="large" color={colors.primary} />
  //     </View>
  //   );
  // }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Redirect to onboarding if needed
  // if (shouldShowOnboarding) {
  //   return <Redirect href="/onboarding" />;
  // }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          height: 80,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="doc.text.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
