import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export const useLinearRefresh = (onRefreshLogic: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // Reset to 0 first
    progressAnim.setValue(0);
    
    // Start animation
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    });
    animationRef.current.start();

    try {
      await onRefreshLogic();
    } finally {
      // Stop the animation
      if (animationRef.current) {
        animationRef.current.stop();
      }
      
      // Small delay to ensure animation completes visually
      setTimeout(() => {
        progressAnim.setValue(0);
        setRefreshing(false);
      }, 100);
    }
  }, [onRefreshLogic, progressAnim]);

  return { refreshing, onRefresh, progressAnim };
};
