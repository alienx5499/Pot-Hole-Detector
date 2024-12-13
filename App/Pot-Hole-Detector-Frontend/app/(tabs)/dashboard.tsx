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
  Alert,
  Platform,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import loadingAnimation from '../../assets/animations/dashboardLoader.json'; // Adjust the path as needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Add new interfaces
interface DashboardData {
  user: {
    name: string;
    email: string;
  };
  reports: {
    imageUrl: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
    };
    detectionResultPercentage: number;
    createdAt: string;
  }[];
  statistics: {
    totalPotholes: number;
    monthlyDetections: number[];
    userStats: {
      totalReports: number;
      confidenceLevels: {
        level: number;
      }[];
      firstReport: string;
      lastReport: string;
    };
  };
}

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  severity: string;
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function Dashboard() {
  const [totalPotholes, setTotalPotholes] = useState<number>(0);
  const [monthlyDetections, setMonthlyDetections] = useState<any>(null);
  const [recentDetections, setRecentDetections] = useState<any[]>([]);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth');
        return;
      }

      const response = await fetch('https://pot-hole-detector.onrender.com/api/v1/pothole/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', text);
        throw new Error('Invalid response from server');
      }

      if (result.success) {
        setDashboardData(result.data);
        setTotalPotholes(result.data.statistics.totalPotholes);

        setMonthlyDetections({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            data: result.data.statistics.monthlyDetections,
            color: (opacity = 1) => `rgba(255, 126, 95, ${opacity})`,
            strokeWidth: 2,
          }],
        });

        const markers = result.data.reports.map((report: any) => ({
          id: report._id || String(Math.random()),
          latitude: Number(report.location.latitude),
          longitude: Number(report.location.longitude),
          title: report.location.address || 'Pothole Location',
          severity: getSeverityFromConfidence(report.detectionResultPercentage),
        }));
        setMapMarkers(markers);

        const recentDetections = result.data.reports.slice(0, 5).map((report: any) => ({
          id: report._id,
          location: report.location.address,
          date: new Date(report.createdAt).toISOString().split('T')[0],
          reporter: result.data.user.name,
          level: Math.floor(report.detectionResultPercentage / 10),
        }));
        setRecentDetections(recentDetections);

        const confidenceLevels = result.data.statistics.userStats.confidenceLevels;
        const levelDistribution = confidenceLevels.reduce((acc: { [key: number]: number }, { level }: { level: number }) => {
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {} as { [key: number]: number });

        const newPieData = Object.entries(levelDistribution).map(([level, count]) => ({
            name: `Level ${level}`,
            population: count,
            color: getColorByLevel(parseInt(level)),
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
        }));

        setPieData(newPieData);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityFromConfidence = (confidence: number): string => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'moderate';
    return 'low';
  };

  function getColorByLevel(level: number): string {
    if (level <= 2) return '#FFB6C1'; // 0-2: Beginner (0-20%)
    if (level <= 4) return '#FFA500'; // 3-4: Intermediate (21-40%)
    if (level <= 6) return '#FFD700'; // 5-6: Advanced (41-60%)
    if (level <= 8) return '#32CD32'; // 7-8: Expert (61-80%)
    return '#8B0000'; // 9-10: Master (81-100%)
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
            width={screenWidth * 0.9}
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
                r: '6',
                strokeWidth: '2',
                stroke: '#FEB47B',
              },
              propsForBackgroundLines: {
                strokeWidth: 1,
                stroke: '#efefef',
              }
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Report Confidence Distribution</Text>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            width={screenWidth * 0.9}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={true}
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
                {mapMarkers.length > 0 ? (
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: 20.5937,
                      longitude: 78.9629,
                      latitudeDelta: 30,
                      longitudeDelta: 30,
                    }}
                  >
                    {mapMarkers.map((marker: MapMarker) => (
                      <Marker
                        key={marker.id}
                        coordinate={{
                          latitude: marker.latitude,
                          longitude: marker.longitude,
                        }}
                        title={marker.title}
                      />
                    ))}
                  </MapView>
                ) : (
                  <View style={[styles.map, styles.noMapData]}>
                    <Text style={styles.noMapDataText}>No pothole locations to display</Text>
                  </View>
                )}
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
    marginVertical: 20, // Added vertical margin
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
    height: screenHeight * 0.4,
    borderRadius: 16,
    marginTop: 10,
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
  noMapData: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noMapDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
