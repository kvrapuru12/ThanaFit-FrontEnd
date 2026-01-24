import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { useProgressData } from '../hooks/useProgressData';

export const ProgressTracking: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, error, refresh } = useProgressData();

  // Use real data or fallback to empty/default values
  const weeklyData = data?.weeklyData || [];
  const goalStats = data?.goalStats || {
    calories: { current: 0, goal: user?.dailyCalorieIntakeTarget || 2000, percentage: 0 },
    exercise: { current: 0, goal: user?.dailyCalorieBurnTarget || 400, percentage: 0 },
    weight: { current: null, goal: user?.targetWeight || null, percentage: 0 },
    water: { current: 0, goal: 8, percentage: 0 },
  };
  const macroDistribution = data?.macroDistribution || {
    carbs: { value: 0, percentage: 0 },
    protein: { value: 0, percentage: 0 },
    fat: { value: 0, percentage: 0 },
  };

  const renderSimpleChart = (data: any[], type: 'line' | 'bar', valueKey: 'calories' | 'exercise' | 'weight' = 'calories') => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.emptyChartText}>No data available</Text>
        </View>
      );
    }

    const maxValue = Math.max(...data.map(d => {
      if (valueKey === 'calories') return d.calories || 0;
      if (valueKey === 'exercise') return d.exercise || 0;
      if (valueKey === 'weight') return d.weight || 0;
      return 0;
    }), 1); // Ensure at least 1 to avoid division by zero
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {data.map((item, index) => {
            let value = 0;
            if (valueKey === 'calories') value = item.calories || 0;
            else if (valueKey === 'exercise') value = item.exercise || 0;
            else if (valueKey === 'weight') value = item.weight || 0;
            
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const barColor = valueKey === 'calories' ? '#f59e0b' : valueKey === 'exercise' ? '#10b981' : '#ef4444';
            return (
              <View key={index} style={styles.chartBarContainer}>
                <View style={[styles.chartBar, { 
                  height: `${height}%`,
                  backgroundColor: barColor
                }]} />
                <Text style={styles.chartLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPieChart = () => {
    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieChart}>
          <View style={styles.pieChartCenter}>
            <Text style={styles.pieChartTitle}>Macros</Text>
            <Text style={styles.pieChartSubtitle}>Today</Text>
          </View>
        </View>
        <View style={styles.pieChartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Carbs {macroDistribution.carbs.percentage}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Protein {macroDistribution.protein.percentage}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Fat {macroDistribution.fat.percentage}%</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading progress data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
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

        {/* Goal Stats */}
        <View style={styles.statsGrid}>
          <Card style={[styles.statCard, styles.calorieCard]}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: '#f59e0b' }]}>
                  <MaterialIcons name="gps-fixed" size={20} color="#ffffff" />
                </View>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              <Text style={styles.statValue}>{Math.round(goalStats.calories.current)}</Text>
              <Text style={styles.statGoal}>of {goalStats.calories.goal} target</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${Math.min(100, goalStats.calories.percentage)}%`,
                  backgroundColor: '#f59e0b'
                }]} />
              </View>
            </CardContent>
          </Card>

          <Card style={[styles.statCard, styles.exerciseCard]}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: '#10b981' }]}>
                  <MaterialIcons name="flash-on" size={20} color="#ffffff" />
                </View>
                <Text style={styles.statLabel}>Exercise</Text>
              </View>
              <Text style={styles.statValue}>{Math.round(goalStats.exercise.current)}</Text>
              <Text style={styles.statGoal}>of {goalStats.exercise.goal} cal</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${Math.min(100, goalStats.exercise.percentage)}%`,
                  backgroundColor: '#10b981'
                }]} />
              </View>
            </CardContent>
          </Card>

          <Card style={[styles.statCard, styles.weightCard]}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: '#ef4444' }]}>
                  <MaterialIcons name="monitor-weight" size={20} color="#ffffff" />
                </View>
                <Text style={styles.statLabel}>Weight</Text>
              </View>
              <Text style={styles.statValue}>{goalStats.weight.current ? goalStats.weight.current.toFixed(1) : '--'}</Text>
              <Text style={styles.statGoal}>kg {goalStats.weight.goal ? `(Goal: ${goalStats.weight.goal})` : ''}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${Math.min(100, Math.max(0, goalStats.weight.percentage))}%`,
                  backgroundColor: '#ef4444'
                }]} />
              </View>
            </CardContent>
          </Card>

          <Card style={[styles.statCard, styles.waterCard]}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: '#06b6d4' }]}>
                  <MaterialIcons name="water-drop" size={20} color="#ffffff" />
                </View>
                <Text style={styles.statLabel}>Water</Text>
              </View>
              <Text style={styles.statValue}>{goalStats.water.current}</Text>
              <Text style={styles.statGoal}>of {goalStats.water.goal} glasses</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${Math.min(100, goalStats.water.percentage)}%`,
                  backgroundColor: '#06b6d4'
                }]} />
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Weekly Progress Chart */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: '#f59e0b' }]} />
              <CardTitle>Weekly Calories</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {renderSimpleChart(weeklyData, 'bar', 'calories')}
          </CardContent>
        </Card>

        {/* Exercise Chart */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: '#10b981' }]} />
              <CardTitle>Exercise Calories</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {renderSimpleChart(weeklyData, 'bar', 'exercise')}
          </CardContent>
        </Card>

        {/* Macros Chart */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={[styles.titleIndicator, { backgroundColor: '#8b5cf6' }]} />
              <CardTitle>Macro Distribution</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {renderPieChart()}
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
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
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
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  calorieCard: {
    backgroundColor: '#fff7ed',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  exerciseCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  weightCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  waterCard: {
    backgroundColor: '#ecfeff',
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  chartCard: {
    marginBottom: 24,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
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
    width: 24,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 40,
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
});