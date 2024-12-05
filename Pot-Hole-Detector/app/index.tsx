import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);

  const pickImage = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take pictures.');
      return;
    }

    // Launch the camera to take a picture
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Location permission is needed to fetch your location.');
      return;
    }

    // Get the current location
    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };

  const submitReport = async () => {
    if (!image || !location) {
      Alert.alert('Incomplete Data', 'Please capture an image and fetch your location before submitting.');
      return;
    }

    // Prepare the data to send
    const formData = new FormData();
    formData.append('photo', {
      uri: image,
      name: 'pothole.jpg',
      type: 'image/jpeg',
    } as any);
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));

    try {
      const response = await fetch('https://your-backend-url.com/api/report', {
        method: 'POST',
        body: formData,
        // Do not set 'Content-Type' header; let fetch handle it
      });

      if (response.ok) {
        Alert.alert('Success', 'Your report has been submitted.');
        // Reset the state
        setImage(null);
        setLocation(null);
      } else {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        Alert.alert('Error', 'Failed to submit the report.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred while submitting the report.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pothole Detector</Text>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Capture Pothole Image</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      <TouchableOpacity style={styles.button} onPress={getLocation}>
        <Text style={styles.buttonText}>Fetch Current Location</Text>
      </TouchableOpacity>

      {location && (
        <Text style={styles.locationText}>
          Location: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </Text>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
        <Text style={styles.submitButtonText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  image: {
    width: '100%',
    height: 250,
    marginTop: 15,
    borderRadius: 8,
  },
  locationText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
});
