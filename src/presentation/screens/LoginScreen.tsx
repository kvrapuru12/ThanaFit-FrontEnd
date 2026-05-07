import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Alert,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { ONBOARDING_COMPLETED_STORAGE_KEY } from './OnboardingScreen';

interface LoginData {
  username: string;
  password: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface LoginScreenProps {
  navigation: any; // TODO: Add proper navigation type
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { login, loginWithGoogle, loginWithApple, isLoading } = useAuth();
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const updateLoginData = (field: keyof LoginData, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!loginData.username.trim()) {
      newErrors.username = 'Username or email is required';
    }

    if (!loginData.password) {
      newErrors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const success = await login(loginData);
    
    if (success) {
      // Navigation will be handled automatically by the AuthContext
      // The app will redirect to Dashboard when authentication is successful
      console.log('Login successful!');
    }
  };

  const previewOnboardingDev = async () => {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_STORAGE_KEY);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Onboarding' }],
    });
  };

  const handleForgotPassword = () => {
    console.log('Forgot Password button pressed');
    try {
      Alert.alert(
        'Feature Coming Soon',
        'We\'re working on password reset functionality. For now, please contact support to reset your password.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Alert error:', error);
      // Fallback for web or if Alert fails
      alert('Feature Coming Soon\n\nWe\'re working on password reset functionality. For now, please contact support to reset your password.');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'Google') {
      setIsGoogleLoading(true);
      try {
        const success = await loginWithGoogle();
        if (!success) {
          Alert.alert('Sign-In Failed', 'Google Sign-In did not complete successfully. Please try again.');
        }
      } catch (error: any) {
        let errorMessage = 'Failed to sign in with Google. Please try again.';

        if (error.message?.includes('cancelled') || error.message?.includes('cancel')) {
          errorMessage = 'Google Sign-In was cancelled. Please try again if you want to sign in with Google.';
        } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
          errorMessage = 'Google Sign-In took too long to complete. Please try again.';
        } else if (error.message?.includes('Passkey') || error.message?.includes('QR code') || error.message?.includes('barcode')) {
          errorMessage = 'Google Sign-In requires additional verification. Please complete the verification and try again.';
        } else if (error.message?.includes('network') || error.message?.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert('Google Sign-In Error', errorMessage);
      } finally {
        setIsGoogleLoading(false);
      }
    } else if (provider === 'Apple') {
      setIsAppleLoading(true);
      try {
        const success = await loginWithApple();
        if (!success) {
          Alert.alert('Sign-In Failed', 'Apple Sign-In did not complete successfully. Please try again.');
        }
      } catch (error: any) {
        if (error?.code === 'ERR_REQUEST_CANCELED') {
          // User cancelled - no alert
          return;
        }
        const msg = error?.message ?? 'Failed to sign in with Apple. Please try again.';
        Alert.alert('Apple Sign-In Error', msg);
      } finally {
        setIsAppleLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.background}>
        <View style={styles.blobA} />
        <View style={styles.blobB} />
        <View style={styles.blobC} />
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandMark}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/logo-icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.title}>Welcome to ThanaFit</Text>
            <Text style={styles.subtitle}>
              Voice-track food and workouts in seconds. Smarter insights, less effort.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, styles.socialButtonGoogle]}
                onPress={() => handleSocialLogin('Google')}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color="#EA4335" size="small" />
                ) : (
                  <>
                    <Image
                      source={require('../../../assets/icons/google-g.png')}
                      style={styles.googleIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.socialButtonApple]}
                  onPress={() => handleSocialLogin('Apple')}
                  disabled={isLoading || isAppleLoading}
                >
                  {isAppleLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={18} color="#ffffff" />
                      <Text style={[styles.socialButtonText, styles.socialButtonTextInverted]}>
                        Continue with Apple
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              <TextInput
                placeholder="Username or Email"
                style={[
                  styles.input,
                  errors.username ? styles.inputError : null
                ]}
                autoCapitalize="none"
                autoCorrect={false}
                value={loginData.username}
                onChangeText={(value) => updateLoginData('username', value)}
                editable={!isLoading}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  style={[
                    styles.input,
                    styles.passwordInput,
                    errors.password ? styles.inputError : null
                  ]}
                  secureTextEntry={!showPassword}
                  value={loginData.password}
                  onChangeText={(value) => updateLoginData('password', value)}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.securityNote}>
              <Ionicons name="lock-closed-outline" size={14} color="#6b7280" />
              <Text style={styles.securityNoteText}>Secure login with encrypted sessions</Text>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupLink}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Signup')}
              disabled={isLoading}
            >
              <Text style={styles.signupLinkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.devPreviewOnboarding}
              onPress={previewOnboardingDev}
              accessibilityLabel="Preview onboarding (development only)"
            >
              <Text style={styles.devPreviewOnboardingText}>Preview onboarding (dev)</Text>
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7ff',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f4f7ff',
  },
  blobA: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -220,
    left: -150,
    backgroundColor: 'rgba(91,155,255,0.22)', // ThanaFit primary
  },
  blobB: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: 40,
    right: -180,
    backgroundColor: 'rgba(127,174,255,0.20)', // ThanaFit calm primary
  },
  blobC: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    bottom: -320,
    left: -220,
    backgroundColor: 'rgba(74,138,239,0.14)', // ThanaFit pressed/secondary
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  header: {
    marginBottom: 22,
    alignItems: 'center',
  },
  brandMark: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#dbe7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 56,
    height: 56,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dce5f3',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  form: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 60,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  showPasswordText: {
    color: '#5b84d6',
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#5b84d6',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#5b84d6',
    paddingVertical: 16,
    minHeight: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#9db5e6',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94a3b8',
    fontSize: 12,
  },
  socialButtons: {
    gap: 12,
    marginBottom: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d8e0ee',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  socialButtonGoogle: {
    backgroundColor: '#ffffff',
  },
  socialButtonApple: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  socialButtonText: {
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
  },
  googleIcon: {
    width: 18,
    height: 18,
  },
  socialButtonTextInverted: {
    color: '#ffffff',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  securityNoteText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#64748b',
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#64748b',
  },
  signupLinkText: {
    color: '#5b84d6',
    fontWeight: '600',
  },
  devPreviewOnboarding: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  devPreviewOnboardingText: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'underline',
  },
});
