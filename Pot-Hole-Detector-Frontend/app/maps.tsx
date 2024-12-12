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

// Direct API Key (Hardcoded)
const GOOGLE_MAPS_API_KEY = "AIzaSyAflTUatLA2jnfY7ZRDESH3WmbVrmj2Vyg";
const { width, height } = Dimensions.get('window');
const Maps = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Region | null>(null);
  const [address, setAddress] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [aiResults, setAiResults] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndLocation();
  }, []);

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      if (!lat || !lng) {
        console.error('Invalid coordinates:', { lat, lng });
        setAddress('Invalid coordinates');
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API key is invalid or missing required permissions');
      }
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        setAddress(data.results[0].formatted_address);
      } else {
        throw new Error(`Geocoding failed: ${data.status}`);
      }
    } catch (error: any) {
      console.error('Geocoding error:', error);
      setAddress('Could not determine address');
    }
  };

  const checkAuthAndLocation = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      if (params.result) {
        try {
          const parsedResult = typeof params.result === 'string' 
            ? JSON.parse(params.result)
            : params.result;
          
          if (!parsedResult.latitude || !parsedResult.longitude) {
            throw new Error('Missing coordinates in result');
          }

          const lat = parseFloat(parsedResult.latitude);
          const lng = parseFloat(parsedResult.longitude);
          
          if (isNaN(lat) || isNaN(lng)) {
            throw new Error('Invalid coordinates received');
          }

          const newLocation = {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          setLocation(newLocation);
          
          await getAddressFromCoords(newLocation.latitude, newLocation.longitude);

          if (parsedResult.aiResults) {
            setAiResults(parsedResult.aiResults);
          }
        } catch (error) {
          throw new Error('Failed to process location data');
        }
      } else {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        if (!currentLocation?.coords?.latitude || !currentLocation?.coords?.longitude) {
          throw new Error('Invalid location data received');
        }

        const newLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setLocation(newLocation);
        await getAddressFromCoords(newLocation.latitude, newLocation.longitude);
      }
    } catch (error: any) {
      console.error('Location Error:', error);
      Alert.alert('Error', error.message || 'Failed to get location. Please check your settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
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
  };

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
                    width: `${result.confidence * 100}%`,
                    backgroundColor: getConfidenceColor(result.confidence)
                  }
                ]} 
              />
              <Text style={styles.confidenceText}>
                {(result.confidence * 100).toFixed(1)}%
              </Text>
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FFC107';
    return '#F44336';
  };

  const onRegionChangeComplete = async (newRegion: Region) => {
    await getAddressFromCoords(newRegion.latitude, newRegion.longitude);
  };

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
      {location ? (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={location}
          onRegionChangeComplete={onRegionChangeComplete}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Pothole Location"
            description={address}
          />
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Getting location...</Text>
        </View>
      )}

      {aiResults.length > 0 && <AiResultsSheet />}

      <View style={styles.bottomSheet}>
        <Text style={styles.addressText} numberOfLines={2}>
          {address || (
            <View style={styles.loadingAddressContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingAddressText}>Getting address...</Text>
            </View>
          )}
        </Text>
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={!address || address === 'Loading address...'}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
          <MaterialIcons name="navigate-next" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  loader: {
    width: 100,
    height: 100,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: width,
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
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  },
  lottie: {
    width: 100,
    height: 100,
  },
  aiResultsSheet: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: height * 0.4,
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
    fontWeight: 'bold',
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
  loadingAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingAddressText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
});

export default Maps;
