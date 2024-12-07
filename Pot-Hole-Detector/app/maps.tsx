import React, { useState,useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet ,
  TouchableOpacity,
  Text
} from 'react-native';
import MapView, { PROVIDER_GOOGLE , Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useEffect } from 'react';
import { Alert } from 'react-native';


const key  = 'AIzaSyAflTUatLA2jnfY7ZRDESH3WmbVrmj2Vyg' 

const maps = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState(
    {
      latitude: 12.9716,
      longitude: 77.5946,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    }
  );
 const [markers, setMarkers] = useState({
   latitude: 12.9716,
   longitude: 77.5946
 });
  const [address, setAddress] = useState('');
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          
        });
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });     
      }
    })();
  }, []);
  const mapsRef = useRef(null);
  const getAddress = async ()=>{
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${region.latitude},${region.longitude}&key=${key}`;
      fetch(url)
      .then(response => response.json())
      .then(data => {
        const address = data.results[0].formatted_address;
       setAddress(address);
      })
      .catch(error => Alert.alert('Error', error.message));
  }

  useEffect(() => {
    getAddress();
  }, [region]);
  


  const searchPlace = async()=>{
    //TODO
  }
const handleSubmit = async () => {
    console.log('called');
    
}

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        followsUserLocation={true}
        showsMyLocationButton={false}
        ref={mapsRef}
        showsUserLocation={true}
        initialRegion={region}
      >
      </MapView>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View>    

      </View>
      <TouchableOpacity style={styles.currentLocationButton} onPress={()=>{mapsRef.current.animateCamera({center: {latitude: region.latitude, longitude: region.longitude}})}}><Text>use current location</Text></TouchableOpacity>
      <View style={styles.bottomBox}>
    <Text style={styles.addressText}>{address}</Text>
    <TouchableOpacity style={styles.submitButton} onPress={getAddress}>
      <Text style={styles.submitButtonText}>Submit</Text>
    </TouchableOpacity>
  </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    position:'absolute',
    bottom:10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  bottomBox: {
    position: 'absolute',
    bottom: 0,
    height: 180,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 20,
    alignItems:'center',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 200,
    right: 130,
    backgroundColor: '#007bff',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default maps;