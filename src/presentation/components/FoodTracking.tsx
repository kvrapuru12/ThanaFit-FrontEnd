import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Dimensions 
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './Input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../providers/AuthProvider';

const { width } = Dimensions.get('window');

export function FoodTracking() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');

  const mealTimes = [
    { id: 'breakfast', label: 'Breakfast', calories: 320, icon: '🥞', gradient: 'gradient-papaya' },
    { id: 'lunch', label: 'Lunch', calories: 480, icon: '🥗', gradient: 'gradient-paradise' },
    { id: 'dinner', label: 'Dinner', calories: 650, icon: '🍽️', gradient: 'gradient-fuschia' },
    { id: 'snacks', label: 'Snacks', calories: 0, icon: '🍎', gradient: 'gradient-palm' }
  ];

  const recentFoods = [
    {
      name: "Grilled Chicken Breast",
      calories: 165,
      serving: "100g",
      protein: 25,
      carbs: 0,
      fat: 3.6,
      image: "https://images.unsplash.com/photo-1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300"
    },
    {
      name: "Brown Rice",
      calories: 216,
      serving: "1 cup cooked",
      protein: 5,
      carbs: 45,
      fat: 1.8,
      image: "https://images.unsplash.com/photo-1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300"
    },
    {
      name: "Mixed Vegetables",
      calories: 85,
      serving: "1 cup",
      protein: 4,
      carbs: 17,
      fat: 0.5,
      image: "https://images.unsplash.com/photo-1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300"
    },
    {
      name: "Greek Yogurt",
      calories: 100,
      serving: "150g",
      protein: 10,
      carbs: 6,
      fat: 5,
      image: "https://images.unsplash.com/photo-1592503469196-3a7880cc2d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYnJlYWtmYXN0JTIwYm93bHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300"
    }
  ];

  const todaysMeals = [
    {
      meal: 'breakfast',
      foods: [
        { name: 'Oatmeal with Berries', calories: 220 },
        { name: 'Greek Yogurt', calories: 100 }
      ]
    },
    {
      meal: 'lunch', 
      foods: [
        { name: 'Quinoa Salad Bowl', calories: 480 }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Food Diary</Text>
            <Text style={styles.subtitle}>Track your meals and nutrition</Text>
          </View>
          <Button style={styles.scanButton}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
            <Text style={styles.scanButtonText}>Scan</Text>
          </Button>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          <MaterialIcons name="auto-awesome" size={16} color="#ff6b6b" style={styles.sparklesIcon} />
        </View>

        {/* Quick Add Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialIcons name="camera-alt" size={16} color="#ff6b6b" />
            <Text style={styles.quickActionText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialIcons name="restaurant" size={16} color="#4ecdc4" />
            <Text style={styles.quickActionText}>Recipe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <MaterialIcons name="access-time" size={16} color="#ffa726" />
            <Text style={styles.quickActionText}>Recent</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Meal Selection */}
        <View style={styles.mealsGrid}>
          {mealTimes.map((meal) => (
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
                  {meal.calories} cal
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Meals Summary */}
        <Card style={styles.mealsCard}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>Today's Meals</Text>
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {todaysMeals.map((mealData, index) => (
              <View key={index} style={styles.mealSection}>
                <View style={styles.mealSectionHeader}>
                  <View style={styles.mealSectionTitle}>
                    <Text style={styles.mealSectionIcon}>
                      {mealTimes.find(m => m.id === mealData.meal)?.icon}
                    </Text>
                    <Text style={styles.mealSectionText}>
                      {mealData.meal.charAt(0).toUpperCase() + mealData.meal.slice(1)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.addMealButton}>
                    <MaterialIcons name="add" size={16} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
                <View style={styles.foodsList}>
                  {mealData.foods.map((food, foodIndex) => (
                    <View key={foodIndex} style={styles.foodItem}>
                      <Text style={styles.foodName}>{food.name}</Text>
                      <Badge variant="secondary" style={styles.foodCalories}>
                        {food.calories} cal
                      </Badge>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Recent/Popular Foods */}
        <Card style={styles.popularCard}>
          <CardHeader style={styles.cardHeader}>
            <CardTitle style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.palmIndicator]} />
              <Text style={styles.cardTitleText}>Popular Foods</Text>
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {recentFoods.map((food, index) => (
              <View key={index} style={styles.foodCard}>
                <View style={styles.foodImageContainer}>
                  <ImageWithFallback
                    src={food.image}
                    alt={food.name}
                    width={64}
                    height={64}
                    style={styles.foodImage}
                  />
                  <View style={styles.foodBadge}>
                    <Text style={styles.foodBadgeText}>🥥</Text>
                  </View>
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodCardName}>{food.name}</Text>
                  <Text style={styles.foodCardMeta}>
                    {food.serving} • {food.calories} cal
                  </Text>
                  <View style={styles.nutritionBadges}>
                    <View style={styles.nutritionBadge}>
                      <Text style={styles.nutritionText}>P: {food.protein}g</Text>
                    </View>
                    <View style={[styles.nutritionBadge, styles.carbsBadge]}>
                      <Text style={styles.carbsText}>C: {food.carbs}g</Text>
                    </View>
                    <View style={[styles.nutritionBadge, styles.fatBadge]}>
                      <Text style={styles.fatText}>F: {food.fat}g</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.addFoodButton}>
                  <MaterialIcons name="add" size={16} color="#ffa726" />
                </TouchableOpacity>
              </View>
            ))}
          </CardContent>
        </Card>
      </View>
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
  scanButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  searchIcon: {
    position: 'absolute',
    left: 20,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 24,
    paddingLeft: 56,
    paddingRight: 56,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sparklesIcon: {
    position: 'absolute',
    right: 20,
    top: 18,
  },
  quickActions: {
    marginBottom: 32,
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    color: '#374151',
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
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedMealCard: {
    backgroundColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mealContent: {
    alignItems: 'flex-start',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    textTransform: 'capitalize',
  },
  selectedMealText: {
    color: 'white',
  },
  mealCalories: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedMealCalories: {
    color: 'rgba(255,255,255,0.8)',
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
  },
  titleIndicator: {
    width: 4,
    height: 32,
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
    fontWeight: '600',
    color: '#1f2937',
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
    color: '#ff6b6b',
    fontWeight: '500',
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
  foodCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 4,
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
  carbsBadge: {
    backgroundColor: '#ffa726',
  },
  fatBadge: {
    backgroundColor: '#4ecdc4',
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
});