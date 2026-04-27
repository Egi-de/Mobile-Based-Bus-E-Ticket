import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "../../components/MapViewWeb";
import { router, useGlobalSearchParams } from "expo-router";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { Card } from "../../components/ui/Card";
import {
  passengerListenerService,
  BusLocationData,
} from "../../services/firebase/passenger-listener.service";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";

const { width, height } = Dimensions.get("window");

// Dark mode map styling
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

/**
 * Bus Tracking Screen
 * Shows real-time bus location on map using Firebase listeners
 * REDESIGNED for professional, modern UI/UX
 */
import { busesApi } from "../../services/api/buses.service";
import { tripsApi } from "../../services/api/trips.service";
import { ticketsService } from "../../services/api/tickets.service";
import { BookingService } from "../../services/booking.service";
import { useToastStore, getErrorMessage } from "../../stores/toast.store";
import { Trip } from "../../types/trip.types";
import { Ticket } from "../../types/ticket.types";

export default function BusTrackingScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Trip-centric params
  const params = useGlobalSearchParams<{
    bookingId?: string; // ✅ Fix Issue 9 - from home screen (Booking ID)
    ticketId?: string;
    tripId?: string;
    busId?: string;
    routeId?: string;
    origin?: string;
    destination?: string;
    travelDate?: string;
    seats?: string;
    operator?: string;
  }>();

  const {
    bookingId,
    ticketId,
    tripId,
    busId: paramBusId,
    routeId,
    origin,
    destination,
    travelDate,
    seats,
    operator,
  } = params;

  // State for trip-centric tracking
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeBusId, setActiveBusId] = useState<string | null>(
    typeof paramBusId === "string" ? paramBusId : null,
  );
  const [busPlateNumber, setBusPlateNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Legacy trip details (for backward compatibility)
  const legacyTripDetails =
    origin && destination
      ? {
          origin,
          destination,
          travelDate: travelDate || "",
          seats: seats ? seats.split(",").filter(Boolean) : [],
          operator: operator || "",
        }
      : null;

  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [busLocation, setBusLocation] = useState<BusLocationData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("--:--:--");

  // NEW: Fetch trip and ticket details
  useEffect(() => {
    const loadTripData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Priority 0: Load from bookingId (passed by home screen "Track Bus" button)
        if (bookingId) {
          console.log(`📋 Loading booking: ${bookingId}`);
          const booking = await BookingService.getBookingById(bookingId);

          if (!booking) {
            setError("Booking not found");
            return;
          }

          const bookingAny = booking as any;

          // ✅ CORRECT: Use booking.tripId to get the EXACT bus this passenger booked
          // This prevents showing a different driver who happens to be on the same route
          if (bookingAny.tripId) {
            console.log(
              `🎯 Resolving exact bus via tripId: ${bookingAny.tripId}`,
            );
            const tripData = await tripsApi.getById(bookingAny.tripId);
            setTrip(tripData);
            setActiveBusId(tripData.busId);
            setBusPlateNumber(tripData.bus?.plateNumber || null);
            console.log(
              `✅ Tracking EXACT bus from booking: ${tripData.bus?.plateNumber} (busId: ${tripData.busId})`,
            );
            return;
          }

          // ✅ Fallback 1: booking.busId directly
          if (bookingAny.busId) {
            console.log(
              `🎯 Resolving exact bus via booking.busId: ${bookingAny.busId}`,
            );
            setActiveBusId(bookingAny.busId);
            const bus = await busesApi.getById(bookingAny.busId);
            setBusPlateNumber(bus.plateNumber);
            console.log(`✅ Tracking bus: ${bus.plateNumber}`);
            return;
          }

          // ✅ Fallback 2: routeId + departure time match
          // This is still better than "any ON_ROUTE bus" because we filter by departure time
          if (booking.routeId) {
            console.warn(
              "⚠️ No tripId on booking — falling back to route+time match",
            );
            const buses = await busesApi.getByRoute(booking.routeId);
            const bookingDate = new Date((booking as any).travelDate || "");
            // Find the bus whose departure time matches the booked travel date (within 1 hour)
            const matchingBus =
              buses.find((b: any) => {
                if (b.status !== "ON_ROUTE") return false;
                if (!b.departureTime) return false;
                const busDate = new Date(b.departureTime);
                return (
                  Math.abs(busDate.getTime() - bookingDate.getTime()) <
                  3_600_000
                );
              }) || buses.find((b: any) => b.status === "ON_ROUTE");

            if (matchingBus) {
              setActiveBusId(matchingBus.id);
              setBusPlateNumber(matchingBus.plateNumber);
              console.log(
                `✅ Matched bus by route+time: ${matchingBus.plateNumber}`,
              );
            } else {
              setError(
                "Your bus hasn't started yet or is not currently tracking. Please try again later.",
              );
            }
          }
          return;
        }

        // Priority 1: Load from ticketId (most common case)
        if (ticketId) {
          console.log(`🎫 Loading ticket: ${ticketId}`);
          const ticketData = await ticketsService.getTicketById(ticketId);

          // Validate ticket status
          if (ticketData.status !== "ACTIVE") {
            setError(
              `Ticket is ${ticketData.status.toLowerCase()}. You can only track active tickets.`,
            );
            useToastStore
              .getState()
              .error(`This ticket is ${ticketData.status.toLowerCase()}`);
            return;
          }

          setTicket(ticketData);

          // Load trip details
          const tripData = await tripsApi.getById(ticketData.tripId);
          setTrip(tripData);
          setActiveBusId(tripData.busId);
          setBusPlateNumber(tripData.bus?.plateNumber || null);

          console.log(
            `✅ Loaded trip: ${tripData.id} on bus ${tripData.bus?.plateNumber}`,
          );
          return;
        }

        // Priority 2: Load from tripId (alternative)
        if (tripId) {
          console.log(`🚌 Loading trip: ${tripId}`);
          const tripData = await tripsApi.getById(tripId);
          setTrip(tripData);
          setActiveBusId(tripData.busId);
          setBusPlateNumber(tripData.bus?.plateNumber || null);
          console.log(`✅ Loaded trip: ${tripData.id}`);
          return;
        }

        // Priority 3: Legacy busId (backward compatibility)
        if (paramBusId) {
          console.log(`🔄 Legacy mode: Loading bus ${paramBusId}`);
          setActiveBusId(paramBusId);
          const bus = await busesApi.getById(paramBusId);
          setBusPlateNumber(bus.plateNumber);
          return;
        }

        // Priority 4: Legacy routeId — DEPRECATED, cannot guarantee correct bus
        if (routeId) {
          console.warn(
            `⚠️ routeId-only tracking is deprecated — cannot guarantee the correct bus for this passenger.`,
          );
          setError(
            "Cannot determine your exact bus from route alone. Please use your ticket or booking to track.",
          );
          return;
        }

        setError("No tracking information provided");
      } catch (err) {
        console.error("❌ Failed to load trip data:", err);
        setError(getErrorMessage(err));
        useToastStore
          .getState()
          .error(getErrorMessage(err), "Could not load trip");
      } finally {
        setIsLoading(false);
      }
    };

    loadTripData();
  }, [bookingId, ticketId, tripId, paramBusId, routeId]);

  useEffect(() => {
    if (!activeBusId) {
      return;
    }

    console.log(`Starting tracking for bus: ${activeBusId}`);

    // Subscribe to bus location updates
    const unsubscribeLocation = passengerListenerService.subscribeToBusLocation(
      activeBusId,
      (location) => {
        setBusLocation(location);
        setIsDriverOnline(true);
        setLastUpdateTime(new Date().toLocaleTimeString());

        // Center map on bus location with smooth animation
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          );
        }
      },
    );

    // Monitor connection status
    const unsubscribeConnection = passengerListenerService.onConnectionChange(
      (connected) => {
        setIsConnected(connected);
      },
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
      ]),
    );
    pulseAnimation.start();

    // Cleanup on unmount
    return () => {
      unsubscribeLocation();
      unsubscribeConnection();
      pulseAnimation.stop();
    };
  }, [activeBusId]);

  const formatSpeed = (speedMs: number) => {
    const speedKmh = speedMs * 3.6;
    return Math.round(speedKmh);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Track Bus</Text>
            <Text style={styles.headerSubtitle}>Live Location</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            customMapStyle={isDark ? darkMapStyle : []}
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
                  <Animated.View
                    style={[
                      styles.busMarkerPulse,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  />
                  <View style={styles.busMarker}>
                    <Ionicons name="bus" size={20} color="#FFF" />
                  </View>
                </View>
              </Marker>
            )}
          </MapView>

          {/* Connection Status Indicator */}
          <View
            style={[
              styles.statusIndicator,
              !isConnected && styles.disconnected,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                !isConnected && styles.statusDotDisconnected,
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? "Connected" : "Reconnecting..."}
            </Text>
          </View>

          {/* Live Indicator */}
          {isDriverOnline && (
            <View style={styles.liveIndicator}>
              <Animated.View
                style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]}
              />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Bottom Info Card */}
        <View style={styles.bottomSheet}>
          <View style={styles.dragHandle} />
          {/* Trip Details Card */}
          {(trip || legacyTripDetails) && (
            <View style={styles.tripDetailsCard}>
              <Text style={styles.tripDetailsTitle}>Trip Details</Text>
              <Text style={styles.tripDetailsRoute}>
                {trip?.route?.origin || legacyTripDetails?.origin || "N/A"} →{" "}
                {trip?.route?.destination ||
                  legacyTripDetails?.destination ||
                  "N/A"}
              </Text>
              {trip?.route && (
                <Text style={styles.tripDetailsOperator}>
                  {legacyTripDetails?.operator || "N/A"}
                </Text>
              )}
              {trip?.departureTime ? (
                <Text style={styles.tripDetailsDate}>
                  {new Date(trip.departureTime).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              ) : legacyTripDetails?.travelDate ? (
                <Text style={styles.tripDetailsDate}>
                  {legacyTripDetails.travelDate}
                </Text>
              ) : null}
              {legacyTripDetails?.seats &&
                legacyTripDetails.seats.length > 0 && (
                  <Text style={styles.tripDetailsSeats}>
                    Seats: {legacyTripDetails.seats.join(", ")}
                  </Text>
                )}
            </View>
          )}

          {/* Boarding & Drop Stop Info (NEW - Trip-centric) */}
          {ticket && (ticket.boardingStop || ticket.dropStop) && (
            <View style={styles.tripDetailsCard}>
              <Text style={styles.tripDetailsTitle}>Your Journey</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Ionicons
                  name="location"
                  size={16}
                  color={theme.colors.success.main}
                />
                <Text
                  style={[
                    styles.tripDetailsRoute,
                    { marginLeft: 8, marginBottom: 0 },
                  ]}
                >
                  {ticket.boardingStop?.stopName || "Boarding Stop"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons
                  name="flag"
                  size={16}
                  color={theme.colors.error.main}
                />
                <Text
                  style={[
                    styles.tripDetailsRoute,
                    { marginLeft: 8, marginBottom: 0 },
                  ]}
                >
                  {ticket.dropStop?.stopName || "Drop Stop"}
                </Text>
              </View>
              {ticket.seatNumber && (
                <Text style={styles.tripDetailsSeats}>
                  Seat: {ticket.seatNumber}
                </Text>
              )}
            </View>
          )}

          {busLocation ? (
            <ScrollView
              style={styles.infoScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Driver Status */}
              <View style={styles.driverStatusContainer}>
                <View
                  style={[
                    styles.driverStatusDot,
                    isDriverOnline && styles.driverOnlineDot,
                  ]}
                />
                <Text style={styles.driverStatusText}>
                  {isDriverOnline ? "Driver is online" : "Driver is offline"}
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="speedometer" size={24} color="#4CAF50" />
                  </View>
                  <Text style={styles.statValue}>
                    {formatSpeed(busLocation.speed)}
                  </Text>
                  <Text style={styles.statLabel}>km/h</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons
                      name="bus"
                      size={24}
                      color={theme.colors.info.main}
                    />
                  </View>
                  <Text
                    style={styles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {busPlateNumber || "Unknown"}
                  </Text>
                  <Text style={styles.statLabel}>Bus Plate</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="time" size={24} color="#FF9800" />
                  </View>
                  <Text style={styles.statValue}>
                    {lastUpdateTime.split(":")[0]}:
                    {lastUpdateTime.split(":")[1]}
                  </Text>
                  <Text style={styles.statLabel}>Last Update</Text>
                </View>
              </View>

              {/* Location Preview with Street View */}
              <Card
                variant="outlined"
                padding="none"
                style={styles.locationPreviewCard}
              >
                <View style={styles.streetViewContainer}>
                  <Image
                    source={{
                      uri: `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${busLocation.lat},${busLocation.lng}&fov=120&heading=${busLocation.heading}&pitch=0&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
                    }}
                    style={styles.streetViewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.streetViewOverlay}>
                    <View style={styles.locationBadge}>
                      <Ionicons
                        name="location"
                        size={16}
                        color={theme.colors.white}
                      />
                      <Text style={styles.locationBadgeText}>
                        Current Location
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.locationInfoRow}>
                  <View style={styles.locationInfoItem}>
                    <Ionicons
                      name="navigate-circle"
                      size={18}
                      color={theme.colors.success.main}
                    />
                    <Text style={styles.locationInfoLabel}>Accuracy</Text>
                    <Text style={styles.locationInfoValue}>
                      {Math.round(busLocation.accuracy)}m
                    </Text>
                  </View>
                  <View style={styles.locationInfoDivider} />
                  <View style={styles.locationInfoItem}>
                    <Ionicons
                      name="map"
                      size={18}
                      color={theme.colors.info.main}
                    />
                    <Text style={styles.locationInfoLabel}>Coordinates</Text>
                    <Text style={styles.locationInfoValue} numberOfLines={1}>
                      {busLocation.lat.toFixed(4)}, {busLocation.lng.toFixed(4)}
                    </Text>
                  </View>
                </View>
              </Card>
            </ScrollView>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="bus-outline" size={64} color="#CCC" />
              <Text style={styles.noDataText}>Waiting for bus location...</Text>
              <Text style={styles.noDataSubtext}>
                The driver hasn't started tracking yet
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor:
        theme.colors.primary[700] || theme.colors.primary[600] || "#1E3A5F",
    },
    backButton: {
      padding: 8,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.white,
    },
    headerSubtitle: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.9)",
      marginTop: 2,
    },
    mapContainer: {
      flex: 1,
      position: "relative",
    },
    map: {
      width: "100%",
      height: "100%",
    },
    busMarkerContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    busMarkerPulse: {
      position: "absolute",
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "rgba(76, 175, 80, 0.3)",
    },
    busMarker: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.success.main,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: theme.colors.white,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    statusIndicator: {
      position: "absolute",
      top: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(76, 175, 80, 0.95)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    disconnected: {
      backgroundColor: "rgba(244, 67, 54, 0.95)",
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.white,
      marginRight: 6,
    },
    statusDotDisconnected: {
      backgroundColor: theme.colors.white,
    },
    statusText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: "600",
    },
    liveIndicator: {
      position: "absolute",
      top: 16,
      left: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(244, 67, 54, 0.95)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.white,
      marginRight: 6,
    },
    liveText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: "bold",
      letterSpacing: 1,
    },
    bottomSheet: {
      backgroundColor: theme.colors.background.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: 20,
      minHeight: height * 0.4, // Started higher
      maxHeight: height * 0.85, // Expand almost to top
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border.light,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 16,
    },
    infoScroll: {
      flex: 1,
      paddingBottom: 20,
    },
    // ... (keep intervening styles)
    driverStatusContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    driverStatusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.text.disabled,
      marginRight: 8,
    },
    driverOnlineDot: {
      backgroundColor: theme.colors.success.main,
    },
    driverStatusText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      fontWeight: "500",
    },
    statsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.background.cardLight,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    statIconContainer: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.text.secondary,
    },
    detailsCard: {
      marginBottom: 20,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    detailContent: {
      marginLeft: 12,
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 14,
      color: theme.colors.text.primary,
      fontWeight: "500",
    },
    noDataContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    noDataText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text.secondary,
      marginTop: 16,
    },
    noDataSubtext: {
      fontSize: 14,
      color: theme.colors.text.tertiary,
      marginTop: 8,
    },
    tripDetailsCard: {
      backgroundColor: theme.colors.background.cardLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.success.main,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    tripDetailsTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.text.secondary,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tripDetailsRoute: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    tripDetailsOperator: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    tripDetailsDate: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    tripDetailsSeats: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      fontWeight: "500",
    },
    locationPreviewCard: {
      marginBottom: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      borderRadius: 16,
    },
    streetViewContainer: {
      height: 220, // Taller image
      backgroundColor: theme.colors.background.tertiary,
      position: "relative",
    },
    streetViewImage: {
      width: "100%",
      height: "100%",
    },
    streetViewOverlay: {
      position: "absolute",
      top: 12,
      left: 12,
      right: 12,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    locationBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },
    locationBadgeText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: "600",
    },
    locationInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.colors.background.card,
    },
    locationInfoItem: {
      flex: 1,
      alignItems: "center",
    },
    locationInfoDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.border.light,
      marginHorizontal: 16,
    },
    locationInfoLabel: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
      marginBottom: 4,
    },
    locationInfoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
  });
