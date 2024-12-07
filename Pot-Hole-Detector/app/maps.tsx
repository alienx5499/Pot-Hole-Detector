// app/(tabs)/camera.tsx

// imp req comps
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// cam comp main
export default function Camera() {
  const [image, setImage] = useState<string | null>(null); // state for img
  const router = useRouter(); // nav hook

  // fun to req cam perm
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'perm denied',
        'cam perm is needed to take photos.',
        [{ text: 'ok' }]
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
        mediaTypes: ImagePicker.MediaType.Images, // img only
        allowsEditing: true, // crop opt
        aspect: [4, 3], // img aspect
        quality: 1, // max qual
      });

      if (!result.canceled && result.assets.length > 0) {
        setImage(result.assets[0].uri); // set img uri
      }
    } catch (error) {
      Alert.alert('error', 'err occurred while taking the photo.', [
        { text: 'ok' },
      ]);
    }
  };

  // fun to retake img
  const retakePhoto = () => {
    setImage(null); // clear img
  };

  // fun to conf and nav with img
  const confirmPhoto = () => {
    if (image) {
      router.push('/maps', { imageUri: image }); // nav with img
    } else {
      Alert.alert('no img', 'pls take a photo bfr proc', [
        { text: 'ok' },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {!image ? (
        <>
          {/* hdr sec */}
          <LinearGradient colors={['#FF7E5F', '#FEB47B']} style={styles.header}>
            <Ionicons name="camera" size={100} color="#fff" />
            <Text style={styles.title}>capture pothole</Text>
          </LinearGradient>

          {/* cap btn */}
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={30} color="#fff" />
            <Text style={styles.captureButtonText}>take photo</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* img prev */}
          <Image source={{ uri: image }} style={styles.previewImage} />

          <View style={styles.buttonContainer}>
            {/* retake btn */}
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="refresh-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>retake</Text>
            </TouchableOpacity>

            {/* conf btn */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmPhoto}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>confirm</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// styles sec
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
    textAlign: 'center',
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
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
    textTransform: 'uppercase',
  },
});
