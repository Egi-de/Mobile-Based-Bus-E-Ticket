import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Marker = () => null;
export const Polyline = () => null;
export const PROVIDER_GOOGLE = null;

export default function MapView({ children, style }: any) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>🗺️ Map not available on web</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4f8',
  },
  text: { fontSize: 16, color: '#666' },
});