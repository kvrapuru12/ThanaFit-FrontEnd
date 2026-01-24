import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../providers/AuthProvider';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../../infrastructure/api/ApiClient';
import { HttpMethod } from '../../infrastructure/api/ApiClient';

const { width } = Dimensions.get('window');

// API Configuration - Load from environment variable
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

interface ProfileProps {
  navigation?: any;
}

export function Profile({ navigation }: ProfileProps) {
  const { logout, isLoading, user, refreshUserData, updateUser, profileComplete } = useAuth();
  
  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Basic info edit state
  const [basicInfoEditModalVisible, setBasicInfoEditModalVisible] = useState(false);
  const [editingBasicInfo, setEditingBasicInfo] = useState<{ label: string; field: string; value: string } | null>(null);
  const [basicInfoEditValue, setBasicInfoEditValue] = useState('');
  const [isUpdatingBasicInfo, setIsUpdatingBasicInfo] = useState(false);
  
  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingDateField, setEditingDateField] = useState<string | null>(null);
  
  // Picker modal state
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerOptions, setPickerOptions] = useState<Array<{label: string; value: string}>>([]);
  const [pickerTitle, setPickerTitle] = useState('');
  
  // Change password modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Fetch fresh user data when Profile component mounts
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        await refreshUserData();
      } catch (error) {
        console.error('Profile - Failed to fetch fresh user data:', error);
      }
    };
    
    fetchFreshUserData();
  }, []); // Empty dependency array - run only on mount

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setEditValue(goal.target.toString());
    setEditModalVisible(true);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal || !user) return;

    setIsUpdating(true);
    try {
      // Map goal title to backend field name
      const fieldMap: { [key: string]: string } = {
        'Daily Calories': 'dailyCalorieIntakeTarget',
        'Daily Protein': 'targetProtein',
        'Daily Carbs': 'targetCarbs',
        'Daily Fat': 'targetFat',
        'Water Intake': 'targetWaterLitres',
        'Daily Steps': 'targetSteps',
        'Sleep Hours': 'targetSleepHours',
        'Target Weight': 'targetWeight',
      };

      const fieldName = fieldMap[editingGoal.title];
      if (!fieldName) {
        throw new Error('Invalid goal field');
      }

      const updateData = {
        [fieldName]: parseFloat(editValue)
      };

      // Use apiClient instead of direct fetch for proper token handling
      const response = await apiClient.patch(`/users/${user.id}`, updateData);

      // Refresh user data
      await refreshUserData();
      
      setEditModalVisible(false);
      setEditingGoal(null);
      setEditValue('');
      
      Alert.alert('Success', `${editingGoal.title} updated successfully!`);
    } catch (error) {
      console.error('Update goal error:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditBasicInfo = (field: any) => {
    setEditingBasicInfo(field);
    setBasicInfoEditValue(field.value);
    
    // If it's a date field, set the selected date
    if (field.field === 'lastPeriodDate' || field.field === 'dob') {
      if (field.value && field.value !== 'Not set') {
        // Parse the date from the field value
        const dateValue = field.field === 'lastPeriodDate' ? user?.lastPeriodDate : user?.dob;
        if (dateValue) {
          setSelectedDate(new Date(dateValue));
        } else {
          setSelectedDate(new Date());
        }
      } else {
        setSelectedDate(new Date());
      }
    }
    
    setBasicInfoEditModalVisible(true);
  };

  const handleUpdateBasicInfo = async () => {
    if (!editingBasicInfo || !user) return;

    // Validate before proceeding
    if (editingBasicInfo.field === 'phoneNumber') {
      const trimmedPhone = basicInfoEditValue.trim();
      if (!trimmedPhone) {
        Alert.alert('Validation Error', 'Phone number is required.');
        return;
      }
      
      // Validate phone number format
      const internationalFormat = /^\+[1-9]\d{1,14}$/;
      const ukFormat = /^0\d{10}$/;
      
      if (!internationalFormat.test(trimmedPhone) && !ukFormat.test(trimmedPhone)) {
        Alert.alert(
          'Invalid Phone Number',
          'Phone number must be in international format (e.g., +447912150965) or UK format (07912150965).'
        );
        return;
      }
    }
    
    if (editingBasicInfo.field === 'dob') {
      // Validate date of birth - must be in the past and user must be at least 13 years old
      const today = new Date();
      const birthDate = selectedDate;
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (birthDate > today) {
        Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
        return;
      }
      
      if (actualAge < 13) {
        Alert.alert('Invalid Date', 'You must be at least 13 years old to use this app.');
        return;
      }
      
      if (actualAge > 120) {
        Alert.alert('Invalid Date', 'Please enter a valid date of birth.');
        return;
      }
    }

    setIsUpdatingBasicInfo(true);
    try {
      let valueToUpdate = basicInfoEditValue;
      
      // For date fields, format the date as YYYY-MM-DD
      if (editingBasicInfo.field === 'lastPeriodDate' || editingBasicInfo.field === 'dob') {
        valueToUpdate = selectedDate.toISOString().split('T')[0];
        console.log('[Profile] Basic info date update - field:', editingBasicInfo.field, 'formatted value:', valueToUpdate);
      }
      
      // Handle phone number formatting if needed
      let finalValue: string = valueToUpdate;
      if (editingBasicInfo.field === 'phoneNumber') {
        const trimmedPhone = valueToUpdate.trim();
        const ukFormat = /^0\d{10}$/;
        
        if (ukFormat.test(trimmedPhone)) {
          // Convert UK format to international format
          const internationalNumber = '+44' + trimmedPhone.substring(1);
          finalValue = internationalNumber;
          console.log('[Profile] Basic info phone number update - converted UK to international:', internationalNumber);
        } else {
          finalValue = trimmedPhone;
          console.log('[Profile] Basic info phone number update - using as-is:', trimmedPhone);
        }
      }
      
      const updateData: any = {
        [editingBasicInfo.field]: finalValue || null
      };
      
      console.log('[Profile] Sending basic info update to backend:', JSON.stringify(updateData, null, 2));

      // Use updateUser from AuthProvider which handles state updates properly
      await updateUser(updateData);
      
      // Refresh user data to get updated profileComplete status
      await refreshUserData();
      
      setBasicInfoEditModalVisible(false);
      setEditingBasicInfo(null);
      setBasicInfoEditValue('');
      
      Alert.alert('Success', `${editingBasicInfo.label} updated successfully!`);
    } catch (error: any) {
      console.error('Update basic info error:', error);
      
      // Show specific error messages based on error type
      let errorMessage = 'Failed to update basic info. Please try again.';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Invalid data provided. Please check your input and try again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to update this information.';
      } else if (error.status === 404) {
        errorMessage = 'User not found. Please try logging in again.';
      } else if (error.message && (error.message.includes('validation') || error.message.includes('format'))) {
        errorMessage = error.message;
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setIsUpdatingBasicInfo(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setSelectedDate(selectedDate);
      // On Android, just update the displayed value - user confirms by closing
      if (Platform.OS === 'android' && event.type === 'set') {
        setEditingValue(selectedDate.toLocaleDateString());
      }
      // On iOS, just update the date - user will confirm with button
    }
  };

  const handleFieldUpdateWithDate = async (field: string, date: Date) => {
    if (!user) return;
    
    setIsUpdatingField(true);
    try {
      const valueToUpdate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const updateData = {
        [field]: valueToUpdate
      };
      
      console.log('[Profile] Date update via modal - field:', field, 'formatted value:', valueToUpdate);
      console.log('[Profile] Sending date update to backend:', JSON.stringify(updateData, null, 2));

      // Use updateUser from AuthProvider instead of direct apiClient.patch for consistency
      await updateUser(updateData);
      
      // Refresh user data to get updated profileComplete status
      await refreshUserData();
      
      setEditingField(null);
      Alert.alert('Success', 'Date updated successfully!');
    } catch (error) {
      console.error('Date update error:', error);
      Alert.alert('Error', 'Failed to update date. Please try again.');
    } finally {
      setIsUpdatingField(false);
    }
  };

  const showDatePickerModal = (field: string) => {
    // Initialize selectedDate with current value if editing a date field
    let dateToSet: Date;
    
    if (field === 'dob' && user?.dob) {
      // Parse the date string properly - handle YYYY-MM-DD format
      const dateStr = user.dob;
      dateToSet = new Date(dateStr);
      // Validate the date
      if (isNaN(dateToSet.getTime())) {
        dateToSet = new Date(); // Fallback to today if invalid
      }
      setEditingValue(dateToSet.toLocaleDateString());
    } else if (field === 'lastPeriodDate' && user?.lastPeriodDate) {
      // Parse the date string properly - handle YYYY-MM-DD format
      const dateStr = user.lastPeriodDate;
      dateToSet = new Date(dateStr);
      // Validate the date
      if (isNaN(dateToSet.getTime())) {
        dateToSet = new Date(); // Fallback to today if invalid
      }
      setEditingValue(dateToSet.toLocaleDateString());
    } else {
      dateToSet = new Date();
      setEditingValue('');
    }
    
    // Set the date state
    setSelectedDate(dateToSet);
    setEditingDateField(field);
    setShowDatePicker(true);
  };

  const handleFieldEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    
    // Initialize selectedDate for date fields
    if (field === 'dob' && user?.dob) {
      const dateStr = user.dob;
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setEditingValue(parsedDate.toLocaleDateString());
      } else {
        setSelectedDate(new Date());
        setEditingValue('');
      }
    } else if (field === 'lastPeriodDate' && user?.lastPeriodDate) {
      const dateStr = user.lastPeriodDate;
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setEditingValue(parsedDate.toLocaleDateString());
      } else {
        setSelectedDate(new Date());
        setEditingValue('');
      }
    } else if (field === 'gender' || field === 'activityLevel') {
      // For picker fields, use the actual value from user object
      const fieldValue = user?.[field as keyof typeof user] as string || '';
      setEditingValue(fieldValue);
      
      // Set up the picker options when opening edit mode
      if (field === 'gender') {
        setPickerTitle('Select Gender');
        setPickerOptions([
          { label: 'Female', value: 'FEMALE' },
          { label: 'Male', value: 'MALE' },
          { label: 'Non-binary', value: 'NON_BINARY' },
          { label: 'Other', value: 'OTHER' },
        ]);
      } else if (field === 'activityLevel') {
        setPickerTitle('Select Activity Level');
        setPickerOptions([
          { label: 'Sedentary', value: 'SEDENTARY' },
          { label: 'Light (1-3 days/week)', value: 'LIGHT' },
          { label: 'Moderate (3-5 days/week)', value: 'MODERATE' },
          { label: 'Active (6-7 days/week)', value: 'ACTIVE' },
          { label: 'Very Active', value: 'VERY_ACTIVE' },
        ]);
      }
    } else if (field === 'phoneNumber') {
      // Extract actual phone number, not "Not set"
      setEditingValue(user?.phoneNumber || '');
    } else if (field === 'email') {
      setEditingValue(user?.email || '');
    } else if (field === 'firstName') {
      setEditingValue(user?.firstName || '');
    } else if (field === 'lastName') {
      setEditingValue(user?.lastName || '');
    } else if (field === 'weight') {
      // Extract just the number from "XX kg"
      const weightValue = user?.weight ? user.weight.toString() : '';
      setEditingValue(weightValue);
    } else if (field === 'height') {
      // Height is an object, keep the display format for now
      // TODO: Implement proper height editing with unit selection
      setEditingValue(currentValue);
    } else {
      setEditingValue(currentValue === 'Not set' ? '' : currentValue);
    }
  };

  const handleFieldUpdate = async () => {
    if (!user || !editingField) return;

    // Validate before proceeding
    if (editingField === 'phoneNumber') {
      const trimmedPhone = editingValue.trim();
      if (!trimmedPhone) {
        Alert.alert('Validation Error', 'Phone number is required.');
        return;
      }
      
      // Validate phone number format
      const internationalFormat = /^\+[1-9]\d{1,14}$/;
      const ukFormat = /^0\d{10}$/;
      
      if (!internationalFormat.test(trimmedPhone) && !ukFormat.test(trimmedPhone)) {
        Alert.alert(
          'Invalid Phone Number',
          'Phone number must be in international format (e.g., +447912150965) or UK format (07912150965).'
        );
        return;
      }
    }
    
    if (editingField === 'dob') {
      // Validate date of birth - must be in the past and user must be at least 13 years old
      const today = new Date();
      const birthDate = selectedDate;
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (birthDate > today) {
        Alert.alert('Invalid Date', 'Date of birth cannot be in the future.');
        return;
      }
      
      if (actualAge < 13) {
        Alert.alert('Invalid Date', 'You must be at least 13 years old to use this app.');
        return;
      }
      
      if (actualAge > 120) {
        Alert.alert('Invalid Date', 'Please enter a valid date of birth.');
        return;
      }
    }

    setIsUpdatingField(true);
    try {
      let valueToUpdate = editingValue;
      
      // Map goal titles to backend field names
      const goalFieldMap: { [key: string]: string } = {
        'Daily Calories': 'dailyCalorieIntakeTarget',
        'Daily Protein': 'targetProtein',
        'Daily Carbs': 'targetCarbs',
        'Daily Fat': 'targetFat',
        'Water Intake': 'targetWaterLitres',
        'Daily Steps': 'targetSteps',
        'Sleep Hours': 'targetSleepHours',
        'Target Weight': 'targetWeight',
      };
      
      // Check if this is a goal field
      const backendFieldName = goalFieldMap[editingField];
      
      // For date fields, format the date as YYYY-MM-DD
      if (editingField === 'lastPeriodDate' || editingField === 'dob') {
        valueToUpdate = selectedDate.toISOString().split('T')[0];
        console.log('[Profile] Date field update - field:', editingField, 'formatted value:', valueToUpdate);
      }
      
      // Handle weight field - convert to number
      let updateData: any = {};
      if (backendFieldName) {
        // This is a goal field - convert to number and use backend field name
        const numValue = parseFloat(valueToUpdate);
        if (isNaN(numValue)) {
          Alert.alert('Validation Error', 'Please enter a valid number.');
          return;
        }
        updateData[backendFieldName] = numValue;
      } else if (editingField === 'weight') {
        const numValue = parseFloat(valueToUpdate);
        if (isNaN(numValue) && valueToUpdate.trim() !== '') {
          Alert.alert('Validation Error', 'Please enter a valid weight.');
          return;
        }
        updateData[editingField] = isNaN(numValue) ? null : numValue;
      } else if (editingField === 'phoneNumber') {
        // For phone number, validate and optionally convert UK format to international
        const trimmedPhone = valueToUpdate.trim();
        const ukFormat = /^0\d{10}$/;
        
        if (ukFormat.test(trimmedPhone)) {
          // Convert UK format to international format
          const internationalNumber = '+44' + trimmedPhone.substring(1);
          updateData[editingField] = internationalNumber;
          console.log('[Profile] Phone number update - converted UK to international:', internationalNumber);
        } else {
          updateData[editingField] = trimmedPhone;
          console.log('[Profile] Phone number update - using as-is:', trimmedPhone);
        }
      } else {
        // For other text fields (including dob as YYYY-MM-DD string)
        updateData[editingField] = valueToUpdate;
        console.log('[Profile] Text field update - field:', editingField, 'value:', valueToUpdate, 'type:', typeof valueToUpdate);
      }
      
      console.log('[Profile] Sending update data to backend:', JSON.stringify(updateData, null, 2));
      
      // Use updateUser from AuthProvider which handles state updates properly
      await updateUser(updateData);
      
      // Refresh user data to get updated profileComplete status
      await refreshUserData();
      
      // Force component re-render
      setRefreshKey(prev => prev + 1);
      
      setEditingField(null);
      setEditingValue('');
      
      Alert.alert('Success', 'Field updated successfully!');
    } catch (error: any) {
      console.error('Field update error:', error);
      
      // Show specific error messages based on error type
      let errorMessage = 'Failed to update field. Please try again.';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Invalid data provided. Please check your input and try again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to update this field.';
      } else if (error.status === 404) {
        errorMessage = 'User not found. Please try logging in again.';
      } else if (error.message && error.message.includes('validation') || error.message.includes('format')) {
        errorMessage = error.message;
      }
      
      Alert.alert('Update Failed', errorMessage);
    } finally {
      setIsUpdatingField(false);
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Validation Error', 'New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirm password do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Validation Error', 'New password must be different from current password');
      return;
    }

    try {
      setIsChangingPassword(true);

      // Call change password endpoint
      await apiClient.post('/auth/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      // Reset form and close modal
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);

      Alert.alert(
        'Success',
        'Password changed successfully. Please log in again with your new password.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Logout user after password change
              await logout();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Change password error:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.status === 401) {
        errorMessage = 'Current password is incorrect. Please try again.';
      } else if (error.status === 400) {
        errorMessage = error.message || 'Invalid password format. Please ensure your new password meets the requirements.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCloseChangePasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowChangePasswordModal(false);
  };

  // Get user data or use defaults
  const userStats = {
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || "User" : "User",
    email: user?.email || "No email provided",
    memberSince: user ? new Date(user.createdAt).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }) : "Unknown",
    currentStreak: 12, // This could be calculated from user data
    totalWorkouts: 89, // This could be calculated from user data
    caloriesTracked: user?.dailyCalorieIntakeTarget ? user.dailyCalorieIntakeTarget * 30 : 60000, // Estimated
  };
  // Memoize goals to ensure they update when user changes
  const goals = React.useMemo(() => {
    
    return [
      { 
        title: "Daily Calories", 
        target: user?.dailyCalorieIntakeTarget || 2000, 
        unit: "cal" 
      },
      { 
        title: "Daily Protein", 
        target: user?.targetProtein || 120, 
        unit: "g" 
      },
      { 
        title: "Daily Carbs", 
        target: user?.targetCarbs || 250, 
        unit: "g" 
      },
      { 
        title: "Daily Fat", 
        target: user?.targetFat || 65, 
        unit: "g" 
      },
      { 
        title: "Water Intake", 
        target: user?.targetWaterLitres || 2.5, 
        unit: "L" 
      },
      { 
        title: "Daily Steps", 
        target: user?.targetSteps || 10000, 
        unit: "steps" 
      },
      { 
        title: "Sleep Hours", 
        target: user?.targetSleepHours || 8, 
        unit: "hrs" 
      },
      { 
        title: "Target Weight", 
        target: user?.targetWeight || 65, 
        unit: "kg" 
      },
    ];
  }, [
    user?.dailyCalorieIntakeTarget,
    user?.targetProtein,
    user?.targetCarbs,
    user?.targetFat,
    user?.targetWaterLitres,
    user?.targetSteps,
    user?.targetSleepHours,
    user?.targetWeight,
    refreshKey, // Include refreshKey to force recalculation
  ]);

  const menuItems = [
    { icon: "settings", label: "Settings", subtitle: "Preferences, notifications, privacy & support", color: "#ff6b6b", screen: "Settings" },
  ];

  const handleMenuPress = (screen: string) => {
    if (navigation) {
      navigation.navigate(screen);
    }
  };

  const achievements = [
    { icon: "🏆", title: "Fitness Streak", color: "#ff6b6b" },
    { icon: "🎯", title: "Goal Crusher", color: "#ffa726" },
    { icon: "💪", title: "Workout Pro", color: "#4ecdc4" },
    { icon: "⚡", title: "Champion", color: "#ff6b6b" },
  ];

  // Basic information fields
  const basicInfoFields = [
    {
      label: 'First Name',
      field: 'firstName',
      value: user?.firstName || 'Not set',
      icon: '👤'
    },
    {
      label: 'Last Name',
      field: 'lastName',
      value: user?.lastName || 'Not set',
      icon: '👤'
    },
    {
      label: 'Email',
      field: 'email',
      value: user?.email || 'Not set',
      icon: '📧'
    },
    {
      label: 'Phone Number',
      field: 'phoneNumber',
      value: user?.phoneNumber || 'Not set',
      icon: '📱'
    },
    {
      label: 'Date of Birth',
      field: 'dob',
      value: user?.dob ? new Date(user.dob).toLocaleDateString() : 'Not set',
      icon: '🎂'
    },
    {
      label: 'Gender',
      field: 'gender',
      value: user?.gender || 'Not set',
      icon: '⚧'
    },
    {
      label: 'Activity Level',
      field: 'activityLevel',
      value: user?.activityLevel || 'Not set',
      icon: '🏃'
    },
    {
      label: 'Height',
      field: 'height',
      value: user?.height ? `${user.height.value} ${user.height.unit}` : 'Not set',
      icon: '📏'
    },
    {
      label: 'Weight',
      field: 'weight',
      value: user?.weight ? `${user.weight} kg` : 'Not set',
      icon: '⚖️'
    },
    {
      label: 'Last Period Date',
      field: 'lastPeriodDate',
      value: user?.lastPeriodDate ? new Date(user.lastPeriodDate).toLocaleDateString() : 'Not set',
      icon: '📅'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Incomplete Banner */}
          {profileComplete === false && (
            <Card style={styles.incompleteBanner}>
              <CardContent style={styles.incompleteBannerContent}>
                <MaterialIcons name="info" size={24} color="#f59e0b" />
                <View style={styles.incompleteBannerText}>
                  <Text style={styles.incompleteBannerTitle}>Complete Your Profile</Text>
                  <Text style={styles.incompleteBannerMessage}>
                    Please complete your profile by adding your gender and date of birth to continue using the app.
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}
          
          {/* Profile Card */}
        <Card style={styles.profileCard}>
          <CardContent style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userStats.name}</Text>
                <Text style={styles.userEmail}>{userStats.email}</Text>
                <Badge style={styles.memberBadge}>
                  <MaterialIcons name="calendar-today" size={12} color="white" />
                  <Text style={styles.memberText}>Member since {userStats.memberSince}</Text>
                </Badge>
              </View>
            </View>
          </CardContent>
        </Card>


        {/* Basic Information */}
        <Card style={styles.basicInfoCard}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleIndicator} />
              <CardTitle>Basic Information</CardTitle>
            </View>
          </CardHeader>
          <CardContent style={styles.basicInfoContent}>
            {basicInfoFields.map((field, index) => {
              const colors = ['#ff6b6b', '#4ecdc4', '#ffa726', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
              return (
                <View key={index} style={styles.basicInfoItem}>
                  <View style={styles.basicInfoHeader}>
                    <View style={[styles.basicInfoIcon, { backgroundColor: colors[index % colors.length] }]}>
                      <Text style={styles.basicInfoIconText}>{field.icon}</Text>
                    </View>
                    <View style={styles.basicInfoDetails}>
                      <Text style={styles.basicInfoLabel}>{field.label}</Text>
                      {editingField === field.field ? (
                        <View style={styles.inlineEditContainer}>
                          {(field.field === 'lastPeriodDate' || field.field === 'dob') ? (
                            <TouchableOpacity 
                              style={styles.inlineDateButton}
                              onPress={() => showDatePickerModal(field.field)}
                            >
                              <Text style={styles.inlineDateText}>
                                {editingValue || 'Select date'}
                              </Text>
                              <MaterialIcons name="calendar-today" size={16} color="#6b7280" />
                            </TouchableOpacity>
                          ) : field.field === 'gender' ? (
                            <TouchableOpacity 
                              style={styles.inlinePickerButton}
                              onPress={() => {
                                setPickerTitle('Select Gender');
                                setPickerOptions([
                                  { label: 'Female', value: 'FEMALE' },
                                  { label: 'Male', value: 'MALE' },
                                  { label: 'Non-binary', value: 'NON_BINARY' },
                                  { label: 'Other', value: 'OTHER' },
                                ]);
                                setShowPickerModal(true);
                              }}
                            >
                              <Text style={styles.inlinePickerText}>
                                {editingValue || 'Select Gender'}
                              </Text>
                              <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
                            </TouchableOpacity>
                          ) : field.field === 'activityLevel' ? (
                            <TouchableOpacity 
                              style={styles.inlinePickerButton}
                              onPress={() => {
                                setPickerTitle('Select Activity Level');
                                setPickerOptions([
                                  { label: 'Sedentary', value: 'SEDENTARY' },
                                  { label: 'Light (1-3 days/week)', value: 'LIGHT' },
                                  { label: 'Moderate (3-5 days/week)', value: 'MODERATE' },
                                  { label: 'Active (6-7 days/week)', value: 'ACTIVE' },
                                  { label: 'Very Active', value: 'VERY_ACTIVE' },
                                ]);
                                setShowPickerModal(true);
                              }}
                            >
                              <Text style={styles.inlinePickerText}>
                                {editingValue || 'Select Activity Level'}
                              </Text>
                              <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
                            </TouchableOpacity>
                          ) : (
                            <TextInput
                              style={styles.inlineTextInput}
                              value={editingValue}
                              onChangeText={setEditingValue}
                              autoFocus={true}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              keyboardType={field.field === 'phoneNumber' ? 'phone-pad' : 'default'}
                              autoCapitalize={field.field === 'email' ? 'none' : 'words'}
                            />
                          )}
                          <View style={styles.inlineEditActions}>
                            <TouchableOpacity 
                              style={styles.inlineSaveButton}
                              onPress={handleFieldUpdate}
                              disabled={isUpdatingField}
                            >
                              <MaterialIcons name="check" size={16} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.inlineCancelButton}
                              onPress={handleFieldCancel}
                            >
                              <MaterialIcons name="close" size={16} color="#6b7280" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          onPress={() => handleFieldEdit(field.field, field.value)}
                          style={styles.inlineValueButton}
                        >
                          <Text style={styles.basicInfoValue}>{field.value}</Text>
                          <MaterialIcons name="edit" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </CardContent>
        </Card>

        {/* Current Goals */}
        <Card style={styles.goalsCard}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleIndicator} />
              <CardTitle>Current Goals</CardTitle>
            </View>
          </CardHeader>
          <CardContent style={styles.goalsContent}>
            {goals.map((goal, index) => {
              const colors = ['#ff6b6b', '#4ecdc4', '#ffa726', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];
              return (
                <View key={index} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    {editingField === goal.title ? (
                      <View style={styles.inlineEditContainer}>
                        <TextInput
                          style={styles.inlineTextInput}
                          value={editingValue}
                          onChangeText={setEditingValue}
                          autoFocus={true}
                          placeholder={`Enter ${goal.title.toLowerCase()}`}
                          keyboardType="numeric"
                        />
                        <View style={styles.inlineEditActions}>
                          <TouchableOpacity 
                            style={styles.inlineSaveButton}
                            onPress={handleFieldUpdate}
                            disabled={isUpdatingField}
                          >
                            <MaterialIcons name="check" size={16} color="white" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.inlineCancelButton}
                            onPress={handleFieldCancel}
                          >
                            <MaterialIcons name="close" size={16} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        onPress={() => handleFieldEdit(goal.title, goal.target.toString())}
                        style={styles.inlineValueButton}
                      >
                        <Text style={[styles.goalValue, { color: colors[index % colors.length] }]}>
                          {goal.target} {goal.unit}
                        </Text>
                        <MaterialIcons name="edit" size={16} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </CardContent>
        </Card>

        {/* Achievements - Hidden */}
        {/* <Card style={styles.achievementsCard}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleIndicator} />
              <CardTitle>Achievements</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                    <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card> */}

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === 0 && styles.firstMenuItem,
                  index === menuItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={() => handleMenuPress(item.screen)}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            <TouchableOpacity
              style={[styles.menuItem, styles.firstMenuItem]}
              onPress={() => setShowChangePasswordModal(true)}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#ffa72620' }]}>
                <MaterialIcons name="lock-outline" size={20} color="#ffa726" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Change Password</Text>
                <Text style={styles.menuSubtitle}>Update your account password</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.lastMenuItem]}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#ff6b6b20' }]}>
                <MaterialIcons name="logout" size={20} color="#ff6b6b" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </Text>
                <Text style={styles.menuSubtitle}>Sign out of your account</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </CardContent>
        </Card>
        </View>
      </ScrollView>

      {/* Edit Goal Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editingGoal?.title}</Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Target Value</Text>
              <TextInput
                style={styles.textInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={`Enter ${editingGoal?.title.toLowerCase()}`}
                keyboardType="numeric"
                autoFocus={true}
              />
              <Text style={styles.inputUnit}>Unit: {editingGoal?.unit}</Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]}
                onPress={handleUpdateGoal}
                disabled={isUpdating}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdating ? 'Updating...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Basic Info Modal */}
      <Modal
        visible={basicInfoEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBasicInfoEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editingBasicInfo?.label}</Text>
              <TouchableOpacity 
                onPress={() => setBasicInfoEditModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>{editingBasicInfo?.label}</Text>
              
              {/* Show date picker for date fields */}
              {(editingBasicInfo?.field === 'lastPeriodDate' || editingBasicInfo?.field === 'dob') ? (
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => showDatePickerModal(editingBasicInfo?.field || '')}
                >
                  <Text style={styles.datePickerText}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={styles.textInput}
                  value={basicInfoEditValue}
                  onChangeText={setBasicInfoEditValue}
                  placeholder={`Enter ${editingBasicInfo?.label.toLowerCase()}`}
                  autoFocus={true}
                />
              )}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setBasicInfoEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isUpdatingBasicInfo && styles.saveButtonDisabled]}
                onPress={handleUpdateBasicInfo}
                disabled={isUpdatingBasicInfo}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdatingBasicInfo ? 'Updating...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>


      {/* Picker Modal for Gender and Activity Level */}
      <Modal
        visible={showPickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>{pickerTitle}</Text>
              <TouchableOpacity 
                onPress={() => setShowPickerModal(false)}
                style={styles.pickerCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.pickerModalBody} showsVerticalScrollIndicator={false}>
              {pickerOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    editingValue === option.value && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    setEditingValue(option.value);
                    setShowPickerModal(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    editingValue === option.value && styles.pickerOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {editingValue === option.value && (
                    <MaterialIcons name="check-circle" size={24} color="#ff6b6b" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker && editingDateField !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setEditingDateField(null);
        }}
      >
        <View style={styles.datePickerModalOverlay}>
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerModalHeader}>
              <Text style={styles.datePickerModalTitle}>
                Select {editingDateField === 'dob' ? 'Date of Birth' : 'Last Period Date'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowDatePicker(false);
                  setEditingDateField(null);
                }}
                style={styles.datePickerCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePickerModalBody}>
              <DateTimePicker
                key={`${editingDateField}-${selectedDate.getTime()}`}
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={editingDateField === 'dob' ? new Date() : undefined}
                minimumDate={editingDateField === 'dob' ? new Date(1900, 0, 1) : undefined}
                textColor="#1f2937"
                style={styles.datePickerComponent}
              />
              
              <View style={styles.datePickerSelectedDate}>
                <Text style={styles.datePickerSelectedDateText}>
                  {Platform.OS === 'ios' 
                    ? selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : `Selected: ${selectedDate.toLocaleDateString()}`
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.datePickerModalFooter}>
              <TouchableOpacity 
                style={styles.datePickerCancelButton}
                onPress={() => {
                  setShowDatePicker(false);
                  setEditingDateField(null);
                }}
              >
                <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.datePickerConfirmButton}
                onPress={async () => {
                  setEditingValue(selectedDate.toLocaleDateString());
                  setShowDatePicker(false);
                  
                  // Update the field when confirmed
                  if (editingDateField && user) {
                    await handleFieldUpdateWithDate(editingDateField, selectedDate);
                    setEditingField(null);
                  }
                  
                  setEditingDateField(null);
                }}
                disabled={isUpdatingField}
              >
                <Text style={styles.datePickerConfirmButtonText}>
                  {isUpdatingField ? 'Updating...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseChangePasswordModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity 
                onPress={handleCloseChangePasswordModal}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Current Password */}
              <View style={styles.passwordInputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <MaterialIcons
                      name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                      size={24}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.passwordInputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password (min 8 characters)"
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <MaterialIcons
                      name={showNewPassword ? 'visibility' : 'visibility-off'}
                      size={24}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>
                  Password must be at least 8 characters long
                </Text>
              </View>

              {/* Confirm Password */}
              <View style={styles.passwordInputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                      size={24}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={styles.passwordError}>Passwords do not match</Text>
                )}
                {confirmPassword.length > 0 && newPassword === confirmPassword && (
                  <Text style={styles.passwordSuccess}>Passwords match</Text>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCloseChangePasswordModal}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton,
                  (isChangingPassword || !currentPassword || !newPassword || !confirmPassword) && styles.saveButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                <Text style={styles.saveButtonText}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7ed',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 16, // Reduced since header is separate
    paddingBottom: 100, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60, // Safe area from top
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fef7ed',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    zIndex: 10,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileCard: {
    backgroundColor: '#ffa726',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#ffa726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileContent: {
    padding: 32,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  memberText: {
    color: 'white',
    fontSize: 12,
  },
  goalsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIndicator: {
    width: 4,
    height: 32,
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
  },
  basicInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  basicInfoContent: {
    gap: 24,
  },
  basicInfoItem: {
    gap: 12,
  },
  basicInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  basicInfoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicInfoIconText: {
    fontSize: 20,
  },
  basicInfoDetails: {
    flex: 1,
    gap: 4,
  },
  basicInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  basicInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  goalsContent: {
    gap: 24,
  },
  goalItem: {
    gap: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  goalValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  editGoalButton: {
    padding: 4,
    borderRadius: 4,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    width: (width - 96) / 2,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  firstMenuItem: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  lastMenuItem: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  menuIcon: {
    padding: 12,
    borderRadius: 16,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '500',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  inputUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 4,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  passwordToggle: {
    padding: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordError: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  passwordSuccess: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
    marginLeft: 4,
  },
  cardHeader: {
    paddingBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  inlineEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#f9fafb',
  },
  inlineDateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  inlineDateText: {
    fontSize: 14,
    color: '#1f2937',
  },
  inlineEditActions: {
    flexDirection: 'row',
    gap: 4,
  },
  inlineSaveButton: {
    backgroundColor: '#10b981',
    borderRadius: 6,
    padding: 6,
  },
  inlineCancelButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 6,
  },
  inlineValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  datePickerContainer: {
    flex: 1,
    marginBottom: 8,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  iosDatePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
  },
  iosDatePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  iosDatePickerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  datePickerModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  datePickerCloseButton: {
    padding: 4,
  },
  datePickerModalBody: {
    marginBottom: 24,
    alignItems: 'center',
  },
  datePickerComponent: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 50,
  },
  datePickerSelectedDate: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  datePickerSelectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  datePickerModalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  datePickerCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  datePickerConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  datePickerConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  inlinePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  inlinePickerText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerCloseButton: {
    padding: 4,
  },
  pickerModalBody: {
    maxHeight: 400,
    flexGrow: 0,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerOptionSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  incompleteBanner: {
    marginBottom: 16,
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  incompleteBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  incompleteBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  incompleteBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  incompleteBannerMessage: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});