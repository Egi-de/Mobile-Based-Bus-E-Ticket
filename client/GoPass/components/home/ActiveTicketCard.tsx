import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Booking } from "../../services/booking.service";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";

interface ActiveTicketCardProps {
  booking: Booking;
  onPress: () => void;
}

export const ActiveTicketCard: React.FC<ActiveTicketCardProps> = ({
  booking,
  onPress,
}) => {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(
    () => createStyles(theme, isDark),
    [theme, isDark],
  );

  // Format travel date for display
  const travelDate = new Date(booking.travelDate);
  const formattedDate = travelDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const formattedDepartureTime = travelDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ✅ Issue 5: Show the time the ticket was PURCHASED (bookingDate), not departure
  const purchaseDate = new Date(booking.bookingDate);
  const formattedPurchaseTime = purchaseDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate departs in
  const now = new Date();
  const diffMs = travelDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const departsIn = diffMins > 0 ? `${diffMins} min` : "Departed";

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      style={styles.containerShadow}
    >
      {/* ✅ Issue 8: Plain View — NO pulse/fade animation */}
      <View style={styles.container}>
        {/* Emerald accent bar on left */}
        <View style={styles.accentBar} />

        {/* Header: Route Badge & Status */}
        <View style={styles.headerRow}>
          <View style={styles.routeBadge}>
            <Text style={styles.routeBadgeText}>
              Route {booking.route?.id?.substring(0, 4) || "---"}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        {/* Main Info + Bus Image */}
        <View style={styles.mainContent}>
          <View style={styles.mainLeft}>
            <View style={styles.header}>
              <Text style={styles.operator}>
                {booking.route?.operator || "Operator"}
              </Text>
              {(booking.route as any)?.plateNumber && (
                <View style={styles.plateContainer}>
                  <Ionicons
                    name="bus"
                    size={12}
                    color={theme.colors.gold[500]}
                  />
                  <Text style={styles.plateNumber}>
                    {(booking.route as any).plateNumber}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.routeRow}>
              <Text style={styles.cityText}>{booking.route?.origin}</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={theme.colors.text.primary}
                style={{ marginHorizontal: 8 }}
              />
              <Text style={styles.cityText}>{booking.route?.destination}</Text>
            </View>
          </View>

          {/* ✅ Issue 8: Bus image on right side */}
          <View style={styles.busImageContainer}>
            {(booking.route as any)?.imageUrl ? (
              <Image
                source={{ uri: (booking.route as any).imageUrl }}
                style={styles.busImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.busIconFallback}>
                <Ionicons
                  name="bus"
                  size={36}
                  color={theme.colors.primary[400]}
                />
              </View>
            )}
          </View>
        </View>

        {/* Departure Time & Departs In badge */}
        <View style={styles.infoRow}>
          <View>
            <Text style={styles.labelText}>Departs</Text>
            <Text style={styles.dateText}>
              {formattedDate}, {formattedDepartureTime}
            </Text>
          </View>
          <View style={styles.timerBadge}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.colors.gold[500]}
            />
            <Text style={styles.timerText}>{departsIn}</Text>
          </View>
        </View>

        {/* Footer: Purchase time & Price */}
        <View style={styles.footer}>
          <View style={styles.purchaseRow}>
            <Ionicons
              name="receipt-outline"
              size={13}
              color={theme.colors.text.tertiary}
            />
            {/* ✅ Issue 5: Shows ticket purchase time */}
            <Text style={styles.purchaseText}>
              Bought at {formattedPurchaseTime}
            </Text>
          </View>
          <Text style={styles.priceText}>
            {booking.totalAmount.toLocaleString()} RWF
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => {
  return StyleSheet.create({
    containerShadow: {
      marginBottom: theme.spacing.xl,
      borderRadius: theme.borderRadius["2xl"],
    },
    container: {
      borderRadius: theme.borderRadius["2xl"],
      overflow: "hidden",
      backgroundColor: theme.colors.background.card,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      position: "relative",
    },
    accentBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: theme.colors.emerald[500],
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: theme.spacing.base,
      paddingLeft: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
    },
    routeBadge: {
      backgroundColor: theme.colors.background.cardLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    routeBadgeText: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.emerald[500] + "20",
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.emerald[500],
    },
    statusText: {
      color: theme.colors.emerald[500],
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    mainContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: theme.spacing.base,
      paddingLeft: theme.spacing.lg,
    },
    mainLeft: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xs,
    },
    operator: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    plateContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.colors.gold[500] + "20",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    plateNumber: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.gold[500],
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    cityText: {
      fontSize: theme.typography.fontSize["2xl"],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      letterSpacing: theme.typography.letterSpacing.tight,
    },
    // ✅ Issue 8: Bus image styles
    busImageContainer: {
      width: 72,
      height: 72,
      borderRadius: theme.borderRadius.lg,
      overflow: "hidden",
      backgroundColor: theme.colors.background.cardLight,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    busImage: {
      width: "100%",
      height: "100%",
    },
    busIconFallback: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary[500] + "15",
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: theme.spacing.base,
      paddingLeft: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
    },
    labelText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      marginBottom: 2,
    },
    dateText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    timerBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.colors.gold[500] + "20",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
    },
    timerText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.gold[500],
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: theme.spacing.base,
      paddingLeft: theme.spacing.lg,
      backgroundColor: theme.colors.background.cardLight,
    },
    purchaseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    purchaseText: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.fontSize.xs,
    },
    priceText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.gold[500],
    },
  });
};
