// app/maps.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Modal,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// Your Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyAflTUatLA2jnfY7ZRDESH3WmbVrmj2Vyg"; // Replace with your valid API key
const { width, height } = Dimensions.get('window');

interface ParsedResult {
  latitude: string | number;
  longitude: string | number;
  aiResults?: any[];
}

// Confidence color logic based on confidence value
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return '#4CAF50'; // High confidence: green
  if (confidence >= 0.6) return '#FFC107'; // Medium confidence: amber
  return '#F44336'; // Low confidence: red
};

export default function Maps() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // State variables
  const [loading, setLoading] = useState(true);
  const [potholeLocation, setPotholeLocation] = useState<Region | null>(null);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [address, setAddress] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [shareOnTwitter, setShareOnTwitter] = useState(false);

  // Animation references
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const googlePlacesRef = useRef<any>(null); // Updated to any to avoid TypeScript issues

  useEffect(() => {
    checkAuthAndInitialize();
  }, []);

  // Check authentication and initialize location + data
  const checkAuthAndInitialize = async () => {
    try {
      // Check token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth');
        return;
      }

      // Check location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to view the map.');
        return;
      }

      // Fetch user's current location first
      const currentLoc = await fetchCurrentLocation();
      if (currentLoc) {
        setUserLocation(currentLoc);
      }

      // If we have result params (from previous screen), use them for pothole location
      if (params.result) {
        await handleIncomingParams(params.result);
      }

    } catch (error: any) {
      console.error('Initialization Error:', error);
      Alert.alert('Error', error.message || 'Failed to initialize map view.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncomingParams = async (resultParam: any) => {
    try {
      const parsedResult: ParsedResult = typeof resultParam === 'string' ? JSON.parse(resultParam) : resultParam;

      if (!parsedResult.latitude || !parsedResult.longitude) {
        throw new Error('Received invalid coordinates from previous screen.');
      }

      const lat = parseFloat(parsedResult.latitude.toString());
      const lng = parseFloat(parsedResult.longitude.toString());

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Coordinates are not valid numbers.');
      }

      const newLocation: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005, // Adjusted for closer zoom
        longitudeDelta: 0.005,
      };
      setPotholeLocation(newLocation);

      const fetchedAddress = await fetchAddress(newLocation.latitude, newLocation.longitude);
      setAddress(fetchedAddress);

      if (parsedResult.aiResults && Array.isArray(parsedResult.aiResults)) {
        setAiResults(parsedResult.aiResults);
      }

      // If we have a pothole location, center map on it
      if (mapRef.current) {
        mapRef.current.animateToRegion(newLocation, 1000);
      }

    } catch (error: any) {
      console.error('Params processing error:', error);
      Alert.alert('Error', 'Failed to process location data from previous screen.');
    }
  };

  const fetchCurrentLocation = async (): Promise<Region | null> => {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      if (!currentLocation?.coords?.latitude || !currentLocation?.coords?.longitude) {
        Alert.alert('Error', 'Unable to retrieve current location.');
        return null;
      }

      const newLocation: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.005, // Adjusted for closer zoom
        longitudeDelta: 0.005,
      };

      // If there's no pothole location, set address from user's location
      if (!potholeLocation) {
        const fetchedAddress = await fetchAddress(newLocation.latitude, newLocation.longitude);
        setAddress(fetchedAddress);
      }
      return newLocation;
    } catch (error: any) {
      console.error('Location Fetch Error:', error);
      Alert.alert('Error', 'Failed to fetch current location.');
      return null;
    }
  };

  // Fetch address using coordinates via Google Geocoding API
  const fetchAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      if (!lat || !lng) throw new Error('Invalid coordinates for address lookup.');

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'REQUEST_DENIED') {
        throw new Error('Check your Google Maps API key and permissions.');
      }

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn('Geocoding failed:', data.status);
        return 'Could not determine address';
      }

    } catch (error: any) {
      console.error('Geocoding error:', error);
      return 'Address not found';
    }
  };

  // When user moves the map, update address if showing pothole location
  const onRegionChangeComplete = async (newRegion: Region) => {
    // Update address based on the new region
    if (newRegion) {
      const fetchedAddress = await fetchAddress(newRegion.latitude, newRegion.longitude);
      setAddress(fetchedAddress);
    }
  };

  // Submitting pothole info and navigate to dashboard
  const handleSubmit = async () => {
    try {
      // Get the token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No token found');
        Alert.alert('Error', 'Please login again');
        router.replace('/auth');
        return;
      }

      // If we have pothole location and params
      if (potholeLocation && params.result) {
        const parsedResult = typeof params.result === 'string'
          ? JSON.parse(params.result)
          : params.result;

        // Creating FormData with the current map location instead of the original location
        const formData = new FormData();
        const imageFile = {
          uri: parsedResult.report?.imageUrl,
          type: 'image/jpeg',
          name: 'photo.jpg'
        };
        
        formData.append('image', imageFile as any);
        formData.append('latitude', potholeLocation.latitude.toString());
        formData.append('longitude', potholeLocation.longitude.toString());
        formData.append('address', address);
        formData.append('detectionResultPercentage', parsedResult.detectionResultPercentage.toString());

        // Updating the report with new location
        const response = await fetch('https://pot-hole-detector.onrender.com/api/v1/pothole/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to update location');
        }

        // Sending Twitter share request if enabled
        if (shareOnTwitter) {
          try {
            const imageUrl = parsedResult.report?.imageUrl;

            if (!imageUrl) {
              Alert.alert('Error', 'Image URL not found');
              return;
            }

            const twitterResponse = await fetch('https://pot-hole-detector.onrender.com/api/v1/pothole/share-twitter', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                imageUrl: imageUrl,
                location: address,
                confidence: Number(parsedResult.detectionResultPercentage).toFixed(2),
              }),
            });

            if (!twitterResponse.ok) {
              const errorData = await twitterResponse.json();
              Alert.alert('Error', 'Failed to share on Twitter');
              return;
            }
          } catch (twitterError) {
            Alert.alert('Error', 'Failed to share on Twitter');
            return;
          }
        }

        // Showing success modal and navigating
        setModalVisible(true);
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          setModalVisible(false);
          scaleAnim.setValue(0);
          router.replace('/(tabs)/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      if (error.message?.includes('token')) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/auth');
      } else {
        Alert.alert('Error', 'Failed to submit report');
      }
    }
  };

  // Center map on user's current location
  const centerOnUserLocation = async () => {
    const currentLoc = await fetchCurrentLocation();
    if (currentLoc && mapRef.current) {
      setUserLocation(currentLoc);
      mapRef.current.animateToRegion(currentLoc, 1000);
    }
  };

  // Function to handle the selection of a place from the search box
  const handlePlaceSelect = (data: any, details: any | null) => {
    if (details && details.geometry && details.geometry.location) {
      const { lat, lng } = details.geometry.location;
      const newRegion: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005, // Adjust zoom level as needed
        longitudeDelta: 0.005,
      };
      setPotholeLocation(newRegion);
      setAddress(data.description);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  };

  // AI Results Sheet Component
  const AiResultsSheet = () => (
    <View style={styles.aiResultsSheet}>
      <View style={styles.aiResultsHeader}>
        <MaterialIcons name="science" size={24} color="#333" />
        <Text style={styles.aiResultsTitle}>AI Detection Results</Text>
      </View>

      {aiResults.map((result, index) => (
        <View key={index} style={styles.aiResultItem}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Pothole Type:</Text>
            <Text style={styles.resultValue}>{result.class}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Confidence:</Text>
            <View style={styles.confidenceContainer}>
              <View
                style={[
                  styles.confidenceBar,
                  {
                    width: `${(result.confidence * 100).toFixed(1)}%`,
                    backgroundColor: getConfidenceColor(result.confidence),
                  },
                ]}
              />
              <Text style={styles.confidenceText}>{(result.confidence * 100).toFixed(1)}%</Text>
            </View>
          </View>

          {result.bbox && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Size:</Text>
              <Text style={styles.resultValue}>
                {Math.round(result.bbox.width)}x{Math.round(result.bbox.height)} px
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/animations/cycleLoader.json')}
          autoPlay
          loop
          style={styles.loader}
        />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Google Places Autocomplete Search Box */}
      <GooglePlacesAutocomplete
        ref={googlePlacesRef}
        placeholder="Search for a location"
        fetchDetails={true}
        onPress={handlePlaceSelect}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'en',
          types: 'geocode', // Restrict to geocoding results
          // components: 'country:us', // Uncomment to restrict to a specific country
        }}
        styles={{
          container: styles.searchContainer,
          textInput: styles.searchInput,
          listView: styles.listView,
        }}
        debounce={200}
      />

      {(potholeLocation || userLocation) ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={potholeLocation || userLocation || {
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          mapType='satellite'
          camera={
            {
              center: {
                latitude: potholeLocation ? potholeLocation.latitude : userLocation ? userLocation.latitude : 37.7749,
                longitude: potholeLocation ? potholeLocation.longitude : userLocation ? userLocation.longitude : -122.4194,
              },
              zoom: 20,
              heading: 10,
              pitch: 10
            }
          }
          onRegionChangeComplete={onRegionChangeComplete}
        >
          {/* Conditionally render a single marker */}
          {(potholeLocation || userLocation) && (
            <Marker
              coordinate={{
                latitude: potholeLocation ? potholeLocation.latitude : userLocation!.latitude,
                longitude: potholeLocation ? potholeLocation.longitude : userLocation!.longitude,
              }}
              title={potholeLocation ? "Pothole Location" : "You are here"}
              description={address}
              pinColor={potholeLocation ? undefined : "red"} // Red for user location, default for pothole
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Determining location...</Text>
        </View>
      )}

      {aiResults.length > 0 && <AiResultsSheet />}

      <View style={styles.bottomSheet}>
        <Text style={styles.addressText} numberOfLines={2}>
          {address || (
            <View style={styles.loadingAddressContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingAddressText}>Fetching address...</Text>
            </View>
          )}
        </Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={!address || address.includes('not found') || address.includes('Could not')}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
          <MaterialIcons name="navigate-next" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Floating button to fetch current location */}
      <View style={styles.currentLocationButtonContainer}>
        <TouchableOpacity style={styles.currentLocationButton} onPress={centerOnUserLocation}>
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            <LottieView
              source={require('../assets/animations/success.json')}
              autoPlay
              loop={false}
              style={styles.lottie}
            />
            <Text style={styles.modalText}>Successfully Submitted!</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Twitter Share Option */}
      <View style={styles.twitterContainer}>
        <View style={styles.twitterShareOption}>
          <Checkbox
            value={shareOnTwitter}
            onValueChange={setShareOnTwitter}
            color={shareOnTwitter ? '#1DA1F2' : undefined}
            style={styles.checkbox}
          />
          <View style={styles.twitterTextContainer}>
            <Text style={styles.twitterShareTitle}>Share on Twitter</Text>
            <Text style={styles.twitterShareSubtext}>
              Let your community know about this pothole
            </Text>
          </View>
          <Ionicons
            name="logo-twitter"
            size={24}
            color="#1DA1F2"
          />
        </View>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Styles for the search box
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    width: '90%',
    alignSelf: 'center',
    zIndex: 1, // Ensure the search box is above the map
  },
  searchInput: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  listView: {
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  loader: {
    width: 100,
    height: 100,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    fontWeight: '600',
  },
  loadingAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingAddressText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 5,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
    color: '#333',
  },
  lottie: {
    width: 100,
    height: 100,
  },
  aiResultsSheet: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100, // Adjusted to avoid overlap with search box
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    maxHeight: height * 0.4,
    elevation: 5,
  },
  aiResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  aiResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  aiResultItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  confidenceContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  confidenceBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginLeft: 8,
    zIndex: 1,
  },
  currentLocationButtonContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
  },
  currentLocationButton: {
    backgroundColor: '#007AFF',
    borderRadius: 30,
    padding: 10,
    elevation: 5,
  },
  twitterContainer: {
    position: 'absolute',
    bottom: 180,
    width: '100%',
    paddingHorizontal: 20,
  },
  twitterShareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkbox: {
    marginRight: 12,
    borderRadius: 4,
  },
  twitterTextContainer: {
    flex: 1,
  },
  twitterShareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  twitterShareSubtext: {
    fontSize: 13,
    color: '#666',
  },
});
