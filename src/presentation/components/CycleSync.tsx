import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { Gender } from '../../core/domain/entities/User';

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

  // Mock cycle data - in real app, this would come from API
  useEffect(() => {
    const mockCycleData: CycleData = {
      cycleLength: 28,
      periodLength: 5,
      lastPeriodStart: '2025-09-20',
      nextPeriodStart: '2025-10-18',
      ovulationDate: '2025-10-04',
      fertileWindow: {
        start: '2025-10-02',
        end: '2025-10-06'
      },
      currentPhase: 'follicular',
      daysUntilNextPeriod: 23
    };
    
    setTimeout(() => {
      setCycleData(mockCycleData);
      setLoading(false);
    }, 1000);
  }, []);

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

  const handleLogPeriod = () => {
    Alert.alert(
      'Log Period Start',
      'Mark today as the start of your period?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Period', 
          onPress: () => {
            // In real app, this would call API to log period
            Alert.alert('Success', 'Period logged successfully!');
          }
        }
      ]
    );
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>CycleSync</Text>
            <Text style={styles.subtitle}>Track your menstrual cycle</Text>
          </View>
        </View>

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

        {/* Cycle Overview */}
        <Card style={styles.overviewCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>Cycle Overview</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
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
          </CardContent>
        </Card>

        {/* Important Dates */}
        <Card style={styles.datesCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.sunsetIndicator]} />
              <Text style={styles.cardTitleText}>Important Dates</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
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
            <View style={styles.dateItem}>
              <MaterialIcons name="favorite" size={20} color="#4ecdc4" />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Fertile Window</Text>
                <Text style={styles.dateValue}>{cycleData.fertileWindow.start} - {cycleData.fertileWindow.end}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.oceanIndicator]} />
              <Text style={styles.cardTitleText}>Quick Actions</Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleLogPeriod}
              >
                <MaterialIcons name="favorite" size={20} color="#ff6b6b" />
                <Text style={styles.actionButtonText}>Log Period</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleLogSymptoms}
              >
                <MaterialIcons name="mood" size={20} color="#ffa726" />
                <Text style={styles.actionButtonText}>Log Symptoms</Text>
              </TouchableOpacity>
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
  overviewCard: {
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
  datesCard: {
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
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
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
});
