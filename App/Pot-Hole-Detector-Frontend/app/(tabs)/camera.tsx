// app/(tabs)/camera.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import processingAnimation from '../../assets/animations/imageDetect.json';
import camLoaderAnimation from '../../assets/animations/cameraLoader.json';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from "../components/BottomNav";

const ROBOFLOW_API_URL = "https://detect.roboflow.com/potholes-detection-qwkkc/5";
const ROBOFLOW_API_KEY = "06CdohBqfvMermFXu3tL";

// Replace with your valid Google Maps API Key (ensure Geocoding API is enabled and billing is set up)
const GOOGLE_MAPS_API_KEY = "AIzaSyAflTUatLA2jnfY7ZRDESH3WmbVrmj2Vyg";

const { width, height } = Dimensions.get('window');
let locationData: Location.LocationObject;

export default function Camera() {
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        router.replace('/auth');
        return;
      }
      setToken(userToken);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/auth');
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus.status !== 'granted' || mediaStatus.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and Media Library access are required to detect potholes.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while taking the photo.');
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while selecting the image.', [{ text: 'OK' }]);
    }
  };

  const retakePhoto = () => {
    setImage(null);
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const addressData = await response.json();
      if (addressData.status === 'OK' && addressData.results && addressData.results.length > 0) {
        return addressData.results[0].formatted_address;
      } else {
        console.error('Geocoding API Error:', addressData.status);
        return 'Address not found';
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      return 'Address not found';
    }
  };

  const detectPothole = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select or take a photo before proceeding.');
      return;
    }

    if (!token) {
      router.replace('/auth');
      return;
    }

    setIsProcessing(true);
    setUploading(true);

    try {
      const imageBase64 = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const roboflowResponse = await axios({
        method: "POST",
        url: ROBOFLOW_API_URL,
        params: {
          api_key: ROBOFLOW_API_KEY,
        },
        data: `data:image/jpeg;base64,${imageBase64}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!roboflowResponse.data.predictions || roboflowResponse.data.predictions.length === 0) {
        throw new Error('No potholes detected in the image');
      }

      const highestConfidence = Math.max(
        ...roboflowResponse.data.predictions.map((p: any) => p.confidence)
      );
      const confidencePercentage = highestConfidence * 100;

      if (confidencePercentage <= 50) {
        Alert.alert("No Potholes Detected", "Detection confidence is below 50%.", [{ text: "OK" }]);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to mark pothole locations accurately.',
          [{ text: 'OK' }]
        );
        return;
      }

      locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      if (!locationData?.coords?.latitude || !locationData?.coords?.longitude) {
        throw new Error('Invalid location data received');
      }

      const address = await getAddressFromCoordinates(locationData.coords.latitude, locationData.coords.longitude);

      if (address === 'Address not found') {
        Alert.alert('Location Error', 'Unable to retrieve address for the detected pothole.', [{ text: 'OK' }]);
      }

      const formData = new FormData();
      const imageFile = {
        uri: image,
        type: 'image/jpeg',
        name: 'photo.jpg'
      };
      formData.append('image', imageFile as any);
      formData.append('latitude', locationData.coords.latitude.toString());
      formData.append('longitude', locationData.coords.longitude.toString());
      formData.append('address', address);
      formData.append('detectionResultPercentage', confidencePercentage.toString());

      const uploadResponse = await fetch('https://pot-hole-detector.onrender.com/api/v1/pothole/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await uploadResponse.json();

      if (result.success) {
        console.log('Upload Result:', result);
        router.push({
          pathname: "/maps",
          params: {
            result: JSON.stringify({
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
              address: address,
              detectionResultPercentage: confidencePercentage,
              aiResults: roboflowResponse.data.predictions,
              report: result.report
            })
          }
        });
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error: any) {
      const errorMessage = error.message.includes('No potholes detected')
        ? 'No potholes were detected in the image. Please try with a different image.'
        : `Error: ${error.message}`;
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to mark pothole locations accurately. Default location will be used.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: '#fff' }]}>
        <LottieView
          source={camLoaderAnimation} // initial loading animation
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Camera</Text>
      </View>

      {!image ? (
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
          <View style={styles.centerContent}>
            <View style={styles.contentCard}>
              <Text style={styles.title}>Capture or {'\n'} Upload Photo</Text>
              <Text style={styles.tagline}>Help identify road hazards</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={takePhoto}
              >
                <View style={[styles.iconContainer, styles.cameraContainer]}>
                  <LinearGradient
                    colors={['#4A90E2', '#007AFF']}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="camera-outline" size={44} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.actionButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={pickImageFromGallery}
              >
                <View style={[styles.iconContainer, styles.galleryContainer]}>
                  <LinearGradient
                    colors={['#34C759', '#32CD32']}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="images-outline" size={44} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.actionButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="refresh-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={detectPothole}>
              <Ionicons name="checkmark-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isProcessing && (
        <View style={styles.uploadingOverlay}>
          <LottieView
            source={processingAnimation}
            autoPlay
            loop
            style={styles.processingLottie}
          />
        </View>
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 200,
    height: 200,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
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
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
    marginTop: -50,
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
    marginBottom: 34,
    width: '100%',
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
  },
  actionButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    width: 150,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    backgroundColor: '#4A90E2',
  },
  galleryContainer: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 18,
    color: '#001524',
    fontWeight: '600',
    marginTop: 8,
  },
  previewContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: '80%',
    borderRadius: 15,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 245, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingLottie: {
    width: 200,
    height: 200,
  },
});
