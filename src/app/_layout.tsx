import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/motion';
import { StoreProvider, useStore } from '@/lib/store';
import { colors, fonts } from '@/lib/theme';

// Keep the violet splash up until fonts and saved data are loaded, then fade it out.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 300 });

function Root() {
  const { ready } = useStore();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.heading, fontSize: 19, color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="chat" options={{ title: 'Ask BayaniHan', presentation: 'modal' }} />
      <Stack.Screen name="route" options={{ title: 'Safer route' }} />
      <Stack.Screen name="about" options={{ title: 'About and privacy' }} />
      <Stack.Screen name="admin" options={{ title: 'Coordinator review' }} />
      <Stack.Screen name="my-reports" options={{ title: '' }} />
      <Stack.Screen name="hotlines" options={{ title: 'Get help now' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <ToastProvider>
          <Root />
        </ToastProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
