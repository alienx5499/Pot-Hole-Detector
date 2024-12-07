import React, { useEffect, useState } from 'react';
import { View, Button, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useNavigation } from 'expo-router';
export default function camera() {
  const [image, setImage] = useState(null);
  const navigation = useNavigation();

    // useEffect(() => {
    //   takePhoto();
    // }, []);
    useFocusEffect(
      React.useCallback(() => {
        takePhoto();
      }, [])
    );

  // Function to launch camera
  const takePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    // Launch the camera
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    // Save the image if not cancelled
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      navigation.navigate('maps');
    }
    else{
      navigation.navigate('index');
    }
  };

  return (
    <View style={styles.container}>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});