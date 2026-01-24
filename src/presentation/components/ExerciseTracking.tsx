import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './Input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VoiceRecorder } from './VoiceRecorder';
import { useAuth } from '../providers/AuthProvider';
import { useActivities } from '../hooks/useActivities';
import { useTodayWorkouts } from '../hooks/useTodayWorkouts';
import { dashboardApiService } from '../../infrastructure/services/dashboardApi';
import { hasVoiceLogAccess } from '../../core/utils/roleUtils';

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
  const { todaysWorkouts, isLoading: workoutsLoading, error: workoutsError, refresh: refreshWorkouts } = useTodayWorkouts();
  
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
    
    // Navigate to AddExercise screen with voice transcript pre-filled
    navigation?.navigate?.('AddExercise', { 
      onWorkoutAdded: refreshWorkouts,
      voiceNote: transcript 
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

      // Create activity log with default values
      const logData = {
        userId: user.id,
        activityId: activity.id,
        loggedAt: new Date().toISOString().split('.')[0] + 'Z', // Remove milliseconds but keep 'Z'
        durationMinutes: 30, // Default 30 minutes for quick add
        note: `Quick add: ${activity.name}`
      };

      console.log('Creating activity log with data:', logData);
      
      const result = await dashboardApiService.createActivityLog(logData);
      console.log('Activity log created successfully:', result);

      // Refresh the workouts data
      await refreshWorkouts();

      Alert.alert(
        'Success!', 
        `${activity.name} has been added to your workouts!`,
        [
          {
            text: 'OK',
            onPress: () => console.log('Quick add completed')
          }
        ]
      );

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Exercise</Text>
            <Text style={styles.subtitle}>Track your workouts</Text>
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
              <Text style={styles.cardTitleText}>Today's Workouts</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {workoutsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4ecdc4" />
                <Text style={styles.loadingText}>Loading today's workouts...</Text>
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
                    <View style={styles.workoutInfo}>
                      <View style={styles.workoutIcon}>
                        <MaterialIcons name="fitness-center" size={24} color="white" />
                      </View>
                      <View style={styles.workoutDetails}>
                        <Text style={styles.workoutName}>{workout.name}</Text>
                        <Text style={styles.workoutMeta}>
                          {workout.time} • {workout.duration} • {workout.calories} cal
                        </Text>
                      </View>
                    </View>
                    <Badge variant="secondary" style={styles.workoutBadge}>
                      {workout.type}
                    </Badge>
                  </View>
                ))}
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.addWorkoutButton}
                    onPress={() => {
                      console.log('=== EXERCISE TRACKING DEBUG ===');
                      console.log('refreshWorkouts function:', refreshWorkouts);
                      console.log('Navigation object:', navigation);
                      navigation?.navigate?.('AddExercise', { onWorkoutAdded: refreshWorkouts });
                    }}
                  >
                    <MaterialIcons name="add" size={20} color="#ff6b6b" />
                    <Text style={styles.addWorkoutText}>Add Exercise</Text>
                  </TouchableOpacity>
                  
                  {hasVoiceLogAccess(user) && (
                    <TouchableOpacity 
                      style={styles.voiceLogButton}
                      onPress={() => setShowVoiceRecorder(true)}
                    >
                      <MaterialIcons name="mic" size={20} color="#4ecdc4" />
                      <Text style={styles.voiceLogText}>Voice Log</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="fitness-center" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No workouts logged today</Text>
                <Text style={styles.emptyStateSubtext}>Start tracking your exercises to see them here</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.addWorkoutButton}
                    onPress={() => {
                      console.log('=== EXERCISE TRACKING DEBUG ===');
                      console.log('refreshWorkouts function:', refreshWorkouts);
                      console.log('Navigation object:', navigation);
                      navigation?.navigate?.('AddExercise', { onWorkoutAdded: refreshWorkouts });
                    }}
                  >
                    <MaterialIcons name="add" size={20} color="#ff6b6b" />
                    <Text style={styles.addWorkoutText}>Add Exercise</Text>
                  </TouchableOpacity>
                  
                  {hasVoiceLogAccess(user) && (
                    <TouchableOpacity 
                      style={styles.voiceLogButton}
                      onPress={() => setShowVoiceRecorder(true)}
                    >
                      <MaterialIcons name="mic" size={20} color="#4ecdc4" />
                      <Text style={styles.voiceLogText}>Voice Log</Text>
                    </TouchableOpacity>
                  )}
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
                      style={styles.addExerciseButton}
                      onPress={() => handleQuickAdd(activity)}
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
                    style={styles.addExerciseButton}
                    onPress={() => handleQuickAdd(activity)}
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

      {/* Voice Recorder Modal - Only show for PREMIUM and ADMIN users */}
      {hasVoiceLogAccess(user) && (
        <VoiceRecorder
          visible={showVoiceRecorder}
          onVoiceLog={handleVoiceLog}
          onVoiceLogSuccess={handleVoiceLogSuccess}
          userId={user?.id}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 24,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  workoutIcon: {
    backgroundColor: '#4ecdc4',
    padding: 12,
    borderRadius: 16,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  workoutBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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