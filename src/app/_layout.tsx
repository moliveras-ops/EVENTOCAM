import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EventsProvider } from '@/lib/EventsContext';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <EventsProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text },
            contentStyle: { backgroundColor: colors.background },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ title: 'EventoCam' }} />
          <Stack.Screen name="create" options={{ title: 'Nuevo evento', presentation: 'modal' }} />
          <Stack.Screen name="join" options={{ title: 'Unirme a un evento', presentation: 'modal' }} />
          <Stack.Screen name="scan" options={{ title: 'Escanear QR', headerShown: false }} />
          <Stack.Screen name="event/[id]/index" options={{ title: 'Evento' }} />
          <Stack.Screen name="event/[id]/camera" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="event/[id]/qr" options={{ title: 'Invitar', presentation: 'modal' }} />
          <Stack.Screen
            name="event/[id]/photo/[photoId]"
            options={{ title: '', headerStyle: { backgroundColor: colors.black }, headerTintColor: colors.white }}
          />
        </Stack>
      </EventsProvider>
    </SafeAreaProvider>
  );
}
