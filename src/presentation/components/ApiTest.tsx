import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { dashboardApiService } from '../../infrastructure/services/dashboardApi';

export const ApiTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testDashboardStats = async () => {
    try {
      setIsLoading(true);
      addResult('Testing dashboard stats API...');
      
      const stats = await dashboardApiService.getTodayStats();
      addResult(`✅ Dashboard stats loaded: ${JSON.stringify(stats, null, 2)}`);
      
    } catch (error: any) {
      addResult(`❌ Dashboard stats failed: ${error.message}`);
      console.error('Dashboard stats test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testRecentMeals = async () => {
    try {
      setIsLoading(true);
      addResult('Testing recent meals API...');
      
      const meals = await dashboardApiService.getRecentMeals();
      addResult(`✅ Recent meals loaded: ${meals.length} meals found`);
      
    } catch (error: any) {
      addResult(`❌ Recent meals failed: ${error.message}`);
      console.error('Recent meals test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testActivityLogs = async () => {
    try {
      setIsLoading(true);
      addResult('Testing activity logs API...');
      
      const activities = await dashboardApiService.getTodayActivityLogs();
      addResult(`✅ Activity logs loaded: ${activities.length} activities found`);
      
    } catch (error: any) {
      addResult(`❌ Activity logs failed: ${error.message}`);
      console.error('Activity logs test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testWaterIntake = async () => {
    try {
      setIsLoading(true);
      addResult('Testing water intake API...');
      
      const waterIntake = await dashboardApiService.getTodayWaterIntake();
      addResult(`✅ Water intake loaded: ${waterIntake.length} entries found`);
      
    } catch (error: any) {
      addResult(`❌ Water intake failed: ${error.message}`);
      console.error('Water intake test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testFoodLogs = async () => {
    try {
      setIsLoading(true);
      addResult('Testing food logs API...');
      
      const foodLogs = await dashboardApiService.getTodayFoodLogs();
      addResult(`✅ Food logs loaded: ${foodLogs.length} entries found`);
      
    } catch (error: any) {
      addResult(`❌ Food logs failed: ${error.message}`);
      console.error('Food logs test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllApis = async () => {
    try {
      setIsLoading(true);
      addResult('Testing all dashboard APIs...');
      
      const dashboardData = await dashboardApiService.getDashboardData();
      addResult(`✅ All dashboard data loaded successfully!`);
      addResult(`Stats: ${JSON.stringify(dashboardData.stats, null, 2)}`);
      addResult(`Meals: ${dashboardData.recentMeals.length} meals`);
      addResult(`Activities: ${dashboardData.activityLogs.length} activities`);
      addResult(`Water: ${dashboardData.waterIntake.length} entries`);
      addResult(`Food: ${dashboardData.foodLogs.length} entries`);
      
    } catch (error: any) {
      addResult(`❌ All APIs test failed: ${error.message}`);
      console.error('All APIs test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Integration Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={testAllApis}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test All APIs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testDashboardStats}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testRecentMeals}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Meals</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testActivityLogs}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Activities</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testWaterIntake}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Water</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testFoodLogs}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No tests run yet. Tap a button above to start testing.</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>{result}</Text>
          ))
        )}
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Testing API...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6b7280',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  noResults: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
