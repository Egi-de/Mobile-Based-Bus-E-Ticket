import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../config/theme';
import { Ticket } from '../../types/ticket.types';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress }) => {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  
  // Handle optional route (for backward compatibility)
  const departureDate = ticket.route ? new Date(ticket.route.departureTime) : new Date(ticket.trip?.departureTime || ticket.purchaseDate);
  const isUsed = ticket.status === 'COMPLETED';
  const isCancelled = ticket.status === 'CANCELLED';
  const isExpired = ticket.status === 'EXPIRED';
  const isActive = ticket.status === 'ACTIVE';

  let statusColor = theme.colors.success.main;
  if (isUsed) statusColor = theme.colors.text.disabled;
  if (isCancelled || isExpired) statusColor = theme.colors.error.main;

  return (
    <Card 
      variant="default" 
      padding="none" 
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Left: Info */}
        <View style={styles.infoSection}>
          <View style={styles.header}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {ticket.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.ticketId}>#{ticket.id.split('-')[1]}</Text>
          </View>

          <Text style={styles.routeText}>
            {ticket.route?.origin || ticket.trip?.route?.origin || ticket.boardingStop?.stopName || 'N/A'} <Ionicons name="arrow-forward" size={14} /> {ticket.route?.destination || ticket.trip?.route?.destination || ticket.dropStop?.stopName || 'N/A'}
          </Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{format(departureDate, 'MMM d')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{format(departureDate, 'HH:mm')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Seat</Text>
              <Text style={styles.detailValue}>{ticket.seatNumber}</Text>
            </View>
          </View>
        </View>

        {/* Right: QR Code Visual (active only) */}
        <View style={styles.qrSection}>
           <View style={[styles.qrContainer, !isActive && styles.qrDisabled]}>
              {isActive ? (
                <QRCode value={ticket.qrCodeData} size={60} />
              ) : (
                <Ionicons 
                  name={isCancelled ? "close-circle" : "checkmark-circle"} 
                  size={48} 
                  color={theme.colors.text.disabled} 
                />
              )}
           </View>
        </View>

        {/* Decorative Circles for Ticket Cutout Effect */}
        <View style={[styles.circle, styles.circleTop]} />
        <View style={[styles.circle, styles.circleBottom]} />
      </View>
    </Card>
  );
};

const createStyles = (theme: typeof staticTheme, isDark: boolean) => StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: theme.spacing.md,
  },
  infoSection: {
    flex: 1,
    paddingRight: theme.spacing.md,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.main,
    borderStyle: 'dashed',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
  },
  ticketId: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  routeText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  qrSection: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: theme.spacing.sm,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 4,
    borderRadius: theme.borderRadius.sm,
  },
  qrDisabled: {
    backgroundColor: theme.colors.background.tertiary,
    opacity: 0.5,
  },
  circle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.background.primary, // Matches screen background
    right: 86, // Positioned over the dashed line
  },
  circleTop: {
    top: -10,
  },
  circleBottom: {
    bottom: -10,
  },
});
