// app/(tabs)/camera.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity, Alert, Dimensions, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import LottieView from 'lottie-react-native'; // Import LottieView
import processingAnimation from '../../assets/animations/processing.json'; // Import processing animation
import camLoaderAnimation from '../../assets/animations/cameraLoader.json'; // Import camera loader animation
import * as Location from 'expo-location'; // Add this import if not already present
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Environment Variables
// Direct API Configurations
const ROBOFLOW_API_URL = "https://detect.roboflow.com/potholes-detection-qwkkc/5";
const ROBOFLOW_API_KEY = "06CdohBqfvMermFXu3tL";
const GOOGLE_MAPS_API_KEY = "AIzaSyAflTUatLA2jnfY7ZRDESH3WmbVrmj2Vyg";

const { width, height } = Dimensions.get('window');

let locationData: Location.LocationObject;

export default function Camera() {
  const [isLoading, setIsLoading] = useState(true); // Loading state for splash
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false); // State to control the loader visibility
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading duration equal to animation's length
    const timer = setTimeout(() => {
      setIsLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 1500); // Adjust this duration based on your animation

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
        'Camera and Media Library access is required to detect potholes.',
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
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
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
        mediaTypes:['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while selecting the image.', [{ text: 'OK' }]);
    }
  };

  const retakePhoto = () => {
    setImage(null);
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
      // Process with Roboflow API
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

      // Get highest confidence prediction
      const highestConfidence = Math.max(
        ...roboflowResponse.data.predictions.map((p: any) => p.confidence)
      );
      const confidencePercentage = highestConfidence * 100;

      if (confidencePercentage > 50) {
        Alert.alert(
          "Detection Approved",
          `Pothole detected with confidence ${confidencePercentage.toFixed(2)}%.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("No Potholes Detected", "Detection confidence is below 50%.", [{ text: "OK" }]);
        return;
      }

      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to mark pothole locations accurately.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }

      try {
        locationData = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        // Verify location data
        if (!locationData?.coords?.latitude || !locationData?.coords?.longitude) {
          throw new Error('Invalid location data received');
        }
        
      } catch (error) {
        console.error('Location error:', error);
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location settings and try again.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }

      // Get address
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationData.coords.latitude},${locationData.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const addressData = await response.json();
      
      let address = '';
      if (addressData.status === 'OK' && addressData.results && addressData.results.length > 0) {
        address = addressData.results[0].formatted_address;
      } else {
        console.error('Geocoding API Error:', addressData.status);
        address = 'Address not found';
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

      
      const uploadResponse = await fetch('http://10.51.11.170:3000/api/v1/pothole/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await uploadResponse.json();

      if (result.success) {
        setModalVisible(true);
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          setModalVisible(false);
          scaleAnim.setValue(0);
          router.push({
            pathname: "/maps",
            params: { 
              result: JSON.stringify({ 
                latitude: locationData.coords.latitude,
                longitude: locationData.coords.longitude,
                address: address,
                detectionResultPercentage: confidencePercentage,
                aiResults: roboflowResponse.data.predictions
              })
            }
          });
        }, 2000);
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error: any) {
      const errorMessage = error.message.includes('No potholes detected')
        ? 'No potholes were detected in the image. Please try with a different image.'
        : `Upload failed: ${error.message}`;
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
          source={camLoaderAnimation} // Show initial loading animation
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ ...styles.header, opacity: fadeAnim }}>
        <Ionicons name="camera" size={100} color="#fff" />
        <Text style={styles.title}>Capture or Select Pothole</Text>
      </Animated.View>

      {!image ? (
        <Animated.View style={{ ...styles.actionButtons, opacity: fadeAnim }}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={30} color="#fff" />
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
            <Ionicons name="image-outline" size={30} color="#fff" />
            <Text style={styles.captureButtonText}>Gallery</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="refresh-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={detectPothole}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isProcessing && (
        <View style={styles.uploadingOverlay}>
          <LottieView
            source={processingAnimation} // Show processing animation during image processing
            autoPlay
            loop
            style={styles.processingLottie}
          />
        </View>
      )}
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
  processingLottie: {
    width: 600,
    height: 600,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#2575fc',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '800',
    marginTop: 15,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  captureButton: {
    flex: 1,
    backgroundColor: '#FF6F61',
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: '#4CA1AF',
    paddingVertical: 15,
    marginLeft: 10,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewImage: {
    width: width * 0.9,
    height: height * 0.5,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#FF8C00', // Dark Orange
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#32CD32', // Lime Green
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(240, 244, 247, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
});
