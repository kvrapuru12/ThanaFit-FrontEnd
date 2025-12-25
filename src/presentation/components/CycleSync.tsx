import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { Gender } from '../../core/domain/entities/User';
import { cycleApiService, Cycle, FoodRecommendation, ActivityRecommendation } from '../../infrastructure/services/cycleApi';

const { width } = Dimensions.get('window');

interface CycleSyncProps {
  navigation?: any;
}

interface CycleData {
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string;
  nextPeriodStart: string;
  ovulationDate: string;
  fertileWindow: {
    start: string;
    end: string;
  };
  currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  daysUntilNextPeriod: number;
}

export function CycleSync({ navigation }: CycleSyncProps) {
  const { user } = useAuth();
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPeriodLog, setShowPeriodLog] = useState(false);
  
  // Period log modal state
  const [periodStartDate, setPeriodStartDate] = useState<Date>(new Date());
  const [originalPeriodDate, setOriginalPeriodDate] = useState<Date | null>(null); // Track original date for cancel
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cycleLength, setCycleLength] = useState<string>('28');
  const [periodDuration, setPeriodDuration] = useState<string>('5');
  const [isCycleRegular, setIsCycleRegular] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingCycle, setExistingCycle] = useState<Cycle | null>(null);
  const [isEditingCycle, setIsEditingCycle] = useState(false);

  // Recommendations state
  const [foodRecommendations, setFoodRecommendations] = useState<FoodRecommendation | null>(null);
  const [activityRecommendations, setActivityRecommendations] = useState<ActivityRecommendation | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsTab, setRecommendationsTab] = useState<'food' | 'activity'>('food');

  // Only show for female users - handle both enum and string values
  const isFemale = user?.gender === Gender.FEMALE || (user?.gender as string) === 'FEMALE';
  
  // TEMPORARY: Allow all users for testing - remove this condition later
  // if (!user || !isFemale) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.errorContainer}>
  //         <MaterialIcons name="info" size={48} color="#d1d5db" />
  //         <Text style={styles.errorText}>CycleSync is only available for female users</Text>
  //       </View>
  //     </View>
  //   );
  // }

  // Helper function to format date as YYYY-MM-DD in local timezone (avoid timezone offset issues)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse date string (YYYY-MM-DD) in local timezone
  const parseDateLocal = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Initialize period start date from user profile if available (only once on mount)
  const hasInitializedDateRef = React.useRef(false);
  
  // Helper functions to calculate cycle dates (defined before useEffect that uses them)
  const calculateNextPeriod = (lastPeriodStart: string, cycleLength: number): string => {
    const date = parseDateLocal(lastPeriodStart);
    date.setDate(date.getDate() + cycleLength);
    return formatDateLocal(date);
  };

  const calculateOvulation = (lastPeriodStart: string, cycleLength: number): string => {
    const date = parseDateLocal(lastPeriodStart);
    date.setDate(date.getDate() + Math.floor(cycleLength / 2));
    return formatDateLocal(date);
  };

  const calculateFertileWindow = (lastPeriodStart: string, cycleLength: number): { start: string; end: string } => {
    const ovulationDate = parseDateLocal(lastPeriodStart);
    ovulationDate.setDate(ovulationDate.getDate() + Math.floor(cycleLength / 2));
    
    const start = new Date(ovulationDate);
    start.setDate(start.getDate() - 2);
    
    const end = new Date(ovulationDate);
    end.setDate(end.getDate() + 2);
    
    return {
      start: formatDateLocal(start),
      end: formatDateLocal(end)
    };
  };

  const calculateCurrentPhase = (lastPeriodStart: string, cycleLength: number): 'menstrual' | 'follicular' | 'ovulation' | 'luteal' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = parseDateLocal(lastPeriodStart);
    startDate.setHours(0, 0, 0, 0);
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayInCycle = daysSinceStart % cycleLength;
    
    if (dayInCycle < 5) return 'menstrual';
    if (dayInCycle < Math.floor(cycleLength / 2)) return 'follicular';
    if (dayInCycle === Math.floor(cycleLength / 2)) return 'ovulation';
    return 'luteal';
  };

  const calculateDaysUntilNextPeriod = (lastPeriodStart: string, cycleLength: number): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = parseDateLocal(lastPeriodStart);
    startDate.setHours(0, 0, 0, 0);
    const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayInCycle = daysSinceStart % cycleLength;
    return cycleLength - dayInCycle;
  };

  // Fetch recommendations based on cycle phase
  const fetchRecommendations = async (phase: string) => {
    try {
      setRecommendationsLoading(true);
      // Note: We only call this function when we have cycle data, so no need to check cycleData here
      
      const [foodRecs, activityRecs] = await Promise.all([
        cycleApiService.getFoodRecommendations(),
        cycleApiService.getActivityRecommendations()
      ]);
      setFoodRecommendations(foodRecs);
      setActivityRecommendations(activityRecs);
    } catch (error: any) {
      // Silently handle errors - recommendations are optional and require cycle data
      // Backend error occurs when no cycle records exist yet
      if (error?.status === 400 || error?.status === 500) {
        // Expected error when user hasn't logged any cycles yet
        console.log('Recommendations unavailable - user needs to log cycle data first');
      } else {
        console.error('Failed to fetch recommendations:', error);
      }
      // Don't set recommendations state on error - section will remain hidden
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    // Only initialize once when component mounts and user data is available
    if (user?.lastPeriodDate && !hasInitializedDateRef.current) {
      const parsedDate = parseDateLocal(user.lastPeriodDate);
      setPeriodStartDate(parsedDate);
      hasInitializedDateRef.current = true;
      console.log('Initializing periodStartDate from user profile:', parsedDate.toLocaleDateString());
    }
  }, [user?.lastPeriodDate]); // Only run when user data changes, but ref prevents multiple initializations

  // Fetch existing cycles and set up cycle data
  useEffect(() => {
    const fetchCycleData = async () => {
      try {
        setLoading(true);
        
        // Fetch most recent cycle if available
        const recentCycle = await cycleApiService.getMostRecentCycle(user?.id);
        if (recentCycle) {
          setExistingCycle(recentCycle);
          // DON'T set periodStartDate here - only set it when opening the modal
          // Use existing cycle data to populate form if opening modal
          setCycleLength(recentCycle.cycleLength.toString());
          setPeriodDuration(recentCycle.periodDuration.toString());
          setIsCycleRegular(recentCycle.isCycleRegular);
          
          // Calculate cycle data from existing cycle
          const cycleDataFromApi: CycleData = {
            cycleLength: recentCycle.cycleLength,
            periodLength: recentCycle.periodDuration,
            lastPeriodStart: recentCycle.periodStartDate,
            nextPeriodStart: calculateNextPeriod(recentCycle.periodStartDate, recentCycle.cycleLength),
            ovulationDate: calculateOvulation(recentCycle.periodStartDate, recentCycle.cycleLength),
            fertileWindow: calculateFertileWindow(recentCycle.periodStartDate, recentCycle.cycleLength),
            currentPhase: calculateCurrentPhase(recentCycle.periodStartDate, recentCycle.cycleLength),
            daysUntilNextPeriod: calculateDaysUntilNextPeriod(recentCycle.periodStartDate, recentCycle.cycleLength)
          };
          setCycleData(cycleDataFromApi);
          
          // Fetch recommendations only when we have real cycle data from backend
          fetchRecommendations(cycleDataFromApi.currentPhase);
        } else {
          // Use mock data if no cycle exists - don't fetch recommendations (backend requires real cycle data)
          const mockCycleData: CycleData = {
            cycleLength: 28,
            periodLength: 5,
            lastPeriodStart: user?.lastPeriodDate || '2025-09-20',
            nextPeriodStart: calculateNextPeriod(user?.lastPeriodDate || '2025-09-20', 28),
            ovulationDate: calculateOvulation(user?.lastPeriodDate || '2025-09-20', 28),
            fertileWindow: calculateFertileWindow(user?.lastPeriodDate || '2025-09-20', 28),
            currentPhase: calculateCurrentPhase(user?.lastPeriodDate || '2025-09-20', 28),
            daysUntilNextPeriod: calculateDaysUntilNextPeriod(user?.lastPeriodDate || '2025-09-20', 28)
          };
          setCycleData(mockCycleData);
          // Don't fetch recommendations - backend requires actual cycle records
        }
      } catch (error) {
        console.error('Failed to fetch cycle data:', error);
        // Use mock data on error - don't fetch recommendations
        const mockCycleData: CycleData = {
          cycleLength: 28,
          periodLength: 5,
          lastPeriodStart: user?.lastPeriodDate || '2025-09-20',
          nextPeriodStart: calculateNextPeriod(user?.lastPeriodDate || '2025-09-20', 28),
          ovulationDate: calculateOvulation(user?.lastPeriodDate || '2025-09-20', 28),
          fertileWindow: calculateFertileWindow(user?.lastPeriodDate || '2025-09-20', 28),
          currentPhase: calculateCurrentPhase(user?.lastPeriodDate || '2025-09-20', 28),
          daysUntilNextPeriod: calculateDaysUntilNextPeriod(user?.lastPeriodDate || '2025-09-20', 28)
        };
        setCycleData(mockCycleData);
        // Don't fetch recommendations on error
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      fetchCycleData();
    } else {
      setLoading(false);
    }
  }, [user?.id]); // Removed user?.lastPeriodDate from dependencies to prevent resets

  // Helper function to get food icon based on food name
  const getFoodIcon = (foodName: string): string => {
    const foodLower = foodName.toLowerCase();
    if (foodLower.includes('carb') || foodLower.includes('bread') || foodLower.includes('grain') || foodLower.includes('rice') || foodLower.includes('pasta')) {
      return 'bakery-dining';
    }
    if (foodLower.includes('fruit') || foodLower.includes('apple') || foodLower.includes('berry') || foodLower.includes('banana')) {
      return 'local-florist';
    }
    if (foodLower.includes('vegetable') || foodLower.includes('green') || foodLower.includes('leafy') || foodLower.includes('salad')) {
      return 'eco';
    }
    if (foodLower.includes('protein') || foodLower.includes('meat') || foodLower.includes('chicken') || foodLower.includes('fish') || foodLower.includes('egg')) {
      return 'local-dining';
    }
    if (foodLower.includes('fat') || foodLower.includes('oil') || foodLower.includes('avocado') || foodLower.includes('nut')) {
      return 'water-drop';
    }
    if (foodLower.includes('sugar') || foodLower.includes('sweet') || foodLower.includes('dessert') || foodLower.includes('candy')) {
      return 'cake';
    }
    if (foodLower.includes('processed') || foodLower.includes('fast food') || foodLower.includes('junk')) {
      return 'fast-food';
    }
    if (foodLower.includes('alcohol') || foodLower.includes('wine') || foodLower.includes('beer') || foodLower.includes('drink')) {
      return 'local-bar';
    }
    return 'restaurant';
  };

  // Helper function to get activity icon based on activity name
  const getActivityIcon = (activityName: string): string => {
    const activityLower = activityName.toLowerCase();
    if (activityLower.includes('yoga') || activityLower.includes('stretch') || activityLower.includes('gentle')) {
      return 'self-improvement';
    }
    if (activityLower.includes('walk')) {
      return 'directions-walk';
    }
    if (activityLower.includes('swim')) {
      return 'pool';
    }
    if (activityLower.includes('cardio') || activityLower.includes('low-impact')) {
      return 'favorite';
    }
    if (activityLower.includes('intensity') || activityLower.includes('heavy') || activityLower.includes('strength')) {
      return 'fitness-center';
    }
    if (activityLower.includes('run') || activityLower.includes('running')) {
      return 'directions-run';
    }
    return 'sports';
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'menstrual': return '#ff6b6b';
      case 'follicular': return '#4ecdc4';
      case 'ovulation': return '#ffa726';
      case 'luteal': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'menstrual': return 'favorite';
      case 'follicular': return 'trending-up';
      case 'ovulation': return 'star';
      case 'luteal': return 'trending-down';
      default: return 'help';
    }
  };

  const handleLogPeriod = async () => {
    // Pre-populate form with last cycle's info, but always create new entry
    console.log('Opening log period modal - fetching last cycle for pre-population...');
    
    // Fetch the most recent cycle to pre-populate form
    const recentCycle = await cycleApiService.getMostRecentCycle(user?.id);
    
    setIsEditingCycle(false); // Always false - we're creating new, not editing
    setExistingCycle(null);
    
    if (recentCycle) {
      // Pre-populate form with last cycle's data for convenience
      const cycleDate = parseDateLocal(recentCycle.periodStartDate);
      setPeriodStartDate(cycleDate);
      setCycleLength(recentCycle.cycleLength.toString());
      setPeriodDuration(recentCycle.periodDuration.toString());
      setIsCycleRegular(recentCycle.isCycleRegular);
      console.log('Pre-populating form with last cycle data:', {
        date: cycleDate.toLocaleDateString(),
        cycleLength: recentCycle.cycleLength,
        periodDuration: recentCycle.periodDuration,
        isCycleRegular: recentCycle.isCycleRegular
      });
    } else {
      // No previous cycle - use defaults or user's lastPeriodDate
      if (user?.lastPeriodDate) {
        const parsedDate = parseDateLocal(user.lastPeriodDate);
        setPeriodStartDate(parsedDate);
        console.log('Using lastPeriodDate from profile:', parsedDate.toLocaleDateString());
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setPeriodStartDate(today);
        console.log('No lastPeriodDate, using today:', today.toLocaleDateString());
      }
      // Reset form fields to defaults
      setCycleLength('28');
      setPeriodDuration('5');
      setIsCycleRegular(true);
    }
    
    setShowDatePicker(false); // Make sure date picker is closed when opening modal
    setShowPeriodLog(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log('handleDateChange called:', { 
      eventType: event?.type, 
      selectedDate, 
      platform: Platform.OS,
      hasSelectedDate: !!selectedDate 
    });
    
    if (Platform.OS === 'android') {
      // On Android, the native dialog handles the selection
      if (event.type === 'set' && selectedDate) {
        // Create a new Date object to ensure it's properly set
        // Reset time to midnight to avoid timezone issues
        const newDate = new Date(selectedDate);
        newDate.setHours(0, 0, 0, 0);
        setPeriodStartDate(newDate);
        setShowDatePicker(false);
        console.log('Date selected on Android - New date:', newDate);
        console.log('Date selected on Android - ISO:', newDate.toISOString());
        console.log('Date selected on Android - Local:', newDate.toLocaleDateString());
      } else if (event.type === 'dismissed') {
        // User cancelled - revert to original date
        if (originalPeriodDate) {
          setPeriodStartDate(new Date(originalPeriodDate));
          console.log('Date picker dismissed - reverted to original:', originalPeriodDate);
        }
        setShowDatePicker(false);
        console.log('Date picker dismissed on Android');
      }
    } else {
      // On iOS, just update the date - user will confirm with button
      if (selectedDate) {
        // Create a new Date object to ensure it's properly set
        // Reset time to midnight to avoid timezone issues
        const newDate = new Date(selectedDate);
        newDate.setHours(0, 0, 0, 0);
        setPeriodStartDate(newDate);
        console.log('Date updated on iOS - New date:', newDate);
        console.log('Date updated on iOS - ISO:', newDate.toISOString());
        console.log('Date updated on iOS - Local:', newDate.toLocaleDateString());
      }
    }
  };

  const handleConfirmDate = () => {
    console.log('Date confirmed on iOS - Final date:', periodStartDate);
    console.log('Date confirmed on iOS - ISO:', periodStartDate.toISOString());
    console.log('Date confirmed on iOS - Local:', periodStartDate.toLocaleDateString());
    setShowDatePicker(false);
    setOriginalPeriodDate(null); // Clear original date after confirmation
  };

  const handleCancelDate = () => {
    // Revert to original date if user cancels
    if (originalPeriodDate) {
      setPeriodStartDate(new Date(originalPeriodDate));
      console.log('Date picker cancelled - reverted to original:', originalPeriodDate);
    } else if (isEditingCycle && existingCycle) {
      setPeriodStartDate(new Date(existingCycle.periodStartDate));
      console.log('Date picker cancelled - reverted to cycle date:', existingCycle.periodStartDate);
    } else if (user?.lastPeriodDate) {
      const dateStr = user.lastPeriodDate;
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        setPeriodStartDate(parsedDate);
        console.log('Date picker cancelled - reverted to profile date:', parsedDate);
      }
    }
    setShowDatePicker(false);
    setOriginalPeriodDate(null);
    console.log('Date picker cancelled');
  };

  const handleSavePeriod = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try again.');
      return;
    }

    // Validate inputs
    const cycleLengthNum = parseInt(cycleLength, 10);
    const periodDurationNum = parseInt(periodDuration, 10);

    if (isNaN(cycleLengthNum) || cycleLengthNum < 21 || cycleLengthNum > 40) {
      Alert.alert('Invalid Input', 'Cycle length must be between 21 and 40 days.');
      return;
    }

    if (isNaN(periodDurationNum) || periodDurationNum < 1 || periodDurationNum > 10) {
      Alert.alert('Invalid Input', 'Period duration must be between 1 and 10 days.');
      return;
    }

    // Validate date - must be today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(periodStartDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      Alert.alert('Invalid Date', 'Period start date must be today or in the past.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure we have a valid date - format in local timezone to avoid offset issues
      const dateToUse = periodStartDate || new Date();
      dateToUse.setHours(0, 0, 0, 0); // Ensure time is midnight
      const periodStartDateStr = formatDateLocal(dateToUse); // Format as YYYY-MM-DD in local timezone
      console.log('Creating new period entry with date:', periodStartDateStr);
      console.log('Date object:', dateToUse);
      console.log('Date local string:', dateToUse.toLocaleDateString());

      // Always create a new cycle entry (POST) to track all periods
      console.log('Creating new cycle entry...');
      const response = await cycleApiService.createCycle({
        userId: user.id,
        periodStartDate: periodStartDateStr,
        cycleLength: cycleLengthNum,
        periodDuration: periodDurationNum,
        isCycleRegular: isCycleRegular
      });
      
      console.log('Period logged successfully:', response);
      Alert.alert('Success', 'Period logged successfully!');

      // Refresh cycle data - fetch fresh data from API
      console.log('Refreshing cycle data after save...');
      const recentCycle = await cycleApiService.getMostRecentCycle(user.id);
      if (recentCycle) {
        console.log('Refreshed cycle data:', recentCycle);
        setExistingCycle(recentCycle);
        const cycleDataFromApi: CycleData = {
          cycleLength: recentCycle.cycleLength,
          periodLength: recentCycle.periodDuration,
          lastPeriodStart: recentCycle.periodStartDate,
          nextPeriodStart: calculateNextPeriod(recentCycle.periodStartDate, recentCycle.cycleLength),
          ovulationDate: calculateOvulation(recentCycle.periodStartDate, recentCycle.cycleLength),
          fertileWindow: calculateFertileWindow(recentCycle.periodStartDate, recentCycle.cycleLength),
          currentPhase: calculateCurrentPhase(recentCycle.periodStartDate, recentCycle.cycleLength),
          daysUntilNextPeriod: calculateDaysUntilNextPeriod(recentCycle.periodStartDate, recentCycle.cycleLength)
        };
        setCycleData(cycleDataFromApi);
        // Update the period start date in the form to match the saved data
        const savedDate = parseDateLocal(recentCycle.periodStartDate);
        setPeriodStartDate(savedDate);
        console.log('Updated periodStartDate in form to:', savedDate.toLocaleDateString());
        
        // Refresh recommendations after saving - now we have cycle data
        fetchRecommendations(cycleDataFromApi.currentPhase);
      }

      setShowPeriodLog(false);
    } catch (error: any) {
      console.error('Failed to save period:', error);
      const errorMessage = error?.responseData?.message || error?.message || 'Failed to save period. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPeriod = () => {
    setShowPeriodLog(false);
    setShowDatePicker(false); // Close date picker if open
    setExistingCycle(null);
    setIsEditingCycle(false);
    setOriginalPeriodDate(null); // Clear original date
    console.log('Period log modal cancelled');
  };

  const handleLogSymptoms = () => {
    Alert.alert(
      'Log Symptoms',
      'Track your cycle symptoms and mood',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Symptoms', 
          onPress: () => {
            // In real app, this would open symptoms logging screen
            Alert.alert('Coming Soon', 'Symptom tracking will be available soon!');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Loading your cycle data...</Text>
        </View>
      </View>
    );
  }

  if (!cycleData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color="#d1d5db" />
          <Text style={styles.errorText}>Unable to load cycle data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>CycleSync</Text>
          <Text style={styles.subtitle}>Track your menstrual cycle</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Phase Card */}
        <Card style={styles.phaseCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, { backgroundColor: getPhaseColor(cycleData.currentPhase) }]} />
              <Text style={styles.cardTitleText}>Current Phase</Text>
            </View>
          </CardHeader>
        <CardContent style={styles.cardContent}>
          <View style={styles.phaseContainer}>
            <View style={[styles.phaseIcon, { backgroundColor: getPhaseColor(cycleData.currentPhase) }]}>
              <MaterialIcons 
                name={getPhaseIcon(cycleData.currentPhase)} 
                size={24} 
                color="white" 
              />
            </View>
            <View style={styles.phaseInfo}>
              <Text style={styles.phaseName}>{cycleData.currentPhase.charAt(0).toUpperCase() + cycleData.currentPhase.slice(1)}</Text>
              <Text style={styles.phaseDescription}>
                {cycleData.currentPhase === 'menstrual' && 'Your period is active'}
                {cycleData.currentPhase === 'follicular' && 'Preparing for ovulation'}
                {cycleData.currentPhase === 'ovulation' && 'Most fertile time'}
                {cycleData.currentPhase === 'luteal' && 'Post-ovulation phase'}
              </Text>
            </View>
          </View>
          </CardContent>
        </Card>

        {/* Recommendations Section */}
        <Card style={styles.recommendationsCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.recommendationsIndicator]} />
              <Text style={styles.cardTitleText}>Recommendations</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {/* Tab Switcher */}
            {(foodRecommendations || activityRecommendations || recommendationsLoading) && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, recommendationsTab === 'food' && styles.tabActive]}
                  onPress={() => setRecommendationsTab('food')}
                >
                  <MaterialIcons 
                    name="restaurant" 
                    size={18} 
                    color={recommendationsTab === 'food' ? '#ffffff' : '#6b7280'} 
                  />
                  <Text style={[styles.tabText, recommendationsTab === 'food' && styles.tabTextActive]}>
                    Food
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, recommendationsTab === 'activity' && styles.tabActive]}
                  onPress={() => setRecommendationsTab('activity')}
                >
                  <MaterialIcons 
                    name="fitness-center" 
                    size={18} 
                    color={recommendationsTab === 'activity' ? '#ffffff' : '#6b7280'} 
                  />
                  <Text style={[styles.tabText, recommendationsTab === 'activity' && styles.tabTextActive]}>
                    Activity
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Food Recommendations */}
              {recommendationsTab === 'food' && foodRecommendations && (
                <View style={styles.recommendationsContent}>
                  <View style={styles.recommendationSection}>
                    <View style={styles.recommendationList}>
                      {foodRecommendations.recommendedFoods.map((food, index) => (
                        <View key={index} style={styles.recommendationBadge}>
                          <MaterialIcons name={getFoodIcon(food) as any} size={18} color="#10b981" />
                          <Text style={styles.recommendationBadgeText}>{food}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.recommendationDivider} />

                  <View style={styles.recommendationSection}>
                    <View style={styles.recommendationList}>
                      {foodRecommendations.avoid.map((item, index) => (
                        <View key={index} style={[styles.recommendationBadge, styles.recommendationBadgeAvoid]}>
                          <MaterialIcons name={getFoodIcon(item) as any} size={18} color="#ef4444" />
                          <Text style={[styles.recommendationBadgeText, styles.recommendationBadgeTextAvoid]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Activity Recommendations */}
              {recommendationsTab === 'activity' && activityRecommendations && (
                <View style={styles.recommendationsContent}>
                  <View style={styles.recommendationSection}>
                    <View style={styles.recommendationList}>
                      {activityRecommendations.recommendedWorkouts.map((workout, index) => (
                        <View key={index} style={styles.recommendationBadge}>
                          <MaterialIcons name={getActivityIcon(workout) as any} size={18} color="#10b981" />
                          <Text style={styles.recommendationBadgeText}>{workout}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.recommendationDivider} />

                  <View style={styles.recommendationSection}>
                    <View style={styles.recommendationList}>
                      {activityRecommendations.avoid.map((item, index) => (
                        <View key={index} style={[styles.recommendationBadge, styles.recommendationBadgeAvoid]}>
                          <MaterialIcons name={getActivityIcon(item) as any} size={18} color="#ef4444" />
                          <Text style={[styles.recommendationBadgeText, styles.recommendationBadgeTextAvoid]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

            {recommendationsLoading && (
              <View style={styles.recommendationsLoading}>
                <ActivityIndicator size="small" color="#4ecdc4" />
                <Text style={styles.recommendationsLoadingText}>Loading recommendations...</Text>
              </View>
            )}

            {!recommendationsLoading && !foodRecommendations && !activityRecommendations && (
              <View style={styles.recommendationsEmpty}>
                <MaterialIcons name="info-outline" size={24} color="#9ca3af" />
                <Text style={styles.recommendationsEmptyText}>
                  Log your cycle to see personalized recommendations
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Cycle Overview & Important Dates - Combined */}
        <Card style={styles.combinedCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>Cycle Overview</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {/* Overview Stats */}
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{cycleData.cycleLength}</Text>
                <Text style={styles.overviewLabel}>Cycle Length</Text>
                <Text style={styles.overviewUnit}>days</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{cycleData.periodLength}</Text>
                <Text style={styles.overviewLabel}>Period Length</Text>
                <Text style={styles.overviewUnit}>days</Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{cycleData.daysUntilNextPeriod}</Text>
                <Text style={styles.overviewLabel}>Days Until</Text>
                <Text style={styles.overviewUnit}>Next Period</Text>
              </View>
            </View>

            {/* Log Period Button */}
            <View style={styles.logPeriodButtonContainer}>
              <TouchableOpacity 
                style={styles.logPeriodButton}
                onPress={handleLogPeriod}
              >
                <View style={styles.logPeriodButtonIcon}>
                  <MaterialIcons name="favorite" size={18} color="#ffffff" />
                </View>
                <Text style={styles.logPeriodButtonText}>Log Period</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Important Dates */}
            <View style={styles.datesSection}>
              <Text style={styles.datesSectionTitle}>Important Dates</Text>
              <View style={styles.dateItem}>
                <MaterialIcons name="event" size={20} color="#ff6b6b" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>Next Period</Text>
                  <Text style={styles.dateValue}>{cycleData.nextPeriodStart}</Text>
                </View>
              </View>
              <View style={styles.dateItem}>
                <MaterialIcons name="star" size={20} color="#ffa726" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>Ovulation</Text>
                  <Text style={styles.dateValue}>{cycleData.ovulationDate}</Text>
                </View>
              </View>
              <View style={[styles.dateItem, styles.dateItemLast]}>
                <MaterialIcons name="favorite" size={20} color="#4ecdc4" />
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>Fertile Window</Text>
                  <Text style={styles.dateValue}>{cycleData.fertileWindow.start} - {cycleData.fertileWindow.end}</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Cycle Phases Info */}
        <Card style={styles.phasesInfoCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.forestIndicator]} />
              <Text style={styles.cardTitleText}>Cycle Phases</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {['menstrual', 'follicular', 'ovulation', 'luteal'].map((phase) => (
              <View key={phase} style={styles.phaseInfoItem}>
                <View style={[styles.phaseDot, { backgroundColor: getPhaseColor(phase) }]} />
                <View style={styles.phaseInfoText}>
                  <Text style={styles.phaseInfoName}>
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </Text>
                  <Text style={styles.phaseInfoDescription}>
                    {phase === 'menstrual' && 'Days 1-5: Menstrual bleeding'}
                    {phase === 'follicular' && 'Days 6-13: Follicle development'}
                    {phase === 'ovulation' && 'Day 14: Egg release'}
                    {phase === 'luteal' && 'Days 15-28: Corpus luteum phase'}
                  </Text>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>
      </ScrollView>

      {/* Period Log Modal */}
      <Modal
        visible={showPeriodLog}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelPeriod}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Log Period Start
              </Text>
              <TouchableOpacity onPress={handleCancelPeriod}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Period Start Date */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Period Start Date *</Text>
                {!showDatePicker ? (
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      console.log('Date button pressed, showing date picker');
                      console.log('Current periodStartDate:', periodStartDate, 'ISO:', periodStartDate.toISOString());
                      // Store the original date when opening picker
                      setOriginalPeriodDate(new Date(periodStartDate));
                      setShowDatePicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="calendar-today" size={20} color="#4ecdc4" />
                    <Text style={styles.dateButtonText}>
                      {periodStartDate.toLocaleDateString()}
                    </Text>
                    <MaterialIcons name="chevron-right" size={20} color="#9ca3af" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={handleCancelDate}>
                        <Text style={styles.datePickerButton}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>Select Date</Text>
                      <TouchableOpacity onPress={handleConfirmDate}>
                        <Text style={[styles.datePickerButton, styles.datePickerConfirm]}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.datePickerBody}>
                      <DateTimePicker
                        key={`date-picker-${periodStartDate.getTime()}`}
                        value={periodStartDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        textColor="#1f2937"
                        style={styles.datePickerComponent}
                      />
                      {Platform.OS === 'android' && (
                        <View style={styles.datePickerSelectedDate}>
                          <Text style={styles.datePickerSelectedDateText}>
                            Selected: {periodStartDate.toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                      {Platform.OS === 'ios' && (
                        <View style={styles.datePickerSelectedDate}>
                          <Text style={styles.datePickerSelectedDateText}>
                            Selected: {periodStartDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* Cycle Length */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Cycle Length (days)</Text>
                <Text style={styles.formHint}>Between 21-40 days (default: 28)</Text>
                <TextInput
                  style={styles.textInput}
                  value={cycleLength}
                  onChangeText={setCycleLength}
                  placeholder="28"
                  keyboardType="numeric"
                />
              </View>

              {/* Period Duration */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Period Duration (days)</Text>
                <Text style={styles.formHint}>Between 1-10 days (default: 5)</Text>
                <TextInput
                  style={styles.textInput}
                  value={periodDuration}
                  onChangeText={setPeriodDuration}
                  placeholder="5"
                  keyboardType="numeric"
                />
              </View>

              {/* Is Cycle Regular */}
              <View style={styles.formField}>
                <View style={styles.switchContainer}>
                  <View style={styles.switchLabelContainer}>
                    <Text style={styles.formLabel}>Regular Cycle</Text>
                    <Text style={styles.formHint}>Is your cycle regular?</Text>
                  </View>
                  <Switch
                    value={isCycleRegular}
                    onValueChange={setIsCycleRegular}
                    trackColor={{ false: '#d1d5db', true: '#4ecdc4' }}
                    thumbColor={isCycleRegular ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelPeriod}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                onPress={handleSavePeriod}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Save
                  </Text>
                )}
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
    color: '#4ecdc4',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  phaseCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#4ecdc4',
  },
  combinedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 20,
    marginHorizontal: -4,
  },
  datesSection: {
    marginTop: 4,
  },
  datesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phasesInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  paradiseIndicator: {
    backgroundColor: '#ff6b6b',
  },
  sunsetIndicator: {
    backgroundColor: '#ffa726',
  },
  oceanIndicator: {
    backgroundColor: '#4ecdc4',
  },
  forestIndicator: {
    backgroundColor: '#8b5cf6',
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  phaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  overviewUnit: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  logPeriodButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  logPeriodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  logPeriodButtonIcon: {
    marginRight: 6,
  },
  logPeriodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dateItemLast: {
    borderBottomWidth: 0,
  },
  dateInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  phaseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  phaseInfoText: {
    flex: 1,
  },
  phaseInfoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  phaseInfoDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  // Recommendations section styles
  recommendationsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  recommendationsIndicator: {
    backgroundColor: '#f59e0b',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#4ecdc4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  recommendationsContent: {
    gap: 0,
  },
  recommendationSection: {
    marginBottom: 0,
  },
  recommendationDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
    marginHorizontal: -4,
  },
  recommendationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 0,
    gap: 8,
  },
  recommendationBadgeAvoid: {
    backgroundColor: '#fef2f2',
  },
  recommendationBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
    lineHeight: 16,
  },
  recommendationBadgeTextAvoid: {
    color: '#991b1b',
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  reasoningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  recommendationsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  recommendationsLoadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  recommendationsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  recommendationsEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  formField: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  formHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 56,
  },
  dateButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  textInput: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#1f2937',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelContainer: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#4ecdc4',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Date picker styles
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  datePickerButton: {
    fontSize: 16,
    color: '#6b7280',
    padding: 8,
  },
  datePickerConfirm: {
    color: '#4ecdc4',
    fontWeight: '600',
  },
  datePickerBody: {
    padding: Platform.OS === 'ios' ? 16 : 0,
    alignItems: 'center',
  },
  datePickerComponent: {
    width: Platform.OS === 'ios' ? '100%' : 'auto',
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
  datePickerSelectedDate: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  datePickerSelectedDateText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
