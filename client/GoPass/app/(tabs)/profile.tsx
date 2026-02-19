import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { imageUploadService } from "../../services/storage/image-upload.service";
import { RefreshableScrollView } from "../../components/ui/RefreshableScrollView";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../stores/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";

export default function ProfileScreen() {
  const { user, logout, login } = useAuthStore(); // login needed to update user state after upload
  const { theme, toggleTheme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [uploading, setUploading] = React.useState(false);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera roll permissions to make this work!",
      );
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    try {
      if (!user?.id) {
        Alert.alert("Error", "User not found");
        return;
      }

      setUploading(true);

      // 1. Upload to Cloudinary
      const downloadURL = await imageUploadService.uploadImage(
        uri,
        user.id,
        "profile",
      );

      console.log("✅ Image uploaded to Cloudinary:", downloadURL);

      // 2. Update user profile on backend with the URL
      const { apiClient } = require("../../services/api/client");
      const response = await apiClient.patch("/auth/profile", {
        profilePicture: downloadURL,
      });

      // 3. Update local state with cache-busted URL
      const cachedUrl = `${downloadURL}?t=${Date.now()}`;
      // Safely extract user from response (handles different API response shapes)
      const responseData =
        response?.data?.data || response?.data?.user || response?.data || null;
      // Merge with current user so we never set on undefined
      const currentUser = useAuthStore.getState().user;
      const updatedUser = {
        ...(currentUser as object),
        ...(responseData && typeof responseData === "object"
          ? responseData
          : {}),
        profilePicture: cachedUrl,
      };
      useAuthStore.getState().setUser(updatedUser as typeof currentUser);

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", "Failed to upload image. Please try again.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  };

  const onRefresh = async () => {
    // Simulate data refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <ScreenWrapper>
      <RefreshableScrollView
        contentContainerStyle={styles.scrollContent}
        onRefresh={onRefresh}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info Card */}
        <Card variant="elevated" padding="lg" style={styles.userCard}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {user?.profilePicture ? (
                <Image
                  source={{ uri: user.profilePicture }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={40}
                  color={theme.colors.text.inverse}
                />
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={theme.colors.white} />
                </View>
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color={theme.colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userEmail}>
            {user?.email || "guest@example.com"}
          </Text>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {/* Theme Toggle */}
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={isDark ? "moon-outline" : "sunny-outline"}
                size={24}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.menuItemTitle}>Appearance</Text>
            </View>
            <View style={styles.themeToggleContainer}>
              <Text style={styles.themeValue}>{isDark ? "Dark" : "Light"}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.colors.border.main,
                  true: theme.colors.primary[500],
                }}
                thumbColor={
                  isDark ? theme.colors.background.primary : theme.colors.white
                }
              />
            </View>
          </View>

          <MenuItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push("/(modals)/edit-profile")}
            theme={theme}
            styles={styles}
          />
          <MenuItem
            icon="card-outline"
            title="Payment Methods"
            onPress={() => {}}
            theme={theme}
            styles={styles}
          />
          <MenuItem
            icon="time-outline"
            title="Booking History"
            onPress={() => {}}
            theme={theme}
            styles={styles}
          />
          <MenuItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() => {}}
            theme={theme}
            styles={styles}
          />
          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => {}}
            theme={theme}
            styles={styles}
          />
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => {}}
            theme={theme}
            styles={styles}
          />
        </View>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          fullWidth
          style={styles.logoutButton}
        />

        <Text style={styles.version}>Version 1.0.0</Text>
      </RefreshableScrollView>
    </ScreenWrapper>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  theme: Theme;
  styles: any;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  onPress,
  theme,
  styles,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <Ionicons name={icon} size={24} color={theme.colors.text.secondary} />
      <Text style={styles.menuItemTitle}>{title}</Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={20}
      color={theme.colors.text.tertiary}
    />
  </TouchableOpacity>
);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: theme.spacing.base,
      paddingBottom: 100, // Extra padding for bottom tab
    },

    header: {
      paddingVertical: theme.spacing.lg,
    },

    title: {
      fontSize: theme.typography.fontSize["2xl"],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },

    userCard: {
      alignItems: "center",
      marginBottom: theme.spacing.xl,
      backgroundColor: theme.colors.background.card,
    },

    avatarContainer: {
      position: "relative",
      marginBottom: theme.spacing.base,
    },

    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.colors.primary[500],
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },

    avatarImage: {
      width: "100%",
      height: "100%",
    },

    cameraIcon: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary[600],
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.colors.background.card,
    },

    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.black,
      opacity: 0.5,
      alignItems: "center",
      justifyContent: "center",
    },

    userName: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },

    userEmail: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },

    menuSection: {
      marginBottom: theme.spacing.xl,
    },

    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.background.card,
      padding: theme.spacing.base,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.sm,
    },

    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    menuItemTitle: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      marginLeft: theme.spacing.base,
      fontWeight: theme.typography.fontWeight.medium,
    },

    themeToggleContainer: {
      flexDirection: "row",
      alignItems: "center",
    },

    themeValue: {
      marginRight: theme.spacing.sm,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.fontSize.sm,
    },

    logoutButton: {
      marginBottom: theme.spacing.base,
    },

    version: {
      textAlign: "center",
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.base,
    },
  });
