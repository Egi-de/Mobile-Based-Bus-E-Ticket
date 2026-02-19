import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { router, useGlobalSearchParams } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { passengerListenerService, BusLocationData } from '../../services/firebase/passenger-listener.service';

const { width, height } = Dimensions.get('window');

/**
 * Passenger Bus Tracking Screen
 * Shows real-time bus location on map using Firebase listeners
 * REDESIGNED for professional, modern UI/UX
 */
export default function PassengerTrackingScreen() {
  const { busId } = useGlobalSearchParams();
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Bottom sheet state
  const COLLAPSED_HEIGHT = 120;
  const HALF_HEIGHT = height * 0.35;
  const EXPANDED_HEIGHT = height * 0.65;
  const bottomSheetHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const [currentHeight, setCurrentHeight] = useState(COLLAPSED_HEIGHT);
  
  const [busLocation, setBusLocation] = useState<BusLocationData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('--:--:--');

  useEffect(() => {
    if (!busId) {
      return;
    }

    // Subscribe to bus location updates
    const unsubscribeLocation = passengerListenerService.subscribeToBusLocation(
      busId as string,
      (location) => {
        setBusLocation(location);
        setIsDriverOnline(true);
        setLastUpdateTime(new Date().toLocaleTimeString());
        
        // Center map on bus location with smooth animation
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 1000);
        }
      }
    );

    // Monitor connection status
    const unsubscribeConnection = passengerListenerService.onConnectionChange(
      (connected) => {
        setIsConnected(connected);
      }
    );

    // Start pulse animation for live indicator
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    // Cleanup on unmount
    return () => {
      unsubscribeLocation();
      unsubscribeConnection();
      pulseAnimation.stop();
    };
  }, [busId]);

  const formatSpeed = (speedMs: number) => {
    const speedKmh = speedMs * 3.6;
    return Math.round(speedKmh);
  };

  // Toggle bottom sheet between collapsed and expanded
  const toggleBottomSheet = () => {
    console.log('Toggle bottom sheet - current height:', currentHeight);
    const newHeight = currentHeight === COLLAPSED_HEIGHT ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
    console.log('New height will be:', newHeight);
    setCurrentHeight(newHeight);
    Animated.spring(bottomSheetHeight, {
      toValue: newHeight,
      useNativeDriver: false,
      damping: 20,
      stiffness: 90,
    }).start();
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Live Tracking</Text>
            <Text style={styles.headerSubtitle}>Bus {busId}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: busLocation?.lat || -1.9441,
              longitude: busLocation?.lng || 30.0619,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {busLocation && (
              <Marker
                coordinate={{
                  latitude: busLocation.lat,
                  longitude: busLocation.lng,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.busMarkerContainer}>
                  <Animated.View style={[styles.busMarkerPulse, { transform: [{ scale: pulseAnim }] }]} />
                  <View style={styles.busMarker}>
                    <Ionicons name="bus" size={20} color="#FFF" />
                  </View>
                </View>
              </Marker>
            )}
          </MapView>

          {/* Connection Status Indicator */}
          <View style={[styles.statusIndicator, !isConnected && styles.disconnected]}>
            <View style={[styles.statusDot, !isConnected && styles.statusDotDisconnected]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </Text>
          </View>

          {/* Live Indicator */}
          {isDriverOnline && (
            <View style={styles.liveIndicator}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Bottom Info Card - Tap to Expand */}
        <Animated.View style={[styles.bottomSheet, { height: bottomSheetHeight }]}>
          <TouchableOpacity onPress={toggleBottomSheet} activeOpacity={0.7}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
              <Text style={styles.dragHint}>
                {currentHeight === COLLAPSED_HEIGHT ? 'Tap to expand ▲' : 'Tap to collapse ▼'}
              </Text>
            </View>
          </TouchableOpacity>
          
          {busLocation ? (
            <ScrollView style={styles.infoScroll} showsVerticalScrollIndicator={false}>
              {/* Driver Status */}
              <View style={styles.driverStatusContainer}>
                <View style={[styles.driverStatusDot, isDriverOnline && styles.driverOnlineDot]} />
                <Text style={styles.driverStatusText}>
                  {isDriverOnline ? 'Driver is online' : 'Driver is offline'}
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="speedometer" size={24} color="#4CAF50" />
                  </View>
                  <Text style={styles.statValue}>{formatSpeed(busLocation.speed)}</Text>
                  <Text style={styles.statLabel}>km/h</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="compass" size={24} color="#2196F3" />
                  </View>
                  <Text style={styles.statValue}>{Math.round(busLocation.heading)}°</Text>
                  <Text style={styles.statLabel}>Heading</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="time" size={24} color="#FF9800" />
                  </View>
                  <Text style={styles.statValue}>{lastUpdateTime.split(':')[0]}:{lastUpdateTime.split(':')[1]}</Text>
                  <Text style={styles.statLabel}>Last Update</Text>
                </View>
              </View>

              {/* Location Details */}
              <Card variant="outlined" padding="md" style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color="#666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Current Location</Text>
                    <Text style={styles.detailValue}>
                      {busLocation.lat.toFixed(6)}, {busLocation.lng.toFixed(6)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Ionicons name="analytics" size={20} color="#666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>GPS Accuracy</Text>
                    <Text style={styles.detailValue}>±{Math.round(busLocation.accuracy)}m</Text>
                  </View>
                </View>
              </Card>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  Location updates automatically every 3-5 seconds while the driver is online.
                </Text>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#9E9E9E" />
              <Text style={styles.noDataTitle}>Waiting for bus location...</Text>
              <Text style={styles.noDataText}>
                The driver hasn't started tracking yet. You'll see the bus location here once they begin their route.
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  busMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  busMarkerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  busMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  statusDotDisconnected: {
    backgroundColor: '#FFF',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  liveIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  liveText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    elevation: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dragHandleContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#BDBDBD',
    borderRadius: 2,
  },
  dragHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    fontWeight: '500',
  },
  infoScroll: {
    flex: 1,
  },
  driverStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9E9E9E',
    marginRight: 8,
  },
  driverOnlineDot: {
    backgroundColor: '#4CAF50',
  },
  driverStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 18,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
