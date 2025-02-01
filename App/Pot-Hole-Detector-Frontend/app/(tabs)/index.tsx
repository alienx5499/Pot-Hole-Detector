import React, { useEffect, useState  } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image, Platform } from "react-native";
import { useNavigation, useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { Ionicons } from "@expo/vector-icons";
import GuestConversionModal from "../components/GuestConversionModal";
import BottomNav from "../components/BottomNav";


export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const targetNumber = 1000;
    const duration = 3;
    const steps = 100;
    const increment = targetNumber / steps;
    const intervalTime = duration / steps;

    let currentCount = 0;
    const timer = setInterval(() => {
      currentCount += increment;
      if (currentCount >= targetNumber) {
        setCounter(targetNumber);
        clearInterval(timer);
      } else {
        setCounter(Math.floor(currentCount));
      }
    }, intervalTime);

    return () => clearInterval(timer);
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

  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons 
            name="person-circle" 
            size={52} 
            color="#333" 
          />
        </TouchableOpacity>
      </View>

      <BottomNav />

      <View style={styles.mainContent}>
        <View style={styles.contentCard}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.tagline}>Empowering Safer Roads</Text>

          <View style={styles.descriptionContainer}>
            <Text style={styles.counterText}>
              {counter}+
            </Text>
            <Text style={styles.counterLabel}>
              Potholes Reported
            </Text>
            <Text style={styles.description}>
              Quickly identify and report road imperfections. Take a photo,
              help pave the way to safer, smoother journeys, and make a difference
              in your community.
            </Text>
          </View>

          {/* <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCameraPress}
            >
              <Ionicons name="camera" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dashboardButton]}
              onPress={handleDashboardPress}
            >
              <Ionicons name="stats-chart" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Dashboard</Text>
            </TouchableOpacity>
          </View> */}
        </View>

        
      </View>

      {isGuest && (
        <TouchableOpacity
          style={styles.conversionPrompt}
          onPress={() => setShowConversionModal(true)}
        >
          <Ionicons name="person-add" size={20} color="#fff" style={styles.conversionIcon} />
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
      <Text style={styles.footer}>Together, let's improve our roads.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#333',
    letterSpacing: 0.5,
    paddingLeft: 10,
  },
  profileButton: {
    padding: 5,
    marginRight: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  descriptionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#4a4a4a',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  buttonGroup: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dashboardButton: {
    backgroundColor: '#34C759',
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 135,
    letterSpacing: 0.5,
  },
  conversionPrompt: {
    position: 'absolute',
    bottom: 170,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.95)',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  conversionIcon: {
    marginRight: 8,
  },
  conversionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  counterText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  counterLabel: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
});
