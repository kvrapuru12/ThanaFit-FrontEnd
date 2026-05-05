import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, Swipeable } from 'react-native-gesture-handler';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './Input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../providers/AuthProvider';
import { useFoods } from '../hooks/useFoods';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { FoodItem, FoodLog } from '../../infrastructure/services/dashboardApi';
import { FoodVoiceRecorder } from './FoodVoiceRecorder';
import { startOfLocalDay, addLocalCalendarDays, isSameLocalDay } from '../../core/utils/dateUtils';
import { getFoodImageUrl } from '../utils/visualMappings';

const { width } = Dimensions.get('window');

/** Bottom tab bar overlay height (see BottomNavigation: padding + min tab height). */
const TAB_BAR_CLEARANCE = 88;

interface FoodTrackingProps {
  navigation?: any;
}

export function FoodTracking({ navigation }: FoodTrackingProps) {
  const insets = useSafeAreaInsets();
  const scrollBottomPadding = insets.bottom + TAB_BAR_CLEARANCE;
  const { user } = useAuth();
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const { foods, loading, error, searchFoods, loadPopularFoods } = useFoods();
  const {
    todaysMeals,
    loading: mealsLoading,
    error: mealsError,
    addFoodToMeal,
    refreshTodaysMeals,
    handleVoiceLogSuccess,
    deleteFoodLog,
    selectedDate,
    setSelectedDate,
  } = useFoodLogs();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [draftPickerDate, setDraftPickerDate] = useState(() => startOfLocalDay(new Date()));

  const todayStart = startOfLocalDay(new Date());
  const isViewingToday = isSameLocalDay(selectedDate, todayStart);
  const canGoNextDay = selectedDate.getTime() < todayStart.getTime();
  const addActionsDisabled = !isViewingToday || mealsLoading;

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

  const confirmDeleteFoodLog = (log: FoodLog) => {
    const label = log.foodItemName || log.food?.name || 'this item';
    Alert.alert(
      'Delete food log',
      `Remove "${label}" from your diary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteFoodLog(log.id);
              } catch {
                Alert.alert('Error', 'Could not delete this food log. Please try again.');
              }
            })();
          },
        },
      ]
    );
  };
  
  // No modal state needed - using navigation instead

  // No search functionality needed in this component - handled in AddFoodScreen

  // Show error alert if API fails
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'Retry', onPress: loadPopularFoods },
        { text: 'Cancel', style: 'cancel' }
      ]);
    }
  }, [error, loadPopularFoods]);

  // Show error alert for meals API
  useEffect(() => {
    if (mealsError) {
      Alert.alert('Error', mealsError, [
        { text: 'OK', style: 'cancel' }
      ]);
    }
  }, [mealsError]);

  // Handle opening add food screen
  const handleOpenAddFoodScreen = (mealType: string) => {
    if (!navigation || addActionsDisabled) return;
    navigation.navigate('AddFood', {
      mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      onFoodAdded: refreshTodaysMeals,
      logDayStartMs: selectedDate.getTime(),
    });
  };

      // Handle quick add food without modal
      const handleQuickAddFood = async (food: FoodItem) => {
        if (addActionsDisabled) {
          return;
        }
        try {
          // Map category to meal type
          const getMealTypeFromCategory = (category: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
            switch (category.toLowerCase()) {
              case 'protein':
              case 'meat':
                return 'dinner';
              case 'grains':
              case 'carbs':
              case 'bread':
                return 'breakfast';
              case 'vegetables':
              case 'greens':
                return 'lunch';
              case 'fruits':
                return 'snack';
              case 'dairy':
              case 'milk':
                return 'breakfast';
              case 'snacks':
              case 'nuts':
                return 'snack';
              default:
                return 'snack'; // Unknown categories default to snack
            }
          };

          const mealType = getMealTypeFromCategory(food.category);
          
          await addFoodToMeal(
            food.id,
            mealType,
            food.quantityPerUnit,
            food.defaultUnit,
            `Quick add: ${food.name} (${food.category})`
          );
          
        } catch (error) {
          console.error('Failed to add food:', error);
          Alert.alert(
            'Error',
            'Failed to add food item',
            [{ text: 'OK' }]
          );
        }
      };

  // No need for handleConfirmAddFood - handled in AddFoodScreen

  // Calculate total calories for a meal using backend data
  const calculateMealCalories = (mealLogs: any[]): number => {
    return mealLogs.reduce((total, log) => {
      // Use backend calories data directly
      return total + (log.calories || 0);
    }, 0);
  };

  // Calculate total macronutrients for a meal
  const calculateMealMacros = (mealLogs: any[]): { protein: number; carbs: number; fat: number } => {
    return mealLogs.reduce((total, log) => {
      return {
        protein: total.protein + (log.protein || 0),
        carbs: total.carbs + (log.carbs || 0),
        fat: total.fat + (log.fat || 0)
      };
    }, { protein: 0, carbs: 0, fat: 0 });
  };


  const mealTimes = [
    { id: 'breakfast', label: 'Breakfast', icon: '🥞', gradient: 'gradient-papaya' },
    { id: 'lunch', label: 'Lunch', icon: '🥗', gradient: 'gradient-paradise' },
    { id: 'dinner', label: 'Dinner', icon: '🍽️', gradient: 'gradient-fuschia' },
    { id: 'snack', label: 'Snacks', icon: '🍎', gradient: 'gradient-palm' }
  ];
  const hasAnyLoggedFoods = mealTimes.some((meal) => (todaysMeals[meal.id] || []).length > 0);

  return (
    <View style={styles.container}>
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Food Diary</Text>
          <Text style={styles.subtitle}>Track your meals and nutrition</Text>
          <View style={styles.dateNavRow}>
            <TouchableOpacity
              accessibilityLabel="Previous day"
              onPress={() => setSelectedDate(addLocalCalendarDays(selectedDate, -1))}
              style={styles.dateArrowButton}
              disabled={mealsLoading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="chevron-left" size={20} color="#ff6b6b" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTextButton}
              onPress={openDatePicker}
              disabled={mealsLoading}
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
              disabled={!canGoNextDay || mealsLoading}
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

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { paddingBottom: scrollBottomPadding }]}>
          {/* Meal Selection */}
        <View style={styles.mealsGrid}>
          {mealTimes.map((meal) => {
            const mealLogs = todaysMeals[meal.id] || [];
            const mealCalories = calculateMealCalories(mealLogs);
            const mealMacros = calculateMealMacros(mealLogs);
            return (
              <TouchableOpacity
                key={meal.id}
                style={[
                  styles.mealCard,
                  selectedMeal === meal.id && styles.selectedMealCard
                ]}
                onPress={() => setSelectedMeal(meal.id)}
              >
                <View style={styles.mealContent}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealIcon}>{meal.icon}</Text>
                    <Text style={[
                      styles.mealLabel,
                      selectedMeal === meal.id && styles.selectedMealText
                    ]}>
                      {meal.label}
                    </Text>
                  </View>
                  <Text style={[
                    styles.mealCalories,
                    selectedMeal === meal.id && styles.selectedMealCalories
                  ]}>
                    {Math.round(mealCalories)} cal
                  </Text>
                  <View style={styles.mealMacros}>
                        <View style={[
                          styles.macroBadge,
                          styles.proteinBadge,
                          selectedMeal === meal.id && styles.selectedProteinBadge,
                          mealMacros.protein === 0 && styles.emptyMacroBadge
                        ]}>
                          <Text style={styles.macroLetter}>P</Text>
                          <Text style={[
                            styles.macroValue,
                            selectedMeal === meal.id && styles.selectedMealMacroValue,
                            mealMacros.protein === 0 && styles.emptyMacroValue
                          ]}>
                            {mealMacros.protein.toFixed(0)}g
                          </Text>
                        </View>
                        <View style={[
                          styles.macroBadge,
                          styles.carbsBadge,
                          selectedMeal === meal.id && styles.selectedCarbsBadge,
                          mealMacros.carbs === 0 && styles.emptyMacroBadge
                        ]}>
                          <Text style={styles.macroLetter}>C</Text>
                          <Text style={[
                            styles.macroValue,
                            selectedMeal === meal.id && styles.selectedMealMacroValue,
                            mealMacros.carbs === 0 && styles.emptyMacroValue
                          ]}>
                            {mealMacros.carbs.toFixed(0)}g
                          </Text>
                        </View>
                        <View style={[
                          styles.macroBadge,
                          styles.fatBadge,
                          selectedMeal === meal.id && styles.selectedFatBadge,
                          mealMacros.fat === 0 && styles.emptyMacroBadge
                        ]}>
                          <Text style={styles.macroLetter}>F</Text>
                          <Text style={[
                            styles.macroValue,
                            selectedMeal === meal.id && styles.selectedMealMacroValue,
                            mealMacros.fat === 0 && styles.emptyMacroValue
                          ]}>
                            {mealMacros.fat.toFixed(0)}g
                          </Text>
                        </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Today's Meals Summary */}
        <Card style={styles.mealsCard}>
          <CardHeader style={styles.mealsCardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>
                {isViewingToday ? "Today's meals" : 'Meals for this day'}
              </Text>
              {hasAnyLoggedFoods && (
                <TouchableOpacity
                  style={[styles.voiceButton, addActionsDisabled && styles.actionDisabled]}
                  onPress={() => setShowVoiceRecorder(true)}
                  disabled={addActionsDisabled}
                  accessibilityState={{ disabled: addActionsDisabled }}
                >
                  <View style={styles.voiceButtonContent}>
                    <MaterialIcons name="mic" size={18} color="#ff6b6b" />
                    <Text style={styles.voiceButtonText}>Voice Log</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </CardHeader>
          <CardContent style={styles.mealsCardContent}>
            {mealsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b6b" />
                <Text style={styles.loadingText}>Loading meals...</Text>
              </View>
            ) : hasAnyLoggedFoods ? (
              mealTimes.map((meal) => {
                const mealLogs = todaysMeals[meal.id] || [];
                const mealCalories = calculateMealCalories(mealLogs);
                
                return (
                  <View key={meal.id} style={styles.mealSection}>
                    <View style={styles.mealSectionHeader}>
                      <View style={styles.mealSectionTitle}>
                        <Text style={styles.mealSectionIcon}>{meal.icon}</Text>
                        <Text style={styles.mealSectionText}>{meal.label}</Text>
                        <Badge variant="secondary" style={styles.mealCaloriesBadge}>
                          {Math.round(mealCalories)} cal
                        </Badge>
                      </View>
                      <TouchableOpacity 
                        style={[styles.addMealButton, addActionsDisabled && styles.actionDisabled]}
                        onPress={() => handleOpenAddFoodScreen(meal.id)}
                        disabled={addActionsDisabled}
                      >
                        <MaterialIcons name="add" size={16} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.foodsList}>
                      {mealLogs.length > 0 ? (
                        mealLogs.map((log) => {
                          const foodImageUrl = getFoodImageUrl({
                            name: log.foodItemName,
                            category: log.food?.category,
                          });
                          return (
                          <Swipeable
                            key={log.id}
                            friction={2}
                            overshootRight={false}
                            renderRightActions={() => (
                              <TouchableOpacity
                                style={styles.foodDeleteAction}
                                onPress={() => confirmDeleteFoodLog(log)}
                                accessibilityRole="button"
                                accessibilityLabel="Delete food log"
                              >
                                <MaterialIcons name="delete-outline" size={26} color="#ffffff" />
                                <Text style={styles.foodDeleteActionText}>Delete</Text>
                              </TouchableOpacity>
                            )}
                          >
                            <View style={styles.foodCard}>
                              <View style={styles.foodImageContainer}>
                                {foodImageUrl ? (
                                  <ImageWithFallback
                                    src={foodImageUrl}
                                    alt={log.food?.name || 'Unknown Food'}
                                    width={56}
                                    height={56}
                                    style={styles.foodImage}
                                  />
                                ) : (
                                  <View style={[styles.foodImage, styles.foodImagePlaceholder]}>
                                    <MaterialIcons name="restaurant" size={22} color="#9ca3af" />
                                  </View>
                                )}
                              </View>
                              <View style={styles.foodInfo}>
                                <View style={styles.foodNameRow}>
                                  <Text
                                    style={styles.foodCardName}
                                    numberOfLines={2}
                                    ellipsizeMode="tail"
                                  >
                                    {log.foodItemName}
                                  </Text>
                                  <View style={styles.foodNameRowActions}>
                                    <Badge variant="secondary" style={styles.foodCalories}>
                                      {Math.round(log.calories)} cal
                                    </Badge>
                                    <TouchableOpacity
                                      style={styles.rowDeleteButton}
                                      onPress={() => confirmDeleteFoodLog(log)}
                                      accessibilityRole="button"
                                      accessibilityLabel="Delete food log"
                                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                      <MaterialIcons name="delete-outline" size={22} color="#9ca3af" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                                <Text style={styles.foodCardMeta}>
                                  {Number(log.quantity) % 1 === 0 ? Math.round(log.quantity) : Number(log.quantity).toFixed(1)} {log.unit}
                                </Text>
                                <View style={styles.nutritionBadges}>
                                  <View style={styles.nutritionBadge}>
                                    <Text style={styles.nutritionText}>P: {log.protein.toFixed(1)}g</Text>
                                  </View>
                                  <View style={[styles.nutritionBadge, styles.carbsBadge]}>
                                    <Text style={styles.carbsText}>C: {log.carbs.toFixed(1)}g</Text>
                                  </View>
                                  <View style={[styles.nutritionBadge, styles.fatBadge]}>
                                    <Text style={styles.fatText}>F: {log.fat.toFixed(1)}g</Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </Swipeable>
                        );
                        })
                      ) : null}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.mealsEmptyState}>
                <MaterialIcons name="restaurant" size={48} color="#d1d5db" />
                <Text style={styles.emptyMealText}>
                  {isViewingToday ? 'No meals logged today' : 'No meals logged on this date'}
                </Text>
                <Text style={styles.emptyMealSubtext}>
                  {isViewingToday
                    ? 'Start tracking your meals to see them here'
                    : 'Switch to today to add meals or use voice log.'}
                </Text>
                <View style={styles.emptyMealActions}>
                  <TouchableOpacity
                    style={[styles.emptyAddButton, addActionsDisabled && styles.actionDisabled]}
                    onPress={() => handleOpenAddFoodScreen(selectedMeal)}
                    disabled={addActionsDisabled}
                  >
                    <MaterialIcons name="add" size={20} color="#ff6b6b" />
                    <Text style={styles.emptyAddButtonText}>Add Food</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emptyVoiceButton, addActionsDisabled && styles.actionDisabled]}
                    onPress={() => setShowVoiceRecorder(true)}
                    disabled={addActionsDisabled}
                  >
                    <MaterialIcons name="mic" size={20} color="#4ecdc4" />
                    <Text style={styles.emptyVoiceButtonText}>Voice Log</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Recent/Popular Foods */}
        <Card style={styles.popularCard}>
          <CardHeader style={styles.popularCardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.palmIndicator]} />
              <Text style={styles.cardTitleText}>
                Popular Foods
              </Text>
            </View>
          </CardHeader>
          <CardContent style={styles.popularCardContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b6b" />
                <Text style={styles.loadingText}>Loading foods...</Text>
              </View>
            ) : foods.length > 0 ? (
              foods.map((food) => {
                const foodImageUrl = getFoodImageUrl({
                  name: food.name,
                  category: food.category,
                });
                return (
                <View key={food.id} style={styles.foodCard}>
                  <View style={styles.foodImageContainer}>
                    {foodImageUrl ? (
                      <ImageWithFallback
                        src={foodImageUrl}
                        alt={food.name}
                        width={64}
                        height={64}
                        style={styles.foodImage}
                      />
                    ) : (
                      <View style={[styles.foodImage, styles.foodImagePlaceholder, { width: 64, height: 64 }]}>
                        <MaterialIcons name="restaurant" size={24} color="#9ca3af" />
                      </View>
                    )}
                  </View>
                  <View style={styles.foodInfo}>
              <View style={styles.foodNameRow}>
                <Text style={styles.foodCardName}>{food.name}</Text>
                <TouchableOpacity 
                  style={[styles.addFoodButton, addActionsDisabled && styles.actionDisabled]}
                  onPress={() => handleQuickAddFood(food)}
                  disabled={addActionsDisabled}
                >
                  <MaterialIcons name="add" size={16} color="white" />
                </TouchableOpacity>
              </View>
                    <Text style={styles.foodCardMeta}>
                      {Number(food.quantityPerUnit) % 1 === 0 ? Math.round(food.quantityPerUnit) : Number(food.quantityPerUnit).toFixed(1)}{food.defaultUnit} • {Math.round(food.caloriesPerUnit)} cal
                    </Text>
                    <View style={styles.nutritionBadges}>
                      <View style={styles.nutritionBadge}>
                        <Text style={styles.nutritionText}>P: {food.proteinPerUnit.toFixed(1)}g</Text>
                      </View>
                      <View style={[styles.nutritionBadge, styles.carbsBadge]}>
                        <Text style={styles.carbsText}>C: {food.carbsPerUnit.toFixed(1)}g</Text>
                      </View>
                      <View style={[styles.nutritionBadge, styles.fatBadge]}>
                        <Text style={styles.fatText}>F: {food.fatPerUnit.toFixed(1)}g</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="restaurant" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  No popular foods available
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* No modal needed - using AddFoodScreen instead */}
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

      <FoodVoiceRecorder
          visible={showVoiceRecorder}
          onClose={() => setShowVoiceRecorder(false)}
          userId={user?.id}
          onVoiceLogSuccess={handleVoiceLogSuccess}
          onVoiceLog={(transcript) => {
            console.log('Voice transcript received:', transcript);
            // Handle manual voice log if needed
          }}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7ed',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60, // Safe area from top
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fef7ed',
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
    color: '#ff6b6b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
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
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
  },
  datePickerConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  thanafitLogo: {
    width: 64,
    height: 64,
  },
  thanafitLogoImage: {
    width: '100%',
    height: '100%',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 26,
  },
  mealCard: {
    width: (width - 16 * 2 - 16) / 2,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectedMealCard: {
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderColor: '#ff6b6b',
    transform: [{ scale: 1.02 }],
  },
  mealContent: {
    alignItems: 'center',
    width: '100%',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mealIcon: {
    fontSize: 28,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
    marginBottom: 0,
    textAlign: 'center',
  },
  selectedMealText: {
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedMealCalories: {
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mealMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 6,
  },
  macroBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  proteinBadge: {
    backgroundColor: '#ef4444', // Red background for protein
    borderColor: '#dc2626',
  },
  carbsBadge: {
    backgroundColor: '#3b82f6', // Blue background for carbs
    borderColor: '#2563eb',
  },
  fatBadge: {
    backgroundColor: '#8b5cf6', // Purple background for fat
    borderColor: '#7c3aed',
  },
  selectedProteinBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectedCarbsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectedFatBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  macroLetter: {
    fontSize: 10,
    fontWeight: '600',
    marginRight: 4,
    color: 'white', // White text for visibility
  },
  macroValue: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white', // White text for visibility
  },
  selectedMealMacroValue: {
    color: 'white',
  },
  emptyMacroBadge: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  emptyMacroValue: {
    color: '#9ca3af',
  },
  mealsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 26,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealsCardHeader: {
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  mealsCardContent: {
    gap: 16,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  popularCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 26,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  voiceButton: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginLeft: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  voiceButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  titleIndicator: {
    width: 4,
    height: 22,
    backgroundColor: '#4ecdc4',
    borderRadius: 2,
  },
  paradiseIndicator: {
    backgroundColor: '#ff6b6b',
  },
  palmIndicator: {
    backgroundColor: '#4ecdc4',
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
  mealSection: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealsEmptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyMealActions: {
    width: '100%',
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  emptyAddButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#f3d1d5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  emptyVoiceButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4ecdc4',
    backgroundColor: '#dff3f2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptyVoiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ecdc4',
  },
  mealSectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealSectionIcon: {
    fontSize: 20,
  },
  mealSectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  addMealButton: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 16,
  },
  foodsList: {
    gap: 16,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodName: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  foodCalories: {
    backgroundColor: '#ffa726',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  foodDeleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 92,
    borderRadius: 16,
    marginLeft: 10,
  },
  foodDeleteActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  foodImageContainer: {
    position: 'relative',
  },
  foodImage: {
    borderRadius: 16,
  },
  foodImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  foodNameRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  rowDeleteButton: {
    padding: 2,
  },
  foodCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  foodCardMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  nutritionBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nutritionText: {
    fontSize: 12,
    color: 'white',
  },
  carbsText: {
    fontSize: 12,
    color: 'white',
  },
  fatText: {
    fontSize: 12,
    color: 'white',
  },
  addFoodButton: {
    backgroundColor: '#ffa726',
    padding: 8,
    borderRadius: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  clearSearchButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  clearSearchText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mealCaloriesBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  foodItemLeft: {
    flex: 1,
  },
  foodQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyMealText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyMealSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#1f2937',
  },
  noteInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#1f2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#ffa726',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Modal styles removed - using AddFoodScreen instead
});