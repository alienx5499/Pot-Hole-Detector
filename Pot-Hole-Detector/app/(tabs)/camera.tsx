// app/(tabs)/camera.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Button,
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

export default function Camera() {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const navigation = useNavigation();

  // fun to req cam permission
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Permission to access the camera is required to detect potholes.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // fun to launch cam
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
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
      Alert.alert('Error', 'An error occurred while taking the photo.', [
        { text: 'OK' },
      ]);
    }
  };

  // fun for photo retake
  const retakePhoto = () => {
    setImage(null);
  };

  // fun to confirm and nav with the conf img
  const confirmPhoto = () => {
    if (image) {
      navigation.navigate('maps', { imageUri: image });
    } else {
      Alert.alert('No Image', 'Please take a photo before proceeding.', [
        { text: 'OK' },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {!image ? (
        <>
          <LinearGradient colors={['#FF7E5F', '#FEB47B']} style={styles.header}>
            <Ionicons name="camera" size={100} color="#fff" />
            <Text style={styles.title}>Capture Pothole</Text>
          </LinearGradient>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={30} color="#fff" />
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="refresh-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
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
  captureButton: {
    flexDirection: 'row',
    backgroundColor: '#FF7E5F',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: '600',
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
    flexDirection: 'row',
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#32CD32',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  uploadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 239, 239, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
