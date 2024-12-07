// app/(tabs)/dashboard.tsx

// imp req comps
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// scrn dim for dyn layout
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// mock data sim // repl w/ backend data
const mockData = {
  totalPotholes: 2500,
  monthlyDetections: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: [300, 400, 350, 500, 450, 600, 700, 650, 800, 750, 900, 850],
        color: (opacity = 1) => `rgba(34, 128, 176, ${opacity})`, // opt color
        strokeWidth: 2, // opt stroke
      },
    ],
  },
  reporterLevels: [
    { name: 'AlienX', level: 5 },
    { name: 'AlienY', level: 3 },
    { name: 'AlienZ', level: 7 },
    { name: 'AlienXX', level: 10 },
    { name: 'AlienXY', level: 2 },
  ],
  recentDetections: [
    { id: 1, location: 'MG Road, Bengaluru', date: '2024-12-07', reporter: 'AlienX', level: 5 },
    { id: 2, location: 'Connaught Pl, Delhi', date: '2024-04-23', reporter: 'AlienY', level: 3 },
  ],
  mapMarkers: [
    { id: 1, latitude: 12.9716, longitude: 77.5946, title: 'MG Road, Bengaluru', severity: 'high' },
    { id: 2, latitude: 28.6139, longitude: 77.2090, title: 'Connaught Pl, Delhi', severity: 'mod' },
  ],
};

// dash comp main
export default function Dashboard() {
  // state vars init
  const [totalPotholes, setTotalPotholes] = useState<number>(0);
  const [monthlyDetections, setMonthlyDetections] = useState<any>(null);
  const [reporterLevels, setReporterLevels] = useState<any[]>([]);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // sim data fetch
  useEffect(() => {
    setTimeout(() => {
      setTotalPotholes(mockData.totalPotholes);
      setMonthlyDetections(mockData.monthlyDetections);
      setReporterLevels(mockData.reporterLevels);
      setRecentDetections(mockData.recentDetections);
      setMapMarkers(mockData.mapMarkers);
      setLoading(false);
    }, 1000); // delay 1 sec
  }, []);

  // calc lvl dist for pie
  const reporterLevelDistribution = reporterLevels.reduce((acc, reporter) => {
    acc[reporter.level] = (acc[reporter.level] || 0) + 1;
    return acc;
  }, {} as { [key: number]: number });

  // prep data for pie chart
  const pieData = Object.keys(reporterLevelDistribution).map((level) => ({
    name: `Lvl ${level}`,
    population: reporterLevelDistribution[parseInt(level)],
    color: getColorByLevel(parseInt(level)),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  // lvl based color
  function getColorByLevel(level: number): string {
    if (level <= 2) return '#FFB6C1'; // light red
    if (level <= 4) return '#FFA500'; // orange
    if (level <= 6) return '#FFD700'; // gold
    if (level <= 8) return '#32CD32'; // lime grn
    return '#8B0000'; // deep red
  }

  // render recent detections
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

  // render dash
  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7E5F" />
          <Text style={styles.loadingText}>load dash...</Text>
        </View>
      ) : (
        <FlatList
          data={recentDetections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecentDetection}
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF7E5F',
    fontWeight: '600',
  },
  flatListContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
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
  },
  recentInfo: {
    flex: 1,
    paddingRight: 10,
  },
  recentLocation: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
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
