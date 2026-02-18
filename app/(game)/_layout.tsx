import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen 
        name="create-room" 
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="[roomId]"
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack>
  );
}
