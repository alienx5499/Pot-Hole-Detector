import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// Roboflow API Config
const API_URL = "https://detect.roboflow.com/potholes-detection-qwkkc/5";
const API_KEY = "06CdohBqfvMermFXu3tL";

export default function Camera() {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const navigation = useNavigation();

  // Request Camera and Media Permissions
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

  // Launch Camera
  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while taking the photo.', [{ text: 'OK' }]);
    }
  };

  // Pick Image from Media Library
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

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while selecting the image.', [{ text: 'OK' }]);
    }
  };

  // Retake Photo
  const retakePhoto = () => {
    setImage(null);
  };

  // Upload and Detect Pothole
  const detectPothole = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please select or take a photo before proceeding.', [{ text: 'OK' }]);
      return;
    }

    setUploading(true);

    try {
      // Convert image to Base64
      const base64Image = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send image to Roboflow API using Axios
      const response = await axios({
        method: "POST",
        url: API_URL,
        params: {
          api_key: API_KEY,
        },
        data: `data:image/jpeg;base64,${base64Image}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const result = response.data;

      if (result.predictions && result.predictions.length > 0) {
        const highestConfidence = Math.max(
          ...result.predictions.map((p) => p.confidence * 100)
        );

        if (highestConfidence > 50) {
          Alert.alert(
            "Detection Approved",
            `Pothole detected with confidence ${highestConfidence.toFixed(2)}%.`,
            [{ text: "OK" }]
          );

          // Navigate to maps with result data
          navigation.navigate('maps', { imageUri: image, result });
        } else {
          Alert.alert("No Potholes Detected", "Detection confidence is below 50%.", [{ text: "OK" }]);
        }
      } else {
        Alert.alert("No Potholes Detected", "No potholes were detected.", [{ text: "OK" }]);
      }
    } catch (error: any) {
      Alert.alert("Error", `Detection failed: ${error.message}`, [{ text: "OK" }]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!image ? (
        <>
          <LinearGradient colors={['#FF7E5F', '#FEB47B']} style={styles.header}>
            <Ionicons name="camera" size={100} color="#fff" />
            <Text style={styles.title}>Capture or Select Pothole</Text>
          </LinearGradient>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={30} color="#fff" />
              <Text style={styles.captureButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
              <Ionicons name="image-outline" size={30} color="#fff" />
              <Text style={styles.captureButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
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
        </>
      )}

      {uploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#FF7E5F" />
          <Text style={styles.uploadingText}>Processing Image...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  captureButton: {
    backgroundColor: '#FF7E5F',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  galleryButton: {
    backgroundColor: '#FEB47B',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '60%',
    borderRadius: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  retakeButton: {
    backgroundColor: '#FFA500', // Orange
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#32CD32', // Green
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  uploadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
