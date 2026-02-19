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

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  
  const { register, mockRegister, isLoading } = useAuthStore();
  const { theme } = useTheme();

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: undefined });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    try {
      await register(formData);
      
      // Get user role and navigate accordingly
      const user = useAuthStore.getState().user;
      console.log('🧭 Registration successful, navigating based on role:', user?.role);
      navigateByRole(user?.role);
    } catch (error: any) {
      useToastStore.getState().error(getErrorMessage(error), 'Registration Failed');
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
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>
            </View>
          </FadeInView>

          <FadeInView delay={150}>
            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChangeText={(text) => updateField('name', text)}
                error={errors.name}
                leftIcon="person-outline"
              />

              <Input
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <Input
                label="Phone Number"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(text) => updateField('phone', text)}
                error={errors.phone}
                keyboardType="phone-pad"
                leftIcon="call-outline"
                maxLength={10}
              />

              <Input
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                error={errors.password}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.passwordConfirmation}
                onChangeText={(text) => updateField('passwordConfirmation', text)}
                error={errors.passwordConfirmation}
                secureTextEntry
                leftIcon="lock-closed-outline"
              />

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                size="lg"
                fullWidth
                style={styles.registerButton}
              />
            </View>
          </FadeInView>

          <FadeInView delay={300}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Button
                title="Sign In"
                onPress={() => router.push('/(auth)/login')}
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
    marginBottom: theme.spacing['2xl'],
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
  
  registerButton: {
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
