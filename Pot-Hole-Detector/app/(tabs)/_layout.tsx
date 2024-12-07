import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet } from "react-native";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        // general tabbar styling
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
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/images/index.png")}
              style={[styles.icon, { width: size, height: size }]}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* Camera Tab */}
      <Tabs.Screen
        name="camera"
        options={{
          headerShown: false,
          title: "Camera",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/images/camera.png")}
              style={[styles.icon, { width: size, height: size }]}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          headerShown: false,
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require("../../assets/images/dashboard.png")}
              style={[styles.icon, { width: size, height: size }]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    // add any icon styling if needed later
  },
});
