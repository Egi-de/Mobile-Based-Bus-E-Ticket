import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../config/theme';
import { useCardPress } from '../../hooks/useCardPress';

interface QuickActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  primary?: boolean; // Highlight style for primary actions
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, title, onPress, primary }) => {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(theme, primary, isDark), [theme, primary, isDark]);
  const { scaleAnim, handlePressIn, handlePressOut } = useCardPress(0.95);

  // Theme-aware colors
  const iconColor = primary 
    ? theme.colors.text.inverse // Dark text on gold
    : (isDark ? theme.colors.gold[500] : theme.colors.primary[500]);

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={icon} 
            size={28} 
            color={iconColor} 
          />
        </View>
        <Text style={styles.title}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (theme: Theme, primary: boolean | undefined, isDark: boolean) => {
  const cardBg = primary 
    ? theme.colors.gold[500] // Gold for primary actions
    : theme.colors.background.card;
  
  return StyleSheet.create({
    container: {
      backgroundColor: cardBg,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.base,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      flex: 1,
      aspectRatio: 1.4,
      
      // Clean flat design
      borderWidth: primary ? 0 : 1,
      borderColor: theme.colors.border.light,
    },
    iconContainer: {
      marginBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      fontFamily: theme.typography.fontFamily.semibold,
      color: primary 
        ? theme.colors.text.inverse
        : theme.colors.text.primary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
};
