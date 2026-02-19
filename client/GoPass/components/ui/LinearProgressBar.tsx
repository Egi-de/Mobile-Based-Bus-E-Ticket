import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../config/theme';

interface LinearProgressBarProps {
  refreshing: boolean;
  progressAnim: Animated.Value;
}

export const LinearProgressBar: React.FC<LinearProgressBarProps> = ({ refreshing, progressAnim }) => {
  const { theme } = useTheme();

  if (!refreshing) return null;

  return (
    <View style={styles.progressContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: theme.colors.accent.main, // Use accent color (Yellow) instead of White
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6, // Slightly taller for visibility? 4 is standard. 6 is fine.
    backgroundColor: 'transparent',
    zIndex: 9999,
    elevation: 10,
  },
  progressBar: {
    height: '100%',
    // backgroundColor set inline dynamic
  },
});
