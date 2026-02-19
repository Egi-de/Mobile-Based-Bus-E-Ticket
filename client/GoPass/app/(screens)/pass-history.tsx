import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { PassCard } from '../../components/features/PassCard';
import { Theme } from '../../config/theme';
import { useTheme } from '../../hooks/useTheme';
import { Pass } from '../../types/pass.types';
import { PassService } from '../../services/pass.service';
// import { getUserPasses } from '../../services/mock/passes.mock'; // Removed mock
import { LinearProgressBar } from '../../components/ui/LinearProgressBar';
import { useLinearRefresh } from '../../hooks/useLinearRefresh';

export default function PassHistoryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [historyPasses, setHistoryPasses] = useState<Pass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await PassService.getUserPasses('HISTORY');
      setHistoryPasses(data);
    } catch (error) {
      console.error('Failed to fetch pass history', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { refreshing, onRefresh, progressAnim } = useLinearRefresh(fetchHistory);

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Pass History</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={historyPasses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ opacity: 0.7 }}>
              <PassCard 
                pass={item} 
                onPress={() => {}} // No action for history items for now
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color={theme.colors.text.disabled} />
                <Text style={styles.emptyText}>No history available</Text>
              </View>
            ) : null
          }
        />
      </View>
      <LinearProgressBar refreshing={refreshing} progressAnim={progressAnim} />
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing['4xl'],
    paddingTop: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.disabled,
    fontSize: theme.typography.fontSize.base,
  },
});
