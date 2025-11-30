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
} from 'react-native';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';
import appJson from '../../../app.json';
import { PreferencesService, AppPreferences } from '../../infrastructure/services/preferencesService';

interface SettingsScreenProps {
  navigation?: any;
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [preferences, setPreferences] = useState<AppPreferences>({
    units: 'METRIC',
    theme: 'light',
    language: 'en',
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await PreferencesService.getPreferences();
    setPreferences(prefs);
  };

  const handleUnitsChange = async (value: 'METRIC' | 'IMPERIAL') => {
    await PreferencesService.setPreference('units', value);
    setPreferences({ ...preferences, units: value });
  };

  const handleThemeChange = async (value: 'light' | 'dark' | 'auto') => {
    await PreferencesService.setPreference('theme', value);
    setPreferences({ ...preferences, theme: value });
    // Note: Theme implementation would require app-wide theme context
  };

  const handleLanguageChange = async (value: string) => {
    await PreferencesService.setPreference('language', value);
    setPreferences({ ...preferences, language: value });
  };

  const handleRateApp = () => {
    const appStoreUrl = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/idYOUR_APP_ID'
      : 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME';
    
    Linking.openURL(appStoreUrl).catch(err => {
      Alert.alert('Error', 'Could not open App Store');
    });
  };

  const appVersion = appJson.expo?.version || '1.0.0';
  const buildNumber = '1';

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
            {/* Units Preference */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Units</Text>
                <Text style={styles.settingDescription}>Choose measurement units</Text>
              </View>
              <View style={styles.unitsToggle}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    preferences.units === 'METRIC' && styles.unitButtonActive,
                  ]}
                  onPress={() => handleUnitsChange('METRIC')}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      preferences.units === 'METRIC' && styles.unitButtonTextActive,
                    ]}
                  >
                    Metric
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    preferences.units === 'IMPERIAL' && styles.unitButtonActive,
                  ]}
                  onPress={() => handleUnitsChange('IMPERIAL')}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      preferences.units === 'IMPERIAL' && styles.unitButtonTextActive,
                    ]}
                  >
                    Imperial
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme Preference */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Theme</Text>
                <Text style={styles.settingDescription}>App appearance</Text>
              </View>
              <View style={styles.themeButtons}>
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[
                      styles.themeButton,
                      preferences.theme === theme && styles.themeButtonActive,
                    ]}
                    onPress={() => handleThemeChange(theme)}
                  >
                    <Text
                      style={[
                        styles.themeButtonText,
                        preferences.theme === theme && styles.themeButtonTextActive,
                      ]}
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card style={styles.card}>
          <CardHeader style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
          </CardHeader>
          <CardContent style={styles.cardContent}>
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

            <View style={styles.versionInfo}>
              <Text style={styles.versionLabel}>App Version</Text>
              <Text style={styles.versionValue}>v{appVersion} ({buildNumber})</Text>
            </View>
          </CardContent>
        </Card>
      </View>
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
  unitsToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  unitButtonTextActive: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: '#ff6b6b',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  themeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
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
});

