import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Seat, SeatStatus } from '../../types/booking.types';

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ seats, selectedSeats, onSeatSelect }) => {
  const { theme, isDark } = useTheme();
  
  const renderSeat = (seat: Seat) => {
    const isSelected = selectedSeats.includes(seat.id);
    const isBooked = seat.status === 'booked';
    const isAvailable = seat.status === 'available';

    // Theme-aware seat colors
    let backgroundColor: string = isDark ? '#2E3355' : '#D1D5DB'; // visible in both modes
    let borderColor: string = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
    let iconColor: string = isDark ? '#E5E7EB' : '#374151';

    if (isBooked) {
      backgroundColor = isDark ? '#1A1D2E' : '#F3F4F6';
      borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      iconColor = isDark ? '#4B5563' : '#9CA3AF';
    } else if (isSelected) {
      backgroundColor = theme.colors.primary[500];
      borderColor = theme.colors.primary[400];
      iconColor = '#FFFFFF';
    } else if (isAvailable) {
      if (seat.type === 'vip') {
        backgroundColor = isDark ? '#2A2410' : '#FEF3C7';
        borderColor = theme.colors.accent.main;
        iconColor = theme.colors.accent.main;
      }
    }

    return (
      <TouchableOpacity
        key={seat.id}
        style={[styles(theme).seat, { backgroundColor, borderColor }]}
        onPress={() => onSeatSelect(seat.id)}
        disabled={isBooked}
        activeOpacity={0.7}
      >
        <Ionicons name="tablet-landscape-outline" size={20} color={iconColor} style={{ transform: [{ rotate: '-90deg' }] }} />
        <Text style={[
          styles(theme).seatLabel, 
          isSelected ? styles(theme).seatLabelSelected : null,
          isBooked ? styles(theme).seatLabelDisabled : null
        ]}>
          {seat.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Group seats by rows
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  const rowNumbers = Object.keys(rows).map(Number).sort((a, b) => a - b);

  return (
    <View style={styles(theme).container}>
      {/* Driver Area */}
      <View style={styles(theme).driverArea}>
        <View style={styles(theme).steeringWheel}>
          <Ionicons name="radio-button-off" size={24} color={theme.colors.text.disabled} />
        </View>
        <Text style={styles(theme).driverText}>Driver</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles(theme).grid}
        showsVerticalScrollIndicator={false}
      >
        {rowNumbers.map((rowNum) => (
          <View key={rowNum} style={styles(theme).row}>
            {/* Left Side (A, B) */}
            <View style={styles(theme).seatGroup}>
              {rows[rowNum].filter(s => s.col <= 1).map(renderSeat)}
            </View>

            {/* Aisle */}
            <View style={styles(theme).aisle}>
              <Text style={styles(theme).aisleText}>{rowNum}</Text>
            </View>

            {/* Right Side (C, D) */}
            <View style={styles(theme).seatGroup}>
              {rows[rowNum].filter(s => s.col > 1).map(renderSeat)}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles(theme).legend}>
        <View style={styles(theme).legendItem}>
          <View style={[styles(theme).legendIndicator, { borderColor: theme.colors.border.light, borderWidth: 1 }]} />
          <Text style={styles(theme).legendText}>Available</Text>
        </View>
        <View style={styles(theme).legendItem}>
          <View style={[styles(theme).legendIndicator, { backgroundColor: theme.colors.primary[500] }]} />
          <Text style={styles(theme).legendText}>Selected</Text>
        </View>
        <View style={styles(theme).legendItem}>
          <View style={[styles(theme).legendIndicator, { backgroundColor: theme.colors.background.tertiary }]} />
          <Text style={styles(theme).legendText}>Booked</Text>
        </View>
        <View style={styles(theme).legendItem}>
          <View style={[styles(theme).legendIndicator, { borderColor: theme.colors.accent.main, borderWidth: 1 }]} />
          <Text style={styles(theme).legendText}>VIP</Text>
        </View>
      </View>
    </View>
  );
};


const styles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  driverArea: {
    alignItems: 'flex-end',
    paddingRight: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.main,
    paddingBottom: theme.spacing.sm,
  },
  steeringWheel: {
    marginRight: 4,
  },
  driverText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.disabled,
  },
  grid: {
    paddingBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seatGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  aisle: {
    width: 30,
    alignItems: 'center',
  },
  aisleText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.disabled,
  },
  seat: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatLabel: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  seatLabelSelected: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.bold,
  },
  seatLabelDisabled: {
    color: theme.colors.text.disabled,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.main,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
});
