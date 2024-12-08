// app/(tabs)/dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../assets/animations/dashboardLoader.json'; // Adjust the path as needed

// Mock Data (Replace with real data from your backend or state management)
const mockData = {
  totalPotholes: 2500,
  monthlyDetections: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [300, 400, 350, 500, 450, 600, 700, 650, 800, 750, 900, 850],
        color: (opacity = 1) => `rgba(34, 128, 176, ${opacity})`, // Optional
        strokeWidth: 2, // Optional
      },
    ],
  },
  reporterLevels: [
    { name: 'AlienX', level: 5 },
    { name: 'AlienY', level: 3 },
    { name: 'AlienZ', level: 7 },
    { name: 'AlienXX', level: 10 },
    { name: 'AlienXY', level: 2 },
    // Add more reporters as needed
  ],
  recentDetections: [
    { id: 1, location: 'Electronics City, Bangalore', date: '2024-12-07', reporter: 'AlienX', level: 5 },
    { id: 2, location: 'Connaught Place, Delhi', date: '2024-04-23', reporter: 'AlienY', level: 3 },
    { id: 3, location: 'Marine Drive, Mumbai', date: '2024-04-20', reporter: 'AlienZ', level: 7 },
    { id: 4, location: 'Salt Lake, Kolkata', date: '2024-04-25', reporter: 'AlienXX', level: 10 },
    // Add more detections as needed
  ],
  mapMarkers: [
    { id: 1, latitude: 12.9716, longitude: 77.5946, title: 'MG Road, Bangalore', severity: 'high' }, // Bengaluru
    { id: 2, latitude: 28.6139, longitude: 77.2090, title: 'Connaught Place, Delhi', severity: 'moderate' }, // Delhi
    { id: 3, latitude: 19.0760, longitude: 72.8777, title: 'Marine Drive, Mumbai', severity: 'moderate' }, // Mumbai
    { id: 4, latitude: 22.5726, longitude: 88.3639, title: 'Salt Lake, Kolkata', severity: 'low' }, // West Bengal
    // Add more markers as needed
  ],
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function Dashboard() {
  const [totalPotholes, setTotalPotholes] = useState<number>(0);
  const [monthlyDetections, setMonthlyDetections] = useState<any>(null);
  const [reporterLevels, setReporterLevels] = useState<any[]>([]);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setTotalPotholes(mockData.totalPotholes);
      setMonthlyDetections(mockData.monthlyDetections);
      setReporterLevels(mockData.reporterLevels);
      setRecentDetections(mockData.recentDetections);
      setMapMarkers(mockData.mapMarkers);
      setLoading(false);
    }, 1000); // Simulated delay
  }, []);

  // Calculate reporter level distribution for PieChart
  const reporterLevelDistribution = reporterLevels.reduce((acc, reporter) => {
    acc[reporter.level] = (acc[reporter.level] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  const pieData = Object.keys(reporterLevelDistribution).map((level) => ({
    name: `Level ${level}`,
    population: reporterLevelDistribution[parseInt(level)],
    color: getColorByLevel(parseInt(level)),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  // Helper function to get color based on reporter level
  function getColorByLevel(level: number): string {
    if (level <= 2) return '#FFB6C1'; // Light Red
    if (level <= 4) return '#FFA500'; // Orange
    if (level <= 6) return '#FFD700'; // Gold
    if (level <= 8) return '#32CD32'; // LimeGreen
    return '#8B0000'; // Deep Red
  }

  // Helper function to get color based on severity level
  function getColorBySeverity(severity: string): string {
    switch (severity) {
      case 'high':
        return '#8B0000';
      case 'moderate':
        return '#FFA500';
      case 'low':
        return '#FFB6C1';
      default:
        return '#FF6347';
    }
  }

  // Render Item for Recent Detections
  const renderRecentDetection = ({ item }: { item: any }) => (
    <View style={styles.recentItem}>
      <View style={styles.recentInfo}>
        <Text style={styles.recentLocation}>{item.location}</Text>
        <Text style={styles.recentDate}>{item.date}</Text>
      </View>
      <View style={styles.reporterInfo}>
        <Ionicons name="person-circle-outline" size={24} color="#333" />
        <Text style={styles.reporterName}>{item.reporter}</Text>
        <View style={[styles.levelBadge, { backgroundColor: getColorByLevel(item.level) }]}>
          <Text style={styles.levelText}>L{item.level}</Text>
        </View>
      </View>
    </View>
  );

  // Define the Header Component for FlatList
  const ListHeader = () => (
    <>
      {/* Header */}
      <Text style={styles.header}>Dashboard</Text>

      {/* Total Potholes */}
      <LinearGradient colors={['#FF7E5F', '#FEB47B']} style={styles.card}>
        <Text style={styles.cardTitle}>Total Potholes Detected</Text>
        <Text style={styles.cardNumber}>{totalPotholes}</Text>
      </LinearGradient>

      {/* Monthly Detections Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Detections</Text>
        {monthlyDetections ? (
          <LineChart
            data={monthlyDetections}
            width={screenWidth * 0.9} // 90% of screen width
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 126, 95, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#FEB47B',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            fromZero
          />
        ) : (
          <ActivityIndicator size="large" color="#FF7E5F" />
        )}
      </View>

      {/* Reporter Levels Pie Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reporter Levels Distribution</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth * 0.9} // 90% of screen width
            height={200}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(255, 126, 95, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={true}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        ) : (
          <ActivityIndicator size="large" color="#FF7E5F" />
        )}
      </View>

      {/* Recent Detections Header */}
      <View style={styles.recentHeader}>
        <Text style={styles.recentHeaderText}>Recent Detections</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={loadingAnimation}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      ) : (
        <FlatList
          data={recentDetections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecentDetection}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={
            <>
              {/* Map with Pothole Locations */}
              <View style={styles.mapCard}>
                <Text style={styles.cardTitle}>Pothole Locations in India</Text>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: 22.5937, // Center of India
                    longitude: 78.9629,
                    latitudeDelta: 20, // Wide view to cover India
                    longitudeDelta: 20,
                  }}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                >
                  {mapMarkers.map((marker) => (
                    <Marker
                      key={marker.id}
                      coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                      title={marker.title}
                      description="Pothole detected here"
                      pinColor={getColorBySeverity(marker.severity)}
                    />
                  ))}
                </MapView>
              </View>
            </>
          }
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 150, // Adjust width as needed
    height: 150, // Adjust height as needed
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#FF7E5F',
    fontWeight: '600',
  },
  flatListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    width: screenWidth * 0.9,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  mapCard: {
    width: screenWidth * 0.9,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  cardNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  map: {
    width: '100%',
    height: screenHeight * 0.3,
    borderRadius: 16,
  },
  recentHeader: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FF7E5F',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  recentHeaderText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
    paddingRight: 10,
  },
  recentLocation: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    flexWrap: 'wrap',
  },
  recentDate: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999',
    marginTop: 4,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  reporterName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6,
  },
  levelBadge: {
    marginLeft: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
