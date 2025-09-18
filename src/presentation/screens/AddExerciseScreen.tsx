import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/Input';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { dashboardApiService, Activity } from '../../infrastructure/services/dashboardApi';

interface AddExerciseScreenProps {
  navigation: any;
  route?: {
    params?: {
      onWorkoutAdded?: () => Promise<void>;
    };
  };
}

export const AddExerciseScreen: React.FC<AddExerciseScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  
  // Create Activity Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState('');
  const [newActivityCalories, setNewActivityCalories] = useState('');
  const [newActivityVisibility, setNewActivityVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const activitiesData = await dashboardApiService.getActivities();
      setActivities(activitiesData.slice(0, 10)); // Show first 10 activities
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      Alert.alert('Error', 'Failed to load activities');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleCreateActivity = async () => {
    if (!newActivityName.trim()) {
      Alert.alert('Error', 'Please enter an activity name');
      return;
    }

    if (!newActivityCategory.trim()) {
      Alert.alert('Error', 'Please enter a category');
      return;
    }

    if (!newActivityCalories || isNaN(Number(newActivityCalories))) {
      Alert.alert('Error', 'Please enter a valid calories per minute');
      return;
    }

    if (Number(newActivityCalories) <= 0) {
      Alert.alert('Error', 'Calories per minute must be greater than 0');
      return;
    }

    try {
      setIsCreatingActivity(true);
      
      const activityData = {
        name: newActivityName.trim(),
        category: newActivityCategory.trim(),
        caloriesPerMinute: Number(newActivityCalories),
        visibility: newActivityVisibility
      };

      const newActivity = await dashboardApiService.createActivity(activityData);
      
      // Create a temporary activity object to add to the list
      const tempActivity: Activity = {
        id: newActivity.id,
        name: activityData.name,
        category: activityData.category,
        caloriesPerMinute: activityData.caloriesPerMinute,
        visibility: activityData.visibility.toLowerCase() as 'public' | 'private',
        createdById: user?.id || 2,
        status: 'active',
        createdAt: newActivity.createdAt,
        updatedAt: newActivity.createdAt
      };

      // Add the new activity to the list and select it
      setActivities(prev => [tempActivity, ...prev]);
      setSelectedActivity(tempActivity);
      
      // Close modal and reset form
      setShowCreateModal(false);
      setNewActivityName('');
      setNewActivityCategory('');
      setNewActivityCalories('');
      setNewActivityVisibility('PUBLIC');
      
      Alert.alert(
        'Success! 🎉',
        `"${activityData.name}" has been created and selected!`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Failed to create activity:', error);
      Alert.alert(
        'Error',
        'Failed to create activity. Please try again.'
      );
    } finally {
      setIsCreatingActivity(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedActivity) {
      Alert.alert('Error', 'Please select an activity');
      return;
    }

    if (!duration || isNaN(Number(duration))) {
      Alert.alert('Error', 'Please enter a valid duration in minutes');
      return;
    }

    if (Number(duration) <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return;
    }

    try {
      setIsLoading(true);
      
      const logData = {
        userId: user?.id || 2,
        activityId: selectedActivity.id,
        loggedAt: new Date().toISOString().split('.')[0] + 'Z', // Remove milliseconds but keep 'Z'
        durationMinutes: Number(duration),
        note: note.trim() || `${selectedActivity.name} workout`
      };

      console.log('=== DATE FORMAT DEBUG ===');
      console.log('Final loggedAt:', logData.loggedAt);
      console.log('Expected format: 2025-09-13T14:00:00Z');
      console.log('========================');

      await dashboardApiService.createActivityLog(logData);
      
      Alert.alert(
        'Success! 🎉',
        'Your workout has been logged successfully!',
        [
          {
            text: 'OK',
            onPress: async () => {
              console.log('=== REFRESH DEBUG ===');
              console.log('Route params:', route?.params);
              console.log('onWorkoutAdded callback:', route?.params?.onWorkoutAdded);
              
              // Refresh the workout data if callback is provided
              if (route?.params?.onWorkoutAdded) {
                console.log('Calling refresh callback...');
                await route.params.onWorkoutAdded();
                console.log('Refresh callback completed');
              } else {
                console.log('No refresh callback provided');
              }
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to create activity log:', error);
      Alert.alert('Error', 'Failed to log your workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (activityName: string): string => {
    const name = activityName.toLowerCase();
    if (name.includes('swim')) return 'pool';
    if (name.includes('run')) return 'directions-run';
    if (name.includes('walk')) return 'directions-walk';
    if (name.includes('bike') || name.includes('cycle')) return 'directions-bike';
    if (name.includes('weight') || name.includes('strength')) return 'fitness-center';
    if (name.includes('yoga')) return 'self-improvement';
    if (name.includes('dance')) return 'music-note';
    if (name.includes('tennis')) return 'sports-tennis';
    if (name.includes('basketball')) return 'sports-basketball';
    if (name.includes('football')) return 'sports-football';
    if (name.includes('soccer')) return 'sports-soccer';
    return 'fitness-center';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#ff6b6b" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Add Exercise</Text>
            <Text style={styles.subtitle}>Log your workout session</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleLeft}>
                <View style={styles.titleIndicator} />
                <CardTitle style={styles.cardTitle}>Select Activity</CardTitle>
              </View>
              <TouchableOpacity
                style={styles.createActivityHeaderButton}
                onPress={() => {
                  console.log('=== CREATE HEADER BUTTON PRESSED ===');
                  setShowCreateModal(true);
                }}
              >
                <MaterialIcons name="add-circle-outline" size={20} color="#ff6b6b" />
                <Text style={styles.createActivityHeaderButtonText}>Create New</Text>
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading activities...</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activitiesScroll}>
                {console.log('=== ACTIVITIES DEBUG ===')}
                {console.log('Activities count:', activities.length)}
                {console.log('Activities:', activities)}
                
                {activities.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.activityCard,
                      selectedActivity?.id === activity.id && styles.selectedActivityCard
                    ]}
                    onPress={() => setSelectedActivity(activity)}
                  >
                    <View style={styles.activityIconContainer}>
                      <MaterialIcons 
                        name={getActivityIcon(activity.name)} 
                        size={24} 
                        color={selectedActivity?.id === activity.id ? '#ff6b6b' : '#6b7280'} 
                      />
                    </View>
                    <Text style={[
                      styles.activityName,
                      selectedActivity?.id === activity.id && styles.selectedActivityName
                    ]}>
                      {activity.name}
                    </Text>
                    <Text style={styles.activityCategory}>{activity.category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <View style={[styles.titleIndicator, styles.papayaIndicator]} />
              <CardTitle style={styles.cardTitle}>Workout Details</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <Input
                placeholder="e.g., 30"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <Input
                placeholder="How did it go? Any notes?"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea]}
              />
            </View>

            {selectedActivity && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Workout Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Activity:</Text>
                  <Text style={styles.summaryValue}>{selectedActivity.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Category:</Text>
                  <Text style={styles.summaryValue}>{selectedActivity.category}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Duration:</Text>
                  <Text style={styles.summaryValue}>{duration || '0'} minutes</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Calories per minute:</Text>
                  <Text style={styles.summaryValue}>{selectedActivity.caloriesPerMinute}</Text>
                </View>
                {duration && (
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Estimated calories burned:</Text>
                    <Text style={styles.totalValue}>
                      {Math.round(Number(duration) * selectedActivity.caloriesPerMinute)} cal
                    </Text>
                  </View>
                )}
              </View>
            )}
          </CardContent>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading || !selectedActivity || !duration}
          >
            <MaterialIcons name="check" size={20} color="white" />
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Logging Workout...' : 'Log Workout'}
            </Text>
          </Button>
        </View>
      </ScrollView>

      {/* Create New Activity Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Activity</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Card style={styles.modalCard}>
              <CardContent>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Activity Name *</Text>
                  <Input
                    placeholder="e.g., Morning Yoga, HIIT Training"
                    value={newActivityName}
                    onChangeText={setNewActivityName}
                    style={styles.modalInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <Input
                    placeholder="e.g., flexibility, cardio, strength"
                    value={newActivityCategory}
                    onChangeText={setNewActivityCategory}
                    style={styles.modalInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Calories per Minute *</Text>
                  <Input
                    placeholder="e.g., 4.5"
                    value={newActivityCalories}
                    onChangeText={setNewActivityCalories}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Visibility</Text>
                  <View style={styles.visibilityContainer}>
                    <TouchableOpacity
                      style={[
                        styles.visibilityButton,
                        newActivityVisibility === 'PUBLIC' && styles.visibilityButtonSelected
                      ]}
                      onPress={() => setNewActivityVisibility('PUBLIC')}
                    >
                      <MaterialIcons 
                        name="public" 
                        size={20} 
                        color={newActivityVisibility === 'PUBLIC' ? '#ff6b6b' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.visibilityButtonText,
                        newActivityVisibility === 'PUBLIC' && styles.visibilityButtonTextSelected
                      ]}>
                        Public
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.visibilityButton,
                        newActivityVisibility === 'PRIVATE' && styles.visibilityButtonSelected
                      ]}
                      onPress={() => setNewActivityVisibility('PRIVATE')}
                    >
                      <MaterialIcons 
                        name="lock" 
                        size={20} 
                        color={newActivityVisibility === 'PRIVATE' ? '#ff6b6b' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.visibilityButtonText,
                        newActivityVisibility === 'PRIVATE' && styles.visibilityButtonTextSelected
                      ]}>
                        Private
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </CardContent>
            </Card>

            <View style={styles.modalButtonContainer}>
              <Button 
                style={styles.createButton}
                onPress={handleCreateActivity}
                disabled={isCreatingActivity}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.createButtonText}>
                  {isCreatingActivity ? 'Creating...' : 'Create Activity'}
                </Text>
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7ed',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleIndicator: {
    width: 4,
    height: 32,
    backgroundColor: '#4ecdc4',
    borderRadius: 2,
    marginRight: 12,
  },
  
  // Create Activity Header Button Styles
  createActivityHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  createActivityHeaderButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  papayaIndicator: {
    backgroundColor: '#ffa726',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'left',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activitiesScroll: {
    paddingVertical: 8,
  },
  activityCard: {
    width: 120,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedActivityCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b6b',
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedActivityName: {
    color: '#ff6b6b',
  },
  activityCategory: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  visibilityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  visibilityButtonSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b6b',
  },
  visibilityButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
  },
  visibilityButtonTextSelected: {
    color: '#ff6b6b',
  },
  modalButtonContainer: {
    paddingBottom: 20,
  },
  createButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});
