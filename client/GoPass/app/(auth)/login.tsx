import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FadeInView } from '../../components/animations/FadeInView';
import { useAuthStore } from '../../stores/auth.store';
import { useToastStore, getErrorMessage } from '../../stores/toast.store';
import { useTheme } from '../../hooks/useTheme';
import { theme as staticTheme } from '../../config/theme';
import { navigateByRole } from '../../utils/role-navigation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login, mockLogin, isLoading } = useAuthStore();
  const toast = useToastStore.getState();
  const { theme } = useTheme();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    try {
      await login(email, password);
      
      // Get user role and navigate accordingly
      const user = useAuthStore.getState().user;
      console.log('🧭 Login successful, navigating based on role:', user?.role);
      navigateByRole(user?.role);
    } catch (error: any) {
      toast.error(getErrorMessage(error), 'Login Failed');
    }
  };

  const styles = createStyles(theme);

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <FadeInView delay={0}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>
          </FadeInView>

          <FadeInView delay={150}>
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({ ...errors, email: undefined });
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors({ ...errors, password: undefined });
                }}
                error={errors.password}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
                size="lg"
                fullWidth
                style={styles.loginButton}
              />

              <Button
                title="Forgot Password?"
                onPress={() => router.push('/(auth)/forgot-password')}
                variant="ghost"
                size="sm"
              />
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Button
                title="Sign Up"
                onPress={() => router.push('/(auth)/register')}
                variant="ghost"
                size="sm"
              />
            </View>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const createStyles = (theme: typeof staticTheme) => StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['2xl'],
  },
  
  header: {
    marginBottom: theme.spacing['3xl'],
  },
  
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  
  form: {
    marginBottom: theme.spacing.xl,
  },
  
  loginButton: {
    marginTop: theme.spacing.base,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  
  footerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
});
