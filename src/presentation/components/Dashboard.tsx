import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../providers/AuthProvider';
import { useDashboardData } from '../hooks/useDashboardData';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, error, refresh } = useDashboardData();

  // Get appropriate activity icon based on activity name
  const getActivityIcon = (activityName: string): any => {
    const activityIcons: { [key: string]: string } = {
      'swimming': 'pool',
      'swim': 'pool',
      'run': 'directions-run',
      'running': 'directions-run',
      'jog': 'directions-run',
      'walk': 'directions-walk',
      'walking': 'directions-walk',
      'cycling': 'directions-bike',
      'bike': 'directions-bike',
      'weight': 'fitness-center',
      'weight training': 'fitness-center',
      'gym': 'fitness-center',
      'strength': 'fitness-center',
      'yoga': 'self-improvement',
      'pilates': 'self-improvement',
      'stretch': 'self-improvement',
      'dance': 'music-note',
      'dancing': 'music-note',
      'tennis': 'sports-tennis',
      'basketball': 'sports-basketball',
      'football': 'sports-football',
      'soccer': 'sports-soccer',
      'volleyball': 'sports-volleyball',
      'hiking': 'hiking',
      'climbing': 'hiking',
      'boxing': 'sports-mma',
      'martial arts': 'sports-mma',
      'karate': 'sports-mma',
      'kickboxing': 'sports-mma',
      'rowing': 'rowing',
      'surfing': 'surfing',
      'skiing': 'downhill-skiing',
      'snowboarding': 'snowboarding',
      'skating': 'ice-skating',
      'ice skating': 'ice-skating',
      'roller skating': 'roller-skating',
      'skateboarding': 'skateboarding',
      'golf': 'golf-course',
      'baseball': 'sports-baseball',
      'softball': 'sports-baseball',
      'cricket': 'sports-cricket',
      'badminton': 'sports-badminton',
      'table tennis': 'sports-tennis',
      'ping pong': 'sports-tennis',
      'squash': 'sports-tennis',
      'racquetball': 'sports-tennis',
      'aerobic': 'fitness-center',
      'aerobics': 'fitness-center',
      'cardio': 'favorite',
      'elliptical': 'fitness-center',
      'treadmill': 'directions-run',
      'stair': 'stairs',
      'stairs': 'stairs',
      'stairmaster': 'stairs',
      'rowing machine': 'rowing',
      'crossfit': 'fitness-center',
      'cross training': 'fitness-center',
      'circuit': 'fitness-center',
      'hiit': 'fitness-center',
      'tabata': 'fitness-center',
      'spinning': 'directions-bike',
      'spin': 'directions-bike',
      'zumba': 'music-note',
      'barre': 'self-improvement',
      'meditation': 'self-improvement',
      'breathing': 'self-improvement'
    };

    // Try to find exact match first
    const exactMatch = activityIcons[activityName.toLowerCase()];
    if (exactMatch) {
      return exactMatch;
    }

    // Try to find partial match
    for (const [key, iconName] of Object.entries(activityIcons)) {
      if (activityName.toLowerCase().includes(key) || key.includes(activityName.toLowerCase())) {
        return iconName;
      }
    }

    // Default fitness icon
    return 'fitness-center';
  };

  // Calculate exercise calories from activity logs
  const totalCaloriesBurned = data?.activityLogs?.reduce((total, activity) => total + activity.caloriesBurned, 0) || 0;
  

  // Use real data from API or fallback to default values
  const baseStats = data?.stats || {
    calories: { consumed: 0, goal: user?.dailyCalorieIntakeTarget || 2000 },
    macros: {
      carbs: { consumed: 0, goal: 250 },
      protein: { consumed: 0, goal: 120 },
      fat: { consumed: 0, goal: 65 }
    },
    water: { consumed: 0, goal: 8 },
    exercise: { burned: 0, goal: user?.dailyCalorieBurnTarget || 400 }
  };

  // Update exercise calories with real data from activity logs
  const todayStats = {
    ...baseStats,
    exercise: {
      ...baseStats.exercise,
      burned: totalCaloriesBurned // Use real data from API
    }
  };

  const recentMeals = data?.recentMeals || [];

  const calorieProgress = (todayStats.calories.consumed / todayStats.calories.goal) * 100;
  const waterProgress = (todayStats.water.consumed / todayStats.water.goal) * 100;
  const exerciseProgress = (todayStats.exercise.burned / todayStats.exercise.goal) * 100;

  // Show loading state
  if (isLoading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Show error state
  if (error && !data) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to load dashboard</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.retryText} onPress={refresh}>
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          colors={['#10b981']}
          tintColor="#10b981"
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              Welcome, {user?.firstName || 'User'}!
            </Text>
            <View style={styles.dateContainer}>
              <MaterialIcons name="event" size={16} color="#10b981" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </View>
          <View style={styles.streakCard}>
            <View style={styles.streakHeader}>
              <MaterialIcons name="emoji-events" size={16} color="#10b981" />
              <Text style={styles.streakLabel}>Streak</Text>
            </View>
            <View style={styles.streakValue}>
              <Text style={styles.streakEmoji}>🌺</Text>
              <Text style={styles.streakNumber}>12</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.calorieCard}>
            <CardContent style={styles.cardContent}>
              <View style={styles.statHeader}>
                <View style={styles.iconWrapper}>
                  <MaterialIcons name="gps-fixed" size={20} color="#ffffff" />
                </View>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <Text style={styles.statValue}>{todayStats.calories.consumed}</Text>
              <Text style={styles.statSubtext}>of {todayStats.calories.goal} target</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${calorieProgress}%` }]} />
              </View>
            </CardContent>
          </Card>

          <Card style={styles.exerciseCard}>
            <CardContent style={styles.cardContent}>
              <View style={styles.statHeader}>
                <View style={styles.iconWrapper}>
                  <MaterialIcons name="flash-on" size={20} color="#ffffff" />
                </View>
                <Text style={styles.statLabel}>Exercise</Text>
              </View>
              <Text style={styles.statValue}>{todayStats.exercise.burned}</Text>
              <Text style={styles.statSubtext}>of {todayStats.exercise.goal} target</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${exerciseProgress}%` }]} />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Macros */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleIndicator} />
              <CardTitle>Macronutrients</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {Object.entries(todayStats.macros).map(([macro, data]) => {
              const progress = (data.consumed / data.goal) * 100;
              return (
                <View key={macro} style={styles.macroRow}>
                  <View style={styles.macroHeader}>
                    <Text style={styles.macroName}>{macro}</Text>
                    <Text style={styles.macroValue}>
                      {data.consumed}g / {data.goal}g
                    </Text>
                  </View>
                  <View style={styles.macroProgressBar}>
                    <View style={[styles.macroProgressFill, { width: `${progress}%` }]} />
                  </View>
                </View>
              );
            })}
          </CardContent>
        </Card>

        {/* Water & Sleep Cards */}
        <View style={styles.horizontalCardsContainer}>
          {/* Water Card */}
          <Card style={styles.horizontalCard}>
            <CardContent style={styles.horizontalCardContent}>
              <View style={styles.horizontalCardHeader}>
                <View style={styles.horizontalCardIconContainer}>
                  <MaterialIcons name="water-drop" size={20} color="#10b981" />
                </View>
                <Text style={styles.horizontalCardTitle}>Water</Text>
              </View>
              <Text style={styles.horizontalCardValue}>{todayStats.water.consumed}ml</Text>
              <Text style={styles.horizontalCardSubtext}>of {todayStats.water.goal}ml</Text>
              <View style={styles.horizontalProgressBar}>
                <View style={[styles.horizontalProgressFill, { width: `${waterProgress}%` }]} />
              </View>
            </CardContent>
          </Card>

          {/* Sleep Card */}
          <Card style={styles.horizontalCard}>
            <CardContent style={styles.horizontalCardContent}>
              <View style={styles.horizontalCardHeader}>
                <View style={styles.horizontalCardIconContainer}>
                  <MaterialIcons name="bedtime" size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.horizontalCardTitle}>Sleep</Text>
              </View>
                    <Text style={styles.horizontalCardValue}>
                      {data?.sleepEntries && data.sleepEntries.length > 0 
                        ? `${data.sleepEntries[0].hours || data.sleepEntries[0].durationHours || data.sleepEntries[0].sleepHours || 0}h` 
                        : '0h'
                      }
                    </Text>
              <Text style={styles.horizontalCardSubtext}>
                {data?.sleepEntries && data.sleepEntries.length > 0 
                  ? data.sleepEntries[0].note || 'Sleep logged'
                  : 'No data'
                }
              </Text>
                    <View style={styles.horizontalProgressBar}>
                      <View style={[styles.horizontalProgressFill, { 
                        width: data?.sleepEntries && data.sleepEntries.length > 0 
                          ? `${Math.min(((data.sleepEntries[0].hours || data.sleepEntries[0].durationHours || data.sleepEntries[0].sleepHours || 0) / 8) * 100, 100)}%` 
                          : '0%',
                        backgroundColor: '#8b5cf6'
                      }]} />
                    </View>
            </CardContent>
          </Card>
        </View>

        {/* Steps & Weight Cards */}
        <View style={styles.horizontalCardsContainer}>
          {/* Steps Card */}
          <Card style={styles.horizontalCard}>
            <CardContent style={styles.horizontalCardContent}>
              <View style={styles.horizontalCardHeader}>
                <View style={styles.horizontalCardIconContainer}>
                  <MaterialIcons name="directions-walk" size={20} color="#06b6d4" />
                </View>
                <Text style={styles.horizontalCardTitle}>Steps</Text>
              </View>
              <Text style={styles.horizontalCardValue}>
                {data?.stepEntries && data.stepEntries.length > 0 
                  ? data.stepEntries[0].stepCount.toLocaleString()
                  : '0'
                }
              </Text>
              <Text style={styles.horizontalCardSubtext}>
                {data?.stepEntries && data.stepEntries.length > 0 
                  ? 'Today\'s steps'
                  : 'No entry today'
                }
              </Text>
              <View style={styles.horizontalProgressBar}>
                <View style={[styles.horizontalProgressFill, { 
                  width: data?.stepEntries && data.stepEntries.length > 0 
                    ? `${Math.min((data.stepEntries[0].stepCount / 10000) * 100, 100)}%` 
                    : '0%',
                  backgroundColor: '#06b6d4'
                }]} />
              </View>
            </CardContent>
          </Card>

          {/* Weight Card */}
          <Card style={styles.horizontalCard}>
            <CardContent style={styles.horizontalCardContent}>
              <View style={styles.horizontalCardHeader}>
                <View style={styles.horizontalCardIconContainer}>
                  <MaterialIcons name="monitor-weight" size={20} color="#ef4444" />
                </View>
                <Text style={styles.horizontalCardTitle}>Weight</Text>
              </View>
              <Text style={styles.horizontalCardValue}>
                {data?.weightEntries && data.weightEntries.length > 0 
                  ? `${data.weightEntries[0].weight || data.weightEntries[0].weightKg || data.weightEntries[0].weightValue || 0}kg`
                  : 'No data'
                }
              </Text>
              <Text style={styles.horizontalCardSubtext}>
                {data?.weightEntries && data.weightEntries.length > 0 
                  ? 'Latest entry'
                  : 'No entry today'
                }
              </Text>
              <View style={styles.horizontalProgressBar}>
                <View style={[styles.horizontalProgressFill, { 
                  width: data?.weightEntries && data.weightEntries.length > 0 ? '100%' : '0%',
                  backgroundColor: '#ef4444'
                }]} />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Recent Meals */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleIndicator} />
              <CardTitle>Recent Meals</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {recentMeals.length > 0 ? (
              recentMeals.map((meal, index) => (
                <View key={meal.id || index} style={styles.mealRow}>
                  <View style={styles.mealImageContainer}>
                    <ImageWithFallback
                      src={meal.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300"}
                      alt={meal.name}
                      width={64}
                      height={64}
                      style={styles.mealImage}
                    />
                    <View style={styles.mealEmoji}>
                      <Text style={styles.emojiText}>🥭</Text>
                    </View>
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealDetails}>
                      {meal.time} • {meal.calories} cal
                    </Text>
                    {meal.macros && (
                      <View style={styles.mealMacros}>
                        <View style={styles.macroBadge}>
                          <Text style={styles.macroText}>P: {meal.macros.protein.toFixed(1)}g</Text>
                        </View>
                        <View style={[styles.macroBadge, styles.carbsMacroBadge]}>
                          <Text style={styles.carbsMacroText}>C: {meal.macros.carbs.toFixed(1)}g</Text>
                        </View>
                        <View style={[styles.macroBadge, styles.fatMacroBadge]}>
                          <Text style={styles.fatMacroText}>F: {meal.macros.fat.toFixed(1)}g</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <Badge variant="secondary" style={styles.mealBadge}>
                    {meal.type}
                  </Badge>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="restaurant" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No meals logged today</Text>
                <Text style={styles.emptyStateSubtext}>Start tracking your meals to see them here</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleIndicator} />
              <CardTitle>Recent Activities</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {data?.activityLogs && data.activityLogs.length > 0 ? (
              data.activityLogs.slice(0, 3).map((activity, index) => (
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityIconContainer}>
                    <MaterialIcons name={getActivityIcon(activity.note)} size={24} color="#10b981" />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>{activity.note}</Text>
                    <Text style={styles.activityDetails}>
                      {new Date(activity.loggedAt).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })} • {activity.durationMinutes} min
                    </Text>
                  </View>
                  <View style={styles.activityCalories}>
                    <Text style={styles.caloriesText}>{activity.caloriesBurned}</Text>
                    <Text style={styles.caloriesLabel}>cal</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="fitness-center" size={48} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No activities logged today</Text>
                <Text style={styles.emptyStateSubtext}>Start tracking your exercises to see them here</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    color: '#1f2937',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  streakCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  calorieCard: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 24,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconWrapper: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  statSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  card: {
    marginBottom: 24,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIndicator: {
    width: 4,
    height: 32,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  macroRow: {
    marginBottom: 24,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroName: {
    fontSize: 16,
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  macroValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  macroProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  waterCardContent: {
    padding: 24,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  waterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  waterIconContainer: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 24,
  },
  waterTitle: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '600',
  },
  waterSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  waterPercentage: {
    fontSize: 32,
    color: '#10b981',
    fontWeight: 'bold',
  },
  waterGlasses: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  waterGlass: {
    flex: 1,
    height: 48,
    borderRadius: 16,
  },
  waterGlassFilled: {
    backgroundColor: '#f0fdf4',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  waterGlassEmpty: {
    backgroundColor: '#f3f4f6',
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  waterProgressContainer: {
    marginTop: 12,
  },
  waterProgressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  horizontalCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  horizontalCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalCardContent: {
    padding: 16,
  },
  horizontalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  horizontalCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  horizontalCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  horizontalCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  horizontalCardSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  horizontalProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  horizontalProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginBottom: 16,
  },
  mealImageContainer: {
    position: 'relative',
  },
  mealImage: {
    borderRadius: 16,
  },
  mealEmoji: {
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
  emojiText: {
    fontSize: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  mealDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  mealBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingTop: 60,
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
    backgroundColor: '#f8fafc',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginBottom: 16,
  },
  activityIconContainer: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityCalories: {
    alignItems: 'center',
  },
  caloriesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  macroBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  carbsMacroBadge: {
    backgroundColor: '#f59e0b',
  },
  fatMacroBadge: {
    backgroundColor: '#06b6d4',
  },
  macroText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  carbsMacroText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  fatMacroText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
});