import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Theme } from "../../config/theme";
import { useTheme } from "../../hooks/useTheme";
import { MOCK_PAYMENT_METHODS } from "../../types/payment.types";
import { PaymentService } from "../../services/payment.service";
import { BookingService } from "../../services/booking.service";
import { useToastStore, getErrorMessage } from "../../stores/toast.store";

export default function BookingConfirmationScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {
    routeId,
    seats,
    totalAmount,
    origin,
    destination,
    date,
    time,
    operator,
    departureTime,
    plateNumber,
    passengerNames,
  } = useLocalSearchParams();
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    MOCK_PAYMENT_METHODS[0].id,
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const seatList = (seats as string)?.split(",") || [];
  const amount = Number(totalAmount) || 0;

  const handlePayment = async () => {
    if (
      !phoneNumber &&
      MOCK_PAYMENT_METHODS.find((m) => m.id === selectedMethodId)?.type ===
        "mobile_money"
    ) {
      useToastStore
        .getState()
        .error("Please enter your phone number.", "Required");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Booking in Backend first
      const booking = await BookingService.createBooking({
        routeId: routeId as string,
        seats: seatList,
        totalAmount: amount,
        travelDate: departureTime as string, // ISO string needed
      });

      // 2. Process Payment
      const method = MOCK_PAYMENT_METHODS.find(
        (m) => m.id === selectedMethodId,
      )!;
      const paymentResult = await PaymentService.processPayment({
        bookingId: booking.id,
        amount: amount,
        paymentMethod: method,
        phoneNumber: phoneNumber || undefined,
      });

      if (!paymentResult.success) {
        throw new Error(paymentResult.message || "Payment failed");
      }

      // 3. Navigate to Success
      router.replace({
        pathname: "/(screens)/payment-success",
        params: {
          amount: amount.toString(),
          seats: seats,
          destination: destination,
          transactionId: paymentResult.transactionId,
        },
      });
    } catch (error: any) {
      console.error("Booking failed:", error);
      useToastStore.getState().error(getErrorMessage(error), "Booking Error");
    } finally {
      setIsProcessing(false);
    }
  };

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
        <Text style={styles.headerTitle}>Confirm Booking</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Route</Text>
              <Text style={styles.value}>
                {origin} to {destination}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Operator</Text>
              <Text style={styles.value}>{operator}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Date & Time</Text>
              <Text style={styles.value}>
                {date}, {time}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Seats ({seatList.length})</Text>
              <Text style={styles.value}>{seatList.join(", ")}</Text>
            </View>
          </View>
          {/* ✅ Issue 4: Plate number */}
          {!!plateNumber && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View>
                  <Text style={styles.label}>Bus Plate Number</Text>
                  <Text
                    style={[styles.value, { color: theme.colors.accent.main }]}
                  >
                    {plateNumber}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        <Text style={styles.sectionHeader}>Payment Method</Text>
        <View style={styles.methodsContainer}>
          {MOCK_PAYMENT_METHODS.map((method) => {
            const isSelected = selectedMethodId === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  isSelected && styles.methodCardSelected,
                ]}
                onPress={() => setSelectedMethodId(method.id)}
              >
                <View
                  style={[styles.radio, isSelected && styles.radioSelected]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodLabel,
                      isSelected && styles.methodLabelSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                  <Text style={styles.methodSubtext}>
                    {method.type === "mobile_money"
                      ? "Fast & Secure"
                      : "Credit/Debit Card"}
                  </Text>
                </View>
                <Ionicons
                  name={
                    method.type === "mobile_money"
                      ? "phone-portrait-outline"
                      : "card-outline"
                  }
                  size={24}
                  color={
                    isSelected
                      ? theme.colors.primary[500]
                      : theme.colors.text.tertiary
                  }
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <Card style={styles.paymentInputCard}>
          <Input
            label="Phone Number"
            placeholder="078 XXX XXXX"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            leftIcon="call-outline"
          />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{amount.toLocaleString()} RWF</Text>
        </View>
        <Button
          title={isProcessing ? "Processing..." : "Pay Now"}
          onPress={handlePayment}
          loading={isProcessing}
          size="lg"
          fullWidth
        />
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing["4xl"],
    },
    sectionCard: {
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      backgroundColor: theme.colors.background.card,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    label: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    value: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.border.main,
      marginVertical: theme.spacing.md,
    },
    sectionHeader: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    methodsContainer: {
      marginBottom: theme.spacing.md,
    },
    methodCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: "transparent",
    },
    methodCardSelected: {
      borderColor: theme.colors.primary[500],
      backgroundColor: theme.colors.background.tertiary,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.text.disabled,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
    },
    radioSelected: {
      borderColor: theme.colors.primary[500],
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary[500],
    },
    methodInfo: {
      flex: 1,
    },
    methodLabel: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    methodLabelSelected: {
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    methodSubtext: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.disabled,
    },
    paymentInputCard: {
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    footer: {
      marginTop: "auto",
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.xl,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.main,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    totalLabel: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
    },
    totalAmount: {
      fontSize: theme.typography.fontSize["2xl"],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.accent.main,
    },
  });
