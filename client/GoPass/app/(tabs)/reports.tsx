import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { BookingService, Booking } from '../../services/booking.service';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await BookingService.getMyBookings();
        setBookings(data);
      } catch (err: any) {
        setError('Unable to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const validBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== 'CANCELLED'),
    [bookings]
  );

  const totalTrips = validBookings.length;
  const totalAmount = useMemo(
    () => validBookings.reduce((total, booking) => total + (booking.totalAmount ?? 0), 0),
    [validBookings]
  );

  const formattedAmount = totalAmount.toLocaleString('en-US');
  const summaryLabel = user?.role === 'DRIVER' ? 'Driver Analytics' : 'Travel History & Spending';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}> 
      <View style={[styles.header, { backgroundColor: theme.colors.background.card }]}> 
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Your Reports</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}> 
          {summaryLabel}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <Text
          onPress={() => setActiveTab('summary')}
          style={[
            styles.tab,
            activeTab === 'summary'
              ? { color: theme.colors.accent.main, borderBottomColor: theme.colors.accent.main }
              : { color: theme.colors.text.tertiary },
          ]}
        >
          Summary
        </Text>
        <Text
          onPress={() => setActiveTab('history')}
          style={[
            styles.tab,
            activeTab === 'history'
              ? { color: theme.colors.accent.main, borderBottomColor: theme.colors.accent.main }
              : { color: theme.colors.text.tertiary },
          ]}
        >
          History
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'summary' ? (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}> 
              <Ionicons name="bus" size={24} color={theme.colors.accent.main} />
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{totalTrips}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total Trips</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.background.secondary }]}> 
              <Ionicons name="wallet" size={24} color={theme.colors.success.main} />
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{formattedAmount}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total RWF</Text>
            </View>
          </View>
        ) : (
          <View style={styles.historyContent}>
            {loading ? (
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>Loading history...</Text>
            ) : error ? (
              <Text style={[styles.emptyText, { color: theme.colors.error.main }]}>{error}</Text>
            ) : validBookings.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.background.card }]}> 
                <Ionicons name="document-text" size={48} color={theme.colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No history available yet.</Text>
              </View>
            ) : (
              validBookings.map((booking) => (
                <View key={booking.id} style={[styles.historyItem, { backgroundColor: theme.colors.background.card }]}> 
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyRoute, { color: theme.colors.text.primary }]}> 
                      {booking.route?.origin ?? 'Unknown'} → {booking.route?.destination ?? 'Unknown'}
                    </Text>
                    <Text style={[styles.historyStatus, { color: booking.status === 'USED' ? theme.colors.success.main : theme.colors.text.secondary }]}> 
                      {booking.status}
                    </Text>
                  </View>
                  <Text style={[styles.historyDetail, { color: theme.colors.text.secondary }]}> 
                    {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString() : 'No date'}
                  </Text>
                  <View style={styles.historyFooter}>
                    <Text style={[styles.historyAmount, { color: theme.colors.text.primary }]}>RWF {booking.totalAmount.toLocaleString('en-US')}</Text>
                    <Text style={[styles.historyRoute, { color: theme.colors.text.tertiary }]}>Seats: {booking.seats.length}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 60, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 10 },
  tab: { marginRight: 24, paddingVertical: 10, fontSize: 16, fontWeight: '600', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { width: '48%', padding: 20, borderRadius: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  statLabel: { fontSize: 14, marginTop: 4 },
  emptyState: { padding: 40, alignItems: 'center', borderRadius: 16 },
  emptyText: { marginTop: 16, fontSize: 16, textAlign: 'center' },
  historyContent: { flexGrow: 1 },
  historyItem: { padding: 18, borderRadius: 16, marginBottom: 16 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  historyRoute: { fontSize: 16, fontWeight: '600' },
  historyDetail: { fontSize: 14 },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  historyAmount: { fontSize: 16, fontWeight: '700' },
  historyStatus: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});
