import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { Card } from '../../../components/ui/Card';
import { theme } from '../../../config/theme';
import { PassService } from '../../../services/pass.service';
import { Pass } from '../../../types/pass.types';
import { format, differenceInDays } from 'date-fns';

export default function PassDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [pass, setPass] = useState<Pass | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0.3))[0];

  useEffect(() => {
    fetchPassDetails();
  }, [id]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  const fetchPassDetails = async () => {
    try {
      // Fetch all passes (active and expired)
      const passes = await PassService.getUserPasses(); 
      let foundPass = passes.find(p => p.id === id);
      
      // If not found in active passes, check expired passes
      if (!foundPass) {
          const expiredPasses = await PassService.getUserPasses('EXPIRED');
          foundPass = expiredPasses.find(p => p.id === id);
      }

      if (foundPass) {
        setPass(foundPass);
      } else {
        Alert.alert('Error', 'Pass not found');
        router.back();
      }
    } catch (error) {
      console.log('Error fetching pass details:', error);
      Alert.alert('Error', 'Failed to load pass details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pass Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <Animated.View style={[styles.skeletonCard, { opacity: fadeAnim }]} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!pass) return null;

  const expiryDate = new Date(pass.expiryDate);
  const daysLeft = differenceInDays(expiryDate, new Date());
  const isExpired = daysLeft < 0;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pass Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.mainCard}>
          {/* Status Badge */}
          <View style={styles.statusContainer}>
             <View style={[
               styles.statusBadge, 
               isExpired ? styles.statusExpired : styles.statusActive
             ]}>
                <Text style={[
                  styles.statusText,
                  isExpired ? styles.textExpired : styles.textActive
                ]}>
                  {isExpired ? 'EXPIRED' : 'ACTIVE'}
                </Text>
             </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <QRCode
              value={pass.qrCode || pass.id}
              size={200}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
            <Text style={styles.qrLabel}>Scan to Validate</Text>
          </View>

          {/* Pass Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.passName}>{pass.name}</Text>
            
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Holder</Text>
                <Text style={styles.value}>{pass.user?.name || 'Unknown'}</Text>
              </View>
              <View>
                <Text style={styles.label}>Pass ID</Text>
                <Text style={styles.value}>{pass.id.slice(0, 8)}...</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Valid From</Text>
                <Text style={styles.value}>{format(new Date(pass.purchaseDate), 'MMM d, yyyy')}</Text>
              </View>
              <View>
                <Text style={styles.label}>Expires On</Text>
                <Text style={styles.value}>{format(expiryDate, 'MMM d, yyyy')}</Text>
              </View>
            </View>
            
            {!isExpired && (
                <View style={styles.daysLeftContainer}>
                    <Ionicons name="time-outline" size={16} color={theme.colors.primary[500]} />
                    <Text style={styles.daysLeftText}>{daysLeft} days remaining</Text>
                </View>
            )}

            <View style={styles.divider} />
            
             <View style={styles.priceRow}>
                <Text style={styles.label}>Price Paid</Text>
                <Text style={styles.priceValue}>{pass.price.toLocaleString()} RWF</Text>
              </View>

          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.xl,
  },
  mainCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  statusContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  statusExpired: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  textActive: {
    color: theme.colors.success.main,
  },
  textExpired: {
    color: theme.colors.error.main,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
    padding: theme.spacing.lg,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
  },
  qrLabel: {
    marginTop: theme.spacing.md,
    color: '#000',
    fontSize: theme.typography.fontSize.sm,
  },
  infoContainer: {
    width: '100%',
  },
  passName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  value: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.md,
  },
  daysLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    gap: 8,
  },
  daysLeftText: {
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.bold,
  },
  priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  priceValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.accent.main,
  },
  skeletonCard: {
    height: 500,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing.xl,
  }
});
