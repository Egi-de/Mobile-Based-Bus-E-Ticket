import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { theme, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start(() => {
        router.replace('/(auth)/login');
      });
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  const gradientColors = (isDark 
    ? [theme.colors.background.primary, theme.colors.background.secondary, theme.colors.background.tertiary]
    : [theme.colors.primary[400], theme.colors.primary[500], theme.colors.primary[600]]) as [string, string, ...string[]];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <SafeAreaView style={styles.container}>
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity, 
              transform: [{ scale }] 
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.logo, { color: theme.colors.white }]}>GoPass</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
  },
});
