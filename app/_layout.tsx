import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        await SplashScreen.hideAsync();
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: true,
        cardStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      <Stack.Screen
        name="(auth)"
        options={{
          animationEnabled: !session,
        }}
      />
      <Stack.Screen
        name="(game)"
        options={{
          animationEnabled: !!session,
        }}
      />
    </Stack>
  );
}
