// app/(tabs)/index.tsx

// imp req comps
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// home comp main
export default function Home() {
  const router = useRouter(); // nav hook

  return (
    <View style={styles.container}>
      {/* hdr sec */}
      <LinearGradient colors={['#FF7E5F', '#FEB47B']} style={styles.header}>
        <Ionicons name="ios-home" size={100} color="#fff" />
        <Text style={styles.title}>pot-hole-detector</Text>
      </LinearGradient>

      {/* btns nav sec */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/camera')}
        >
          <Ionicons name="camera-outline" size={30} color="#fff" />
          <Text style={styles.buttonText}>detect pothole</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/dashboard')}
        >
          <Ionicons name="stats-chart-outline" size={30} color="#fff" />
          <Text style={styles.buttonText}>view dash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// styles sec
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
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
  buttonsContainer: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#FF7E5F',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
