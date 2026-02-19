import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../config/theme';

interface SkeletonProps {
  /** Width - number or '100%' */
  width?: number | string;
  /** Height - number or '100%' */
  height?: number | string;
  /** Border radius */
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Skeleton placeholder with shimmer animation. Use instead of ActivityIndicator for image/content loading.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 100,
  borderRadius = 0,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const baseColor = theme.colors.border.light;
  const highlightColor = theme.colors.background.tertiary ?? theme.colors.border.main;

  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: highlightColor,
            borderRadius,
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    opacity: 0.6,
  },
});
