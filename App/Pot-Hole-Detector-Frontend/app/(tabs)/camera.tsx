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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import processingAnimation from '../../assets/animations/processing.json';
import camLoaderAnimation from '../../assets/animations/cameraLoader.json';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        // On success, navigate to maps page
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
            source={processingAnimation} // loader animation during processing
            autoPlay
            loop
            style={styles.processingLottie}
          />
          {/* No processing text, just the loader */}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
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
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
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
    backgroundColor: '#32CD32',
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
});
