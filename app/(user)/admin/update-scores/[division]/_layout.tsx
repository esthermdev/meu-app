import { Stack } from 'expo-router';

export default function UpdateScoresLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
