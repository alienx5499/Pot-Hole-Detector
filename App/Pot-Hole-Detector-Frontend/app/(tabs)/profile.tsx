// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = () => {
  const router = useRouter();

  // State variables for user data
  const [userData, setUserData] = useState({
    profilePicture: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSwyXIh0_peK1rr_KtfSPpK50oH0zZgwutkrw&s', // Default placeholder
    name: '',
    level: '',
    rating: 0,
    email: '',
    phone: '',
  });

  // Load user data from AsyncStorage when the component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedProfilePicture = await AsyncStorage.getItem('userProfilePicture');
        const storedName = await AsyncStorage.getItem('userName');
        const storedLevel = await AsyncStorage.getItem('userLevel');
        const storedRating = await AsyncStorage.getItem('userRating');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedPhone = await AsyncStorage.getItem('userPhone');

        setUserData({
          profilePicture: storedProfilePicture || userData.profilePicture,
          name: storedName || 'Steven Gerrard',
          level: storedLevel || 'Advanced',
          rating: storedRating ? parseFloat(storedRating) : 4.9,
          email: storedEmail || 'stevengerrard@liverpool.com',
          phone: storedPhone || '+91 7908699436',
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Failed to load user data. Please try again.');
      }
    };

    loadUserData();
  }, []);

  // Refresh user data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const refreshUserData = async () => {
        try {
          const storedProfilePicture = await AsyncStorage.getItem('userProfilePicture');
          const storedName = await AsyncStorage.getItem('userName');
          const storedLevel = await AsyncStorage.getItem('userLevel');
          const storedRating = await AsyncStorage.getItem('userRating');
          const storedEmail = await AsyncStorage.getItem('userEmail');
          const storedPhone = await AsyncStorage.getItem('userPhone');

          setUserData({
            profilePicture: storedProfilePicture || userData.profilePicture,
            name: storedName || 'Steven Gerrard',
            level: storedLevel || 'Advanced',
            rating: storedRating ? parseFloat(storedRating) : 4.9,
            email: storedEmail || 'stevengerrard@liverpool.com',
            phone: storedPhone || '+91 7908699436',
          });
        } catch (error) {
          console.error('Error refreshing user data:', error);
          Alert.alert('Error', 'Failed to refresh user data. Please try again.');
        }
      };

      refreshUserData();
    }, [])
  );

  // Handle Logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              router.replace('/auth');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'An error occurred while logging out. Please try again.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: userData.profilePicture }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{userData.name}</Text>
      </View>

      {/* User Information */}
      <View style={styles.infoContainer}>
        {/* Level */}
        <View style={styles.infoRow}>
          <Ionicons name="podium-outline" size={24} color="#007AFF" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Level</Text>
            <Text style={styles.infoValue}>{userData.level}</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.infoRow}>
          <Ionicons name="star-outline" size={24} color="#FFD700" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(userData.rating) ? 'star' : 'star-outline'}
                  size={20}
                  color="#FFD700"
                />
              ))}
              <Text style={styles.ratingText}> {userData.rating} / 5</Text>
            </View>
          </View>
        </View>

        {/* Email */}
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={24} color="#34C759" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Email</Text>
            <Text style={styles.infoValue}>{userData.email}</Text>
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={24} color="#FF9500" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Phone</Text>
            <Text style={styles.infoValue}>{userData.phone}</Text>
          </View>
        </View>

        {/* Add more information fields as needed */}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          accessibilityLabel="Edit Profile Button"
          onPress={() => router.push('/editProfile')}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          accessibilityLabel="Logout Button"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#EFEFEF', // Adjust based on theme
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc', // Placeholder background
    marginBottom: 15,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333333',
  },
  infoContainer: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    color: '#8e8e93',
  },
  infoValue: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 5,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
});
