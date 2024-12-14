import React, { useEffect, useState  } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import GuestConversionModal from '../components/GuestConversionModal';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';


export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const checkGuestStatus = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (!token) {
            await AsyncStorage.removeItem('isGuest');
            router.replace('/auth');
            return;
          }

          const isGuestUser = await AsyncStorage.getItem('isGuest');

          setIsGuest(isGuestUser === 'true');
        } catch (error) {
          console.error('Error checking guest status:', error);
          setIsGuest(false);
        }
      };
      checkGuestStatus();
    }, [])
  );

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/auth');
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleCameraPress = () => {
    router.push("/camera");
  };

  const handleDashboardPress = () => {
    router.push("/dashboard");
  };

  const handleConversionSuccess = async () => {
    try {
      await AsyncStorage.setItem('isGuest', 'false');
      setShowConversionModal(false);
      setIsGuest(false);
    } catch (error) {
      console.error('Error updating guest status:', error);
    }
  };

  useEffect(() => {
    const debugStorage = async () => {
      const allKeys = await AsyncStorage.getAllKeys();
      const allItems = await AsyncStorage.multiGet(allKeys);
    };
    debugStorage();
  }, []);

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
          <Text style={styles.title}>Welcome</Text>
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
            onPress={handleCameraPress}
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
            onPress={handleDashboardPress}
          >
            <LinearGradient
              colors={["#ffd200", "#ffa300"]}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>View Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ctaButtonContainer}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={["#ffd200", "#ffa300"]}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Together, let's improve our roads.</Text>

        {isGuest && (
          <TouchableOpacity
            style={styles.conversionPrompt}
            onPress={() => setShowConversionModal(true)}
          >
            <Text style={styles.conversionText}>
              Create an account to save your data
            </Text>
          </TouchableOpacity>
        )}

        <GuestConversionModal
          visible={showConversionModal}
          onClose={() => setShowConversionModal(false)}
          onSuccess={handleConversionSuccess}
        />
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
  conversionPrompt: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.9)',
    padding: 15,
    borderRadius: 25,
    alignSelf: 'center',
  },
  conversionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
