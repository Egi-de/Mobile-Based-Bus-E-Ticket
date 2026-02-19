import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Animated,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../config/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}


export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { theme, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...styles[`size_${size}`],
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return { ...baseStyle, ...styles.primary };
      case 'secondary':
        return { ...baseStyle, ...styles.secondary };
      case 'outline':
        return { ...baseStyle, ...styles.outline };
      case 'ghost':
        return { ...baseStyle, ...styles.ghost };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...styles.text,
      ...styles[`text_${size}`],
    };

    switch (variant) {
      case 'primary':
        return { ...baseTextStyle, ...styles.text_primary };
      case 'secondary':
        return { ...baseTextStyle, ...styles.text_secondary };
      case 'outline':
        return { ...baseTextStyle, ...styles.text_outline };
      case 'ghost':
        return { ...baseTextStyle, ...styles.text_ghost };
      default:
        return baseTextStyle;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          getButtonStyle(),
          disabled && styles.disabled,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? theme.colors.text.inverse : theme.colors.gold[500]}
            size="small"
          />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  size_sm: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    minHeight: 36,
  },
  
  size_md: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 48,
  },
  
  size_lg: {
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
  },

  primary: {
    backgroundColor: theme.colors.gold[500], // Gold
  },
  
  secondary: {
    backgroundColor: theme.colors.emerald[500], // Emerald
  },
  
  outline: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 2,
    borderColor: theme.colors.primary[500], // Primary Blue
  },
  
  ghost: {
    backgroundColor: theme.colors.transparent,
  },

  disabled: {
    opacity: 0.5,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconLeft: {
    marginRight: theme.spacing.sm,
  },

  iconRight: {
    marginLeft: theme.spacing.sm,
  },

  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.semibold,
  },
  
  text_sm: {
    fontSize: theme.typography.fontSize.sm,
  },
  
  text_md: {
    fontSize: theme.typography.fontSize.base,
  },
  
  text_lg: {
    fontSize: theme.typography.fontSize.lg,
  },

  text_primary: {
    // Gold background -> Dark text
    color: theme.colors.text.inverse,
  },
  
  text_secondary: {
    // Emerald background -> White text
    color: theme.colors.white,
  },
  
  text_outline: {
    // Use primary text color for better visibility in both light and dark modes
    color: theme.colors.text.primary,
  },
  
  text_ghost: {
    color: theme.colors.gold[500],
  },
});
