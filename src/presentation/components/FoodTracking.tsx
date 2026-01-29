import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Card, CardContent, CardHeader } from './ui/card';
import { Input } from './Input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../providers/AuthProvider';
import { useFoods } from '../hooks/useFoods';
import { useFoodLogs } from '../hooks/useFoodLogs';
import { FoodItem } from '../../infrastructure/services/dashboardApi';
import { FoodVoiceRecorder } from './FoodVoiceRecorder';

const { width } = Dimensions.get('window');

interface FoodTrackingProps {
  navigation?: any;
}

export function FoodTracking({ navigation }: FoodTrackingProps) {
  const { user } = useAuth();
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const { foods, loading, error, searchFoods, loadPopularFoods } = useFoods();
  const { todaysMeals, loading: mealsLoading, error: mealsError, addFoodToMeal, refreshTodaysMeals, handleVoiceLogSuccess } = useFoodLogs();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  // No modal state needed - using navigation instead

  // Load popular foods on mount
  useEffect(() => {
    loadPopularFoods();
  }, []);

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
    if (navigation) {
      navigation.navigate('AddFood', {
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        onFoodAdded: refreshTodaysMeals
      });
    }
  };

      // Handle quick add food without modal
      const handleQuickAddFood = async (food: FoodItem) => {
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
          
          // Show success message with meal type
          Alert.alert(
            'Success!',
            `${food.name} added to ${mealType}`,
            [{ text: 'OK' }]
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

  // Helper function to get food image URL based on category
  const getFoodImageUrl = (food: FoodItem): string => {
    const baseUrl = "https://images.unsplash.com/photo-";
    const categoryImages = {
      protein: "1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300",
      grains: "1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300",
      vegetables: "1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300",
      dairy: "1592503469196-3a7880cc2d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYnJlYWtmYXN0JTIwYm93bHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300",
      fruits: "1592503469196-3a7880cc2d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYnJlYWtmYXN0JTIwYm93bHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300",
      default: "1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300"
    };
    
    const categoryKey = food.category.toLowerCase() as keyof typeof categoryImages;
    return baseUrl + (categoryImages[categoryKey] || categoryImages.default);
  };

  const mealTimes = [
    { id: 'breakfast', label: 'Breakfast', icon: '🥞', gradient: 'gradient-papaya' },
    { id: 'lunch', label: 'Lunch', icon: '🥗', gradient: 'gradient-paradise' },
    { id: 'dinner', label: 'Dinner', icon: '🍽️', gradient: 'gradient-fuschia' },
    { id: 'snack', label: 'Snacks', icon: '🍎', gradient: 'gradient-palm' }
  ];

  return (
    <View style={styles.container}>
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Food Diary</Text>
          <Text style={styles.subtitle}>Track your meals and nutrition</Text>
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
        <View style={styles.content}>
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
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>Today's Meals</Text>
              <TouchableOpacity 
                style={styles.voiceButton}
                onPress={() => setShowVoiceRecorder(true)}
              >
                <MaterialIcons name="mic" size={20} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {mealsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b6b" />
                <Text style={styles.loadingText}>Loading meals...</Text>
              </View>
            ) : (
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
                        style={styles.addMealButton}
                        onPress={() => handleOpenAddFoodScreen(meal.id)}
                      >
                        <MaterialIcons name="add" size={16} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.foodsList}>
                      {mealLogs.length > 0 ? (
                        mealLogs.map((log, logIndex) => (
                          <View key={logIndex} style={styles.foodCard}>
                            <View style={styles.foodImageContainer}>
                              <ImageWithFallback
                                src={getFoodImageUrl(log.food || { category: 'default' } as FoodItem)}
                                alt={log.food?.name || 'Unknown Food'}
                                width={64}
                                height={64}
                                style={styles.foodImage}
                              />
                              <View style={styles.foodBadge}>
                                <Text style={styles.foodBadgeText}>
                                  {log.food?.category === 'protein' ? '🥩' : 
                                   log.food?.category === 'grains' ? '🌾' :
                                   log.food?.category === 'vegetables' ? '🥬' :
                                   log.food?.category === 'dairy' ? '🥛' :
                                   log.food?.category === 'fruits' ? '🍎' : '🥥'}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.foodInfo}>
                              <View style={styles.foodNameRow}>
                                <Text style={styles.foodCardName}>
                                  {log.foodItemName}
                                </Text>
                                <Badge variant="secondary" style={styles.foodCalories}>
                                  {Math.round(log.calories)} cal
                                </Badge>
                              </View>
                              <Text style={styles.foodCardMeta}>
                                {log.quantity} {log.unit} • {Math.round(log.food?.caloriesPerUnit || (log.calories / log.quantity))} cal per unit
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
                        ))
                      ) : (
                        <View style={styles.emptyMealContainer}>
                          <Text style={styles.emptyMealText}>No foods logged yet</Text>
                          <Text style={styles.emptyMealSubtext}>
                            Tap the + button to add foods to this meal
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent/Popular Foods */}
        <Card style={styles.popularCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.palmIndicator]} />
              <Text style={styles.cardTitleText}>
                Popular Foods
              </Text>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b6b" />
                <Text style={styles.loadingText}>Loading foods...</Text>
              </View>
            ) : foods.length > 0 ? (
              foods.map((food) => (
                <View key={food.id} style={styles.foodCard}>
                  <View style={styles.foodImageContainer}>
                    <ImageWithFallback
                      src={getFoodImageUrl(food)}
                      alt={food.name}
                      width={64}
                      height={64}
                      style={styles.foodImage}
                    />
                    <View style={styles.foodBadge}>
                      <Text style={styles.foodBadgeText}>
                        {food.category === 'protein' ? '🥩' : 
                         food.category === 'grains' ? '🌾' :
                         food.category === 'vegetables' ? '🥬' :
                         food.category === 'dairy' ? '🥛' :
                         food.category === 'fruits' ? '🍎' : '🥥'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.foodInfo}>
              <View style={styles.foodNameRow}>
                <Text style={styles.foodCardName}>{food.name}</Text>
                <TouchableOpacity 
                  style={styles.addFoodButton}
                  onPress={() => handleQuickAddFood(food)}
                >
                  <MaterialIcons name="add" size={16} color="white" />
                </TouchableOpacity>
              </View>
                    <Text style={styles.foodCardMeta}>
                      {food.quantityPerUnit}{food.defaultUnit} • {Math.round(food.caloriesPerUnit)} cal
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
              ))
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
  thanafitLogo: {
    width: 80,
    height: 80,
  },
  thanafitLogoImage: {
    width: '100%',
    height: '100%',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  mealCard: {
    width: (width - 80) / 2,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 16,
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
    marginBottom: 8,
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
  voiceButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    marginLeft: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  titleIndicator: {
    width: 4,
    height: 24,
    backgroundColor: '#4ecdc4',
    borderRadius: 2,
    marginTop: 8, // Manual centering: (40 - 24) / 2 = 8
  },
  paradiseIndicator: {
    backgroundColor: '#ff6b6b',
  },
  palmIndicator: {
    backgroundColor: '#4ecdc4',
  },
  cardTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'left',
    flex: 1,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 8, // Manual centering for text: (40 - 24) / 2 = 8
  },
  cardContent: {
    gap: 24,
  },
  mealSection: {
    backgroundColor: '#f3f4f6',
    padding: 24,
    borderRadius: 24,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 14,
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
    gap: 12,
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
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
  },
  foodImageContainer: {
    position: 'relative',
  },
  foodImage: {
    borderRadius: 16,
  },
  foodBadge: {
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
  foodBadgeText: {
    fontSize: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  foodCardMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  nutritionBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
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
  emptyMealContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  emptyMealText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyMealSubtext: {
    fontSize: 12,
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