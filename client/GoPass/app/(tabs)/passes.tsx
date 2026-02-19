import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../components/ui/ScreenWrapper";
import { RefreshableScrollView } from "../../components/ui/RefreshableScrollView";
import { PassCard } from "../../components/features/PassCard";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button"; // Assuming Button component exists
import { FadeInView } from "../../components/animations/FadeInView";
import { GradientBackground } from "../../components/ui/GradientBackground";
import { Theme } from "../../config/theme";
import { useTheme } from "../../hooks/useTheme";
import { Pass, PassTemplate } from "../../types/pass.types";
import { PassService } from "../../services/pass.service";
// Remove mock imports
// import { getUserPasses, getPassTemplates } from '../../services/mock/passes.mock';

import { Animated } from "react-native";

export default function PassesScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
  const [activePasses, setActivePasses] = useState<Pass[]>([]);
  const [templates, setTemplates] = useState<PassTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0.3))[0]; // Initial value for opacity: 0.3
  const animationRef = React.useRef<Animated.CompositeAnimation | null>(null); // Store animation reference

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Start skeleton animation
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      animationRef.current.start();

      const [passesData, templatesData] = await Promise.allSettled([
        PassService.getUserPasses("ACTIVE"),
        PassService.getPassTemplates(),
      ]);

      if (passesData.status === "fulfilled") {
        setActivePasses(
          Array.isArray(passesData.value) ? passesData.value : [],
        );
      }
      if (templatesData.status === "fulfilled") {
        setTemplates(
          Array.isArray(templatesData.value) ? templatesData.value : [],
        );
      }
    } catch (error) {
      console.log("Failed to fetch passes:", error);
    } finally {
      // Always stop animation and hide loading
      try {
        animationRef.current?.stop();
      } catch (_) {}
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    await fetchData();
  };

  const handlePassPress = (pass: Pass) => {
    router.push(`/(screens)/pass-details/${pass.id}` as any);
  };

  // ✅ Issue 2: Navigate to pass-checkout screen with payment method selection
  const handleBuyPass = (template: PassTemplate) => {
    router.push({
      pathname: "/(screens)/pass-checkout",
      params: {
        templateId: template.id,
        templateName: template.name,
        templatePrice: template.price.toString(),
        templateDescription: template.description,
      },
    } as any);
  };

  const renderSkeleton = () => (
    <View>
      {/* Active Passes Skeleton */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Active Passes</Text>
        <Animated.View style={[styles.skeletonCard, { opacity: fadeAnim }]} />
      </View>

      {/* Buy New Pass Skeleton */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buy New Pass</Text>
        <View style={styles.templatesGrid}>
          <Animated.View
            style={[styles.skeletonTemplateCard, { opacity: fadeAnim }]}
          />
          <Animated.View
            style={[styles.skeletonTemplateCard, { opacity: fadeAnim }]}
          />
          <Animated.View
            style={[styles.skeletonTemplateCard, { opacity: fadeAnim }]}
          />
        </View>
      </View>
    </View>
  );

  return (
    <GradientBackground>
      <ScreenWrapper style={{ backgroundColor: "transparent" }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bus Passes</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => router.push("/(screens)/pass-history")}
            >
              <Ionicons
                name="time-outline"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          <RefreshableScrollView
            contentContainerStyle={styles.scrollContent}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              renderSkeleton()
            ) : (
              <>
                {/* Section: Your Active Passes */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Active Passes</Text>
                  {activePasses.length > 0 ? (
                    activePasses.map((pass) => (
                      <PassCard
                        key={pass.id}
                        pass={pass}
                        onPress={() => handlePassPress(pass)}
                      />
                    ))
                  ) : (
                    <Card style={styles.emptyCard}>
                      <Text style={styles.emptyText}>No active passes</Text>
                    </Card>
                  )}
                </View>

                {/* Section: Buy New Pass */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Buy New Pass</Text>
                  <View style={styles.templatesGrid}>
                    {templates.map((template, index) => (
                      <FadeInView key={template.id} delay={index * 100}>
                        <Card style={styles.templateCard} padding="md">
                          <View style={styles.templateIcon}>
                            <Ionicons
                              name={
                                template.type === "weekly"
                                  ? "calendar-outline"
                                  : "calendar-number-outline"
                              }
                              size={24}
                              color={theme.colors.primary[500]}
                            />
                          </View>
                          <Text style={styles.templateName}>
                            {template.name}
                          </Text>
                          <Text style={styles.templatePrice}>
                            {template.price.toLocaleString()} RWF
                          </Text>
                          <Text style={styles.templateDesc}>
                            {template.description}
                          </Text>
                          <Button
                            title="Buy"
                            onPress={() => handleBuyPass(template)}
                            size="sm"
                            style={styles.buyButton}
                          />
                        </Card>
                      </FadeInView>
                    ))}
                  </View>
                </View>
              </>
            )}
          </RefreshableScrollView>
        </View>
      </ScreenWrapper>
    </GradientBackground>
  );
}

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    title: {
      fontSize: theme.typography.fontSize["3xl"],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
    },
    historyButton: {
      padding: theme.spacing.sm,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing["4xl"],
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.md,
    },
    emptyCard: {
      alignItems: "center",
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background.card,
    },
    emptyText: {
      color: theme.colors.text.disabled,
    },
    templatesGrid: {
      gap: theme.spacing.md,
    },
    templateCard: {
      backgroundColor: theme.colors.background.card,
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      width: "100%",
    },
    templateIcon: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.background.tertiary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.md,
    },
    templateName: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: 4,
    },
    templatePrice: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary[600],
      marginBottom: 8,
    },
    templateDesc: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.md,
    },
    buyButton: {
      width: "100%",
      alignSelf: "stretch",
      marginTop: theme.spacing.sm,
    },
    skeletonCard: {
      height: 120,
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.xl,
      marginBottom: theme.spacing.md,
    },
    skeletonTemplateCard: {
      height: 180,
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.borderRadius.xl,
      marginBottom: theme.spacing.md,
    },
  });
