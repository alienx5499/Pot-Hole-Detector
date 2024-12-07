// app/maps.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Keyboard,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAflTUatLA2jnfY7ZRDESH3WmbVrmj2Vyg';

const Maps = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState<Region>({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const mapsRef = useRef<MapView>(null);

  // Success Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      // Update region to current location
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (region.latitude && region.longitude) {
      getAddress();
    }
  }, [region]);

  const getAddress = async () => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${region.latitude},${region.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const fetchedAddress = data.results[0]?.formatted_address || 'No address found';
        setAddress(fetchedAddress);
      } else {
        setAddress('Unable to fetch address');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const searchPlace = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Empty Search', 'Please enter a location to search.');
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery
      )}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const { lat, lng } = data.results[0].geometry.location;
        const newRegion: Region = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);

        // Animate map to the searched location
        mapsRef.current?.animateToRegion(newRegion, 1000);

        // Dismiss the keyboard
        Keyboard.dismiss();
      } else {
        Alert.alert('Location Not Found', 'Please try a different search query.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSubmit = () => {
    // Perform any submission logic here (e.g., sending data to backend)

    // Show success modal
    setModalVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Navigate to Home screen after animation
    setTimeout(() => {
      setModalVisible(false);
      scaleAnim.setValue(0);
      navigation.navigate('(tabs)', { screen: 'index' });
    }, 2000); // Duration matches animation length
  };

 const currentLocation = async () => {
   try {
     // Display loading indicator
     setLoading(true);

     const currentLocation = await Location.getCurrentPositionAsync({
       accuracy: Location.Accuracy.Highest,
     });

     // Update region to current location
     setRegion({
       latitude: currentLocation.coords.latitude,
       longitude: currentLocation.coords.longitude,
       latitudeDelta: 0.05,
       longitudeDelta: 0.05,
     });
     mapsRef.current?.animateToRegion(region, 1000);
 
     // Dismiss the loading indicator
     setSearchQuery('');
     setLoading(false);
   } catch (error) {
     Alert.alert('Error', error.message);
     setLoading(false);
   }
 };
 
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E90FF" />
          <Text style={styles.loadingText}>Fetching your location...</Text>
        </View>
      ) : (
        <>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            ref={mapsRef}
            showsUserLocation={false}
            showsMyLocationButton={false}
            followsUserLocation={true}
            initialRegion={region}
            camera={
              {
                center: {
                  latitude: region.latitude,
                  longitude: region.longitude,
                },
                pitch: 45,
                heading: 90,
                zoom: 20,
              }
            }
            mapType='satellite'
          >
            <Marker
              coordinate={{ latitude: region.latitude, longitude: region.longitude }}
              title="Pothole Location"
              // description={address}
              pinColor="#FF6347" // Tomato color for visibility
              draggable
              onDragEnd={(e) => {
                setRegion({
                  latitude: e.nativeEvent.coordinate.latitude,
                  longitude: e.nativeEvent.coordinate.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                });
              }}
            />
          </MapView>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#333" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchPlace}
              returnKeyType="search"
            />
           
            {searchQuery.trim() ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#333" style={styles.clearIcon} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={currentLocation}
            accessibilityLabel="Use current location"
          >
            <Ionicons name="locate-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Bottom Sheet */}
          <View style={styles.bottomSheet}>
            <Text style={styles.addressText}>{address}</Text>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit</Text>
              <MaterialIcons name="navigate-next" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Success Modal */}
          <Modal
            transparent={true}
            animationType="fade"
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
              scaleAnim.setValue(0);
            }}
          >
            <View style={styles.modalContainer}>
              <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
                <LottieView
                  source={require('../assets/animations/success.json')} // Corrected path
                  autoPlay
                  loop={false}
                  style={styles.lottie}
                  onAnimationFinish={() => {
                    // Optional: Handle animation completion
                  }}
                />
                <Text style={styles.modalText}>Successfully Submitted!</Text>
              </Animated.View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1E90FF',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 150,
    right: 30,
    backgroundColor: '#007bff',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 100,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    marginRight: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E90FF', // DodgerBlue
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 200, // Increased from 100 to 200
    height: 200, // Increased from 100 to 200
  },
  modalText: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Maps;
