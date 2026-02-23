import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ScreenWrapper } from "../../../components/ui/ScreenWrapper";
import { Button } from "../../../components/ui/Button";
import { SeatMap } from "../../../components/features/SeatMap";
import { useTheme } from "../../../hooks/useTheme";
import { theme as staticTheme } from "../../../config/theme";
import { Route } from "../../../types/route.types";
import { Seat } from "../../../types/booking.types";
import { RouteService } from "../../../services/route.service";
import { BookingService } from "../../../services/booking.service";
import { useToastStore, getErrorMessage } from "../../../stores/toast.store";

export default function RouteDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [route, setRoute] = useState<Route | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Issue 3: Multi-passenger state
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [isForOthers, setIsForOthers] = useState<boolean | null>(null);
  const [passengerNames, setPassengerNames] = useState<string[]>([]);
  const [cancelOldBookingId, setCancelOldBookingId] = useState<string | null>(null);

  useEffect(() => {
    const loadRouteData = async () => {
      if (!id) return;

      try {
        const routeData = await RouteService.getRouteById(id as string);
        setRoute(routeData);

        // Fetch booked seats for this route
        const bookedSeats = await BookingService.getBookedSeats(
          routeData.id,
          routeData.departureTime,
        );

        // Generate seats with correct status
        // Note: In a real app we might fetch seat layout from backend too
        // For now we generate layout but use real availability
        const realSeats = generateSeats(routeData.price, bookedSeats);
        setSeats(realSeats);
      } catch (error) {
        console.error("Failed to fetch details:", error);
        useToastStore.getState().error(getErrorMessage(error), "Error");
      } finally {
        setIsLoading(false);
      }
    };

    loadRouteData();
  }, [id]);

  // Helper to generate seat layout with real availability
  const generateSeats = (price: number, bookedSeatIds: string[]): Seat[] => {
    const totalRows = 10;
    const seatsList: Seat[] = [];
    const colMap: { [key: string]: number } = { A: 0, B: 1, C: 2, D: 3 };

    ["A", "B", "C", "D"].forEach((colLabel) => {
      for (let row = 1; row <= totalRows; row++) {
        const seatId = `${row}${colLabel}`;
        seatsList.push({
          id: seatId,
          label: seatId,
          type: "standard",
          price: price, // Use route price
          status: bookedSeatIds.includes(seatId) ? "booked" : "available",
          row,
          col: colMap[colLabel],
        });
      }
    });

    return seatsList;
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        if (prev.length >= 5) {
          useToastStore
            .getState()
            .info("You can only select up to 5 seats.", "Limit Reached");
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  const totalPrice = selectedSeats.reduce((total, seatId) => {
    const seat = seats.find((s) => s.id === seatId);
    return total + (seat?.price || 0);
  }, 0);

  // ✅ Issue 3: Navigate to booking-confirmation with passenger names + plate number
  // ✅ Issue 4: Pass plateNumber
  const navigateToConfirmation = (names: string[], cancelOldBookingId?: string) => {
    const depDate = route?.departureTime
      ? new Date(route.departureTime)
      : new Date();
    router.push({
      pathname: "/(screens)/booking-confirmation",
      params: {
        routeId: id,
        seats: selectedSeats.join(","),
        totalAmount: totalPrice.toString(),
        origin: route?.origin,
        destination: route?.destination,
        operator: route?.operator || "",
        plateNumber: route?.plateNumber || "",
        date: format(depDate, "MMM d, yyyy"),
        time: format(depDate, "HH:mm"),
        departureTime: route?.departureTime,
        passengerNames: names.filter((n) => n.trim()).join(","),
        ...(cancelOldBookingId ? { cancelOldBookingId } : {}),
      },
    });
  };

  // ✅ Duplicate ticket check + passenger name flow
  const handleContinue = async () => {
    if (selectedSeats.length === 0) return;

    // Check for existing active bookings on the same route
    try {
      const activeBookings = await BookingService.getMyBookings("ACTIVE");
      const duplicateBooking = activeBookings.find(
        (b) => b.routeId === (id as string)
      );

      if (duplicateBooking) {
        // Show warning about duplicate
        Alert.alert(
          "Active Ticket Found",
          `You already have an active ticket for ${route?.origin} → ${route?.destination}.\n\nIf you proceed, your previous ticket will be cancelled with no refund.`,
          [
            { text: "Go Back", style: "cancel" },
            {
              text: "Continue Anyway",
              style: "destructive",
              onPress: () => proceedToBooking(duplicateBooking.id),
            },
          ]
        );
        return;
      }
    } catch (error) {
      // If checking fails, allow proceeding anyway
      console.warn("Could not check for duplicate bookings:", error);
    }

    proceedToBooking();
  };

  const proceedToBooking = (oldBookingId?: string) => {
    if (oldBookingId) setCancelOldBookingId(oldBookingId);
    if (selectedSeats.length > 1) {
      // Multiple seats → collect passenger names
      setIsForOthers(true);
      setPassengerNames(new Array(selectedSeats.length).fill(""));
      setShowPassengerModal(true);
    } else {
      navigateToConfirmation([], oldBookingId || cancelOldBookingId || undefined);
    }
  };

  const updatePassengerName = (index: number, name: string) => {
    const names = [...passengerNames];
    names[index] = name;
    setPassengerNames(names);
  };

  if (!route) {
    return (
      <ScreenWrapper>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.skeletonHeader}>
              <View
                style={[
                  styles.skeletonBox,
                  { width: "70%", height: 28, marginBottom: 8 },
                ]}
              />
              <View
                style={[styles.skeletonBox, { width: "40%", height: 20 }]}
              />
            </View>
            <View style={styles.skeletonCard}>
              <View
                style={[
                  styles.skeletonBox,
                  { width: "50%", height: 20, marginBottom: 12 },
                ]}
              />
              <View
                style={[
                  styles.skeletonBox,
                  { width: "80%", height: 16, marginBottom: 8 },
                ]}
              />
              <View
                style={[styles.skeletonBox, { width: "60%", height: 16 }]}
              />
            </View>
            <View style={styles.skeletonCard}>
              <View
                style={[
                  styles.skeletonBox,
                  { width: "50%", height: 20, marginBottom: 12 },
                ]}
              />
              <View
                style={[styles.skeletonBox, { width: "100%", height: 200 }]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Route not found.</Text>
          </View>
        )}
      </ScreenWrapper>
    );
  }

  const departureDate = new Date(route.departureTime);

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>
            {route.origin} to {route.destination}
          </Text>
          <Text style={styles.headerSubtitle}>
            {route.operator} • {format(departureDate, "MMM d, HH:mm")}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>Select Seats</Text>
          <SeatMap
            seats={seats}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.priceInfo}>
            <Text style={styles.selectedCount}>
              {selectedSeats.length} Seat{selectedSeats.length !== 1 ? "s" : ""}{" "}
              Selected
            </Text>
            <Text style={styles.totalPrice}>
              {totalPrice.toLocaleString()}{" "}
              <Text style={styles.currency}>RWF</Text>
            </Text>
          </View>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={selectedSeats.length === 0}
            style={styles.continueButton}
          />
        </View>
      </View>

      {/* ✅ Issue 3: Multi-passenger modal */}
      <Modal
        visible={showPassengerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPassengerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isForOthers === null ? (
              /* Step 1: Ask if buying for others */
              <>
                <Text style={styles.modalTitle}>Multiple Seats Selected</Text>
                <Text style={styles.modalSubtitle}>
                  You selected {selectedSeats.length} seats. Are some of them
                  for other passengers?
                </Text>
                <TouchableOpacity
                  style={styles.modalOptionBtn}
                  onPress={() => setIsForOthers(true)}
                >
                  <Ionicons
                    name="people"
                    size={20}
                    color={theme.colors.primary[500]}
                  />
                  <Text style={styles.modalOptionText}>
                    Yes, some are for other passengers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalOptionBtn, styles.modalOptionBtnAlt]}
                  onPress={() => {
                    setShowPassengerModal(false);
                    navigateToConfirmation([], cancelOldBookingId || undefined);
                  }}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={theme.colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    No, all seats are for me
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Step 2: Enter names for ALL passengers (each seat gets a name) */
              <>
                <Text style={styles.modalTitle}>Passenger Names</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the full name for each passenger ({selectedSeats.length}{" "}
                  seats)
                </Text>
                <ScrollView
                  style={{ maxHeight: 320 }}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedSeats.map((seat, idx) => (
                    <View key={seat} style={styles.passengerRow}>
                      <View style={styles.passengerSeatBadge}>
                        <Text style={styles.passengerSeatText}>{seat}</Text>
                      </View>
                      <TextInput
                        style={styles.passengerInput}
                        placeholder={`Passenger ${idx + 1} name`}
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        value={passengerNames[idx] || ""}
                        onChangeText={(text) => updatePassengerName(idx, text)}
                      />
                    </View>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalBackBtn}
                    onPress={() => setShowPassengerModal(false)}
                  >
                    <Text style={styles.modalBackBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    onPress={() => {
                      setShowPassengerModal(false);
                      navigateToConfirmation(passengerNames, cancelOldBookingId || undefined);
                    }}
                  >
                    <Text style={styles.modalConfirmBtnText}>
                      Continue to Payment
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const createStyles = (theme: typeof staticTheme) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      color: theme.colors.text.secondary,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    content: {
      flex: 1,
    },
    mapContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
      marginLeft: theme.spacing.xs,
    },
    footer: {
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl, // Optimize for safe area
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.main,
    },
    priceInfo: {
      flex: 1,
    },
    selectedCount: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    totalPrice: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    currency: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeight.regular,
    },
    continueButton: {
      minWidth: 140,
    },
    skeletonHeader: {
      padding: theme.spacing.lg,
    },
    skeletonCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.base,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    skeletonBox: {
      backgroundColor: theme.colors.border.light,
      borderRadius: theme.borderRadius.sm,
    },
    // ── Multi-passenger modal ──────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.colors.background.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: theme.spacing.xl,
      paddingBottom: 36,
    },
    modalTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
    },
    modalSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.lg,
    },
    modalOptionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary[500],
      backgroundColor: theme.colors.primary[500] + "12",
      marginBottom: theme.spacing.md,
    },
    modalOptionBtnAlt: {
      borderColor: theme.colors.border.main,
      backgroundColor: theme.colors.background.cardLight,
    },
    modalOptionText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.primary[500],
      flex: 1,
    },
    passengerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: theme.spacing.md,
    },
    passengerSeatBadge: {
      width: 44,
      height: 44,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary[500] + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    passengerSeatText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary[500],
    },
    passengerInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border.main,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.cardLight,
      fontSize: theme.typography.fontSize.base,
    },
    modalActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    modalBackBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.main,
      alignItems: "center",
    },
    modalBackBtnText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    modalConfirmBtn: {
      flex: 2,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.accent.main,
      alignItems: "center",
    },
    modalConfirmBtnText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
