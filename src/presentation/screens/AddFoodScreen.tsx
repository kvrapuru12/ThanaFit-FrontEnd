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
  TextInput,
  ActivityIndicator,
  Dimensions,
  Modal
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { dashboardApiService, FoodItem } from '../../infrastructure/services/dashboardApi';
import { useFoods } from '../hooks/useFoods';

const { width } = Dimensions.get('window');

export const AddFoodScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const { foods, searchFoods, loadPopularFoods } = useFoods();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create Food Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
  const [newFoodDefaultUnit, setNewFoodDefaultUnit] = useState('grams');
  const [newFoodQuantityPerUnit, setNewFoodQuantityPerUnit] = useState('100');
  const [newFoodCaloriesPerUnit, setNewFoodCaloriesPerUnit] = useState('');
  const [newFoodProteinPerUnit, setNewFoodProteinPerUnit] = useState('');
  const [newFoodCarbsPerUnit, setNewFoodCarbsPerUnit] = useState('');
  const [newFoodFatPerUnit, setNewFoodFatPerUnit] = useState('');
  const [newFoodFiberPerUnit, setNewFoodFiberPerUnit] = useState('');
  const [newFoodVisibility, setNewFoodVisibility] = useState<'public' | 'private'>('public');
  const [isCreatingFood, setIsCreatingFood] = useState(false);
  const [showServingUnitPicker, setShowServingUnitPicker] = useState(false);
  
  const mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = (route?.params?.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack') || 'breakfast';
  const mealTypeLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch', 
    dinner: 'Dinner',
    snack: 'Snack'
  };

  useEffect(() => {
    loadPopularFoods();
  }, []);

  // Handle search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        await searchFoods(query);
        // The searchFoods function updates the foods state, so we use that
        setSearchResults([]);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Update search results when foods state changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(foods);
    }
  }, [foods, searchQuery]);

  // Handle search input changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle selecting a food item
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    const isGrams = food.defaultUnit?.toLowerCase().includes('gram') || food.defaultUnit?.toLowerCase() === 'g';
    setQuantity(isGrams ? '1' : food.quantityPerUnit.toString());
  };

  // Handle creating new food
  const handleCreateFood = async () => {
    if (!newFoodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    if (!newFoodCaloriesPerUnit || isNaN(Number(newFoodCaloriesPerUnit))) {
      Alert.alert('Error', 'Please enter valid calories per unit');
      return;
    }

    if (Number(newFoodCaloriesPerUnit) <= 0) {
      Alert.alert('Error', 'Calories per unit must be greater than 0');
      return;
    }

    try {
      setIsCreatingFood(true);
      
      const foodData = {
        name: newFoodName.trim(),
        category: newFoodCategory,
        defaultUnit: newFoodDefaultUnit,
        quantityPerUnit: Number(newFoodQuantityPerUnit) || 100,
        caloriesPerUnit: Number(newFoodCaloriesPerUnit),
        proteinPerUnit: Number(newFoodProteinPerUnit) || 0,
        carbsPerUnit: Number(newFoodCarbsPerUnit) || 0,
        fatPerUnit: Number(newFoodFatPerUnit) || 0,
        fiberPerUnit: Number(newFoodFiberPerUnit) || 0,
        visibility: newFoodVisibility
      };

      const newFood = await dashboardApiService.createFood(foodData);
      
      // Create a temporary food object to add to the list
      const tempFood: FoodItem = {
        id: newFood.id,
        name: foodData.name,
        category: foodData.category,
        defaultUnit: foodData.defaultUnit,
        quantityPerUnit: foodData.quantityPerUnit,
        caloriesPerUnit: foodData.caloriesPerUnit,
        proteinPerUnit: foodData.proteinPerUnit,
        carbsPerUnit: foodData.carbsPerUnit,
        fatPerUnit: foodData.fatPerUnit,
        fiberPerUnit: foodData.fiberPerUnit,
        visibility: foodData.visibility,
        createdAt: newFood.createdAt,
        updatedAt: newFood.updatedAt
      };

      // Add the new food to the search results and select it
      setSearchResults(prev => [tempFood, ...prev]);
      setSelectedFood(tempFood);
      const isGrams = tempFood.defaultUnit?.toLowerCase().includes('gram') || tempFood.defaultUnit?.toLowerCase() === 'g';
      setQuantity(isGrams ? '1' : tempFood.quantityPerUnit.toString());
      
      // Close modal and reset form
      setShowCreateModal(false);
      setShowServingUnitPicker(false);
      setNewFoodName('');
      setNewFoodCategory('snack');
      setNewFoodDefaultUnit('grams');
      setNewFoodQuantityPerUnit('100');
      setNewFoodCaloriesPerUnit('');
      setNewFoodProteinPerUnit('');
      setNewFoodCarbsPerUnit('');
      setNewFoodFatPerUnit('');
      setNewFoodFiberPerUnit('');
      setNewFoodVisibility('public');
      
      Alert.alert(
        'Success! 🎉',
        `"${foodData.name}" has been created and selected!`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Failed to create food:', error);
      Alert.alert(
        'Error',
        'Failed to create food. Please try again.'
      );
    } finally {
      setIsCreatingFood(false);
    }
  };

  // Handle adding food to meal
  const handleAddFood = async () => {
    if (!selectedFood || !user?.id) return;

    try {
      setIsLoading(true);
      const quantityNum = parseFloat(quantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity');
        return;
      }

      await dashboardApiService.addFoodLog({
        userId: user.id,
        foodItemId: selectedFood.id,
        mealType,
        quantity: quantityNum,
        unit: selectedFood.defaultUnit,
        note: note.trim() || undefined
      });

      Alert.alert(
        'Success!',
        `${selectedFood.name} added to ${mealTypeLabels[mealType]}`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (route?.params?.onFoodAdded) {
                route.params.onFoodAdded();
              }
              if (navigation) {
                navigation.goBack();
              }
            }
          }
        ]
      );
    } catch (err) {
      console.error('Failed to add food:', err);
      Alert.alert('Error', 'Failed to add food item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food to {mealTypeLabels[mealType]}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Section */}
        <Card style={styles.searchCard}>
          <CardContent style={styles.searchContent}>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for foods..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </CardContent>
        </Card>

        {/* Food Selection */}
        <Card style={styles.foodSelectionCard}>
          <CardHeader style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.titleLeft}>
                <View style={styles.titleIndicator} />
                <CardTitle style={styles.cardTitle}>Select Food</CardTitle>
              </View>
              <TouchableOpacity
                style={styles.createFoodHeaderButton}
                onPress={() => setShowCreateModal(true)}
              >
                <MaterialIcons name="add-circle-outline" size={20} color="#ff6b6b" />
                <Text style={styles.createFoodHeaderButtonText}>Create New</Text>
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ff6b6b" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
                  {searchResults.map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      style={[
                        styles.foodItem,
                        selectedFood?.id === food.id && styles.selectedFoodItem
                      ]}
                      onPress={() => handleSelectFood(food)}
                    >
                      <View style={styles.foodItemInfo}>
                        <Text style={styles.foodItemName}>{food.name}</Text>
                        <Text style={styles.foodItemMeta}>
                          {Number(food.quantityPerUnit) % 1 === 0 ? Math.round(food.quantityPerUnit) : Number(food.quantityPerUnit).toFixed(1)} {food.defaultUnit} • {Math.round(food.caloriesPerUnit)} cal
                        </Text>
                      </View>
                      <View style={styles.foodItemBadges}>
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
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="search-off" size={48} color="#9ca3af" />
                  <Text style={styles.emptyText}>No foods found</Text>
                </View>
              )
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>Search for foods to add</Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Selected Food Details */}
        {selectedFood && (
          <Card style={styles.selectedFoodCard}>
            <CardHeader style={styles.cardHeader}>
              <CardTitle style={styles.cardTitle}>Selected Food</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              <View style={styles.selectedFoodInfo}>
                <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                <Text style={styles.selectedFoodMeta}>
                  {Number(selectedFood.quantityPerUnit) % 1 === 0 ? Math.round(selectedFood.quantityPerUnit) : Number(selectedFood.quantityPerUnit).toFixed(1)} {selectedFood.defaultUnit} • {Math.round(selectedFood.caloriesPerUnit)} cal
                </Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.quantityInputContainer}>
                    <Text style={styles.inputLabel}>
                      {selectedFood.defaultUnit?.toLowerCase().includes('gram') || selectedFood.defaultUnit?.toLowerCase() === 'g'
                        ? 'Serving'
                        : 'Quantity'}
                    </Text>
                    <TextInput
                      style={styles.quantityInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      placeholder="Enter quantity"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Note (Optional)</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Add a note..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>
            </CardContent>
          </Card>
        )}
      </ScrollView>

      {/* Add Button */}
      <View style={styles.bottomContainer}>
        <Button
          style={[styles.addButton, !selectedFood && styles.disabledButton]}
          onPress={handleAddFood}
          disabled={!selectedFood || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.addButtonText}>
              Add to {mealTypeLabels[mealType]}
            </Text>
          )}
        </Button>
      </View>

      {/* Create New Food Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowCreateModal(false); setShowServingUnitPicker(false); }}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => { setShowCreateModal(false); setShowServingUnitPicker(false); }}
            >
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Food</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Card style={styles.modalCard}>
              <CardContent>
                <View style={styles.inputGroup}>
                  <Text style={styles.modalInputLabel}>Food Name *</Text>
                  <TextInput
                    placeholder="e.g., Grilled Chicken Breast, Quinoa Salad"
                    value={newFoodName}
                    onChangeText={setNewFoodName}
                    style={styles.modalInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalInputLabel}>Category *</Text>
                  <View style={styles.categoryContainer}>
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          newFoodCategory === category && styles.categoryButtonSelected
                        ]}
                        onPress={() => setNewFoodCategory(category)}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          newFoodCategory === category && styles.categoryButtonTextSelected
                        ]}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.modalInputLabel}>Serving size</Text>
                    <TextInput
                      placeholder="e.g. 100, 1"
                      value={newFoodQuantityPerUnit}
                      onChangeText={setNewFoodQuantityPerUnit}
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.modalInputLabel}>Serving unit</Text>
                    <TouchableOpacity
                      style={styles.servingUnitDropdown}
                      onPress={() => setShowServingUnitPicker(true)}
                    >
                      <Text style={styles.servingUnitDropdownText}>{newFoodDefaultUnit}</Text>
                      <MaterialIcons name="arrow-drop-down" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalInputLabel}>Calories per Unit *</Text>
                  <TextInput
                    placeholder="e.g., 165"
                    value={newFoodCaloriesPerUnit}
                    onChangeText={setNewFoodCaloriesPerUnit}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.modalInputLabel}>Protein (g)</Text>
                    <TextInput
                      placeholder="0"
                      value={newFoodProteinPerUnit}
                      onChangeText={setNewFoodProteinPerUnit}
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.modalInputLabel}>Carbs (g)</Text>
                    <TextInput
                      placeholder="0"
                      value={newFoodCarbsPerUnit}
                      onChangeText={setNewFoodCarbsPerUnit}
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.modalInputLabel}>Fat (g)</Text>
                    <TextInput
                      placeholder="0"
                      value={newFoodFatPerUnit}
                      onChangeText={setNewFoodFatPerUnit}
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.modalInputLabel}>Fiber (g)</Text>
                    <TextInput
                      placeholder="0"
                      value={newFoodFiberPerUnit}
                      onChangeText={setNewFoodFiberPerUnit}
                      keyboardType="numeric"
                      style={styles.modalInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.modalInputLabel}>Visibility</Text>
                  <View style={styles.visibilityContainer}>
                    <TouchableOpacity
                      style={[
                        styles.visibilityButton,
                        newFoodVisibility === 'public' && styles.visibilityButtonSelected
                      ]}
                      onPress={() => setNewFoodVisibility('public')}
                    >
                      <MaterialIcons 
                        name="public" 
                        size={20} 
                        color={newFoodVisibility === 'public' ? '#ff6b6b' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.visibilityButtonText,
                        newFoodVisibility === 'public' && styles.visibilityButtonTextSelected
                      ]}>
                        Public
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.visibilityButton,
                        newFoodVisibility === 'private' && styles.visibilityButtonSelected
                      ]}
                      onPress={() => setNewFoodVisibility('private')}
                    >
                      <MaterialIcons 
                        name="lock" 
                        size={20} 
                        color={newFoodVisibility === 'private' ? '#ff6b6b' : '#6b7280'} 
                      />
                      <Text style={[
                        styles.visibilityButtonText,
                        newFoodVisibility === 'private' && styles.visibilityButtonTextSelected
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
                onPress={handleCreateFood}
                disabled={isCreatingFood}
              >
                <MaterialIcons name="restaurant" size={20} color="white" />
                <Text style={styles.createButtonText}>
                  {isCreatingFood ? 'Creating...' : 'Create Food'}
                </Text>
              </Button>
            </View>
          </ScrollView>

          {/* Serving unit picker overlay - inside Create modal so it appears on top */}
          {showServingUnitPicker && (
            <View style={styles.servingUnitPickerOverlay} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.servingUnitPickerDimmer}
                activeOpacity={1}
                onPress={() => setShowServingUnitPicker(false)}
              />
              <View style={styles.servingUnitPickerContent} pointerEvents="box-none">
                <View style={styles.servingUnitPickerHeader}>
                  <Text style={styles.servingUnitPickerTitle}>Serving unit</Text>
                  <TouchableOpacity onPress={() => setShowServingUnitPicker(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <MaterialIcons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.servingUnitOptionsList} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.servingUnitOption, newFoodDefaultUnit === 'grams' && styles.servingUnitOptionSelected]}
                    onPress={() => { setNewFoodDefaultUnit('grams'); setShowServingUnitPicker(false); }}
                  >
                    <Text style={[styles.servingUnitOptionText, newFoodDefaultUnit === 'grams' && styles.servingUnitOptionTextSelected]}>grams</Text>
                    {newFoodDefaultUnit === 'grams' && <MaterialIcons name="check-circle" size={24} color="#ff6b6b" />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.servingUnitOption, newFoodDefaultUnit === 'pieces' && styles.servingUnitOptionSelected]}
                    onPress={() => { setNewFoodDefaultUnit('pieces'); setShowServingUnitPicker(false); }}
                  >
                    <Text style={[styles.servingUnitOptionText, newFoodDefaultUnit === 'pieces' && styles.servingUnitOptionTextSelected]}>pieces</Text>
                    {newFoodDefaultUnit === 'pieces' && <MaterialIcons name="check-circle" size={24} color="#ff6b6b" />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.servingUnitOption, newFoodDefaultUnit === 'cup' && styles.servingUnitOptionSelected]}
                    onPress={() => { setNewFoodDefaultUnit('cup'); setShowServingUnitPicker(false); }}
                  >
                    <Text style={[styles.servingUnitOptionText, newFoodDefaultUnit === 'cup' && styles.servingUnitOptionTextSelected]}>cup</Text>
                    {newFoodDefaultUnit === 'cup' && <MaterialIcons name="check-circle" size={24} color="#ff6b6b" />}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchCard: {
    marginBottom: 20,
  },
  searchContent: {
    padding: 16,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#1f2937',
  },
  foodSelectionCard: {
    marginBottom: 20,
  },
  selectedFoodCard: {
    marginBottom: 20,
  },
  cardHeader: {
    paddingBottom: 12,
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
  createFoodHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  createFoodHeaderButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'left',
    flex: 1,
  },
  cardContent: {
    paddingTop: 0,
  },
  foodList: {
    maxHeight: 300,
  },
  foodItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedFoodItem: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b6b',
  },
  foodItemInfo: {
    marginBottom: 8,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  foodItemMeta: {
    fontSize: 14,
    color: '#6b7280',
  },
  foodItemBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  carbsBadge: {
    backgroundColor: '#ffa726',
  },
  fatBadge: {
    backgroundColor: '#66bb6a',
  },
  nutritionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  carbsText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  fatText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  selectedFoodInfo: {
    gap: 16,
  },
  selectedFoodName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedFoodMeta: {
    fontSize: 16,
    color: '#6b7280',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInputContainer: {
    flex: 1,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  inputGroupHalf: {
    flex: 1,
    marginBottom: 20,
  },
  modalInputLabel: {
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
  servingUnitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  servingUnitDropdownText: {
    fontSize: 16,
    color: '#1f2937',
  },
  servingUnitPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  servingUnitPickerDimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 0,
  },
  servingUnitPickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    zIndex: 1,
  },
  servingUnitPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servingUnitPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  servingUnitOptionsList: {
    maxHeight: 280,
  },
  servingUnitOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  servingUnitOptionSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  servingUnitOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  servingUnitOptionTextSelected: {
    fontWeight: '600',
    color: '#ff6b6b',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryButtonSelected: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b6b',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryButtonTextSelected: {
    color: '#ff6b6b',
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
