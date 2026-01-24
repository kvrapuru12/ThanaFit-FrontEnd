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
  Alert
} from 'react-native';
import { useAuth } from '../../presentation/providers/AuthProvider';

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
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

    try {
      const success = await login(loginData);
      
      if (success) {
        // Navigation will be handled automatically by the AuthContext
        // The app will redirect to Dashboard when authentication is successful
        console.log('Login successful!');
      } else {
        // Show error alert if login failed
        Alert.alert(
          'Login Failed',
          'Invalid credentials or network error. Please check your username/password and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Login error in LoginScreen:', error);
      Alert.alert(
        'Login Error',
        error.message || 'An error occurred during login. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot Password clicked - functionality not implemented yet');
  };

  const handleSocialLogin = async (provider: string) => {
    console.log(`[LoginScreen] handleSocialLogin called with provider: ${provider}`);
    if (provider === 'Google') {
      setIsGoogleLoading(true);
      try {
        console.log('[LoginScreen] Starting Google Sign-In...');
        const success = await loginWithGoogle();
        if (success) {
          console.log('[LoginScreen] Google Sign-In successful!');
          // Navigation will be handled automatically by AuthContext
        } else {
          console.log('[LoginScreen] Google Sign-In returned false');
          Alert.alert('Sign-In Failed', 'Google Sign-In did not complete successfully. Please try again.');
        }
      } catch (error: any) {
        console.error('[LoginScreen] Error in handleSocialLogin:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to sign in with Google. Please try again.';
        
        if (error.message?.includes('cancelled') || error.message?.includes('cancel')) {
          errorMessage = 'Google Sign-In was cancelled. Please try again if you want to sign in with Google.';
        } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
          errorMessage = 'Google Sign-In took too long to complete. Please try again and ensure you complete the verification promptly (scan QR code if prompted).';
        } else if (error.message?.includes('Passkey') || error.message?.includes('QR code') || error.message?.includes('barcode')) {
          errorMessage = 'Google Sign-In requires additional verification. Please complete the verification on the Google sign-in screen (scan QR code if prompted) and try again.';
        } else if (error.message?.includes('network') || error.message?.includes('connection')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Show alert to user
        Alert.alert('Google Sign-In Error', errorMessage);
      } finally {
        setIsGoogleLoading(false);
      }
    } else if (provider === 'Apple') {
      console.log('Apple Sign-In - to be implemented');
      // TODO: Implement Apple Sign-In
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your fitness journey</Text>
          </View>

          {/* Login Form */}
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

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
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

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Google')}
              disabled={isLoading}
            >
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Apple')}
              disabled={isLoading}
            >
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
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

          {/* Demo Credentials */}
          <View style={styles.demoCredentials}>
            <Text style={styles.demoTitle}>Demo Credentials (for testing):</Text>
            <Text style={styles.demoText}>
              Username: demo@example.com | Password: demo123
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
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
    color: '#2563eb',
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
    color: '#2563eb',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
  },
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
  },
  signupLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#6b7280',
  },
  signupLinkText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  demoCredentials: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  demoTitle: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  demoText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
});
