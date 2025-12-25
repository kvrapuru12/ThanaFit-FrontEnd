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
  const { logout, isLoading, user, refreshUserData } = useAuth();
  
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
  
  // Debug: Log user data
  console.log('Profile - user data:', user);
  
  // Fetch fresh user data when Profile component mounts
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        console.log('Profile - Fetching fresh user data from API...');
        await refreshUserData();
      } catch (error) {
        console.error('Profile - Failed to fetch fresh user data:', error);
      }
    };
    
    fetchFreshUserData();
  }, []); // Empty dependency array - run only on mount

  // Debug: Log when user object changes
  useEffect(() => {
    console.log('Profile - User object changed:', {
      userId: user?.id,
      targetProtein: user?.targetProtein,
      targetCarbs: user?.targetCarbs,
      targetFat: user?.targetFat,
      targetWaterLitres: user?.targetWaterLitres,
      targetSteps: user?.targetSteps,
      targetSleepHours: user?.targetSleepHours,
      targetWeight: user?.targetWeight,
      dailyCalorieIntakeTarget: user?.dailyCalorieIntakeTarget,
    });
  }, [user]);

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
      console.log('Updating goal via apiClient:', fieldName, updateData);
      const response = await apiClient.patch(`/users/${user.id}`, updateData);
      
      console.log('Goal update successful - Response:', response.data);

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

    setIsUpdatingBasicInfo(true);
    try {
      let valueToUpdate = basicInfoEditValue;
      
      // For date fields, format the date
      if (editingBasicInfo.field === 'lastPeriodDate' || editingBasicInfo.field === 'dob') {
        valueToUpdate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
      
      const updateData = {
        [editingBasicInfo.field]: valueToUpdate
      };

      // Use apiClient instead of direct fetch for proper token handling
      console.log('Updating basic info via apiClient:', updateData);
      const response = await apiClient.patch(`/users/${user.id}`, updateData);
      
      console.log('Basic info update successful - Response:', response.data);

      // Refresh user data
      await refreshUserData();
      
      setBasicInfoEditModalVisible(false);
      setEditingBasicInfo(null);
      setBasicInfoEditValue('');
      
      Alert.alert('Success', `${editingBasicInfo.label} updated successfully!`);
    } catch (error) {
      console.error('Update basic info error:', error);
      Alert.alert('Error', 'Failed to update basic info. Please try again.');
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
      const valueToUpdate = date.toISOString().split('T')[0];
      const updateData = {
        [field]: valueToUpdate
      };

      // Use apiClient instead of direct fetch for proper token handling
      console.log('Updating date field via apiClient:', field, updateData);
      const response = await apiClient.patch(`/users/${user.id}`, updateData);
      
      console.log('Date update successful - Response:', response.data);

      await refreshUserData();
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
      
      // For date fields, format the date
      if (editingField === 'lastPeriodDate' || editingField === 'dob') {
        valueToUpdate = selectedDate.toISOString().split('T')[0];
      }
      
      // Handle weight field - convert to number
      let updateData: any = {};
      if (backendFieldName) {
        // This is a goal field - convert to number and use backend field name
        const numValue = parseFloat(valueToUpdate);
        if (isNaN(numValue)) {
          throw new Error('Invalid number value');
        }
        updateData[backendFieldName] = numValue;
        console.log(`Updating goal field "${editingField}" -> "${backendFieldName}" with value:`, numValue);
      } else if (editingField === 'weight') {
        const numValue = parseFloat(valueToUpdate);
        updateData[editingField] = isNaN(numValue) ? null : numValue;
      } else {
        updateData[editingField] = valueToUpdate;
      }
      
      console.log('Update payload:', JSON.stringify(updateData, null, 2));

      // Use apiClient instead of direct fetch for proper token handling
      console.log('Calling apiClient.patch...');
      try {
        const response = await apiClient.patch(`/users/${user.id}`, updateData);
        
        console.log('Update successful - Response status:', response.status);
        console.log('Update successful - Response data:', response.data);
      } catch (error: any) {
        console.error('Update failed with error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error);
        
        if (error.status === 403) {
          throw new Error('Access forbidden. You may not have permission to update this user, or your session may have expired. Please log in again.');
        } else if (error.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw error;
      }

      // Refresh user data from backend
      console.log('Refreshing user data...');
      try {
        await refreshUserData();
        console.log('User data refreshed successfully');
        console.log('Updated user data:', user);
        
        // Force component re-render
        setRefreshKey(prev => prev + 1);
        
        // Wait a bit for state to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setEditingField(null);
        setEditingValue('');
        
        Alert.alert('Success', 'Field updated successfully!');
      } catch (refreshError) {
        console.error('Failed to refresh user data:', refreshError);
        // Still show success since the update worked
        setEditingField(null);
        setEditingValue('');
        Alert.alert('Success', 'Field updated, but refresh failed. Please reload the page.');
      }
    } catch (error) {
      console.error('Field update error:', error);
      Alert.alert('Error', 'Failed to update field. Please try again.');
    } finally {
      setIsUpdatingField(false);
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditingValue('');
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
  
  // Debug: Log user stats
  console.log('Profile - userStats:', userStats);
  console.log('Profile - user target fields:', {
    dailyCalorieIntakeTarget: user?.dailyCalorieIntakeTarget,
    targetProtein: user?.targetProtein,
    targetCarbs: user?.targetCarbs,
    targetFat: user?.targetFat,
    targetWaterLitres: user?.targetWaterLitres,
    targetSteps: user?.targetSteps,
    targetSleepHours: user?.targetSleepHours,
    targetWeight: user?.targetWeight,
  });

  // Memoize goals to ensure they update when user changes
  const goals = React.useMemo(() => {
    console.log('Recalculating goals array - refreshKey:', refreshKey);
    console.log('Current user target values:', {
      dailyCalorieIntakeTarget: user?.dailyCalorieIntakeTarget,
      targetProtein: user?.targetProtein,
      targetCarbs: user?.targetCarbs,
      targetFat: user?.targetFat,
      targetWaterLitres: user?.targetWaterLitres,
      targetSteps: user?.targetSteps,
      targetSleepHours: user?.targetSleepHours,
      targetWeight: user?.targetWeight,
    });
    
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
    { icon: "settings", label: "Settings", subtitle: "App preferences", color: "#ff6b6b", screen: "Settings" },
    { icon: "notifications", label: "Notifications", subtitle: "Manage alerts", color: "#4ecdc4", screen: "Notifications" },
    { icon: "security", label: "Privacy", subtitle: "Data & security", color: "#ffa726", screen: "Privacy" },
    { icon: "help", label: "Support", subtitle: "Get help", color: "#ff6b6b", screen: "Support" },
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
        <Button variant="outline" style={styles.editButton}>
          <MaterialIcons name="edit" size={16} color="#ff6b6b" />
          <Text style={styles.editButtonText}>Edit</Text>
        </Button>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
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

        {/* Sign Out */}
        <Card style={styles.signOutCard}>
          <CardContent style={styles.signOutContent}>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <View style={styles.signOutIcon}>
                <MaterialIcons name="logout" size={20} color="#ef4444" />
              </View>
              <View style={styles.signOutInfo}>
                <Text style={styles.signOutLabel}>
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </Text>
                <Text style={styles.signOutSubtitle}>Sign out of your account</Text>
              </View>
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
  editButton: {
    borderColor: '#ff6b6b',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
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
  signOutCard: {
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
  signOutContent: {
    padding: 0,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderRadius: 24,
  },
  signOutIcon: {
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
  },
  signOutInfo: {
    flex: 1,
  },
  signOutLabel: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '500',
    marginBottom: 4,
  },
  signOutSubtitle: {
    fontSize: 14,
    color: '#ef4444',
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
});