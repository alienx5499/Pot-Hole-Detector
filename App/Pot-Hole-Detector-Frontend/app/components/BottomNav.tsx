import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Camera Button */}
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => router.push("/camera")}
      >
        <View style={styles.cameraCircle}>
          <View>
            <View>
              <Ionicons name="camera-outline" size={44} color="#000" />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/")}
        >
          <Ionicons
            name="home"
            size={28}
            color={isActive("/") ? "#A99985" : "#FFFFFF"}
          />
          <Text
            style={[styles.navLabel, isActive("/") && styles.navLabelActive]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/dashboard")}
        >
          <Ionicons
            name="bar-chart"
            size={28}
            color={isActive("/dashboard") ? "#A99985" : "#FFFFFF"}
          />
          <Text
            style={[
              styles.navLabel,
              isActive("/dashboard") && styles.navLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  cameraButton: {
    position: "absolute",
    bottom: 35,
    alignSelf: "center",
    zIndex: 2,
  },
  cameraCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F8FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 70,
    backgroundColor: "#001524",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    paddingBottom: 10,
    zIndex: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.5)",
    overflow: "visible",
    paddingTop: 10,
  },
  navItem: {
    width: 70,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    fontSize: 12,
    marginTop: 2,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#FFFFFF",
  },
});
