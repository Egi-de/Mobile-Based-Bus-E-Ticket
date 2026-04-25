import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/auth.store';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background.card }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Your Reports</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
          {user?.role === 'DRIVER' ? 'Driver Analytics' : 'Travel History & Spending'}
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <Text 
          onPress={() => setActiveTab('summary')}
          style={[styles.tab, activeTab === 'summary' ? { color: theme.colors.primary, borderBottomColor: theme.colors.primary } : { color: theme.colors.text.tertiary }]}
        >
          Summary
        </Text>
        <Text 
          onPress={() => setActiveTab('history')}
          style={[styles.tab, activeTab === 'history' ? { color: theme.colors.primary, borderBottomColor: theme.colors.primary } : { color: theme.colors.text.tertiary }]}
        >
          History
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'summary' ? (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.background.card }]}>
              <Ionicons name="bus" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total Trips</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.background.card }]}>
              <Ionicons name="wallet" size={24} color={theme.colors.success || '#10B981'} />
              <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>45,000</Text>
              <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Total RWF</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.background.card }]}>
            <Ionicons name="document-text" size={48} color={theme.colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No history available yet.</Text>
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
  emptyText: { marginTop: 16, fontSize: 16 },
});
