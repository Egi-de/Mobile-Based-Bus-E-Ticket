import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker,Polyline, PROVIDER_GOOGLE } from "../../components/MapViewWeb";
import * as Location from "expo-location";
import { router } from "expo-router";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { driverGPSService } from "../../services/firebase/driver-gps.service";
import { useAuthStore } from "../../stores/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";

const { height } = Dimensions.get("window");

// ── Kigali, Rwanda center coordinates (always use as map default) ──────────
const KIGALI_COORDS = { latitude: -1.9441, longitude: 30.0619 };

// ── Haversine formula ──────────────────────────────────────────────────────
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Dark map style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1f2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8f9e" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c3347" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3d4a5c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d1b2a" }],
  },
];

/**
 * Driver GPS Tracking Screen – REFINED
 * • Map preview showing driver position in real time
 * • Distance traveled + remaining
 * • Speed, heading, accuracy
 * • Compact layout
 */
export default function DriverTrackingScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isTracking, setIsTracking] = useState(false);
  const [busAssignment, setBusAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live location state
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [locationHistory, setLocationHistory] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [distanceTraveled, setDistanceTraveled] = useState(0); // km
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [passengerCount, setPassengerCount] = useState<number | null>(null);

  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTrackingRef = useRef(false);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const { logout } = useAuthStore();

  // ── Pulse animation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isTracking) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isTracking]);

  // ── Load bus assignment ────────────────────────────────────────────────────
  useEffect(() => {
    loadBusAssignment();
    return () => {
      if (isTrackingRef.current) stopTracking();
    };
  }, []);

  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  const loadBusAssignment = async () => {
    try {
      setLoading(true);
      setError(null);
      const assignment = await driverGPSService.fetchAssignedBus();
      if (assignment) {
        setBusAssignment(assignment);
        // Fetch passenger count for this route/trip
        try {
          const routeId = assignment.routeId || assignment.route?.id;
          const depTime = (assignment.route as any)?.departureTime;
          if (routeId) {
            const {
              BookingService,
            } = require("../../services/booking.service");
            const booked = await BookingService.getBookedSeats(
              routeId,
              depTime,
            );
            setPassengerCount(Array.isArray(booked) ? booked.length : 0);
          }
        } catch {
          // passenger count is optional — ignore errors
        }
      } else {
        setError("No bus assigned. Contact admin.");
      }
    } catch {
      setError("Failed to load assignment. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Location subscription ──────────────────────────────────────────────────
  const startLocationWatch = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    locationSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 10,
      },
      (loc) => {
        setCurrentLocation(loc);
        const { latitude, longitude, speed } = loc.coords;
        setCurrentSpeed(Math.max(0, (speed ?? 0) * 3.6)); // m/s → km/h

        // Accumulate distance
        if (lastLocationRef.current) {
          const d = haversineKm(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            latitude,
            longitude,
          );
          if (d > 0.005) {
            // ignore < 5m jitter
            setDistanceTraveled((prev) => prev + d);
            setLocationHistory((prev) => [
              ...prev,
              { lat: latitude, lng: longitude },
            ]);
          }
        } else {
          setLocationHistory([{ lat: latitude, lng: longitude }]);
        }
        lastLocationRef.current = { lat: latitude, lng: longitude };

        // Follow on map
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          },
          800,
        );
      },
    );
  };

  const stopLocationWatch = () => {
    locationSub.current?.remove();
    locationSub.current = null;
  };

  // ── Tracking controls ──────────────────────────────────────────────────────
  const handleStartTracking = async () => {
    const result = await driverGPSService.startTracking();
    if (result.success) {
      setIsTracking(true);
      setDistanceTraveled(0);
      setElapsedSeconds(0);
      lastLocationRef.current = null;
      setLocationHistory([]);
      startTimer();
      await startLocationWatch();
    } else {
      Alert.alert("Error", result.message);
    }
  };

  const stopTracking = async () => {
    await driverGPSService.stopTracking();
    setIsTracking(false);
    stopLocationWatch();
    stopTimer();
  };

  const handleStopTracking = async () => {
    Alert.alert(
      "Stop Tracking",
      `Route summary:\n• Distance: ${formatKm(distanceTraveled)}\n• Duration: ${formatElapsed(elapsedSeconds)}\n\nConfirm stop?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stop",
          style: "destructive",
          onPress: async () => {
            await stopTracking();
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    if (isTracking) {
      Alert.alert(
        "Tracking Active",
        "Please stop tracking before logging out.",
      );
      return;
    }
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => await logout(),
      },
    ]);
  };

  // ── Route total distance estimate ──────────────────────────────────────────
  // Total route km (dummy estimate if not available from backend)
  const routeTotalKm: number | null = busAssignment?.route?.distanceKm ?? null;
  const distanceRemaining =
    routeTotalKm != null ? Math.max(0, routeTotalKm - distanceTraveled) : null;

  // ── Current coords — always fall back to Kigali centre ────────────────────
  const lat = currentLocation?.coords.latitude ?? KIGALI_COORDS.latitude;
  const lng = currentLocation?.coords.longitude ?? KIGALI_COORDS.longitude;

  // ── Loading & Error states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading assignment...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
              <Ionicons
                name="log-out-outline"
                size={22}
                color={theme.colors.error.main}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Driver Tracking</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.centerContainer}>
            <Ionicons
              name="alert-circle"
              size={56}
              color={theme.colors.error.main}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={loadBusAssignment}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Driver Tracking</Text>
            <View
              style={[
                styles.statusPill,
                isTracking
                  ? styles.statusPillActive
                  : styles.statusPillInactive,
              ]}
            >
              <Animated.View
                style={[
                  styles.statusDot,
                  isTracking && { transform: [{ scale: pulseAnim }] },
                  isTracking
                    ? styles.statusDotActive
                    : styles.statusDotInactive,
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  isTracking
                    ? styles.statusPillTextActive
                    : styles.statusPillTextInactive,
                ]}
              >
                {isTracking ? "LIVE" : "IDLE"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* QR Scanner */}
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => router.push("/(screens)/driver-scanner")}
            >
              <Ionicons
                name="qr-code-outline"
                size={20}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            {/* Profile */}
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => router.push("/(screens)/driver-profile")}
            >
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Map Preview ─────────────────────────────────────────────────── */}
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            customMapStyle={isDark ? darkMapStyle : []}
            initialRegion={{
              latitude: KIGALI_COORDS.latitude,
              longitude: KIGALI_COORDS.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsTraffic={isTracking}
          >
            {/* Route polyline */}
            {locationHistory.length > 1 && (
              <Polyline
                coordinates={locationHistory.map((p) => ({
                  latitude: p.lat,
                  longitude: p.lng,
                }))}
                strokeColor={theme.colors.primary[500]}
                strokeWidth={4}
              />
            )}

            {/* Bus marker */}
            {currentLocation && (
              <Marker
                coordinate={{ latitude: lat, longitude: lng }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.busMarkerWrap}>
                  {isTracking && (
                    <Animated.View
                      style={[
                        styles.busMarkerPulse,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.busMarker,
                      isTracking
                        ? styles.busMarkerActive
                        : styles.busMarkerIdle,
                    ]}
                  >
                    <Ionicons name="bus" size={18} color="#FFF" />
                  </View>
                </View>
              </Marker>
            )}
          </MapView>

          {/* Map overlay: bus plate badge */}
          {busAssignment?.plateNumber && (
            <View style={styles.plateBadge}>
              <Ionicons
                name="bus-outline"
                size={13}
                color={theme.colors.text.primary}
              />
              <Text style={styles.plateBadgeText}>
                {busAssignment.plateNumber}
              </Text>
            </View>
          )}

          {/* Map overlay: center button */}
          <TouchableOpacity
            style={styles.centerBtn}
            onPress={() =>
              currentLocation &&
              mapRef.current?.animateToRegion(
                {
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                },
                600,
              )
            }
          >
            <Ionicons
              name="locate"
              size={20}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="speedometer" size={20} color="#4CAF50" />
            <Text style={styles.statValue}>
              {Math.round(currentSpeed)}
              <Text style={styles.statUnit}> km/h</Text>
            </Text>
            <Text style={styles.statLabel}>Speed</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons
              name="trending-up"
              size={20}
              color={theme.colors.primary[500]}
            />
            <Text style={styles.statValue}>{formatKm(distanceTraveled)}</Text>
            <Text style={styles.statLabel}>Traveled</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="navigate" size={20} color="#FF9800" />
            <Text style={styles.statValue}>
              {distanceRemaining != null ? formatKm(distanceRemaining) : "--"}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color={theme.colors.info.main} />
            <Text style={styles.statValue}>
              {formatElapsed(elapsedSeconds)}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        {/* ── Passengers on Board Bar ──────────────────────────────────────── */}
        <View style={styles.passengerBar}>
          <View style={styles.passengerBarLeft}>
            <Ionicons
              name="people"
              size={20}
              color={theme.colors.primary[500]}
            />
            <View>
              <Text style={styles.passengerCount}>
                {passengerCount !== null ? passengerCount : "—"}
              </Text>
              <Text style={styles.passengerLabel}>Passengers on board</Text>
            </View>
          </View>
          {busAssignment?.route && (
            <View style={styles.routeTag}>
              <Ionicons
                name="navigate"
                size={12}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.routeTagText} numberOfLines={1}>
                {busAssignment.route.origin} → {busAssignment.route.destination}
              </Text>
            </View>
          )}
        </View>

        {/* ── Progress Bar (if total distance known) ───────────────────────── */}
        {routeTotalKm && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (distanceTraveled / routeTotalKm) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {Math.round((distanceTraveled / routeTotalKm) * 100)}% complete
            </Text>
          </View>
        )}

        {/* ── Start / Stop Button ──────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.ctaBtn, isTracking && styles.ctaBtnStop]}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isTracking ? "stop-circle" : "play-circle"}
            size={22}
            color="#FFF"
          />
          <Text style={styles.ctaBtnText}>
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </Text>
        </TouchableOpacity>

        {/* ── Quick tips (collapsed when tracking) ────────────────────────── */}
        {!isTracking && (
          <View style={styles.tipsCard}>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={15} color="#4CAF50" />
              <Text style={styles.tipText}>
                Keep the app open for best GPS accuracy
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={15} color="#4CAF50" />
              <Text style={styles.tipText}>
                GPS updates every 10 m or 3 seconds
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={15} color="#4CAF50" />
              <Text style={styles.tipText}>
                Stop tracking when you reach the destination
              </Text>
            </View>
          </View>
        )}

        {/* ── Live info strip (only while tracking) ───────────────────────── */}
        {isTracking && currentLocation && (
          <View style={styles.liveStrip}>
            <Ionicons name="location" size={13} color="#4CAF50" />
            <Text style={styles.liveStripText}>
              {lat.toFixed(5)}, {lng.toFixed(5)} · Accuracy{" "}
              {Math.round(currentLocation.coords.accuracy ?? 0)} m
            </Text>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    errorText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.error.main,
      textAlign: "center",
      lineHeight: 20,
    },
    retryBtn: {
      marginTop: 20,
      backgroundColor: theme.colors.primary[500],
      paddingHorizontal: 32,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },

    // ── Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text.primary,
    },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      gap: 5,
    },
    statusPillActive: { backgroundColor: "#4CAF5020" },
    statusPillInactive: { backgroundColor: theme.colors.background.tertiary },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusDotActive: { backgroundColor: "#4CAF50" },
    statusDotInactive: { backgroundColor: theme.colors.text.disabled },
    statusPillText: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.8 },
    statusPillTextActive: { color: "#4CAF50" },
    statusPillTextInactive: { color: theme.colors.text.disabled },
    iconBtn: { padding: 8 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    headerActionBtn: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.background.tertiary,
    },

    // ── Map
    mapWrapper: {
      height: height * 0.3,
      marginHorizontal: 12,
      marginBottom: 8,
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
    },
    map: { flex: 1 },
    busMarkerWrap: { alignItems: "center", justifyContent: "center" },
    busMarkerPulse: {
      position: "absolute",
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(76,175,80,0.25)",
    },
    busMarker: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2.5,
      borderColor: "#FFF",
      elevation: 4,
    },
    busMarkerActive: { backgroundColor: "#4CAF50" },
    busMarkerIdle: { backgroundColor: "#9E9E9E" },
    plateBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: theme.colors.background.card + "EE",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    plateBadgeText: {
      fontSize: 13,
      fontWeight: "bold",
      color: theme.colors.text.primary,
    },
    centerBtn: {
      position: "absolute",
      bottom: 10,
      right: 10,
      backgroundColor: theme.colors.background.card + "EE",
      padding: 8,
      borderRadius: 10,
    },

    // ── Stats Row
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background.card,
      marginHorizontal: 12,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    statItem: { flex: 1, alignItems: "center", gap: 3 },
    statValue: {
      fontSize: 15,
      fontWeight: "bold",
      color: theme.colors.text.primary,
      marginTop: 3,
    },
    statUnit: { fontSize: 11, color: theme.colors.text.secondary },
    statLabel: { fontSize: 11, color: theme.colors.text.tertiary },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: theme.colors.border.light,
    },

    // ── Passenger bar
    passengerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.background.card,
      marginHorizontal: 12,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 8,
    },
    passengerBarLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    passengerCount: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.colors.text.primary,
      lineHeight: 26,
    },
    passengerLabel: {
      fontSize: 11,
      color: theme.colors.text.tertiary,
    },
    routeTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      maxWidth: "55%",
    },
    routeTagText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.colors.text.secondary,
    },

    // ── Progress bar
    progressWrap: {
      marginHorizontal: 12,
      marginBottom: 10,
    },
    progressTrack: {
      height: 6,
      backgroundColor: theme.colors.border.light,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.primary[500],
      borderRadius: 3,
    },
    progressLabel: {
      fontSize: 11,
      color: theme.colors.text.tertiary,
      marginTop: 4,
      textAlign: "right",
    },

    // ── CTA button
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#4CAF50",
      marginHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
      marginBottom: 8,
    },
    ctaBtnStop: { backgroundColor: theme.colors.error.main },
    ctaBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },

    // ── Tips
    tipsCard: {
      marginHorizontal: 12,
      backgroundColor: theme.colors.background.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 6,
    },
    tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    tipText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.text.secondary,
      lineHeight: 17,
    },

    // ── Live strip
    liveStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginHorizontal: 12,
      marginTop: 2,
    },
    liveStripText: { fontSize: 11, color: theme.colors.text.tertiary },
  });
