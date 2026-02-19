import { useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

export const useCardPress = (scaleTo = 0.96) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return {
    scaleAnim,
    handlePressIn,
    handlePressOut,
  };
};
