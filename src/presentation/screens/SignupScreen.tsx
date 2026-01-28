import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../presentation/providers/AuthProvider';
import { SignupRequest } from '../../infrastructure/services/api';

interface UserData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;

  // Step 2: Personal Details
  phoneNumber: string;
  dob: string;
  gender: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'OTHER';

  // Step 3: Fitness Profile
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  dailyCalorieIntakeTarget: string;
  dailyCalorieBurnTarget: string;
  weight: string;
  heightValue: string;
  heightUnit: 'CM' | 'FEET';
}

interface ValidationErrors {
  [key: string]: string;
}

interface SignupScreenProps {
  navigation: any; // TODO: Add proper navigation type
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const { signup, isLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    dob: '',
    gender: 'FEMALE',
    activityLevel: 'MODERATE',
    dailyCalorieIntakeTarget: '2000',
    dailyCalorieBurnTarget: '500',
    weight: '',
    heightValue: '',
    heightUnit: 'CM',
  });

  const updateUserData = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear API errors when user starts typing
    if (apiErrors.length > 0) {
      setApiErrors([]);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!userData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!userData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!userData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (userData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!userData.password) {
      newErrors.password = 'Password is required';
    } else if (userData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(userData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (userData.password !== userData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!userData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      // Check if it's already in international format
      const internationalFormat = /^\+[1-9]\d{1,14}$/;
      const ukFormat = /^0\d{10}$/;
      
      if (internationalFormat.test(userData.phoneNumber)) {
        // Already in international format, good
      } else if (ukFormat.test(userData.phoneNumber)) {
        // Convert UK format to international format
        const internationalNumber = '+44' + userData.phoneNumber.substring(1);
        setUserData(prev => ({ ...prev, phoneNumber: internationalNumber }));
      } else {
        newErrors.phoneNumber = 'Phone number must be in international format (e.g., +447912150965) or UK format (07912150965)';
      }
    }

    if (!userData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      // Validate date format - accept both MM/DD/YYYY and YYYY-MM-DD
      const slashDateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      const dashDateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      
      if (!slashDateRegex.test(userData.dob) && !dashDateRegex.test(userData.dob)) {
        newErrors.dob = 'Please enter date in MM/DD/YYYY or YYYY-MM-DD format';
      } else {
        const today = new Date();
        const birthDate = new Date(userData.dob);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13) {
          newErrors.dob = 'User must be at least 13 years old';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!userData.weight) {
      newErrors.weight = 'Weight is required';
    } else {
      const weight = parseFloat(userData.weight);
      if (isNaN(weight) || weight < 30 || weight > 300) {
        newErrors.weight = 'Weight must be between 30 and 300 kg';
      }
    }

    if (!userData.heightValue) {
      newErrors.heightValue = 'Height is required';
    } else {
      const height = parseFloat(userData.heightValue);
      if (isNaN(height) || height <= 0) {
        newErrors.heightValue = 'Please enter a valid height';
      } else {
        // Validate height based on unit
        if (userData.heightUnit === 'CM') {
          if (height < 100 || height > 250) {
            newErrors.heightValue = 'Height must be between 100 and 250 cm';
          }
        } else if (userData.heightUnit === 'FEET') {
          // Convert feet to cm for validation (1 foot = 30.48 cm)
          const heightInCm = height * 30.48;
          if (heightInCm < 100 || heightInCm > 250) {
            newErrors.heightValue = 'Height must be between 3.3 and 8.2 feet';
          }
        }
      }
    }

    if (!userData.dailyCalorieIntakeTarget) {
      newErrors.dailyCalorieIntakeTarget = 'Daily calorie intake target is required';
    } else {
      const calories = parseInt(userData.dailyCalorieIntakeTarget);
      if (isNaN(calories) || calories < 1000 || calories > 5000) {
        newErrors.dailyCalorieIntakeTarget = 'Daily calorie intake must be between 1000 and 5000';
      }
    }

    if (!userData.dailyCalorieBurnTarget) {
      newErrors.dailyCalorieBurnTarget = 'Daily calorie burn target is required';
    } else {
      const calories = parseInt(userData.dailyCalorieBurnTarget);
      if (isNaN(calories) || calories < 100 || calories > 2000) {
        newErrors.dailyCalorieBurnTarget = 'Daily calorie burn must be between 100 and 2000';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSignup = async () => {
    if (!validateStep3()) return;

    try {
      // Convert date to YYYY-MM-DD format for backend
      const formatDateForBackend = (dateString: string): string => {
        // If already in YYYY-MM-DD format, return as is
        if (dateString.includes('-')) {
          return dateString;
        }
        // If in MM/DD/YYYY format, convert to YYYY-MM-DD
        const [month, day, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      // Prepare data for backend API
      const signupData: SignupRequest = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        username: userData.username,
        password: userData.password,
        dob: formatDateForBackend(userData.dob),
        gender: userData.gender,
        activityLevel: userData.activityLevel,
        dailyCalorieIntakeTarget: parseInt(userData.dailyCalorieIntakeTarget),
        dailyCalorieBurnTarget: parseInt(userData.dailyCalorieBurnTarget),
        weight: parseFloat(userData.weight),
        height: {
          value: userData.heightUnit === 'FEET' 
            ? parseFloat(userData.heightValue) * 30.48  // Convert feet to cm
            : parseFloat(userData.heightValue),          // Already in cm
          unit: 'CM'  // Always send in cm to backend
        },
        role: 'USER' as const
      };


      console.log('=== SIGNUP SCREEN SUBMISSION ===');
      console.log('Signup data being sent:', JSON.stringify(signupData, null, 2));
      
      const success = await signup(signupData);

      if (success) {
        console.log('=== SIGNUP SCREEN SUCCESS ===');
        console.log('Signup successful, user should be automatically logged in');
        
        // Since user is now automatically logged in, navigate to main app
        // The navigation will be handled by the AppNavigator based on authentication state
        // No need to navigate to login screen
        console.log('User is now logged in, navigation will be handled by AppNavigator');
      } else {
        console.log('=== SIGNUP SCREEN FAILED ===');
        console.log('Signup failed, staying on signup screen');
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Extract detailed error information
      let errorMessages: string[] = [];
      
      if (error.details) {
        // Handle validation errors from backend
        if (Array.isArray(error.details)) {
          errorMessages = error.details.map((err: any) => 
            typeof err === 'string' ? err : `${err.field || 'Field'}: ${err.message || err}`
          );
        } else if (typeof error.details === 'object') {
          // Handle object-based validation errors
          errorMessages = Object.entries(error.details).map(([field, message]) => 
            `${field}: ${message}`
          );
        }
      } else if (error.responseData?.fieldErrors) {
        // Handle backend fieldErrors format: {"fieldErrors": {"field1": "message1", "field2": "message2"}}
        errorMessages = Object.entries(error.responseData.fieldErrors).map(([field, message]) => 
          `${field}: ${message}`
        );
        
        // Also set individual field errors for better UX
        const fieldErrors = error.responseData.fieldErrors;
        const newFieldErrors: ValidationErrors = {};
        
        if (fieldErrors.email) {
          newFieldErrors.email = fieldErrors.email;
        }
        if (fieldErrors.phoneNumber) {
          newFieldErrors.phoneNumber = fieldErrors.phoneNumber;
        }
        if (fieldErrors.height) {
          newFieldErrors.heightValue = fieldErrors.height;
        }
        if (fieldErrors.username) {
          newFieldErrors.username = fieldErrors.username;
        }
        
        setErrors(newFieldErrors);
      } else if (error.message) {
        errorMessages = [error.message];
      } else {
        errorMessages = ['Failed to create account. Please try again.'];
      }
      
      // Set API errors for display
      setApiErrors(errorMessages);
      
      console.error('Signup failed with errors:', errorMessages);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              step <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive
            ]}
          >
            <Text style={[
              styles.stepText,
              step <= currentStep ? styles.stepTextActive : styles.stepTextInactive
            ]}>
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View
              style={[
                styles.stepLine,
                step < currentStep ? styles.stepLineActive : styles.stepLineInactive
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderApiErrors = () => {
    if (apiErrors.length === 0) return null;
    
    return (
      <View style={styles.apiErrorContainer}>
        <Text style={styles.apiErrorTitle}>Please fix the following errors:</Text>
        {apiErrors.map((error, index) => (
          <Text key={index} style={styles.apiErrorText}>
            • {error}
          </Text>
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Let's start with your basic account information. This will be used to create your profile.
      </Text>

      <TextInput
        placeholder="First Name"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.firstName ? styles.inputError : null
        ]}
        value={userData.firstName}
        onChangeText={(value) => updateUserData('firstName', value)}
      />
      {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

      <TextInput
        placeholder="Last Name"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.lastName ? styles.inputError : null
        ]}
        value={userData.lastName}
        onChangeText={(value) => updateUserData('lastName', value)}
      />
      {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.email ? styles.inputError : null
        ]}
        autoCapitalize="none"
        keyboardType="email-address"
        value={userData.email}
        onChangeText={(value) => updateUserData('email', value)}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        placeholder="Username"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.username ? styles.inputError : null
        ]}
        autoCapitalize="none"
        value={userData.username}
        onChangeText={(value) => updateUserData('username', value)}
      />
      {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

      <TextInput
        placeholder="Password"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.password ? styles.inputError : null
        ]}
        secureTextEntry
        value={userData.password}
        onChangeText={(value) => {
          console.log('Password field changed:', value);
          updateUserData('password', value);
        }}
        onFocus={() => console.log('Password field focused')}
        onBlur={() => console.log('Password field blurred')}
        autoComplete="new-password"
        textContentType="newPassword"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.confirmPassword ? styles.inputError : null
        ]}
        secureTextEntry
        value={userData.confirmPassword}
        onChangeText={(value) => {
          console.log('Confirm password field changed:', value);
          updateUserData('confirmPassword', value);
        }}
        onFocus={() => console.log('Confirm password field focused')}
        onBlur={() => console.log('Confirm password field blurred')}
        autoComplete="new-password"
        textContentType="newPassword"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Personal Details</Text>
      <Text style={styles.stepDescription}>
        Tell us a bit more about yourself. This information helps us personalize your experience.
      </Text>

      <TextInput
        placeholder="Phone Number (e.g., +447912150000)"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.phoneNumber ? styles.inputError : null
        ]}
        keyboardType="phone-pad"
        value={userData.phoneNumber}
        onChangeText={(value) => updateUserData('phoneNumber', value)}
      />
      {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

      <TextInput
        placeholder="Date of Birth (YYYY-MM-DD)"
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          errors.dob ? styles.inputError : null
        ]}
        value={userData.dob}
        onChangeText={(value) => updateUserData('dob', value)}
      />
      {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={userData.gender}
          onValueChange={(value) => updateUserData('gender', value)}
        >
          <Picker.Item label="Female" value="FEMALE" />
          <Picker.Item label="Male" value="MALE" />
          <Picker.Item label="Non-binary" value="NON_BINARY" />
          <Picker.Item label="Other" value="OTHER" />
        </Picker>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Fitness Profile</Text>
      <Text style={styles.stepDescription}>
        Let's set up your fitness profile
      </Text>

      {/* Activity Level Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🏃‍♀️ Activity Level</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userData.activityLevel}
            onValueChange={(value) => updateUserData('activityLevel', value)}
          >
            <Picker.Item label="Sedentary" value="SEDENTARY" />
            <Picker.Item label="Light (1-3 days/week)" value="LIGHT" />
            <Picker.Item label="Moderate (3-5 days/week)" value="MODERATE" />
            <Picker.Item label="Active (6-7 days/week)" value="ACTIVE" />
            <Picker.Item label="Very Active" value="VERY_ACTIVE" />
          </Picker>
        </View>
      </View>

      {/* Physical Measurements Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📏 Physical Measurements</Text>
        
        <TextInput
          placeholder="Weight (kg) - e.g., 70"
          placeholderTextColor="#9ca3af"
          style={[
            styles.input,
            errors.weight ? styles.inputError : null
          ]}
          keyboardType="numeric"
          value={userData.weight}
          onChangeText={(value) => updateUserData('weight', value)}
        />
        {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}

        <View style={styles.heightContainer}>
          <View style={styles.heightInput}>
            <TextInput
              placeholder={`Height - e.g., ${userData.heightUnit === 'CM' ? '170' : '5.7'}`}
              placeholderTextColor="#9ca3af"
              style={[
                styles.input,
                styles.heightInputField,
                errors.heightValue ? styles.inputError : null
              ]}
              keyboardType="numeric"
              value={userData.heightValue}
              onChangeText={(value) => updateUserData('heightValue', value)}
            />
          </View>
          <View style={styles.heightUnit}>
            <View style={styles.unitButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  userData.heightUnit === 'CM' ? styles.unitButtonActive : styles.unitButtonInactive
                ]}
                onPress={() => updateUserData('heightUnit', 'CM')}
              >
                <Text style={[
                  styles.unitButtonText,
                  userData.heightUnit === 'CM' ? styles.unitButtonTextActive : styles.unitButtonTextInactive
                ]}>
                  cm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  userData.heightUnit === 'FEET' ? styles.unitButtonActive : styles.unitButtonInactive
                ]}
                onPress={() => updateUserData('heightUnit', 'FEET')}
              >
                <Text style={[
                  styles.unitButtonText,
                  userData.heightUnit === 'FEET' ? styles.unitButtonTextActive : styles.unitButtonTextInactive
                ]}>
                  ft
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {errors.heightValue && <Text style={styles.errorText}>{errors.heightValue}</Text>}
      </View>

      {/* Calorie Goals Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>🎯 Calorie Goals</Text>
        
        <TextInput
          placeholder="Daily Calorie Intake (1500-2500)"
          placeholderTextColor="#9ca3af"
          style={[
            styles.input,
            errors.dailyCalorieIntakeTarget ? styles.inputError : null
          ]}
          keyboardType="numeric"
          value={userData.dailyCalorieIntakeTarget}
          onChangeText={(value) => updateUserData('dailyCalorieIntakeTarget', value)}
        />
        {errors.dailyCalorieIntakeTarget && <Text style={styles.errorText}>{errors.dailyCalorieIntakeTarget}</Text>}

        <TextInput
          placeholder="Daily Calorie Burn Goal (200-800)"
          placeholderTextColor="#9ca3af"
          style={[
            styles.input,
            errors.dailyCalorieBurnTarget ? styles.inputError : null
          ]}
          keyboardType="numeric"
          value={userData.dailyCalorieBurnTarget}
          onChangeText={(value) => updateUserData('dailyCalorieBurnTarget', value)}
        />
        {errors.dailyCalorieBurnTarget && <Text style={styles.errorText}>{errors.dailyCalorieBurnTarget}</Text>}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {renderStepIndicator()}
          {renderApiErrors()}
          {renderCurrentStep()}
        </View>
      </ScrollView>
      
      <View style={styles.footerContainer}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.previousButton]}
              onPress={handlePrevious}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentStep < 3 ? (
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.signupButton]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
          <Text style={styles.loginLinkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2563eb',
  },
  stepCircleInactive: {
    backgroundColor: '#d1d5db',
  },
  stepText: {
    fontWeight: '600',
  },
  stepTextActive: {
    color: 'white',
  },
  stepTextInactive: {
    color: '#6b7280',
  },
  stepLine: {
    width: 48,
    height: 4,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#2563eb',
  },
  stepLineInactive: {
    backgroundColor: '#d1d5db',
  },
  apiErrorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  apiErrorTitle: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  apiErrorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  heightContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  heightInput: {
    flex: 1,
    marginRight: 12,
  },
  heightInputField: {
    marginBottom: 0,
    height: 44,
  },
  heightUnit: {
    width: 80,
  },
  unitButtonContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  unitButtonActive: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  unitButtonInactive: {
    backgroundColor: 'transparent',
  },
  unitButtonText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  unitButtonTextInactive: {
    color: '#6b7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  previousButton: {
    backgroundColor: '#6b7280',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },
  signupButton: {
    backgroundColor: '#10b981',
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#10b981',
    textAlign: 'center',
  },
});
