// app/_layout.tsx
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import AnimatedSplashScreen from "./AnimatedSplashScreen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [AnimationFinish , setAnimationFinish] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false); 
  const [fontsLoaded] = useFonts({
    // Add any custom fonts here
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
      setIsAppReady(true)
    }
  }, [isLoading, fontsLoaded]);

  if (!isAppReady || !AnimationFinish) {
    return (
      <AnimatedSplashScreen onAnimationFinish={(isCancelled) => {
        setAnimationFinish(true);
      }} />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="maps" options={{ headerShown: false }} />
    </Stack>
  );
}

