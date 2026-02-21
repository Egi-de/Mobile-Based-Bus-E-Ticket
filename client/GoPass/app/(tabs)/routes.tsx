import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { Input } from "../../components/ui/Input";
import { RouteCard } from "../../components/features/RouteCard";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { useTheme } from "../../hooks/useTheme";
import { Theme } from "../../config/theme";
import { Route } from "../../types/route.types";
import { Card } from "../../components/ui/Card";
import { useLinearRefresh } from "../../hooks/useLinearRefresh";
import { LinearProgressBar } from "../../components/ui/LinearProgressBar";
import { RouteService } from "../../services/route.service";
import { useToastStore, getErrorMessage } from "../../stores/toast.store";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function RoutesScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { destination: paramDestination } = useLocalSearchParams<{
    destination?: string;
  }>();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchParams, setSearchParams] = useState({
    origin: "",
    destination: paramDestination || "",
    date: "",
  });

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const data = await RouteService.getRoutes();
      setRoutes(data);
    } catch (error) {
      console.error("Failed to fetch routes", error);
      useToastStore
        .getState()
        .error(getErrorMessage(error), "Could not load routes");
    } finally {
      setIsLoading(false);
    }
  };

  const { refreshing, onRefresh, progressAnim } = useLinearRefresh(fetchRoutes);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await RouteService.getRoutes({
        origin: searchParams.origin,
        destination: searchParams.destination,
      });
      setRoutes(data);
    } catch (error) {
      console.error("Search failed", error);
      useToastStore.getState().error(getErrorMessage(error), "Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (paramDestination) {
      // Pre-fill and auto-search when coming from home screen
      setSearchParams((prev) => ({ ...prev, destination: paramDestination }));
      RouteService.getRoutes({ destination: paramDestination })
        .then((data) => setRoutes(data))
        .catch((err) => console.error("Search failed", err))
        .finally(() => setIsLoading(false));
    } else {
      fetchRoutes();
    }
  }, [paramDestination]);

  const handleRoutePress = (route: Route) => {
    router.push(`/(screens)/route-details/${route.id}`);
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleSwap = () => {
    setSearchParams((prev) => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  return (
    <GradientBackground>
      <ScreenWrapper style={{ backgroundColor: "transparent" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            {/* Header */}
            <TouchableOpacity
              style={styles.header}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.title}>Find Routes</Text>
                <Text style={styles.subtitle}>Where do you want to go?</Text>
              </View>
              <View
                style={[
                  styles.chevronContainer,
                  !isExpanded && styles.chevronCollapsed,
                ]}
              >
                <Ionicons
                  name="chevron-up"
                  size={24}
                  color={theme.colors.text.primary}
                />
              </View>
            </TouchableOpacity>

            {/* Search Container */}
            {isExpanded && (
              <Card variant="default" padding="md" style={styles.searchCard}>
                <View style={styles.inputRow}>
                  <View style={styles.iconColumn}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                    <View style={[styles.dot, styles.dotDest]} />
                  </View>
                  <View style={styles.inputsColumn}>
                    <Input
                      label=""
                      placeholder="From (e.g. Kigali)"
                      value={searchParams.origin}
                      onChangeText={(text) => {
                        setSearchParams({ ...searchParams, origin: text });
                        handleSearch();
                      }}
                      style={styles.inputContainer}
                      inputContainerStyle={styles.input}
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                    <View style={styles.inputDivider} />
                    <Input
                      label=""
                      placeholder="To (e.g. Musanze)"
                      value={searchParams.destination}
                      onChangeText={(text) => {
                        setSearchParams({ ...searchParams, destination: text });
                        handleSearch();
                      }}
                      style={styles.inputContainer}
                      inputContainerStyle={styles.input}
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.swapButton}
                    onPress={handleSwap}
                  >
                    <Ionicons
                      name="swap-vertical"
                      size={20}
                      color={theme.colors.emerald[500]}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {/* Results */}
            <View style={styles.resultsContainer}>
              <Text style={styles.sectionTitle}>
                Available Buses ({routes.length})
              </Text>
              <FlatList
                data={routes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RouteCard
                    route={item}
                    onPress={() => handleRoutePress(item)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="transparent"
                    colors={["transparent"]}
                    style={{ backgroundColor: "transparent" }}
                    progressBackgroundColor="transparent"
                    progressViewOffset={-100}
                  />
                }
                ListEmptyComponent={
                  !isLoading ? (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="bus-outline"
                        size={48}
                        color={theme.colors.text.disabled}
                      />
                      <Text style={styles.emptyText}>No routes found</Text>
                    </View>
                  ) : (
                    <View style={styles.skeletonContainer}>
                      {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.skeletonCard}>
                          <View style={styles.skeletonHeader}>
                            <View
                              style={[
                                styles.skeletonBox,
                                { width: "60%", height: 20 },
                              ]}
                            />
                            <View
                              style={[
                                styles.skeletonBox,
                                { width: 60, height: 24, borderRadius: 12 },
                              ]}
                            />
                          </View>
                          <View style={styles.skeletonBody}>
                            <View
                              style={[
                                styles.skeletonBox,
                                { width: "40%", height: 16 },
                              ]}
                            />
                            <View
                              style={[
                                styles.skeletonBox,
                                { width: "30%", height: 16, marginTop: 8 },
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  )
                }
              />
            </View>
          </View>
        </KeyboardAvoidingView>
        <LinearProgressBar
          refreshing={refreshing}
          progressAnim={progressAnim}
        />
      </ScreenWrapper>
    </GradientBackground>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    keyboardView: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    chevronContainer: {
      transform: [{ rotate: "0deg" }],
    },
    chevronCollapsed: {
      transform: [{ rotate: "180deg" }],
    },
    title: {
      fontSize: theme.typography.fontSize["3xl"],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
    },
    searchCard: {
      marginHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
      backgroundColor: theme.colors.background.card,
    },
    inputRow: {
      flexDirection: "row",
    },
    iconColumn: {
      alignItems: "center",
      paddingVertical: 18,
      width: 24,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary[500],
      borderWidth: 1,
      borderColor: theme.colors.background.card,
    },
    dotDest: {
      backgroundColor: theme.colors.accent.main,
    },
    line: {
      flex: 1,
      width: 1,
      backgroundColor: theme.colors.border.light,
      marginVertical: 4,
    },
    inputsColumn: {
      flex: 1,
      paddingHorizontal: theme.spacing.sm,
    },
    inputContainer: {
      marginBottom: 0,
    },
    input: {
      backgroundColor: theme.colors.background.input, // Use distinct input background
      borderWidth: 1,
      borderColor: theme.colors.border.main, // Use stronger border color
      borderRadius: theme.borderRadius.lg,
      height: 48,
      color: theme.colors.text.primary,
    },
    inputDivider: {
      height: 1,
      backgroundColor: theme.colors.border.light,
      marginVertical: theme.spacing.sm,
    },
    swapButton: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.sm,
    },
    resultsContainer: {
      flex: 1,
      paddingHorizontal: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    listContent: {
      paddingBottom: theme.spacing["4xl"],
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
    },
    emptyText: {
      marginTop: theme.spacing.md,
      color: theme.colors.text.disabled,
      fontSize: theme.typography.fontSize.base,
    },
    skeletonContainer: {
      paddingTop: theme.spacing.md,
    },
    skeletonCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.base,
      marginBottom: theme.spacing.md,
      ...theme.shadows.sm,
    },
    skeletonHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    skeletonBody: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    skeletonBox: {
      backgroundColor: theme.colors.border.light,
      borderRadius: theme.borderRadius.sm,
    },
  });
