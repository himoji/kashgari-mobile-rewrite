import '@/global.css';
import '@/lib/i18n';

import { ApolloProvider } from '@apollo/client/react';
import { setAudioModeAsync } from 'expo-audio';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useActiveProfile, useSession } from '@/features/auth/session';
import { apolloClient } from '@/lib/apollo';
import { fonts } from '@/theme/fonts';
import { ErrorState } from '@/ui/feedback';

void SplashScreen.preventAutoHideAsync();
// Listening tasks and word pronunciation must play with the iOS ringer switch off.
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 justify-center bg-canvas">
      <ErrorState onRetry={retry} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fonts);
  const hydrated = useSession((s) => s.hydrated);
  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ApolloProvider client={apolloClient}>
          <StatusBar style="dark" />
          <RootStack />
        </ApolloProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const signedIn = useSession((s) => s.credentials.length > 0);
  const role = useActiveProfile()?.role;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f6f8fc' } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="accounts" options={{ presentation: role ? 'transparentModal' : 'card', animation: role ? 'fade' : 'default', contentStyle: role ? { backgroundColor: 'transparent' } : undefined }} />
        <Stack.Screen name="word" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
      </Stack.Protected>
      <Stack.Protected guard={role === 'student'}>
        <Stack.Screen name="student" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'teacher'}>
        <Stack.Screen name="teacher" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'parent'}>
        <Stack.Screen name="parent" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'principal'}>
        <Stack.Screen name="principal" />
      </Stack.Protected>
    </Stack>
  );
}
