import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AuthProvider, useAuth } from './src/presentation/providers/AuthProvider';
import { container } from './src/di/Container';
import LoginScreen from './src/presentation/screens/LoginScreen';
import SignupScreen from './src/presentation/screens/SignupScreen';
import { BottomNavigation } from './src/presentation/components/BottomNavigation';
import { Dashboard } from './src/presentation/components/Dashboard';
import { FoodTracking } from './src/presentation/components/FoodTracking';
import { ExerciseTracking } from './src/presentation/components/ExerciseTracking';
import { ProgressTracking } from './src/presentation/components/ProgressTracking';
import { Profile } from './src/presentation/components/Profile';
import { ApiTest } from './src/presentation/components/ApiTest';
import { AddExerciseScreen } from './src/presentation/screens/AddExerciseScreen';
import { AddFoodScreen } from './src/presentation/screens/AddFoodScreen';

// Import global CSS for web builds
import './src/styles/global.css';

const Stack = createNativeStackNavigator();

// Loading Screen Component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

// Main App Navigator Component
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "MainApp" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // Authenticated Stack
          <>
            <Stack.Screen
              name="MainApp"
              component={MainApp}
              options={{ title: 'ThanaFit' }}
            />
            <Stack.Screen
              name="AddExercise"
              component={AddExerciseScreen}
              options={{ title: 'Add Exercise' }}
            />
            <Stack.Screen
              name="AddFood"
              component={AddFoodScreen}
              options={{ title: 'Add Food' }}
            />
          </>
        ) : (
          // Authentication Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Login' }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ title: 'Sign Up' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App Component with Bottom Navigation
const MainApp = ({ navigation }: { navigation?: any }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveTab = (navigation?: any) => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'food':
        return <FoodTracking navigation={navigation} />;
      case 'exercise':
        return <ExerciseTracking navigation={navigation} />;
      case 'progress':
        return <ProgressTracking />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs">
        {({ navigation }) => (
          <View style={styles.mainAppContainer}>
            {renderActiveTab(navigation)}
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </View>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// Main App Component with Clean Architecture
export default function App() {
  // Get auth repository from dependency injection container
  const authRepository = container.getAuthRepository();

  return (
    <AuthProvider authRepository={authRepository}>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  mainAppContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
