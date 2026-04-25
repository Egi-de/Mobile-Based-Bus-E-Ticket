import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// Animated Tab Icon Component
const AnimatedTabIcon = ({ name, color, focused }: { name: any; color: string; focused: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
};

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.gold[500], // Gold for active state
          tabBarInactiveTintColor: theme.colors.text.tertiary,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            paddingHorizontal: 40, 
          },

          tabBarBackground: () => (
            <View style={[styles.tabBarBackground, { 
              backgroundColor: theme.colors.background.card,
              borderTopColor: theme.colors.border.light,
            }]} />
          ),
          
          tabBarIconStyle: {
            marginTop: 5,
          },
          
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: 'Routes',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name="bus" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: 'Tickets',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name="ticket" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="passes"
          options={{
            title: 'Passes',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name="card" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon name="stats-chart" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 20, 
    right: 20,
    height: 70,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderTopWidth: 1,
  },
});