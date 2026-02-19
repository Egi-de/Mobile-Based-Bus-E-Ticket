import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";
import { ticketsService } from "../../services/api/tickets.service";

type ScanResult = {
  valid: boolean;
  ticketId: string;
  passenger?: string;
  seat?: string;
  route?: string;
  date?: string;
  operator?: string;
  status?: string;
  message: string;
};

export default function DriverScannerScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [scanCount, setScanCount] = useState(0); // how many valid tickets scanned this session

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  // ── Scanning line animation ──────────────────────────────────────────────
  useEffect(() => {
    if (!scanned) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [scanned]);

  // ── Result card slide-in ─────────────────────────────────────────────────
  useEffect(() => {
    if (scanResult) {
      Animated.spring(resultAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      resultAnim.setValue(0);
    }
  }, [scanResult]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isValidating) return;
    setScanned(true);
    setIsValidating(true);
    Vibration.vibrate(100);

    try {
      // The QR code value is the ticket/booking ID
      const ticketId = data.trim();
      const ticket = await ticketsService.getTicketById(ticketId);

      const ticketAny = ticket as any;
      const isActive =
        ticket.status === "ACTIVE" || (ticket.status as string) === "active";
      const route = ticketAny.route;

      if (isActive) {
        Vibration.vibrate([0, 100, 50, 100]); // double buzz = valid
        setScanCount((c) => c + 1);
        setScanResult({
          valid: true,
          ticketId: ticket.id,
          passenger:
            ticketAny.passenger?.name || ticketAny.passengerName || "—",
          seat: ticketAny.seatLabel || ticket.seatNumber || "—",
          route: route ? `${route.origin} → ${route.destination}` : "—",
          date: route?.departureTime
            ? new Date(route.departureTime).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
          operator: route?.operator || "—",
          status: ticket.status,
          message: "Valid Ticket ✓",
        });
      } else {
        Vibration.vibrate([0, 500]); // long buzz = invalid
        setScanResult({
          valid: false,
          ticketId: ticket.id,
          status: ticket.status,
          message: `Ticket is ${ticket.status.toLowerCase()}`,
        });
      }
    } catch {
      Vibration.vibrate([0, 500]);
      setScanResult({
        valid: false,
        ticketId: data,
        message: "Ticket not found or invalid QR code",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setScanned(false);
  };

  // ── Permission screen ────────────────────────────────────────────────────
  if (!permission) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Text style={styles.permText}>Checking camera permissions...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Tickets</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={styles.centerContainer}>
            <Ionicons
              name="camera-outline"
              size={64}
              color={theme.colors.text.tertiary}
            />
            <Text style={styles.permTitle}>Camera Access Required</Text>
            <Text style={styles.permText}>
              Enable camera access to scan passenger QR codes
            </Text>
            <TouchableOpacity
              style={styles.permBtn}
              onPress={requestPermission}
            >
              <Text style={styles.permBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Passenger Ticket</Text>
          <View style={styles.scanCountBadge}>
            <Text style={styles.scanCountText}>{scanCount}</Text>
          </View>
        </View>

        {/* ── Camera + viewfinder ─────────────────────────────────────── */}
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />

          {/* Dark overlay with cutout */}
          <View style={styles.overlay}>
            <View style={styles.overlayTop} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              {/* Viewfinder box */}
              <View style={styles.viewfinder}>
                {/* Corner brackets */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {/* Scanning line */}
                {!scanned && (
                  <Animated.View
                    style={[
                      styles.scanLine,
                      { transform: [{ translateY: scanLineY }] },
                    ]}
                  />
                )}

                {/* Validating overlay */}
                {isValidating && (
                  <View style={styles.validatingOverlay}>
                    <Ionicons name="scan" size={48} color="#FFF" />
                    <Text style={styles.validatingText}>Validating...</Text>
                  </View>
                )}
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.scanHint}>
                {isValidating
                  ? "Checking ticket..."
                  : scanned
                    ? "Ticket scanned"
                    : "Align the QR code within the frame"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Result Card ──────────────────────────────────────────────── */}
        {scanResult && (
          <Animated.View
            style={[
              styles.resultCard,
              scanResult.valid
                ? styles.resultCardValid
                : styles.resultCardInvalid,
              {
                transform: [
                  {
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
                opacity: resultAnim,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status header */}
              <View style={styles.resultHeader}>
                <Ionicons
                  name={scanResult.valid ? "checkmark-circle" : "close-circle"}
                  size={36}
                  color={scanResult.valid ? "#4CAF50" : "#F44336"}
                />
                <Text
                  style={[
                    styles.resultMessage,
                    { color: scanResult.valid ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {scanResult.message}
                </Text>
              </View>

              {/* Ticket details (only for valid) */}
              {scanResult.valid && (
                <View style={styles.resultDetails}>
                  <ResultRow
                    label="Passenger"
                    value={scanResult.passenger ?? "—"}
                    icon="person"
                  />
                  <ResultRow
                    label="Seat"
                    value={scanResult.seat ?? "—"}
                    icon="cube"
                  />
                  <ResultRow
                    label="Route"
                    value={scanResult.route ?? "—"}
                    icon="navigate"
                  />
                  <ResultRow
                    label="Date"
                    value={scanResult.date ?? "—"}
                    icon="calendar"
                  />
                  <ResultRow
                    label="Operator"
                    value={scanResult.operator ?? "—"}
                    icon="business"
                  />
                </View>
              )}

              {/* Ticket ID */}
              <Text style={styles.ticketIdText} numberOfLines={1}>
                ID: {scanResult.ticketId}
              </Text>

              {/* Actions */}
              <TouchableOpacity
                style={styles.scanAgainBtn}
                onPress={handleScanAgain}
              >
                <Ionicons name="scan" size={18} color="#FFF" />
                <Text style={styles.scanAgainBtnText}>Scan Next Passenger</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Session counter bar ──────────────────────────────────────── */}
        {!scanResult && (
          <View style={styles.sessionBar}>
            <Ionicons
              name="people"
              size={16}
              color={theme.colors.primary[500]}
            />
            <Text style={styles.sessionBarText}>
              {scanCount === 0
                ? "No passengers scanned yet"
                : `${scanCount} passenger${scanCount !== 1 ? "s" : ""} validated this session`}
            </Text>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

// ── Small helper component ─────────────────────────────────────────────────
function ResultRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={rrStyles.row}>
      <Ionicons name={icon} size={15} color="#888" style={rrStyles.icon} />
      <Text style={rrStyles.label}>{label}</Text>
      <Text style={rrStyles.value}>{value}</Text>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: { marginRight: 8 },
  label: {
    fontSize: 13,
    color: "#888",
    width: 72,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    iconBtn: { padding: 8 },
    headerTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: theme.colors.text.primary,
    },
    scanCountBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary[500],
      alignItems: "center",
      justifyContent: "center",
    },
    scanCountText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },

    // Camera
    cameraWrapper: {
      flex: 1,
      position: "relative",
      overflow: "hidden",
    },
    camera: { flex: 1 },

    // Overlay
    overlay: { ...StyleSheet.absoluteFillObject },
    overlayTop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    overlayMiddle: {
      flexDirection: "row",
      height: 240,
    },
    overlaySide: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    overlayBottom: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      paddingTop: 16,
    },
    scanHint: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 14,
      fontWeight: "500",
    },

    // Viewfinder
    viewfinder: {
      width: 240,
      height: 240,
      position: "relative",
      overflow: "hidden",
    },
    corner: {
      position: "absolute",
      width: 28,
      height: 28,
      borderColor: "#FFC107",
      borderWidth: 3,
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopLeftRadius: 4,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopRightRadius: 4,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: 4,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomRightRadius: 4,
    },
    scanLine: {
      position: "absolute",
      left: 10,
      right: 10,
      height: 2,
      backgroundColor: "#FFC107",
      shadowColor: "#FFC107",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 6,
      elevation: 3,
    },
    validatingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    validatingText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

    // Result card
    resultCard: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 32,
      maxHeight: "70%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
    },
    resultCardValid: { backgroundColor: "#FFFFFF" },
    resultCardInvalid: { backgroundColor: "#FFF5F5" },
    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 16,
    },
    resultMessage: {
      fontSize: 18,
      fontWeight: "bold",
      flex: 1,
    },
    resultDetails: {
      backgroundColor: "#F8F8F8",
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    ticketIdText: {
      fontSize: 11,
      color: "#AAA",
      marginBottom: 14,
      fontFamily: "monospace",
    },
    scanAgainBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1E3A5F",
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
    },
    scanAgainBtnText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 15,
    },

    // Session bar
    sessionBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.colors.background.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
    },
    sessionBarText: {
      fontSize: 13,
      color: theme.colors.text.secondary,
    },

    // Permission
    permTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text.primary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    permText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: "center",
      lineHeight: 20,
    },
    permBtn: {
      marginTop: 24,
      backgroundColor: theme.colors.primary[500],
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 10,
    },
    permBtnText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 15,
    },
  });
