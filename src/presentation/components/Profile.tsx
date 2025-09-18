import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Alert 
} from 'react-native';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '../providers/AuthProvider';

const { width } = Dimensions.get('window');

export function Profile() {
  const { logout, isLoading, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Get user data or use defaults
  const userStats = {
    name: user ? `${user.firstName} ${user.lastName}`.trim() : "User",
    email: user?.email || "No email provided",
    memberSince: user ? new Date(user.createdAt).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }) : "Unknown",
    currentStreak: 12, // This could be calculated from user data
    totalWorkouts: 89, // This could be calculated from user data
    caloriesTracked: user?.dailyCalorieIntakeTarget ? user.dailyCalorieIntakeTarget * 30 : 60000, // Estimated
  };

  const goals = [
    { 
      title: "Daily Calories", 
      current: 1450, 
      target: user?.dailyCalorieIntakeTarget || 2000, 
      unit: "cal" 
    },
    { title: "Weekly Workouts", current: 4, target: 5, unit: "workouts" },
    { title: "Water Intake", current: 6, target: 8, unit: "glasses" },
  ];

  const menuItems = [
    { icon: "settings", label: "Settings", subtitle: "App preferences", color: "#ff6b6b" },
    { icon: "notifications", label: "Notifications", subtitle: "Manage alerts", color: "#4ecdc4" },
    { icon: "security", label: "Privacy", subtitle: "Data & security", color: "#ffa726" },
    { icon: "help", label: "Support", subtitle: "Get help", color: "#ff6b6b" },
  ];

  const achievements = [
    { icon: "🏆", title: "Fitness Streak", color: "#ff6b6b" },
    { icon: "🎯", title: "Goal Crusher", color: "#ffa726" },
    { icon: "💪", title: "Workout Pro", color: "#4ecdc4" },
    { icon: "⚡", title: "Champion", color: "#ff6b6b" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Manage your account</Text>
          </View>
          <Button variant="outline" style={styles.editButton}>
            <MaterialIcons name="edit" size={16} color="#ff6b6b" />
            <Text style={styles.editButtonText}>Edit</Text>
          </Button>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <CardContent style={styles.profileContent}>
            <View style={styles.profileInfo}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userStats.name}</Text>
                <Text style={styles.userEmail}>{userStats.email}</Text>
                <Badge style={styles.memberBadge}>
                  <MaterialIcons name="calendar-today" size={12} color="white" />
                  <Text style={styles.memberText}>Member since {userStats.memberSince}</Text>
                </Badge>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
              <Text style={styles.statEmoji}>🔥</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, styles.palmText]}>{userStats.totalWorkouts}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
              <Text style={styles.statEmoji}>💪</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={[styles.statNumber, styles.papayaText]}>{(userStats.caloriesTracked / 1000).toFixed(0)}k</Text>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statEmoji}>🎯</Text>
            </View>
          </Card>
        </View>

        {/* Current Goals */}
        <Card style={styles.goalsCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.paradiseIndicator]} />
              <Text style={styles.cardTitleText}>Current Goals</Text>
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.goalsContent}>
            {goals.map((goal, index) => {
              const progress = (goal.current / goal.target) * 100;
              const colors = ['#ff6b6b', '#4ecdc4', '#ffa726'];
              return (
                <View key={index} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalProgress}>
                      {goal.current} / {goal.target} {goal.unit}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: colors[index]
                        }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card style={styles.achievementsCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitle}>
              <View style={[styles.titleIndicator, styles.palmIndicator]} />
              <Text style={styles.cardTitleText}>Achievements</Text>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                    <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === 0 && styles.firstMenuItem,
                  index === menuItems.length - 1 && styles.lastMenuItem
                ]}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card style={styles.signOutCard}>
          <CardContent style={styles.signOutContent}>
            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <View style={styles.signOutIcon}>
                <MaterialIcons name="logout" size={20} color="#ef4444" />
              </View>
              <View style={styles.signOutInfo}>
                <Text style={styles.signOutLabel}>
                  {isLoading ? 'Signing Out...' : 'Sign Out'}
                </Text>
                <Text style={styles.signOutSubtitle}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>
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
  editButton: {
    borderColor: '#ff6b6b',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#ffa726',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#ffa726',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileContent: {
    padding: 32,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  memberText: {
    color: 'white',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  palmText: {
    color: '#4ecdc4',
  },
  papayaText: {
    color: '#ffa726',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 20,
  },
  goalsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  goalsContent: {
    gap: 24,
  },
  goalItem: {
    gap: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  goalProgress: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    width: (width - 96) / 2,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '500',
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  firstMenuItem: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  lastMenuItem: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  menuIcon: {
    padding: 12,
    borderRadius: 16,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '500',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  signOutContent: {
    padding: 0,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderRadius: 24,
  },
  signOutIcon: {
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 16,
  },
  signOutInfo: {
    flex: 1,
  },
  signOutLabel: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '500',
    marginBottom: 4,
  },
  signOutSubtitle: {
    fontSize: 14,
    color: '#ef4444',
  },
});