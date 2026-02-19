import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore, ToastType } from '../../stores/toast.store';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../config/theme';

const icons: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  error: 'alert-circle',
  success: 'checkmark-circle',
  info: 'information-circle',
};

export function Toast() {
  const { visible, message, title, type, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = createStyles(theme, insets.top);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15 }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  const iconName = icons[type];
  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <Animated.View
      style={[
        styles.container,
        isError && styles.containerError,
        isSuccess && styles.containerSuccess,
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={hide}
        activeOpacity={1}
        accessibilityRole="alert"
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={iconName}
            size={22}
            color={isError ? theme.colors.error.dark : isSuccess ? theme.colors.success.dark : theme.colors.info.dark}
          />
        </View>
        <View style={styles.textWrap}>
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
          <Text style={styles.message} numberOfLines={3}>{message}</Text>
        </View>
        <TouchableOpacity onPress={hide} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (theme: typeof staticTheme, topInset: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: topInset + (Platform.OS === 'ios' ? 8 : 16),
      zIndex: 9999,
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.info.main,
      ...theme.shadows.lg,
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    containerError: {
      borderLeftColor: theme.colors.error.main,
    },
    containerSuccess: {
      borderLeftColor: theme.colors.success.main,
    },
    touchable: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    iconWrap: {
      marginRight: 12,
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    message: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    closeBtn: {
      padding: 4,
      marginLeft: 4,
    },
  });
