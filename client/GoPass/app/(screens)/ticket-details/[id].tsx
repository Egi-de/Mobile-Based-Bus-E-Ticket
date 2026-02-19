import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ScreenWrapper } from "../../../components/ui/ScreenWrapper";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useTheme } from "../../../hooks/useTheme";
import { theme as staticTheme } from "../../../config/theme";
import { Ticket } from "../../../types/ticket.types";
import { TicketService } from "../../../services/ticket.service";
import QRCode from "react-native-qrcode-svg";

// ── Cancellation reasons ────────────────────────────────────────────────────
const CANCEL_REASONS = [
  "Found alternative transport",
  "Plans changed",
  "Wrong booking details",
  "Emergency / health issue",
  "Other",
];

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Issue 7: Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await TicketService.getTicketById(id as string);
        setTicket(data || null);
      } catch (error) {
        console.error("Failed to fetch ticket", error);
        Alert.alert("Error", "Failed to load ticket details");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleShare = async () => {
    try {
      if (!ticket) return;
      await Share.share({
        message: `Bus Ticket: ${(ticket as any).route?.origin || ""} to ${(ticket as any).route?.destination || ""}\nDate: ${format(new Date((ticket as any).route?.departureTime || ticket.purchaseDate), "PPP p")}\nSeat: ${(ticket as any).seatLabel || ticket.seatNumber}\nTicket ID: ${ticket.id}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ Issue 7: Show reason selection modal instead of basic Alert
  const handleCancel = () => {
    setSelectedReason(null);
    setCustomReason("");
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    const reason =
      selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!reason) {
      Alert.alert("Required", "Please select or enter a cancellation reason.");
      return;
    }

    setIsCancelling(true);
    try {
      await TicketService.cancelTicket(id as string);
      setShowCancelModal(false);
      Alert.alert(
        "Ticket Cancelled",
        "Your ticket has been cancelled successfully.\n\n💳 Refund Notice: Your refund will be processed within 24 hours to your original payment method.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      console.error("Cancellation failed:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to cancel ticket. Please try again.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !ticket) {
    return (
      <ScreenWrapper>
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
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <View
            style={[
              styles.qrCard,
              { alignItems: "center", padding: theme.spacing["2xl"] },
            ]}
          >
            <View
              style={[
                styles.skeletonBox,
                { width: 180, height: 180, marginBottom: theme.spacing.lg },
              ]}
            />
            <View
              style={[
                styles.skeletonBox,
                { width: 120, height: 20, marginBottom: theme.spacing.sm },
              ]}
            />
            <View style={[styles.skeletonBox, { width: 200, height: 14 }]} />
          </View>
          <View style={styles.detailsCard}>
            <View
              style={[
                styles.skeletonBox,
                { width: 140, height: 20, marginBottom: theme.spacing.lg },
              ]}
            />
            <View
              style={[
                styles.skeletonBox,
                { width: "100%", height: 80, marginBottom: theme.spacing.xl },
              ]}
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: theme.spacing.md,
              }}
            >
              <View
                style={[styles.skeletonBox, { width: "45%", height: 60 }]}
              />
              <View
                style={[styles.skeletonBox, { width: "45%", height: 60 }]}
              />
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Support both legacy (booking-based) and new ticket formats
  const ticketAny = ticket as any;
  const routeData = ticketAny.route;
  const departureDate = routeData?.departureTime
    ? new Date(routeData.departureTime)
    : new Date(ticket.purchaseDate);
  const arrivalDate = routeData?.arrivalTime
    ? new Date(routeData.arrivalTime)
    : null;
  const seatDisplay = ticketAny.seatLabel || ticket.seatNumber || "—";
  const plateNumber =
    routeData?.plateNumber || ticketAny.trip?.bus?.plateNumber || null;
  const isActive =
    ticket.status === "ACTIVE" || (ticket.status as string) === "active";

  // ✅ Issue 5: Purchase time
  const purchaseDate = new Date(ticket.purchaseDate);

  return (
    <ScreenWrapper>
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
        <Text style={styles.headerTitle}>Ticket Details</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons
            name="share-social-outline"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <QRCode
              value={ticket.qrCodeData || ticket.id}
              size={220}
              ecl="H"
              quietZone={16}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          </View>
          <Text style={styles.ticketId}>{ticket.id}</Text>
          <Text style={styles.qrNote}>
            Show this QR code to the bus conductor
          </Text>
        </Card>

        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Trip Information</Text>

          {routeData && (
            <View style={styles.routeRow}>
              <View>
                <Text style={styles.cityLabel}>From</Text>
                <Text style={styles.cityValue}>{routeData.origin}</Text>
                <Text style={styles.timeValue}>
                  {format(departureDate, "HH:mm")}
                </Text>
              </View>
              <View style={styles.routeDivider}>
                <Ionicons
                  name="bus-outline"
                  size={24}
                  color={theme.colors.accent.main}
                />
                <View style={styles.dottedLine} />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.cityLabel}>To</Text>
                <Text style={styles.cityValue}>{routeData.destination}</Text>
                {arrivalDate && (
                  <Text style={styles.timeValue}>
                    {format(arrivalDate, "HH:mm")}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {format(departureDate, "MMM d, yyyy")}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Seat</Text>
              <Text style={styles.infoValue}>{seatDisplay}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bus Operator</Text>
              <Text style={styles.infoValue}>{routeData?.operator || "—"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Passenger</Text>
              <Text style={styles.infoValue}>
                {ticketAny.passenger?.name?.split(" ")[0] || "—"}
              </Text>
            </View>

            {/* ✅ Issue 6: Plate number */}
            {plateNumber && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Plate Number</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: theme.colors.accent.main },
                  ]}
                >
                  {plateNumber}
                </Text>
              </View>
            )}

            {/* ✅ Issue 5: Purchased time */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Purchased At</Text>
              <Text style={styles.infoValue}>
                {format(purchaseDate, "HH:mm, MMM d")}
              </Text>
            </View>
          </View>

          {/* ✅ Passenger names for multi-seat bookings */}
          {(() => {
            const rawNames =
              ticketAny.passengerNames ||
              ticketAny.booking?.passengerNames ||
              "";
            const nameList =
              typeof rawNames === "string"
                ? rawNames.split(",").filter((n: string) => n.trim())
                : Array.isArray(rawNames)
                  ? rawNames
                  : [];
            if (nameList.length === 0) return null;
            return (
              <>
                <View style={styles.divider} />
                <Text style={[styles.infoLabel, { marginBottom: 8 }]}>
                  Passengers
                </Text>
                {nameList.map((name: string, idx: number) => (
                  <View key={idx} style={styles.passengerNameRow}>
                    <Ionicons
                      name="person-circle-outline"
                      size={18}
                      color={theme.colors.primary[500]}
                    />
                    <Text style={styles.passengerNameText}>{name.trim()}</Text>
                  </View>
                ))}
              </>
            );
          })()}
        </Card>

        {isActive && (
          <Button
            title="Cancel Ticket"
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
            textStyle={{ color: theme.colors.error.main }}
          />
        )}
      </ScrollView>

      {/* ✅ Issue 7: Cancel Reason Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Ticket</Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Please tell us why you're cancelling this ticket
            </Text>

            <ScrollView
              style={styles.reasonsList}
              showsVerticalScrollIndicator={false}
            >
              {CANCEL_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selectedReason === reason && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedReason === reason && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason && styles.reasonTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}

              {selectedReason === "Other" && (
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Please describe your reason..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={customReason}
                  onChangeText={setCustomReason}
                  multiline
                  numberOfLines={3}
                />
              )}
            </ScrollView>

            {/* Refund notice */}
            <View style={styles.refundNotice}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={theme.colors.warning?.main || "#F59E0B"}
              />
              <Text style={styles.refundNoticeText}>
                Refund will be processed within 24 hours
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Keep Ticket</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  (!selectedReason ||
                    (selectedReason === "Other" && !customReason.trim())) &&
                    styles.modalConfirmBtnDisabled,
                ]}
                onPress={confirmCancellation}
                disabled={
                  isCancelling ||
                  !selectedReason ||
                  (selectedReason === "Other" && !customReason.trim())
                }
              >
                <Text style={styles.modalConfirmBtnText}>
                  {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const createStyles = (theme: typeof staticTheme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    content: {
      padding: theme.spacing.xl,
      paddingBottom: theme.spacing["4xl"],
    },
    qrCard: {
      alignItems: "center",
      padding: theme.spacing["2xl"],
      backgroundColor: theme.colors.white,
      marginBottom: theme.spacing.lg,
    },
    qrContainer: {
      marginBottom: theme.spacing.lg,
    },
    ticketId: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.black,
      marginBottom: theme.spacing.sm,
      textAlign: "center",
    },
    qrNote: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.disabled,
      textAlign: "center",
    },
    detailsCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      backgroundColor: theme.colors.background.card,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
    },
    routeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    cityLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    cityValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    timeValue: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.accent.main,
      fontWeight: theme.typography.fontWeight.medium,
    },
    routeDivider: {
      alignItems: "center",
      width: 60,
    },
    dottedLine: {
      width: "100%",
      height: 1,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.text.disabled,
      borderStyle: "dashed",
      marginTop: 4,
    },
    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.lg,
    },
    infoItem: {
      width: "45%",
      marginBottom: theme.spacing.sm,
    },
    infoLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    cancelButton: {
      borderColor: theme.colors.error.main,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border.main,
      marginVertical: theme.spacing.md,
    },
    passengerNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    passengerNameText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
    },
    skeletonBox: {
      backgroundColor: theme.colors.border.light,
      borderRadius: theme.borderRadius.md,
    },
    // ── Cancel Modal styles ──────────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.colors.background.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: theme.spacing.xl,
      paddingBottom: 36,
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.sm,
    },
    modalTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    modalSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.lg,
    },
    reasonsList: {
      maxHeight: 300,
      marginBottom: theme.spacing.md,
    },
    reasonItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      backgroundColor: theme.colors.background.cardLight,
    },
    reasonItemSelected: {
      borderColor: theme.colors.error.main,
      backgroundColor: theme.colors.error.main + "10",
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.text.disabled,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
    },
    radioCircleSelected: {
      borderColor: theme.colors.error.main,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.error.main,
    },
    reasonText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      flex: 1,
    },
    reasonTextSelected: {
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    customReasonInput: {
      borderWidth: 1,
      borderColor: theme.colors.border.main,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.cardLight,
      fontSize: theme.typography.fontSize.base,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: theme.spacing.md,
    },
    refundNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#F59E0B" + "15",
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: "#F59E0B",
    },
    refundNoticeText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.primary,
      flex: 1,
      fontWeight: theme.typography.fontWeight.medium,
    },
    modalActions: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border.main,
      alignItems: "center",
    },
    modalCancelBtnText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    modalConfirmBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.error.main,
      alignItems: "center",
    },
    modalConfirmBtnDisabled: {
      opacity: 0.5,
    },
    modalConfirmBtnText: {
      fontSize: theme.typography.fontSize.base,
      color: "#FFFFFF",
      fontWeight: theme.typography.fontWeight.semibold,
    },
  });
