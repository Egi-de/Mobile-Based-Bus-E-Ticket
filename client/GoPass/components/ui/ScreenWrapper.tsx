import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { theme } from '../../config/theme';
import { useTheme } from '../../hooks/useTheme';

import { StatusBar } from 'expo-status-bar';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: SafeAreaViewProps['edges'];
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
  children, 
  style,
  edges = ['top']
}) => {
  const { isDark, theme } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView 
        style={[
          styles.container, 
          { backgroundColor: theme.colors.background.primary },
          style
        ]} 
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
