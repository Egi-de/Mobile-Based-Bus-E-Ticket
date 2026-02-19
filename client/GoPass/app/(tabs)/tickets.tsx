import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { TicketCard } from '../../components/features/TicketCard';
import { GradientBackground } from '../../components/ui/GradientBackground';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../config/theme';
import { Ticket, TicketStatus } from '../../types/ticket.types';
import { BookingService } from '../../services/booking.service';
import { useLinearRefresh } from '../../hooks/useLinearRefresh';
import { LinearProgressBar } from '../../components/ui/LinearProgressBar';
import { useToastStore, getErrorMessage } from '../../stores/toast.store';

type BookingStatusFilter = 'ACTIVE' | 'USED' | 'CANCELLED';
type FilterTabValue = BookingStatusFilter | 'all';

const FILTER_TABS: { label: string; value: FilterTabValue }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Used', value: 'USED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function TicketsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTabValue>('ACTIVE');

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const bookingStatus = activeTab === 'all' ? undefined : activeTab as BookingStatusFilter;
      const bookings = await BookingService.getMyBookings(bookingStatus);
      
      // Transform bookings to tickets format - ensure bookings is always an array
      const transformedTickets: Ticket[] = (Array.isArray(bookings) ? bookings : []).map((booking: any) => ({
        id: booking.id,
        bookingId: booking.id,
        tripId: booking.tripId || '',
        userId: booking.userId || '',
        seatNumber: Array.isArray(booking.seats) ? booking.seats.join(', ') : (booking.seats || ''),
        boardingStopId: booking.boardingStopId || '',
        dropStopId: booking.dropStopId || '',
        route: booking.route,
        price: booking.totalAmount,
        passenger: {
          name: booking.user?.name || 'Unknown',
          email: booking.user?.email || '',
          phone: booking.user?.phone || '',
        },
        status: (booking.status?.toUpperCase() || 'ACTIVE') as TicketStatus,
        purchaseDate: booking.bookingDate,
        qrCodeData: booking.qrCode || '',
      }));
      
      setTickets(transformedTickets);
    } catch (error: any) {
      console.error('Failed to fetch tickets', error);
      setTickets([]);
      if (error?.statusCode !== 401) {
        useToastStore.getState().error(getErrorMessage(error), 'Could not load tickets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const { refreshing, onRefresh, progressAnim } = useLinearRefresh(fetchTickets);

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const handleTicketPress = (ticket: Ticket) => {
    router.push(`/(screens)/ticket-details/${ticket.id}`);
  };

  return (
    <GradientBackground>
      <ScreenWrapper style={{ backgroundColor: 'transparent' }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>My Tickets</Text>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabsContainer}>
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <TouchableOpacity
                  key={tab.value}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.value as FilterTabValue)}
                >
                  <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tickets List */}
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TicketCard ticket={item} onPress={() => handleTicketPress(item)} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor="transparent"
                colors={['transparent']}
                style={{ backgroundColor: 'transparent' }}
                progressBackgroundColor="transparent"
                progressViewOffset={-100}
              />
            }
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyState}>
                  <Ionicons name="ticket-outline" size={64} color={theme.colors.text.disabled} />
                  <Text style={styles.emptyText}>No {activeTab !== 'all' ? activeTab.toLowerCase() : ''} tickets found</Text>
                  {activeTab === 'ACTIVE' && (
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => router.push('/(tabs)/routes')}
                    >
                      <Text style={styles.bookButtonText}>Book a Ticket</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null
            }
          />
        </View>
        <LinearProgressBar refreshing={refreshing} progressAnim={progressAnim} />
      </ScreenWrapper>
    </GradientBackground>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.main,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary, // Use primary (white in dark mode) for visibility
    fontWeight: theme.typography.fontWeight.medium,
  },
  tabTextActive: {
    color: '#FFFFFF', // White text on dark primary background
    fontWeight: theme.typography.fontWeight.semibold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 120, // Extra padding for tab bar + button
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.disabled,
    fontSize: theme.typography.fontSize.base,
  },
  bookButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.accent.main,
    borderRadius: theme.borderRadius.full,
  },
  bookButtonText: {
    color: theme.colors.text.inverse, // Dark text on yellow button
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.base,
  },
});
