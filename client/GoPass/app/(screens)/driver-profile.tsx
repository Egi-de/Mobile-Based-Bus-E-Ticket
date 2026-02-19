import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { Card } from "../../components/ui/Card";
import { useAuthStore } from "../../stores/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";

export default function DriverProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [highAccuracyGPS, setHighAccuracyGPS] = useState(true);
  const [vibrateOnScan, setVibrateOnScan] = useState(true);
  const [autoStopReminder, setAutoStopReminder] = useState(true);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR";

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* ── Avatar + Info Card ─────────────────────────────────────────── */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Ionicons name="bus" size={10} color="#FFF" />
              <Text style={styles.roleBadgeText}>DRIVER</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || "Driver"}</Text>
          <Text style={styles.userEmail}>{user?.email || "—"}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: "#4CAF50" }]}>
                Active
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="star" size={16} color="#FFC107" />
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>Driver</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons
                name="id-card"
                size={16}
                color={theme.colors.primary[500]}
              />
              <Text style={styles.infoLabel}>ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.id?.slice(0, 6) ?? "—"}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={styles.sectionCard}>
          <PrefRow
            icon={isDark ? "moon" : "sunny"}
            iconColor={isDark ? "#7C3AED" : "#F59E0B"}
            label="Dark Mode"
            sublabel={isDark ? "Dark theme active" : "Light theme active"}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: theme.colors.border.main,
                  true: theme.colors.primary[500],
                }}
                thumbColor={isDark ? "#FFF" : "#FFF"}
              />
            }
            theme={theme}
          />
        </Card>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.sectionCard}>
          <PrefRow
            icon="notifications"
            iconColor="#4CAF50"
            label="Push Notifications"
            sublabel="Route updates and alerts"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: theme.colors.border.main,
                  true: theme.colors.primary[500],
                }}
                thumbColor="#FFF"
              />
            }
            theme={theme}
          />
          <View style={styles.rowDivider} />
          <PrefRow
            icon="timer"
            iconColor="#FF9800"
            label="End-of-Route Reminder"
            sublabel="Remind to stop tracking"
            right={
              <Switch
                value={autoStopReminder}
                onValueChange={setAutoStopReminder}
                trackColor={{
                  false: theme.colors.border.main,
                  true: theme.colors.primary[500],
                }}
                thumbColor="#FFF"
              />
            }
            theme={theme}
          />
        </Card>

        {/* ── GPS & Scanning ────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>GPS & Scanning</Text>
        <Card style={styles.sectionCard}>
          <PrefRow
            icon="locate"
            iconColor="#2196F3"
            label="High Accuracy GPS"
            sublabel="Better location, uses more battery"
            right={
              <Switch
                value={highAccuracyGPS}
                onValueChange={setHighAccuracyGPS}
                trackColor={{
                  false: theme.colors.border.main,
                  true: theme.colors.primary[500],
                }}
                thumbColor="#FFF"
              />
            }
            theme={theme}
          />
          <View style={styles.rowDivider} />
          <PrefRow
            icon="phone-portrait"
            iconColor="#9C27B0"
            label="Vibrate on Scan"
            sublabel="Haptic feedback when scanning tickets"
            right={
              <Switch
                value={vibrateOnScan}
                onValueChange={setVibrateOnScan}
                trackColor={{
                  false: theme.colors.border.main,
                  true: theme.colors.primary[500],
                }}
                thumbColor="#FFF"
              />
            }
            theme={theme}
          />
        </Card>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Card style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push("/(screens)/driver-scanner")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#1E3A5F" }]}>
              <Ionicons name="qr-code" size={18} color="#FFF" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Open Scanner</Text>
              <Text style={styles.actionSublabel}>
                Scan passenger QR tickets
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.back()}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#4CAF50" }]}>
              <Ionicons name="map" size={18} color="#FFF" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Tracking Dashboard</Text>
              <Text style={styles.actionSublabel}>
                View map & route progress
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        </Card>

        {/* ── App Info ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>About</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Version</Text>
            <Text style={styles.aboutValue}>GoPass Driver 1.0.0</Text>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Platform</Text>
            <Text style={styles.aboutValue}>GoPass Rwanda</Text>
          </View>
        </Card>

        {/* ── Logout ───────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#F44336" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>GoPass Driver © 2026</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

// ── PrefRow helper ─────────────────────────────────────────────────────────
function PrefRow({
  icon,
  iconColor,
  label,
  sublabel,
  right,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  sublabel: string;
  right: React.ReactNode;
  theme: Theme;
}) {
  return (
    <View style={prStyles.row}>
      <View style={[prStyles.iconBox, { backgroundColor: iconColor + "20" }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={prStyles.info}>
        <Text style={[prStyles.label, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
        <Text
          style={[prStyles.sublabel, { color: theme.colors.text.tertiary }]}
        >
          {sublabel}
        </Text>
      </View>
      {right}
    </View>
  );
}

const prStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: "600" },
  sublabel: { fontSize: 12, marginTop: 1 },
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 12,
      paddingBottom: 8,
    },
    iconBtn: { padding: 8 },
    headerTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: theme.colors.text.primary,
    },

    // Profile card
    profileCard: {
      alignItems: "center",
      padding: 20,
      marginBottom: 16,
      backgroundColor: theme.colors.background.card,
    },
    avatarWrap: {
      position: "relative",
      marginBottom: 12,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary[600] || theme.colors.primary[500],
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#FFF",
    },
    roleBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "#4CAF50",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    roleBadgeText: {
      color: "#FFF",
      fontSize: 9,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
    userName: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 13,
      color: theme.colors.text.secondary,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: "row",
      width: "100%",
      borderTopWidth: 1,
      borderTopColor: theme.colors.border.light,
      paddingTop: 12,
    },
    infoItem: {
      flex: 1,
      alignItems: "center",
      gap: 4,
    },
    infoDivider: {
      width: 1,
      backgroundColor: theme.colors.border.light,
      marginHorizontal: 8,
    },
    infoLabel: {
      fontSize: 11,
      color: theme.colors.text.tertiary,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },

    // Sections
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.colors.text.tertiary,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 6,
      marginTop: 4,
    },
    sectionCard: {
      padding: 14,
      marginBottom: 12,
      backgroundColor: theme.colors.background.card,
    },
    rowDivider: {
      height: 1,
      backgroundColor: theme.colors.border.light,
      marginVertical: 8,
    },

    // Actions
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6,
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    actionInfo: { flex: 1 },
    actionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    actionSublabel: {
      fontSize: 12,
      color: theme.colors.text.tertiary,
      marginTop: 1,
    },

    // About
    aboutRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    aboutLabel: {
      fontSize: 13,
      color: theme.colors.text.secondary,
    },
    aboutValue: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },

    // Logout
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
      marginBottom: 12,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#F44336",
    },
    logoutBtnText: {
      color: "#F44336",
      fontWeight: "bold",
      fontSize: 15,
    },

    version: {
      textAlign: "center",
      fontSize: 11,
      color: theme.colors.text.tertiary,
      marginBottom: 8,
    },
  });
