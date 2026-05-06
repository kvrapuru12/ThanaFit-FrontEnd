import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet, 
  TextInput,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './Input';
import { Button } from './ui/button';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VoiceRecorder } from './VoiceRecorder';
import { useAuth } from '../providers/AuthProvider';
import { useActivities } from '../hooks/useActivities';
import { useTodayWorkouts, TodayWorkout } from '../hooks/useTodayWorkouts';
import { dashboardApiService } from '../../infrastructure/services/dashboardApi';
import { startOfLocalDay, addLocalCalendarDays, isSameLocalDay, loggedAtIsoForBackdatedLocalDay } from '../../core/utils/dateUtils';
import { getActivityImageUrl } from '../utils/visualMappings';
import { showRowActionsMenu } from '../utils/showRowActionsMenu';
import { TabScreenHeader, TAB_SCREEN_HORIZONTAL_PADDING, tabScreenScrollTopInset } from './TabScreenHeader';

const { width } = Dimensions.get('window');
const TAB_BAR_CLEARANCE = 88;

interface ExerciseTrackingProps {
  navigation?: any;
}

export function ExerciseTracking({ navigation }: ExerciseTrackingProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const scrollBottomPadding = insets.bottom + TAB_BAR_CLEARANCE;

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

  const todayStart = startOfLocalDay(new Date());
  const isViewingToday = isSameLocalDay(selectedDate, todayStart);
  const addActionsDisabled = !isViewingToday || workoutsLoading;
  const emptyDayLabel = isViewingToday ? 'today' : 'on this date';
  const weekDays = useMemo(() => ['S', 'M', 'T', 'W', 'T', 'F', 'S'], []);
  const dateRailScrollRef = useRef<ScrollView>(null);
  const contentScrollRef = useRef<ScrollView>(null);
  const shouldSnapDateRailToEndRef = useRef(true);
  const dateItemGap = 10;
  const dateRailSidePadding = 8;
  const visibleDayCount = 7;
  const weekDayItemWidth = useMemo(() => {
    const availableWidth =
      screenWidth - TAB_SCREEN_HORIZONTAL_PADDING * 2 - dateRailSidePadding * 2 - dateItemGap * (visibleDayCount - 1);
    return Math.max(28, Math.floor(availableWidth / visibleDayCount));
  }, [screenWidth]);
  const weekDateItems = useMemo(() => {
    const totalPastDays = 120;
    const windowStart = addLocalCalendarDays(todayStart, -totalPastDays);
    return Array.from({ length: totalPastDays + 1 }, (_unused, dayOffset) => {
      const date = addLocalCalendarDays(windowStart, dayOffset);
      return {
        date,
        dayLabel: weekDays[date.getDay()],
        isFuture: date.getTime() > todayStart.getTime(),
      };
    });
  }, [todayStart, weekDays]);
  const scrollDateRailToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dateRailScrollRef.current?.scrollToEnd({ animated: false });
      });
    });
  }, []);
  const alignToCurrentWeek = useCallback(() => {
    setSelectedDate(startOfLocalDay(new Date()));
    shouldSnapDateRailToEndRef.current = true;
    scrollDateRailToEnd();
    requestAnimationFrame(() => {
      contentScrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [scrollDateRailToEnd, setSelectedDate]);

  const handleSelectDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      requestAnimationFrame(() => {
        contentScrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    },
    [setSelectedDate]
  );

  useEffect(() => {
    alignToCurrentWeek();
  }, [alignToCurrentWeek]);

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        contentScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      });
    }, [])
  );

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

    return {
      totalMinutes,
      totalCalories,
      totalWorkouts
    };
  };

  const summaryStats = calculateSummaryStats();

  // Handle voice log functionality (fallback for manual processing)
  const handleVoiceLog = (transcript: string) => {
    if (!navigation || addActionsDisabled) return;
    navigation.navigate('AddExercise', {
      onWorkoutAdded: refreshWorkouts,
      voiceNote: transcript,
      logDayStartMs: selectedDate.getTime(),
    });
  };

  // Handle successful voice log processing
  const handleVoiceLogSuccess = async (activityLog: any) => {
    // Refresh the workouts data to show the new entry
    await refreshWorkouts();
  };

  // Handle quick add functionality
  const handleQuickAdd = async (activity: any) => {
    if (addActionsDisabled) {
      return;
    }
    try {
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

      await dashboardApiService.createActivityLog(logData);

      // Refresh the workouts data
      await refreshWorkouts();

    } catch (error) {
      console.error('Failed to quick add activity:', error);
      Alert.alert('Error', 'Failed to add activity. Please try again.');
    }
  };

  return (
    <View style={styles.screenWrapper}>
    <ScrollView
      ref={contentScrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: tabScreenScrollTopInset(insets.top),
            paddingBottom: scrollBottomPadding,
          },
        ]}
      >
        <TabScreenHeader
          title="Exercise"
          subtitle="Track your workouts"
          hideLogo
        />
        <ScrollView
          ref={dateRailScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekStrip}
          contentContainerStyle={styles.weekStripContent}
          onContentSizeChange={() => {
            if (!shouldSnapDateRailToEndRef.current) return;
            scrollDateRailToEnd();
            shouldSnapDateRailToEndRef.current = false;
          }}
        >
          {weekDateItems.map((item, index) => (
            <Pressable
              key={item.date.toISOString()}
              style={({ pressed }) => [
                styles.weekDayColumn,
                {
                  width: weekDayItemWidth,
                  marginRight: index === weekDateItems.length - 1 ? 0 : dateItemGap,
                },
                pressed && styles.weekDayColumnPressed,
              ]}
              onPress={() => handleSelectDate(item.date)}
              disabled={workoutsLoading || item.isFuture}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}`}
            >
              <Text
                style={[
                  styles.weekDayLabel,
                  isSameLocalDay(item.date, selectedDate) && styles.weekDayLabelSelected,
                ]}
              >
                {item.dayLabel}
              </Text>
              <View
                style={[
                  styles.weekDayCircle,
                  isSameLocalDay(item.date, selectedDate) && styles.weekDayCircleSelected,
                  item.isFuture && styles.weekDayCircleDisabled,
                ]}
              >
                {isSameLocalDay(item.date, selectedDate) ? (
                  <MaterialIcons name="check" size={14} color="#ffffff" />
                ) : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>



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
          <CardHeader style={styles.workoutsCardHeader}>
            <View style={styles.cardTitle}>
              <View style={styles.titleIndicator} />
              <Text style={styles.cardTitleText}>
                {isViewingToday ? "Today's workouts" : 'Workouts for this day'}
              </Text>
            </View>
          </CardHeader>
          <CardContent style={styles.workoutsCardContent}>
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
                  <View key={workout.id} style={styles.workoutItem}>
                    <View style={styles.workoutThumbWrap}>
                      <ImageWithFallback
                        src={getActivityImageUrl({
                          name: workout.name,
                          category: workout.type,
                        })}
                        alt={workout.name}
                        width={64}
                        height={64}
                        style={styles.workoutThumbnail}
                      />
                    </View>
                    <View style={styles.workoutDetailsCol}>
                      <Text style={styles.workoutName} numberOfLines={2} ellipsizeMode="tail">
                        {workout.name}
                      </Text>
                      <Text style={styles.workoutMeta}>
                        {workout.type} · {workout.duration} · {workout.calories} cal
                      </Text>
                    </View>
                    <View style={styles.workoutCardMenuRail}>
                      <TouchableOpacity
                        style={styles.workoutRowMoreButton}
                        onPress={() =>
                          showRowActionsMenu({
                            title: workout.name || 'Workout',
                            onDelete: () => confirmDeleteWorkout(workout),
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Workout options"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="more-vert" size={22} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </View>
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
          <CardHeader style={styles.quickWorkoutsCardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.papayaIndicator]} />
              <Text style={styles.cardTitleText}>Quick Workouts</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.quickWorkoutsCardContent}>
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
              <View style={styles.quickWorkoutsList}>
                {quickWorkouts.map((activity) => (
                  <View key={activity.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseImageContainer}>
                      <ImageWithFallback
                        src={getActivityImageUrl({
                          name: activity.name,
                          category: activity.category,
                        })}
                        alt={activity.name}
                        width={64}
                        height={64}
                        style={styles.exerciseImage}
                      />
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{activity.name}</Text>
                      <Text style={styles.exerciseCalories}>
                        {Math.round(300 / activity.caloriesPerMinute)} min • {activity.caloriesPerMinute} cal/min
                      </Text>
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
          <CardHeader style={styles.popularCardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>Popular Exercises</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.popularCardContent}>
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
                      src={getActivityImageUrl({
                        name: activity.name,
                        category: activity.category,
                      })}
                      alt={activity.name}
                      width={64}
                      height={64}
                      style={styles.exerciseImage}
                    />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{activity.name}</Text>
                    <Text style={styles.exerciseCalories}>{activity.caloriesPerMinute} cal/min</Text>
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
    paddingHorizontal: TAB_SCREEN_HORIZONTAL_PADDING,
  },
  weekStrip: {
    marginTop: -2,
    marginBottom: 18,
  },
  weekStripContent: {
    paddingHorizontal: 8,
  },
  weekDayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  weekDayColumnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  weekDayLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  weekDayLabelSelected: {
    color: '#111827',
    fontWeight: '700',
  },
  weekDayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.25,
    borderColor: '#b6bcc6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  weekDayCircleSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  weekDayCircleDisabled: {
    opacity: 0.35,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  summaryCard: {
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryContent: {
    paddingVertical: 18,
    paddingHorizontal: 16,
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
    borderRadius: 20,
    marginBottom: 26,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  workoutsCardHeader: {
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  workoutsCardContent: {
    gap: 16,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  quickWorkoutsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 26,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  quickWorkoutsCardHeader: {
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  quickWorkoutsCardContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  quickWorkoutsList: {
    gap: 16,
  },
  popularCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 26,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  popularCardHeader: {
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  popularCardContent: {
    gap: 16,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-start',
    minHeight: 40,
  },
  titleIndicator: {
    width: 4,
    height: 22,
    backgroundColor: '#4ecdc4',
    borderRadius: 2,
  },
  papayaIndicator: {
    backgroundColor: '#ffa726',
  },
  paradiseIndicator: {
    backgroundColor: '#ff6b6b',
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'left',
    flex: 1,
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardContent: {
    gap: 16,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 12,
    overflow: 'visible',
  },
  workoutCardMenuRail: {
    justifyContent: 'center',
    flexShrink: 0,
    paddingLeft: 4,
  },
  workoutRowMoreButton: {
    padding: 4,
    flexShrink: 0,
  },
  workoutThumbWrap: {
    flexShrink: 0,
    alignSelf: 'center',
  },
  workoutThumbnail: {
    borderRadius: 16,
  },
  workoutDetailsCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: 6,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  workoutMeta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    width: '100%',
  },
  addWorkoutButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 20,
    gap: 8,
  },
  addWorkoutText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  voiceLogButton: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f0fdfa',
    borderWidth: 2,
    borderColor: '#4ecdc4',
    borderRadius: 20,
    gap: 8,
  },
  voiceLogText: {
    color: '#4ecdc4',
    fontSize: 16,
    fontWeight: '600',
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
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
  },
  exerciseImageContainer: {
    position: 'relative',
  },
  exerciseImage: {
    borderRadius: 16,
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