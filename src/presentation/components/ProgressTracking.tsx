import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

export const ProgressTracking: React.FC = () => {
  const { user } = useAuth();
  const weeklyData = [
    { day: 'Mon', calories: 1850, exercise: 320, weight: 165.2 },
    { day: 'Tue', calories: 1920, exercise: 280, weight: 165.0 },
    { day: 'Wed', calories: 1750, exercise: 450, weight: 164.8 },
    { day: 'Thu', calories: 2100, exercise: 380, weight: 164.5 },
    { day: 'Fri', calories: 1950, exercise: 420, weight: 164.3 },
    { day: 'Sat', calories: 2200, exercise: 350, weight: 164.1 },
    { day: 'Sun', calories: 1800, exercise: 300, weight: 163.9 },
  ];

  const goalStats = {
    calories: { current: 1950, goal: 2000 },
    exercise: { current: 380, goal: 400 },
    weight: { current: 163.9, goal: 160.0 },
    water: { current: 7, goal: 8 },
  };

  const achievements = [
    { id: 1, title: '7-Day Streak', description: 'Consistent logging', icon: 'emoji-events', earned: true },
    { id: 2, title: 'Calorie Master', description: 'Met daily goals 5 times', icon: 'gps-fixed', earned: true },
    { id: 3, title: 'Exercise Warrior', description: 'Completed 10 workouts', icon: 'fitness-center', earned: false },
    { id: 4, title: 'Hydration Hero', description: 'Drank 8 glasses daily', icon: 'water-drop', earned: false },
  ];

  const renderSimpleChart = (data: any[], type: 'line' | 'bar') => {
    const maxValue = Math.max(...data.map(d => d.calories || d.exercise || d.weight));
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {data.map((item, index) => {
            const value = item.calories || item.exercise || item.weight;
            const height = (value / maxValue) * 100;
            return (
              <View key={index} style={styles.chartBarContainer}>
                <View style={[styles.chartBar, { height: `${height}%` }]} />
                <Text style={styles.chartLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPieChart = (data: any[]) => {
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          <View style={styles.pieChartCenter}>
            <Text style={styles.pieChartTitle}>Macros</Text>
            <Text style={styles.pieChartSubtitle}>This Week</Text>
          </View>
        </View>
        <View style={styles.pieChartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Carbs 45%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Protein 30%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Fat 25%</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Monitor your fitness journey</Text>
        </View>
        <Badge variant="secondary" style={styles.headerBadge}>
          <MaterialIcons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.badgeText}>This Week</Text>
        </Badge>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Goal Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <MaterialIcons name="gps-fixed" size={24} color="#f59e0b" />
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <Text style={styles.statValue}>{goalStats.calories.current}</Text>
              <Text style={styles.statGoal}>of {goalStats.calories.goal}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(goalStats.calories.current / goalStats.calories.goal) * 100}%` }]} />
              </View>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <MaterialIcons name="fitness-center" size={24} color="#10b981" />
                <Text style={styles.statLabel}>Exercise</Text>
              </View>
              <Text style={styles.statValue}>{goalStats.exercise.current}</Text>
              <Text style={styles.statGoal}>of {goalStats.exercise.goal} min</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(goalStats.exercise.current / goalStats.exercise.goal) * 100}%` }]} />
              </View>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <MaterialIcons name="trending-up" size={24} color="#ef4444" />
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <Text style={styles.statValue}>{goalStats.weight.current}</Text>
              <Text style={styles.statGoal}>kg (Goal: {goalStats.weight.goal})</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((goalStats.weight.goal - goalStats.weight.current) / goalStats.weight.goal) * 100}%` }]} />
              </View>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <MaterialIcons name="water-drop" size={24} color="#3b82f6" />
                <Text style={styles.statLabel}>Water</Text>
              </View>
              <Text style={styles.statValue}>{goalStats.water.current}</Text>
              <Text style={styles.statGoal}>of {goalStats.water.goal} glasses</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(goalStats.water.current / goalStats.water.goal) * 100}%` }]} />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Weekly Progress Chart */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {renderSimpleChart(weeklyData, 'bar')}
          </CardContent>
        </Card>

        {/* Exercise Chart */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <CardTitle>Exercise Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            {renderSimpleChart(weeklyData, 'bar')}
          </CardContent>
        </Card>

        {/* Macros Chart */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart([])}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card style={styles.achievementsCard}>
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, achievement.earned && styles.achievementEarned]}>
                    <MaterialIcons 
                      name={achievement.icon as any} 
                      size={24} 
                      color={achievement.earned ? '#10b981' : '#6b7280'} 
                    />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  {achievement.earned && (
                    <Badge variant="default" style={styles.achievementBadge}>
                      <MaterialIcons name="emoji-events" size={12} color="white" />
                      <Text style={styles.achievementBadgeText}>Earned</Text>
                    </Badge>
                  )}
                </View>
              ))}
            </View>
          </CardContent>
        </Card>
        </View>
      </ScrollView>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  badgeText: {
    fontSize: 12,
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
  },
  statContent: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statGoal: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  chartCard: {
    marginBottom: 24,
  },
  chartContainer: {
    height: 200,
    paddingVertical: 16,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 20,
    backgroundColor: '#10b981',
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartCenter: {
    alignItems: 'center',
  },
  pieChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  pieChartSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  pieChartLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
  },
  achievementsCard: {
    marginBottom: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementEarned: {
    backgroundColor: '#f0fdf4',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b981',
  },
  achievementBadgeText: {
    fontSize: 10,
    color: 'white',
  },
});