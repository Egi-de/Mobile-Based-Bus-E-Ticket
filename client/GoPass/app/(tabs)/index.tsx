import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { RefreshableScrollView } from "../../components/ui/RefreshableScrollView";
import { FadeInView } from "../../components/animations/FadeInView";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { ActiveTicketCard } from "../../components/home/ActiveTicketCard";
import { QuickActionCard } from "../../components/home/QuickActionCard";

import { useAuthStore } from "../../stores/auth.store";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";
import { BookingService, Booking } from "../../services/booking.service";
import { useToastStore } from "../../stores/toast.store";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [greeting, setGreeting] = useState("");
  const [activeTicket, setActiveTicket] = useState<Booking | null>(null);
  const [searchDestination, setSearchDestination] = useState("");

  // Notification badge pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const fetchActiveTicket = async () => {
    try {
      const bookings = await BookingService.getMyBookings("ACTIVE");
      // Sort by travel date to get the nearest upcoming trip
      if (bookings && bookings.length > 0) {
        setActiveTicket(bookings[0]);
      } else {
        setActiveTicket(null);
      }
    } catch (error) {
      console.error("Error fetching active ticket:", error);
      // Silent error or minimal toast
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveTicket();
    }, []),
  );

  const handleSearch = () => {
    if (searchDestination.trim()) {
      router.push({
        pathname: "/(tabs)/routes",
        params: { destination: searchDestination.trim() },
      });
    } else {
      router.push("/(tabs)/routes");
    }
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchActiveTicket();
  };

  return (
    <GradientBackground>
      <ScreenWrapper style={{ backgroundColor: "transparent" }}>
        <RefreshableScrollView
          contentContainerStyle={styles.scrollContent}
          onRefresh={onRefresh}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent.main} // Lime spinner
            />
          }
        >
          {/* 1. Header */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/profile")}
              style={styles.profileButton}
            >
              <View style={styles.avatarContainer}>
                {user?.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={styles.avatarImage}
                    // cache policy handled via uri timestamp query param
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarImage,
                      {
                        backgroundColor: theme.colors.primary[500],
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Text style={styles.avatarInitials}>
                      {user?.name
                        ? user.name.substring(0, 1).toUpperCase()
                        : "G"}
                    </Text>
                  </View>
                )}
              </View>
              <View>
                <Text style={styles.greetingText}>{greeting},</Text>
                <Text style={styles.userNameText}>
                  {user?.name?.split(" ")[0] || "Guest"} 👋
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={theme.colors.text.primary}
              />
              <Animated.View
                style={[
                  styles.notificationBadge,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* 2. Active Ticket (HERO) */}
          <FadeInView delay={100} duration={600}>
            {activeTicket ? (
              <View style={styles.heroSection}>
                <ActiveTicketCard
                  booking={activeTicket}
                  onPress={() => router.push("/(tabs)/tickets")}
                />
              </View>
            ) : (
              // Search section for finding buses
              <View
                style={[styles.heroSection, { marginBottom: theme.spacing.lg }]}
              >
                <Card variant="default" padding="md" style={styles.searchCard}>
                  <Text style={styles.searchTitle}>Where to today?</Text>
                  <Input
                    label=""
                    placeholder="Search destination (e.g. Rubavu, Musanze)"
                    value={searchDestination}
                    onChangeText={setSearchDestination}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    leftIcon="search"
                    style={styles.searchInput}
                  />
                  {searchDestination.trim().length > 0 && (
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={handleSearch}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="arrow-forward-circle"
                        size={20}
                        color="#000"
                      />
                      <Text style={styles.searchButtonText}>
                        Search Buses to "{searchDestination.trim()}"
                      </Text>
                    </TouchableOpacity>
                  )}
                </Card>
              </View>
            )}
          </FadeInView>

          {/* 3. Quick Actions (Adaptive) */}
          <FadeInView delay={200} duration={600}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {/* ID: 1 - Show QR (if active ticket) OR Buy Pass */}
                {activeTicket ? (
                  <View style={styles.gridItem}>
                    <QuickActionCard
                      icon="qr-code-outline"
                      title="Show QR"
                      primary // Highlighted
                      onPress={() => router.push("/(tabs)/tickets")}
                    />
                  </View>
                ) : (
                  <View style={styles.gridItem}>
                    <QuickActionCard
                      icon="card-outline"
                      title="Buy Pass"
                      onPress={() => router.push("/(tabs)/passes")}
                    />
                  </View>
                )}

                {/* ID: 2 - Track Bus (Always relevant) */}
                <View style={styles.gridItem}>
                  <QuickActionCard
                    icon="map-outline"
                    title="Track Bus"
                    onPress={() => {
                      if (activeTicket?.id) {
                        // ✅ Fix Issue 9: Pass bookingId (activeTicket is a Booking, not a Ticket)
                        router.push({
                          pathname: "/(screens)/bus-tracking",
                          params: {
                            bookingId: activeTicket.id,
                            origin: activeTicket.route?.origin,
                            destination: activeTicket.route?.destination,
                            operator: activeTicket.route?.operator,
                          },
                        });
                      } else {
                        useToastStore
                          .getState()
                          .info(
                            "Book a ticket first to track.",
                            "No Active Trip",
                          );
                      }
                    }}
                  />
                </View>

                {/* ID: 3 - Book Ticket */}
                <View style={styles.gridItem}>
                  <QuickActionCard
                    icon="ticket-outline"
                    title="Book Ticket"
                    onPress={() => router.push("/(tabs)/routes")}
                  />
                </View>

                {/* ID: 4 - My Trips */}
                <View style={styles.gridItem}>
                  <QuickActionCard
                    icon="time-outline"
                    title="My Trips"
                    onPress={() => router.push("/(tabs)/tickets")}
                  />
                </View>
              </View>
            </View>
          </FadeInView>

          {/* 4. Recent Routes (Hidden for single-screen premium feel) */}
          {/* 
          <FadeInView delay={300}>
            <View style={styles.section}>
               <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Routes</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/routes')}>
                         <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
               </View>
               
               <TouchableOpacity style={styles.recentRouteItem}>
                   <View style={styles.recentRouteIcon}>
                        <Ionicons name="location-outline" size={20} color={theme.colors.accent.main} />
                   </View>
                   <View style={{ flex: 1 }}>
                        <Text style={styles.recentRouteTitle}>Nyabugogo ➝ Remera</Text>
                        <Text style={styles.recentRouteSubtitle}>Ritco Express</Text>
                   </View>
                   <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
               </TouchableOpacity>

               <TouchableOpacity style={styles.recentRouteItem}>
                   <View style={styles.recentRouteIcon}>
                        <Ionicons name="bus-outline" size={20} color={theme.colors.accent.main} />
                   </View>
                   <View style={{ flex: 1 }}>
                        <Text style={styles.recentRouteTitle}>Kicukiro ➝ City Center</Text>
                        <Text style={styles.recentRouteSubtitle}>KBS</Text>
                   </View>
                   <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
               </TouchableOpacity>

            </View>
          </FadeInView>
          */}
        </RefreshableScrollView>
      </ScreenWrapper>
    </GradientBackground>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollContent: {
      paddingHorizontal: theme.spacing.base,
      paddingBottom: 120, // Bottom nav spacing
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
      paddingTop: theme.spacing["2xl"], // Extra top padding
    },
    profileButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    avatarContainer: {
      padding: 2,
      backgroundColor: theme.colors.border.light,
      borderRadius: 24,
    },
    avatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarInitials: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    greetingText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    userNameText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    notificationButton: {
      position: "relative",
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: theme.colors.background.card,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    notificationBadge: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF5252", // Red attention
    },
    heroSection: {
      marginBottom: theme.spacing.xl,
    },
    emptyHero: {
      padding: theme.spacing.xl,
      borderRadius: theme.borderRadius["3xl"],
      backgroundColor: theme.colors.background.card,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    emptyHeroTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    emptyHeroSubtitle: {
      fontSize: 14,
      color: theme.colors.text.secondary,
    },
    searchCard: {
      backgroundColor: theme.colors.background.card,
      marginBottom: theme.spacing.md,
    },
    searchTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      marginBottom: 0,
    },
    searchButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.accent.main,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.full,
    },
    searchButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: "#000",
      flex: 1,
    },
    routesPreview: {
      marginTop: theme.spacing.md,
    },
    routesHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    routesTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    viewAllText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary[500],
      fontWeight: theme.typography.fontWeight.medium,
    },
    section: {
      marginBottom: theme.spacing["2xl"],
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg, // 18-20px
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
      opacity: 0.9,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    seeAllText: {
      fontSize: 14,
      color: theme.colors.text.secondary,
      fontWeight: "500",
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -8, // Negative margin to offset item padding
    },
    gridItem: {
      width: "50%", // 2 cols
      padding: 8, // Spacing between cards
    },
    recentRouteItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
    },
    recentRouteIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.cardLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    recentRouteTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    recentRouteSubtitle: {
      fontSize: 13,
      color: theme.colors.text.tertiary,
    },
  });
