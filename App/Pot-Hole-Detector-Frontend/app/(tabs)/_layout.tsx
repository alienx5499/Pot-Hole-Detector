// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#ccc",
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8e8e93",
        headerShown: false, // Hide header for all tabs
        tabBarIcon: ({ color, size }) => {
          let iconName: string = "ellipse"; // Default icon

          switch (route.name) {
            case "index":
              iconName = "home";
              break;
            case "camera":
              iconName = "camera";
              break;
            case "dashboard":
              iconName = "stats-chart";
              break;
            case "profile":
              iconName = "person-circle";
              break;
            default:
              iconName = "ellipse";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />

      {/* Camera Tab */}
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
        }}
      />

      {/* Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
        />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Add any additional styles if needed
});
