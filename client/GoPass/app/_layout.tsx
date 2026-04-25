import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import "react-native-reanimated";
import { useAuthStore } from "../stores/auth.store";
import { theme } from "../config/theme";
import { useTheme } from "../hooks/useTheme";
import { fcmService } from "../services/notifications/fcm.service";
import { Toast } from "../components/ui/Toast";
import * as Notifications from "expo-notifications";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { isAuthenticated, loadStoredAuth, user } = useAuthStore();
  const { theme } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadStoredAuth();

    // Configure notification channels
    fcmService.configureChannels();
  }, []);

  // Handle notifications when app is in foreground
  useEffect(() => {
    const subscription = fcmService.onNotificationReceived((notification) => {
      console.log("📬 Notification received:", notification);
      // Notification will be shown automatically
    });

    return () => subscription.remove();
  }, []);

  // Handle notification taps
  useEffect(() => {
    const subscription = fcmService.onNotificationTapped((response) => {
      console.log("👆 Notification tapped:", response);
      const data = response.notification.request.content.data as {
        busId: string;
        routeId: string;
        type: string;
      };

      // Handle different notification types
      if (data.type === "BUS_DEPARTED" || data.type === "BUS_ARRIVING") {
        // Navigate to bus tracking screen
        router.push({
          pathname: "/(screens)/bus-tracking",
          params: {
            busId: data.busId,
            routeId: data.routeId,
          },
        });
      }
    });

    return () => subscription.remove();
  }, []);

  // Register FCM token when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fcmService.registerToken(user.id).catch((error) => {
        console.error("Failed to register FCM token:", error);
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const inAuthGroup = segments[0] === "(auth)";

      if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)/welcome");
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect based on role
        if (user?.role === "DRIVER") {
          router.replace("/(screens)/driver-tracking");
        } else {
          router.replace("/(tabs)");
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, segments, user]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.background.primary }]}>
      <Slot />
      <Toast />
    </View>
  );
}
