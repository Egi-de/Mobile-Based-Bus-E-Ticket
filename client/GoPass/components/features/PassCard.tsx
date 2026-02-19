import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../config/theme';
import { Pass } from '../../types/pass.types';

interface PassCardProps {
  pass: Pass;
  onPress: () => void;
}

export const PassCard: React.FC<PassCardProps> = ({ pass, onPress }) => {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);
  
  const expiryDate = new Date(pass.expiryDate);
  const daysLeft = differenceInDays(expiryDate, new Date());
  
  const isExpiringSoon = daysLeft <= 5;

  return (
    <Card 
      variant="default" 
      padding="none" 
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.passName}>{pass.name}</Text>
          <Text style={styles.expiryLabel}>Expires {format(expiryDate, 'MMM d, yyyy')}</Text>
        </View>
        <Ionicons name="card-outline" size={24} color={theme.colors.white} style={{ opacity: 0.8 }} />
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <View>
             <Text style={styles.label}>Holder</Text>
             <Text style={styles.value}>{pass.user?.name || 'N/A'}</Text>
          </View>
          <View>
             <Text style={styles.label}>Status</Text>
             <View style={styles.statusBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.statusText}>ACTIVE</Text>
             </View>
          </View>
        </View>

        <View style={styles.footer}>
           <Text style={styles.idLabel}>ID: {pass.id}</Text>
           <Text style={[styles.daysLeft, isExpiringSoon && styles.daysLeftWarning]}>
              {daysLeft} days left
           </Text>
        </View>
      </View>
    </Card>
  );
};

const createStyles = (theme: typeof staticTheme, isDark: boolean) => {
  // Theme-aware header color: lime for dark mode, blue for light mode
  const headerColor = isDark ? theme.colors.accent.main : theme.colors.primary[600];
  const daysLeftColor = isDark ? theme.colors.accent.main : theme.colors.primary[500];
  
  return StyleSheet.create({
    card: {
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.background.card,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    cardHeader: {
      backgroundColor: headerColor,
      padding: theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    passName: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: isDark ? theme.colors.text.inverse : theme.colors.white,
      marginBottom: 4,
    },
    expiryLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: isDark ? theme.colors.text.inverse : theme.colors.white,
      opacity: 0.8,
    },
    cardBody: {
      padding: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
      marginBottom: 2,
    },
    value: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.success.main,
      marginRight: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.success.main,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
      paddingTop: theme.spacing.sm,
    },
    idLabel: {
      fontSize: 10,
      color: theme.colors.text.tertiary,
    },
    daysLeft: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: daysLeftColor,
    },
    daysLeftWarning: {
      color: theme.colors.warning.main,
    },
  });
};
