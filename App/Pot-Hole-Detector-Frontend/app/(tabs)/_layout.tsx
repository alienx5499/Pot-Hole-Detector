// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { 
          display: 'none',  // This hides the default tab bar
          height: 0        // Ensure it takes no space
        }, 
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="dashboard" />
    </Tabs>
  );
}

