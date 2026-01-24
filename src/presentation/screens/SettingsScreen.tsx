import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Switch,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';
import appJson from '../../../app.json';
import { PreferencesService, AppPreferences } from '../../infrastructure/services/preferencesService';
import { useAuth } from '../providers/AuthProvider';
import { apiClient } from '../../infrastructure/api/ApiClient';
import { RatingModal } from '../components/RatingModal';

interface SettingsScreenProps {
  navigation?: any;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { user, logout } = useAuth();
  const [preferences, setPreferences] = useState<AppPreferences>({
    units: 'METRIC',
    theme: 'light',
    language: 'en',
  });
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const loadPreferences = async () => {
    const prefs = await PreferencesService.getPreferences();
    setPreferences(prefs);
  };

  // Units are currently fixed to METRIC - Imperial support coming later

  const handleLanguageChange = async (value: string) => {
    await PreferencesService.setPreference('language', value);
    setPreferences({ ...preferences, language: value });
  };

  const handleOpenNotificationSettings = () => {
    // Open device notification settings (iOS/Android)
    // iOS requires apps to direct users to Settings app for notification control
    Linking.openSettings().catch(err => {
      Alert.alert('Error', 'Could not open device settings');
    });
  };

  const handleRateApp = () => {
    // Show custom rating modal first
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, feedback?: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    try {
      setIsSubmittingRating(true);

      // Submit rating to backend: POST /api/app-ratings
      const response = await apiClient.post<{
        id: number;
        userId: number;
        rating: number;
        feedback: string | null;
        platform: string;
        appVersion: string;
        createdAt: string;
      }>('/app-ratings', {
        userId: user.id,
        rating: rating,
        feedback: feedback && feedback.trim() ? feedback.trim() : null,
        platform: Platform.OS,
        appVersion: appJson.expo?.version || '1.0.0',
      });


      // Close modal
      setShowRatingModal(false);

      // If user rated 4-5 stars, prompt them to rate on store
      if (rating >= 4) {
        Alert.alert(
          'Thank you! ⭐',
          'We\'re glad you\'re enjoying ThanaFit! Would you like to rate us on the App Store?',
          [
            {
              text: 'Maybe Later',
              style: 'cancel',
            },
            {
              text: 'Rate on Store',
              onPress: openStoreRating,
            },
          ]
        );
      } else {
        // For lower ratings, just thank them
        Alert.alert(
          'Thank You!',
          'We appreciate your feedback and will use it to improve ThanaFit.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to submit rating. Please try again.';
      let errorTitle = 'Error';
      
      if (error.status === 400) {
        errorMessage = error.message || 'Invalid rating data. Please check your input.';
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.status === 422) {
        errorMessage = error.message || 'Validation error. Please check your rating and feedback.';
      } else if (error.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'We\'re experiencing technical difficulties. Please try again in a moment.';
      } else if (error.status === 503) {
        errorTitle = 'Service Unavailable';
        errorMessage = 'The service is temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const openStoreRating = () => {
    // Open App Store/Play Store for rating
    let appStoreUrl: string;
    
    if (Platform.OS === 'ios') {
      // For iOS: Use App Store ID (you'll get this when you publish to App Store)
      // TODO: Replace with actual App Store ID after first publish
      appStoreUrl = `https://apps.apple.com/app/id1234567890`;
    } else {
      // For Android: Use package name
      // TODO: Add package name to app.json expo.android.package after publishing
      const packageName = 'com.thanafit.app'; // Update with actual package name
      appStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    }
    
    Linking.openURL(appStoreUrl).catch(err => {
      Alert.alert(
        'Error',
        'Could not open app store. Please search for "ThanaFit" in the App Store or Play Store.',
        [{ text: 'OK' }]
      );
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account and all associated data. Type "DELETE" to confirm.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: confirmDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    try {
      setIsDeletingAccount(true);
      
      // Call DELETE endpoint: DELETE /api/users/{id}
      await apiClient.delete<{
        message: string;
        userId: number;
        timestamp: string;
      }>(`/users/${user.id}`);
      
      // Show success message first, then logout
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted. All your data has been permanently removed.',
        [
          {
            text: 'OK',
            onPress: async () => {
              try {
                // Logout and redirect to login screen
                await logout();
                // Navigation will automatically redirect to login via AuthProvider
              } catch (logoutError) {
                // Even if logout fails, clear state and redirect
                console.error('Logout error after account deletion:', logoutError);
                // Force navigation to login if available
                if (navigation) {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                }
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Delete account error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to delete account. Please try again or contact support.';
      
      if (error.status === 401) {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to delete this account.';
      } else if (error.status === 404) {
        errorMessage = 'User account not found.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const appVersion = appJson.expo?.version || '1.0.0';
  const buildNumber = '1';
  const appName = appJson.expo?.name || 'ThanaFit';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* App Preferences Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>App Preferences</Text>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {/* Units Preference - Metric Only for now */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Units</Text>
                <Text style={styles.settingDescription}>Measurement units</Text>
              </View>
              <View style={styles.unitsDisplay}>
                <Text style={styles.unitsDisplayText}>Metric</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <TouchableOpacity
              style={styles.notificationSettingsButton}
              onPress={handleOpenNotificationSettings}
            >
              <View style={styles.notificationButtonContent}>
                <View style={[styles.menuIcon, { backgroundColor: '#4ecdc420' }]}>
                  <MaterialIcons name="notifications" size={20} color="#4ecdc4" />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>Manage Notifications</Text>
                  <Text style={styles.menuSubtitle}>
                    Control notification preferences in device settings
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.notificationInfo}>
              <MaterialIcons name="info-outline" size={16} color="#6b7280" />
              <Text style={styles.notificationInfoText}>
                Notifications help you stay on track with your fitness goals, workout reminders, and daily progress updates.
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Account Section - Made More Prominent */}
        <Card style={[styles.card, styles.accountCard]}>
          <CardHeader style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Account Management</Text>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.deleteAccountContainer}>
              <View style={styles.deleteAccountHeader}>
                <MaterialIcons name="warning" size={24} color="#ef4444" />
                <Text style={styles.deleteAccountTitle}>Delete Account</Text>
              </View>
              <Text style={styles.deleteAccountDescription}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </Text>
              <TouchableOpacity
                style={[styles.deleteAccountButton, isDeletingAccount && styles.deleteAccountButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <MaterialIcons name="delete-outline" size={20} color="#ffffff" />
                    <Text style={styles.deleteAccountButtonText}>Delete My Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Support & Legal Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Support & Legal</Text>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            {/* Support Contact Information */}
            <View style={styles.supportContact}>
              <View style={styles.supportContactIcon}>
                <MaterialIcons name="email" size={24} color="#ff6b6b" />
              </View>
              <View style={styles.supportContactInfo}>
                <Text style={styles.supportContactTitle}>Need Help?</Text>
                <Text style={styles.supportContactText}>
                  If you have any questions, please email us at:
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('mailto:support@thanafit.com')}
                >
                  <Text style={styles.supportEmail}>support@thanafit.com</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation?.navigate('FAQ')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#4ecdc420' }]}>
                <MaterialIcons name="help-outline" size={20} color="#4ecdc4" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>FAQ & Help Center</Text>
                <Text style={styles.menuSubtitle}>Get answers to common questions</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation?.navigate('Privacy')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#ffa72620' }]}>
                <MaterialIcons name="security" size={20} color="#ffa726" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Privacy Policy</Text>
                <Text style={styles.menuSubtitle}>How we protect your data</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation?.navigate('Terms')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#9ca3af20' }]}>
                <MaterialIcons name="description" size={20} color="#9ca3af" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Terms of Service</Text>
                <Text style={styles.menuSubtitle}>Terms and conditions</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleRateApp}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#ffa72620' }]}>
                <MaterialIcons name="star-outline" size={20} color="#ffa726" />
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>Rate the App</Text>
                <Text style={styles.menuSubtitle}>Share your feedback</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>About</Text>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>App Name</Text>
              <Text style={styles.aboutValue}>{appName}</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>v{appVersion} (Build {buildNumber})</Text>
            </View>
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>Platform</Text>
              <Text style={styles.aboutValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
            </View>
            <View style={styles.aboutFooter}>
              <Text style={styles.copyrightText}>
                © {new Date().getFullYear()} ThanaFit. All rights reserved.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        isLoading={isSubmittingRating}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingItem: {
    marginTop: 20,
  },
  settingInfo: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  unitsDisplay: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  unitsDisplayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  versionInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  supportContact: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  supportContactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ff6b6b20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportContactInfo: {
    flex: 1,
  },
  supportContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  supportContactText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  supportEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff6b6b',
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
  accountCard: {
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  deleteAccountContainer: {
    paddingVertical: 8,
  },
  deleteAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  deleteAccountTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
  },
  deleteAccountDescription: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteAccountButtonDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.7,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  aboutItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  aboutLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  aboutFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  notificationSettingsButton: {
    marginTop: 8,
  },
  notificationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  notificationInfo: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  notificationInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});

