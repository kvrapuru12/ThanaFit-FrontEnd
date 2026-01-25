import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Gender } from '../../core/domain/entities/User';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userGender?: Gender;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, userGender }) => {
  // Debug logging
  console.log('BottomNavigation - userGender:', userGender);
  console.log('BottomNavigation - Gender.FEMALE:', Gender.FEMALE);
  console.log('BottomNavigation - userGender === Gender.FEMALE:', userGender === Gender.FEMALE);
  console.log('BottomNavigation - userGender === "FEMALE":', userGender === 'FEMALE');
  
  // Define tabs based on user gender
  const baseTabs = [
    { id: 'dashboard', icon: 'home' as keyof typeof MaterialIcons.glyphMap, label: 'Home' },
    { id: 'food', icon: 'restaurant' as keyof typeof MaterialIcons.glyphMap, label: 'Food' },
    { id: 'exercise', icon: 'fitness-center' as keyof typeof MaterialIcons.glyphMap, label: 'Exercise' },
  ];

  // Add gender-specific tab - handle enum values and null
  const isFemale = userGender === Gender.FEMALE || (userGender as any) === 'FEMALE';
  const genderSpecificTab = isFemale
    ? { id: 'cyclesync', icon: 'favorite' as keyof typeof MaterialIcons.glyphMap, label: 'CycleSync' }
    : { id: 'progress', icon: 'trending-up' as keyof typeof MaterialIcons.glyphMap, label: 'Progress' };

  console.log('BottomNavigation - isFemale:', isFemale);
  console.log('BottomNavigation - genderSpecificTab:', genderSpecificTab);

  const tabs = [
    ...baseTabs,
    genderSpecificTab,
    { id: 'profile', icon: 'person' as keyof typeof MaterialIcons.glyphMap, label: 'Profile' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.tabsContainer}>
          {tabs.map(({ id, icon, label }) => (
            <TouchableOpacity
              key={id}
              onPress={() => onTabChange(id)}
              style={styles.tab}
            >
              {/* Active background */}
              {activeTab === id && (
                <View style={styles.activeBackground} />
              )}
              
              {/* Icon container */}
              <View style={[
                styles.iconContainer,
                activeTab === id && styles.activeIconContainer
              ]}>
                <MaterialIcons 
                  name={icon} 
                  size={20} 
                  color={activeTab === id ? '#ffffff' : '#6b7280'} 
                />
              </View>
              
              {/* Label */}
              <Text 
                style={[
                  styles.label,
                  activeTab === id && styles.activeLabel
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {label}
              </Text>
              
              {/* Active indicator dot */}
              {activeTab === id && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glassmorphism effect
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tab: {
    position: 'relative',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 24,
    minHeight: 60,
    justifyContent: 'center',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb', // Primary blue gradient fallback
    borderRadius: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 16,
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.7,
  },
  activeLabel: {
    color: '#ffffff',
    fontWeight: '600',
    opacity: 1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 6,
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
});