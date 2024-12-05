// layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
      }}
    />
  );
}
