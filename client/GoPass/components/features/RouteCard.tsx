import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Route } from '../../types/route.types';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../config/theme';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { getTripStatus, getTripStatusInfo, TripStatus } from '../../utils/trip-status.utils';

interface RouteCardProps {
  route: Route;
  onPress: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, onPress }) => {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [imageLoading, setImageLoading] = useState(!!route.imageUrl);

  // Calculate trip status
  const tripStatus = getTripStatus(route.departureTime, route.arrivalTime);
  const statusInfo = getTripStatusInfo(tripStatus, route.departureTime, route.nextStop);

  // Calculate duration
  const departureDate = new Date(route.departureTime);
  const arrivalDate = new Date(route.arrivalTime);
  const durationMs = arrivalDate.getTime() - departureDate.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationStr = durationMinutes > 0 ? `${durationHours}h ${durationMinutes}m` : `${durationHours}h`;

  // Format time
  const departureTime = format(departureDate, 'HH:mm');

  // Determine if booking is disabled
  const isBookingDisabled = tripStatus === TripStatus.COMPLETED;

  return (
    <Card 
      variant="default" 
      padding="none" 
      style={isBookingDisabled ? { ...styles.card, ...styles.cardDisabled } : styles.card} 
      onPress={isBookingDisabled ? undefined : onPress}
    >
      {/* Bus image / hero area */}
      <View style={styles.imageContainer}>
        {route.imageUrl ? (
          <>
            <Image
              source={{ uri: route.imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <Skeleton
                  width="100%"
                  height={100}
                  borderRadius={0}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>
            )}
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="bus" size={40} color={theme.colors.text.tertiary} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* Route */}
        <View style={styles.routeRow}>
          <Text style={styles.cityText} numberOfLines={1}>{route.origin}</Text>
          <Ionicons name="arrow-forward" size={16} color={theme.colors.text.primary} style={styles.arrow} />
          <Text style={styles.cityText} numberOfLines={1}>{route.destination}</Text>
        </View>

        {/* Status Description */}
        <Text style={styles.statusDescription} numberOfLines={1}>
          {statusInfo.description}
        </Text>

        {/* Time and Duration */}
        <View style={styles.timeRow}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color={theme.colors.text.primary} />
            <Text style={styles.timeText}>{departureTime}</Text>
          </View>
          <View style={styles.durationContainer}>
            <Ionicons name="hourglass-outline" size={14} color={theme.colors.text.secondary} />
            <Text style={styles.durationText}>{durationStr}</Text>
          </View>
        </View>

        {/* Price and Seats */}
        <View style={styles.footer}>
          <Text style={styles.price}>{route.price.toLocaleString()} RWF</Text>
          <View style={styles.seatsContainer}>
            <Ionicons 
              name="people" 
              size={16} 
              color={route.seatsAvailable < 5 ? theme.colors.gold[500] : theme.colors.emerald[500]} 
            />
            <Text style={[
              styles.seats,
              route.seatsAvailable < 5 && styles.seatsLow
            ]}>
              {route.seatsAvailable} left
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const createStyles = (theme: typeof staticTheme, isDark: boolean) => {
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    cardDisabled: {
      opacity: 0.6,
    },
    imageContainer: {
      position: 'relative',
      height: 100,
      backgroundColor: theme.colors.background.cardLight,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.cardLight,
    },
    operatorBadge: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      right: 8,
      backgroundColor: theme.colors.background.card + 'F2', // 95% opacity for better readability
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border.light + '40', // Subtle border
    },
    operatorName: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    plateNumber: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      fontFamily: theme.typography.fontFamily.medium,
    },
    content: {
      padding: theme.spacing.base,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    statusLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.semibold,
      fontFamily: theme.typography.fontFamily.semibold,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    cityText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text.primary,
      flex: 1,
    },
    arrow: {
      marginHorizontal: 8,
    },
    statusDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontFamily: theme.typography.fontFamily.regular,
      marginBottom: theme.spacing.sm,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      fontFamily: theme.typography.fontFamily.semibold,
      color: theme.colors.text.primary, // High contrast for dark mode
    },
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    durationText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontFamily: theme.typography.fontFamily.medium,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
    },
    price: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.gold[500], // Gold for price
    },
    seatsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    seats: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.emerald[500], // Emerald for available seats
      fontWeight: theme.typography.fontWeight.medium,
      fontFamily: theme.typography.fontFamily.medium,
    },
    seatsLow: {
      color: theme.colors.gold[500], // Gold for low seats
    },
  });
};
