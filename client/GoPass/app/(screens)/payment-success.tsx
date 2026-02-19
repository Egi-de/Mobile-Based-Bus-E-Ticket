import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Theme } from '../../config/theme';
import { useTheme } from '../../hooks/useTheme';

export default function PaymentSuccessScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { amount, seats, destination } = useLocalSearchParams();

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color={theme.colors.success.main} />
        </View>
        
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your booking to {destination} is confirmed.</Text>
        
        <View style={styles.detailCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.value}>{Number(amount).toLocaleString()} RWF</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Seats</Text>
            <Text style={styles.value}>{seats}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Ticket ID</Text>
            <Text style={styles.value}>TKT-{Math.floor(Math.random() * 1000000)}</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Button 
            title="View Ticket" 
            onPress={() => {
              // Reset to tickets tab eventually
              router.navigate('/(tabs)/tickets');
            }} 
            variant="primary"
            fullWidth
            style={styles.button}
          />
          <Button 
            title="Back to Home" 
            onPress={() => router.navigate('/(tabs)')} 
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  detailCard: {
    width: '100%',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing['3xl'],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  value: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.main,
    marginVertical: theme.spacing.lg,
  },
  actionContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  button: {
    marginBottom: theme.spacing.md,
  },
});
