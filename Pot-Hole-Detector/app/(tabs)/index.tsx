import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function Index() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      // gradient
      colors={["#0f2027", "#203a43", "#2c5364"]}
      style={styles.gradientContainer}
    >
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.contentCard}>
          <Text style={styles.title}>Pot-Hole-Detector</Text>
          <Text style={styles.tagline}>Empowering Safer Roads</Text>

          <Text style={styles.description}>
            Quickly identify and report road imperfections. Take a photo,
            help pave the way to safer, smoother journeys, and make a difference
            in your community.
          </Text>

          {/* Take a Photo Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ctaButtonContainer}
            onPress={() => navigation.navigate("camera")}
          >
            <LinearGradient
              colors={["#ffd200", "#ffa300"]}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>Take a Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* View Dashboard Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ctaButtonContainer}
            onPress={() => navigation.navigate("dashboard")}
          >
            <LinearGradient
              colors={["#ffd200", "#ffa300"]}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>View Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Together, let's improve our roads.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f0f0f0",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#f0f0f0",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  ctaButtonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10, // Space between buttons
  },
  ctaButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 30,
    elevation: 3,
    width: "70%",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    color: "#1E3C72",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1.1,
  },
  footer: {
    fontSize: 14,
    color: "#d0d0d0",
    textAlign: "center",
    marginTop: "auto",
    paddingHorizontal: 20,
  },
});
