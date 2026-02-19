import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, Animated, Pressable } from 'react-native';
import { theme } from '../../config/theme';
import { useTheme } from '../../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return { backgroundColor: theme.colors.background.card };
      case 'outlined':
        return {
          backgroundColor: theme.colors.transparent,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
        };
      case 'default':
      default:
        return { backgroundColor: theme.colors.background.card };
    }
  };

  const cardStyle = [
    { borderRadius: theme.borderRadius.xl },
    getVariantStyle(),
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  padding_none: {
    padding: 0,
  },
  
  padding_sm: {
    padding: 8,
  },
  
  padding_md: {
    padding: 16,
  },
  
  padding_lg: {
    padding: 24,
  },
});
