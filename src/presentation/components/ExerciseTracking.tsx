import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './Input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VoiceRecorder } from './VoiceRecorder';
import { useAuth } from '../providers/AuthProvider';
import { useActivities } from '../hooks/useActivities';
import { useTodayWorkouts, TodayWorkout } from '../hooks/useTodayWorkouts';
import { dashboardApiService } from '../../infrastructure/services/dashboardApi';
import {
  startOfLocalDay,
  addLocalCalendarDays,
  isSameLocalDay,
  loggedAtIsoForBackdatedLocalDay,
} from '../../core/utils/dateUtils';

const { width } = Dimensions.get('window');

interface ExerciseTrackingProps {
  navigation?: any;
}

export function ExerciseTracking({ navigation }: ExerciseTrackingProps) {
  console.log('=== EXERCISE TRACKING COMPONENT LOADED ===');
  console.log('Category cards have been removed from this component');
  console.log('Start Workout button has been removed from this component');
  
  const { user } = useAuth();
  const { activities, quickWorkouts, isLoading: activitiesLoading, error: activitiesError } = useActivities();
  const {
    todaysWorkouts,
    isLoading: workoutsLoading,
    error: workoutsError,
    refresh: refreshWorkouts,
    deleteWorkout,
    selectedDate,
    setSelectedDate,
  } = useTodayWorkouts();

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [draftPickerDate, setDraftPickerDate] = useState(() => startOfLocalDay(new Date()));

  const todayStart = startOfLocalDay(new Date());
  const isViewingToday = isSameLocalDay(selectedDate, todayStart);
  const canGoNextDay = selectedDate.getTime() < todayStart.getTime();
  const addActionsDisabled = !isViewingToday || workoutsLoading;
  const emptyDayLabel = isViewingToday ? 'today' : 'on this date';

  const openDatePicker = () => {
    setDraftPickerDate(selectedDate);
    setDatePickerVisible(true);
  };

  const handlePickerChange = (_event: unknown, date?: Date) => {
    if (date) {
      const normalized = startOfLocalDay(date);
      const max = startOfLocalDay(new Date());
      setDraftPickerDate(normalized.getTime() > max.getTime() ? max : normalized);
    }
  };

  const confirmPickerDate = () => {
    setSelectedDate(draftPickerDate);
    setDatePickerVisible(false);
  };

  const goToAddExercise = () => {
    if (!navigation || addActionsDisabled) return;
    navigation.navigate('AddExercise', {
      onWorkoutAdded: refreshWorkouts,
      logDayStartMs: selectedDate.getTime(),
    });
  };

  const confirmDeleteWorkout = (workout: TodayWorkout) => {
    Alert.alert(
      'Delete workout',
      `Remove "${workout.name}" from your log${isViewingToday ? ' for today' : ' for this day'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteWorkout(workout.id);
              } catch {
                Alert.alert('Error', 'Could not delete this workout. Please try again.');
              }
            })();
          },
        },
      ]
    );
  };
  
  // Voice recording state
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Calculate real summary statistics from backend data
  const calculateSummaryStats = () => {
    if (!todaysWorkouts || todaysWorkouts.length === 0) {
      return {
        totalMinutes: 0,
        totalCalories: 0,
        totalWorkouts: 0
      };
    }

    const totalMinutes = todaysWorkouts.reduce((sum, workout) => {
      // Extract minutes from duration string like "40 min"
      const minutes = parseInt(workout.duration.replace(' min', '')) || 0;
      return sum + minutes;
    }, 0);

    const totalCalories = todaysWorkouts.reduce((sum, workout) => sum + workout.calories, 0);
    const totalWorkouts = todaysWorkouts.length;

    console.log('=== SUMMARY STATS CALCULATION ===');
    console.log('Total minutes:', totalMinutes);
    console.log('Total calories:', totalCalories);
    console.log('Total workouts:', totalWorkouts);
    console.log('===============================');

    return {
      totalMinutes,
      totalCalories,
      totalWorkouts
    };
  };

  const summaryStats = calculateSummaryStats();

  // Handle voice log functionality (fallback for manual processing)
  const handleVoiceLog = (transcript: string) => {
    console.log('=== VOICE LOG RECEIVED (MANUAL) ===');
    console.log('Transcript:', transcript);
    if (!navigation || addActionsDisabled) return;
    navigation.navigate('AddExercise', {
      onWorkoutAdded: refreshWorkouts,
      voiceNote: transcript,
      logDayStartMs: selectedDate.getTime(),
    });
  };

  // Handle successful voice log processing
  const handleVoiceLogSuccess = async (activityLog: any) => {
    console.log('=== VOICE LOG SUCCESS ===');
    console.log('Activity log created:', activityLog);
    
    // Refresh the workouts data to show the new entry
    await refreshWorkouts();
    
    // Show success message (optional, since VoiceRecorder already shows one)
    console.log('Workout data refreshed successfully');
  };

  // Handle quick add functionality
  const handleQuickAdd = async (activity: any) => {
    if (addActionsDisabled) {
      return;
    }
    try {
      console.log('=== QUICK ADD DEBUG ===');
      console.log('Adding activity:', activity.name);
      console.log('Activity ID:', activity.id);
      console.log('User ID:', user?.id);
      console.log('========================');

      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const backdatedLoggedAt = loggedAtIsoForBackdatedLocalDay(selectedDate);
      const loggedAt =
        backdatedLoggedAt ?? new Date().toISOString().split('.')[0] + 'Z';

      // Create activity log with default values
      const logData = {
        userId: user.id,
        activityId: activity.id,
        loggedAt,
        durationMinutes: 30, // Default 30 minutes for quick add
        note: `Quick add: ${activity.name}`
      };

      console.log('Creating activity log with data:', logData);
      
      const result = await dashboardApiService.createActivityLog(logData);
      console.log('Activity log created successfully:', result);

      // Refresh the workouts data
      await refreshWorkouts();

    } catch (error) {
      console.error('Failed to quick add activity:', error);
      Alert.alert('Error', 'Failed to add activity. Please try again.');
    }
  };





  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return styles.easyBadge;
      case 'medium': return styles.mediumBadge;
      case 'hard': return styles.hardBadge;
      default: return styles.defaultBadge;
    }
  };

  return (
    <View style={styles.screenWrapper}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Exercise</Text>
            <Text style={styles.subtitle}>Track your workouts</Text>
            <View style={styles.dateNavRow}>
              <TouchableOpacity
                accessibilityLabel="Previous day"
                onPress={() => setSelectedDate(addLocalCalendarDays(selectedDate, -1))}
                style={styles.dateArrowButton}
                disabled={workoutsLoading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="chevron-left" size={20} color="#ff6b6b" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTextButton}
                onPress={openDatePicker}
                disabled={workoutsLoading}
                accessibilityRole="button"
                accessibilityLabel="Open date picker"
              >
                <MaterialIcons name="event" size={16} color="#ff6b6b" />
                <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Next day"
                onPress={() => {
                  if (canGoNextDay) {
                    setSelectedDate(addLocalCalendarDays(selectedDate, 1));
                  }
                }}
                style={styles.dateArrowButton}
                disabled={!canGoNextDay || workoutsLoading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={canGoNextDay ? '#ff6b6b' : '#d1d5db'}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.thanafitLogo}>
            <Image
              source={require('../../../assets/logo-icon.png')}
              style={styles.thanafitLogoImage}
              resizeMode="contain"
            />
          </View>
        </View>



        {/* Today's Summary */}
        <Card style={styles.summaryCard}>
          <CardContent style={styles.summaryContent}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="access-time" size={24} color="rgba(255,255,255,0.8)" />
                <Text style={styles.summaryNumber}>{summaryStats.totalMinutes}</Text>
                <Text style={styles.summaryLabel}>Minutes</Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialIcons name="flash-on" size={24} color="rgba(255,255,255,0.8)" />
                <Text style={styles.summaryNumber}>{summaryStats.totalCalories}</Text>
                <Text style={styles.summaryLabel}>Calories</Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialIcons name="fitness-center" size={24} color="rgba(255,255,255,0.8)" />
                <Text style={styles.summaryNumber}>{summaryStats.totalWorkouts}</Text>
                <Text style={styles.summaryLabel}>Workouts</Text>
              </View>
            </View>
          </CardContent>
        </Card>


        {/* Today's Workouts */}
        <Card style={styles.workoutsCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={styles.titleIndicator} />
              <Text style={styles.cardTitleText}>
                {isViewingToday ? "Today's workouts" : 'Workouts for this day'}
              </Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {workoutsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ecdc4" />
                <Text style={styles.loadingText}>Loading workouts...</Text>
              </View>
            ) : workoutsError ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                <Text style={styles.errorText}>{workoutsError}</Text>
              </View>
            ) : todaysWorkouts.length > 0 ? (
              <>
                {todaysWorkouts.map((workout) => (
                  <Swipeable
                    key={workout.id}
                    friction={2}
                    overshootRight={false}
                    renderRightActions={() => (
                      <TouchableOpacity
                        style={styles.workoutDeleteAction}
                        onPress={() => confirmDeleteWorkout(workout)}
                        accessibilityRole="button"
                        accessibilityLabel="Delete workout"
                      >
                        <MaterialIcons name="delete-outline" size={26} color="#ffffff" />
                        <Text style={styles.workoutDeleteActionText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  >
                    <View style={styles.workoutItem}>
                      <View style={styles.workoutIcon}>
                        <MaterialIcons name="fitness-center" size={24} color="white" />
                      </View>
                      <View style={styles.workoutDetailsCol}>
                        <View style={styles.workoutTitleRow}>
                          <Text style={styles.workoutName} numberOfLines={1} ellipsizeMode="tail">
                            {workout.name}
                          </Text>
                          <View style={styles.workoutBadgeWrap}>
                            <Badge variant="destructive" style={styles.workoutBadge}>
                              {workout.type}
                            </Badge>
                          </View>
                        </View>
                        <Text style={styles.workoutMeta}>
                          {workout.duration} · {workout.calories} cal
                        </Text>
                      </View>
                    </View>
                  </Swipeable>
                ))}
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.addWorkoutButton, addActionsDisabled && styles.actionDisabled]}
                    onPress={goToAddExercise}
                    disabled={addActionsDisabled}
                  >
                    <MaterialIcons name="add" size={20} color="#ff6b6b" />
                    <Text style={styles.addWorkoutText}>Add Exercise</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.voiceLogButton, addActionsDisabled && styles.actionDisabled]}
                    onPress={() => setShowVoiceRecorder(true)}
                    disabled={addActionsDisabled}
                  >
                    <MaterialIcons name="mic" size={20} color="#4ecdc4" />
                    <Text style={styles.voiceLogText}>Voice Log</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="fitness-center" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No workouts logged {emptyDayLabel}</Text>
                <Text style={styles.emptyStateSubtext}>
                  {isViewingToday
                    ? 'Start tracking your exercises to see them here'
                    : 'Switch to today to add workouts or use voice log.'}
                </Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.addWorkoutButton, addActionsDisabled && styles.actionDisabled]}
                    onPress={goToAddExercise}
                    disabled={addActionsDisabled}
                  >
                    <MaterialIcons name="add" size={20} color="#ff6b6b" />
                    <Text style={styles.addWorkoutText}>Add Exercise</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.voiceLogButton, addActionsDisabled && styles.actionDisabled]}
                    onPress={() => setShowVoiceRecorder(true)}
                    disabled={addActionsDisabled}
                  >
                    <MaterialIcons name="mic" size={20} color="#4ecdc4" />
                    <Text style={styles.voiceLogText}>Voice Log</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Quick Workouts */}
        <Card style={styles.quickWorkoutsCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.papayaIndicator]} />
              <Text style={styles.cardTitleText}>Quick Workouts</Text>
            </View>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffa726" />
                <Text style={styles.loadingText}>Loading quick workouts...</Text>
              </View>
            ) : activitiesError ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                <Text style={styles.errorText}>{activitiesError}</Text>
              </View>
            ) : quickWorkouts.length > 0 ? (
              <View style={styles.cardContent}>
                {quickWorkouts.map((activity) => (
                  <View key={activity.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseImageContainer}>
                      <ImageWithFallback
                        src={`https://images.unsplash.com/photo-1545186079-85b6e2424f28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwZXhlcmNpc2UlMjBmaXRuZXNzfGVufDF8fHx8MTc1NzUzMzU1NXww&ixlib=rb-4.1.0&q=80&w=300`}
                        alt={activity.name}
                        width={64}
                        height={64}
                        style={styles.exerciseImage}
                      />
                      <View style={styles.exerciseBadge}>
                        <Text style={styles.exerciseBadgeText}>⚡</Text>
                      </View>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{activity.name}</Text>
                      <Text style={styles.exerciseCalories}>
                        {Math.round(300 / activity.caloriesPerMinute)} min • {activity.caloriesPerMinute} cal/min
                      </Text>
                      <View style={styles.exerciseBadges}>
                        <Badge variant="outline" style={styles.categoryBadge}>
                          {activity.category}
                        </Badge>
                        <Badge style={[styles.difficultyBadge, getDifficultyColor(activity.category)]}>
                          Quick
                        </Badge>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={[styles.addExerciseButton, addActionsDisabled && styles.actionDisabled]}
                      onPress={() => handleQuickAdd(activity)}
                      disabled={addActionsDisabled}
                    >
                      <MaterialIcons name="add" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="fitness-center" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No quick workouts available</Text>
                <Text style={styles.emptyStateSubtext}>Try adding some high-intensity activities</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Popular Exercises */}
        <Card style={styles.popularCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>Popular Exercises</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {activitiesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b6b" />
                <Text style={styles.loadingText}>Loading exercises...</Text>
              </View>
            ) : activitiesError ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                <Text style={styles.errorText}>{activitiesError}</Text>
              </View>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <View key={activity.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseImageContainer}>
                    <ImageWithFallback
                      src={`https://images.unsplash.com/photo-1545186079-85b6e2424f28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwZXhlcmNpc2UlMjBmaXRuZXNzfGVufDF8fHx8MTc1NzUzMzU1NXww&ixlib=rb-4.1.0&q=80&w=300`}
                      alt={activity.name}
                      width={64}
                      height={64}
                      style={styles.exerciseImage}
                    />
                    <View style={styles.exerciseBadge}>
                      <Text style={styles.exerciseBadgeText}>🏄‍♀️</Text>
                    </View>
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{activity.name}</Text>
                    <Text style={styles.exerciseCalories}>{activity.caloriesPerMinute} cal/min</Text>
                    <View style={styles.exerciseBadges}>
                      <Badge variant="outline" style={styles.categoryBadge}>
                        {activity.category}
                      </Badge>
                      <Badge style={[styles.difficultyBadge, getDifficultyColor(activity.category)]}>
                        {activity.visibility}
                      </Badge>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.addExerciseButton, addActionsDisabled && styles.actionDisabled]}
                    onPress={() => handleQuickAdd(activity)}
                    disabled={addActionsDisabled}
                  >
                    <MaterialIcons name="add" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="fitness-center" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No exercises found</Text>
                <Text style={styles.emptyStateSubtext}>Try searching for different activities</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>

      <Modal
        visible={datePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.datePickerModalOverlay}>
          <View style={styles.datePickerModalContent}>
            <View style={styles.datePickerModalHeader}>
              <Text style={styles.datePickerModalTitle}>Choose date</Text>
              <TouchableOpacity
                onPress={() => setDatePickerVisible(false)}
                style={styles.datePickerCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerModalBody}>
              <DateTimePicker
                key={draftPickerDate.getTime()}
                value={draftPickerDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
                maximumDate={todayStart}
                textColor="#1f2937"
                style={styles.datePickerComponent}
              />
              <View style={styles.datePickerSelectedDate}>
                <Text style={styles.datePickerSelectedDateText}>
                  {draftPickerDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.datePickerModalFooter}>
              <TouchableOpacity
                style={styles.datePickerCancelButton}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerConfirmButton}
                onPress={confirmPickerDate}
              >
                <Text style={styles.datePickerConfirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <VoiceRecorder
        visible={showVoiceRecorder}
        onVoiceLog={handleVoiceLog}
        onVoiceLogSuccess={handleVoiceLogSuccess}
        userId={user?.id}
        onClose={() => setShowVoiceRecorder(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#fef7ed',
  },
  container: {
    flex: 1,
    backgroundColor: '#fef7ed',
  },
  content: {
    padding: 24,
    paddingTop: 60, // More space from top
    paddingBottom: 100, // Space for bottom navigation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: 8,
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  dateArrowButton: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  dateTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    flexShrink: 1,
    minWidth: 0,
  },
  actionDisabled: {
    opacity: 0.45,
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
    alignSelf: 'stretch',
  },
  datePickerSelectedDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
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
    backgroundColor: '#4ecdc4',
    alignItems: 'center',
  },
  datePickerConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  thanafitLogo: {
    width: 80,
    height: 80,
  },
  thanafitLogoImage: {
    width: '100%',
    height: '100%',
  },
  summaryCard: {
    backgroundColor: '#ff6b6b',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryContent: {
    padding: 32,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  workoutsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickWorkoutsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    paddingBottom: 16,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'flex-start',
    height: 40,
  },
  titleIndicator: {
    width: 4,
    height: 24,
    backgroundColor: '#4ecdc4',
    borderRadius: 2,
    alignSelf: 'center',
  },
  papayaIndicator: {
    backgroundColor: '#ffa726',
  },
  paradiseIndicator: {
    backgroundColor: '#ff6b6b',
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'left',
    flex: 1,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardContent: {
    gap: 16,
  },
  workoutDeleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
    borderRadius: 24,
    marginLeft: 10,
  },
  workoutDeleteActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 24,
    gap: 16,
    overflow: 'visible',
  },
  workoutIcon: {
    backgroundColor: '#4ecdc4',
    padding: 12,
    borderRadius: 16,
    flexShrink: 0,
  },
  workoutDetailsCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 6,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  workoutName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  workoutMeta: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  workoutBadgeWrap: {
    flexShrink: 0,
  },
  workoutBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexShrink: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addWorkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 20,
    gap: 8,
  },
  addWorkoutText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
  },
  voiceLogButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0fdfa',
    borderWidth: 2,
    borderColor: '#4ecdc4',
    borderRadius: 20,
    gap: 8,
  },
  voiceLogText: {
    color: '#4ecdc4',
    fontSize: 14,
    fontWeight: '500',
  },
  quickWorkoutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickWorkoutItem: {
    width: (width - 96) / 2,
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 24,
  },
  quickWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  quickWorkoutIcon: {
    fontSize: 20,
  },
  quickWorkoutName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  quickWorkoutDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  quickWorkoutBadge: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
  },
  exerciseImageContainer: {
    position: 'relative',
  },
  exerciseImage: {
    borderRadius: 16,
  },
  exerciseBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    backgroundColor: 'white',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseBadgeText: {
    fontSize: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  exerciseCalories: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  exerciseBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryBadge: {
    backgroundColor: '#ffa726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  easyBadge: {
    backgroundColor: '#4ecdc4',
  },
  mediumBadge: {
    backgroundColor: '#ffa726',
  },
  hardBadge: {
    backgroundColor: '#ff6b6b',
  },
  defaultBadge: {
    backgroundColor: '#6b7280',
  },
  addExerciseButton: {
    backgroundColor: '#ffa726',
    padding: 8,
    borderRadius: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});