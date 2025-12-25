import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Modal, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../providers/AuthProvider';
import { useDashboardData } from '../hooks/useDashboardData';
import { dashboardApiService } from '../../infrastructure/services/dashboardApi';
import { apiClient } from '../../infrastructure/api/ApiClient';

export const Dashboard: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  
  // Refresh user data on mount to ensure firstName is loaded from backend
  useEffect(() => {
    const refreshUser = async () => {
      if (user && (!user.firstName || user.firstName === user.username)) {
        try {
          await refreshUserData();
        } catch (error) {
          console.error('Failed to refresh user data in Dashboard:', error);
        }
      }
    };
    refreshUser();
  }, [user]);
  const { data, isLoading, error, refresh } = useDashboardData();
  
  // Modal states
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  
  // Input states
  const [waterAmount, setWaterAmount] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [stepCount, setStepCount] = useState('');
  const [weightValue, setWeightValue] = useState('');
  
  // Loading states
  const [isLoggingWater, setIsLoggingWater] = useState(false);
  const [isLoggingSleep, setIsLoggingSleep] = useState(false);
  const [isLoggingSteps, setIsLoggingSteps] = useState(false);
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

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
      carbs: { consumed: 0, goal: user?.targetCarbs || 250 },
      protein: { consumed: 0, goal: user?.targetProtein || 120 },
      fat: { consumed: 0, goal: user?.targetFat || 65 }
    },
    water: { consumed: 0, goal: (user?.targetWaterLitres || 2.5) * 1000 }, // Convert L to ml
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

  // Handler functions for logging
  const handleLogWater = async () => {
    if (!waterAmount || parseFloat(waterAmount) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid water amount in ml');
      return;
    }

    setIsLoggingWater(true);
    try {
      await dashboardApiService.addWaterIntake(parseFloat(waterAmount));
      setWaterAmount('');
      setShowWaterModal(false);
      await refresh();
      Alert.alert('Success', 'Water intake logged successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log water intake');
    } finally {
      setIsLoggingWater(false);
    }
  };

  const handleLogSleep = async () => {
    if (!sleepHours || parseFloat(sleepHours) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of sleep hours');
      return;
    }

    setIsLoggingSleep(true);
    try {
      await apiClient.post('/sleeps', {
        hours: parseFloat(sleepHours),
        loggedAt: new Date().toISOString(),
      });
      setSleepHours('');
      setShowSleepModal(false);
      await refresh();
      Alert.alert('Success', 'Sleep logged successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log sleep');
    } finally {
      setIsLoggingSleep(false);
    }
  };

  const handleLogSteps = async () => {
    if (!stepCount || parseInt(stepCount) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of steps');
      return;
    }

    setIsLoggingSteps(true);
    try {
      await apiClient.post('/steps', {
        stepCount: parseInt(stepCount),
        loggedAt: new Date().toISOString(),
      });
      setStepCount('');
      setShowStepsModal(false);
      await refresh();
      Alert.alert('Success', 'Steps logged successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log steps');
    } finally {
      setIsLoggingSteps(false);
    }
  };

  const handleLogWeight = async () => {
    if (!weightValue || parseFloat(weightValue) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight in kg');
      return;
    }

    setIsLoggingWeight(true);
    try {
      await apiClient.post('/weights', {
        weight: parseFloat(weightValue),
        loggedAt: new Date().toISOString(),
      });
      setWeightValue('');
      setShowWeightModal(false);
      await refresh();
      Alert.alert('Success', 'Weight logged successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log weight');
    } finally {
      setIsLoggingWeight(false);
    }
  };

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
    <View style={styles.container}>
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            Welcome, {(() => {
              // Display firstName if it exists and is different from username (real firstName from backend)
              if (user?.firstName && user.firstName !== user?.username) {
                return user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1);
              }
              // If firstName equals username, it's still showing the login fallback value
              // Return 'User' until refresh completes and we get the real firstName
              return 'User';
            })()}!
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

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            colors={['#10b981']}
            tintColor="#10b981"
          />
        }
      >
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
              const formatValue = (value: number) => {
                if (macro === 'carbs') {
                  return value.toFixed(2);
                }
                return value.toString();
              };
              return (
                <View key={macro} style={styles.macroRow}>
                  <View style={styles.macroHeader}>
                    <Text style={styles.macroName}>{macro}</Text>
                    <Text style={styles.macroValue}>
                      {formatValue(data.consumed)}g / {formatValue(data.goal)}g
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
                <TouchableOpacity 
                  style={styles.logButton}
                  onPress={() => setShowWaterModal(true)}
                >
                  <MaterialIcons name="add" size={18} color="#10b981" />
                </TouchableOpacity>
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
                <TouchableOpacity 
                  style={styles.logButton}
                  onPress={() => setShowSleepModal(true)}
                >
                  <MaterialIcons name="add" size={18} color="#8b5cf6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.horizontalCardValue}>
                {data?.sleepEntries && data.sleepEntries.length > 0 
                  ? `${data.sleepEntries[0].hours || data.sleepEntries[0].durationHours || data.sleepEntries[0].sleepHours || 0}h` 
                  : '0h'
                }
              </Text>
              <Text style={styles.horizontalCardSubtext}>
                of {user?.targetSleepHours || 8}h target
              </Text>
                    <View style={styles.horizontalProgressBar}>
                      <View style={[styles.horizontalProgressFill, { 
                        width: data?.sleepEntries && data.sleepEntries.length > 0 
                          ? `${Math.min(((data.sleepEntries[0].hours || data.sleepEntries[0].durationHours || data.sleepEntries[0].sleepHours || 0) / (user?.targetSleepHours || 8)) * 100, 100)}%` 
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
                <TouchableOpacity 
                  style={styles.logButton}
                  onPress={() => setShowStepsModal(true)}
                >
                  <MaterialIcons name="add" size={18} color="#06b6d4" />
                </TouchableOpacity>
              </View>
              <Text style={styles.horizontalCardValue}>
                {data?.stepEntries && data.stepEntries.length > 0 
                  ? data.stepEntries[0].stepCount.toLocaleString()
                  : '0'
                }
              </Text>
              <Text style={styles.horizontalCardSubtext}>
                of {user?.targetSteps || 10000} target
              </Text>
              <View style={styles.horizontalProgressBar}>
                <View style={[styles.horizontalProgressFill, { 
                  width: data?.stepEntries && data.stepEntries.length > 0 
                    ? `${Math.min((data.stepEntries[0].stepCount / (user?.targetSteps || 10000)) * 100, 100)}%` 
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
                <TouchableOpacity 
                  style={styles.logButton}
                  onPress={() => setShowWeightModal(true)}
                >
                  <MaterialIcons name="add" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.horizontalCardValue}>
                {data?.weightEntries && data.weightEntries.length > 0 
                  ? `${data.weightEntries[0].weight || data.weightEntries[0].weightKg || data.weightEntries[0].weightValue || 0}kg`
                  : user?.weight ? `${user.weight}kg` : 'No data'
                }
              </Text>
              <Text style={styles.horizontalCardSubtext}>
                {user?.targetWeight ? `Target: ${user.targetWeight}kg` : 'No target set'}
              </Text>
              <View style={styles.horizontalProgressBar}>
                <View style={[styles.horizontalProgressFill, { 
                  width: data?.weightEntries && data.weightEntries.length > 0 && user?.targetWeight 
                    ? `${Math.min(((data.weightEntries[0].weight || data.weightEntries[0].weightKg || data.weightEntries[0].weightValue || 0) / user.targetWeight) * 100, 100)}%`
                    : '0%',
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
      </ScrollView>

      {/* Water Log Modal */}
      <Modal
        visible={showWaterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWaterModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Water Intake</Text>
              <TouchableOpacity onPress={() => setShowWaterModal(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Amount (ml)</Text>
              <TextInput
                style={styles.textInput}
                value={waterAmount}
                onChangeText={setWaterAmount}
                placeholder="Enter amount in ml"
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.submitButton, isLoggingWater && styles.submitButtonDisabled]}
                onPress={handleLogWater}
                disabled={isLoggingWater}
              >
                {isLoggingWater ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Log Water</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sleep Log Modal */}
      <Modal
        visible={showSleepModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSleepModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Sleep</Text>
              <TouchableOpacity onPress={() => setShowSleepModal(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Hours Slept</Text>
              <TextInput
                style={styles.textInput}
                value={sleepHours}
                onChangeText={setSleepHours}
                placeholder="Enter hours (e.g., 7.5)"
                keyboardType="decimal-pad"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.submitButton, isLoggingSleep && styles.submitButtonDisabled]}
                onPress={handleLogSleep}
                disabled={isLoggingSleep}
              >
                {isLoggingSleep ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Log Sleep</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Steps Log Modal */}
      <Modal
        visible={showStepsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStepsModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Steps</Text>
              <TouchableOpacity onPress={() => setShowStepsModal(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Number of Steps</Text>
              <TextInput
                style={styles.textInput}
                value={stepCount}
                onChangeText={setStepCount}
                placeholder="Enter number of steps"
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.submitButton, isLoggingSteps && styles.submitButtonDisabled]}
                onPress={handleLogSteps}
                disabled={isLoggingSteps}
              >
                {isLoggingSteps ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Log Steps</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Weight Log Modal */}
      <Modal
        visible={showWeightModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Weight</Text>
              <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={weightValue}
                onChangeText={setWeightValue}
                placeholder="Enter weight in kg"
                keyboardType="decimal-pad"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.submitButton, isLoggingWeight && styles.submitButtonDisabled]}
                onPress={handleLogWeight}
                disabled={isLoggingWeight}
              >
                {isLoggingWeight ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Log Weight</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f8fafc',
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
    justifyContent: 'space-between',
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
  logButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginLeft: 'auto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});