import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { Button } from "../../components/ui/Button";
import { useAuthStore } from "../../stores/auth.store";
import { authService } from "../../services/api/auth.service";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture || "",
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera roll permissions to make this work!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Prepare update data
      const updateData: any = {};

      // If there's a new image, upload it to Cloudinary first
      if (imageUri) {
        try {
          const {
            imageUploadService,
          } = require("../../services/storage/image-upload.service");
          console.log("📤 Uploading new profile picture...");

          const cloudinaryUrl = await imageUploadService.uploadImage(
            imageUri,
            user?.id || "unknown",
            "profile",
          );

          console.log("✅ Image uploaded to Cloudinary:", cloudinaryUrl);
          // Server expects `profilePictureUrl` — not `profilePicture`
          updateData.profilePictureUrl = cloudinaryUrl;
        } catch (uploadError: any) {
          console.error("❌ Image upload failed:", uploadError);
          Alert.alert(
            "Upload Error",
            "Failed to upload profile picture. Please try again.",
          );
          return;
        }
      }

      // Add other fields if changed
      if (name !== user?.name) updateData.name = name;
      if (phone !== user?.phone) updateData.phone = phone;

      // If nothing changed, just go back
      if (Object.keys(updateData).length === 0) {
        router.back();
        return;
      }

      // Update profile with JSON data
      const updatedUser = await authService.updateProfile(updateData);

      if (!updatedUser) {
        throw new Error("No response from server. Please try again.");
      }

      // Update local state with cache-busted URL if profile picture changed
      if (updateData.profilePictureUrl) {
        // Add cache-busting parameter to force image reload
        const cacheBustedUrl = `${updateData.profilePictureUrl}?t=${Date.now()}`;
        updatedUser.profilePicture = cacheBustedUrl;
        setProfilePicture(cacheBustedUrl);
      }

      setUser(updatedUser);

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayImage = imageUri || profilePicture;

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Profile Picture */}
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {displayImage ? (
                <Image
                  source={{ uri: displayImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={50}
                  color={theme.colors.text.inverse}
                />
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color={theme.colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.text.tertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.email || ""}
                editable={false}
                placeholderTextColor={theme.colors.text.tertiary}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title={isLoading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={isLoading}
              fullWidth
              style={styles.saveButton}
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              fullWidth
              disabled={isLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.main,
    },

    backButton: {
      padding: theme.spacing.xs,
    },

    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },

    placeholder: {
      width: 40,
    },

    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.base,
      paddingTop: theme.spacing.xl,
    },

    avatarContainer: {
      alignSelf: "center",
      position: "relative",
      marginBottom: theme.spacing.xs,
    },

    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
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
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: theme.colors.background.primary,
    },

    changePhotoText: {
      textAlign: "center",
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.xl,
    },

    form: {
      marginBottom: theme.spacing.xl,
    },

    inputGroup: {
      marginBottom: theme.spacing.base,
    },

    label: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },

    input: {
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.base,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      borderWidth: 1,
      borderColor: theme.colors.border.main,
    },

    disabledInput: {
      opacity: 0.6,
      backgroundColor: theme.colors.background.secondary,
    },

    helperText: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      marginTop: theme.spacing.xs,
    },

    actions: {
      gap: theme.spacing.sm,
    },

    saveButton: {
      marginBottom: theme.spacing.sm,
    },
  });
