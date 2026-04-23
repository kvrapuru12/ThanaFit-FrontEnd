import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { notificationApiService, NotificationPreferences } from '../../infrastructure/services/notificationApi';
import { requestNotificationPermission } from '../../infrastructure/services/notificationService';

interface NotificationSettingsScreenProps {
  navigation?: any;
}

function timeStringToDate(value: string): Date {
  const [hh, mm] = value.split(':').map((v) => parseInt(v, 10));
  const now = new Date();
  now.setHours(Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
  return now;
}

function dateToTimeString(value: Date): string {
  const hh = String(value.getHours()).padStart(2, '0');
  const mm = String(value.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function displayTime(value: string): string {
  return timeStringToDate(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [showQuietStartPicker, setShowQuietStartPicker] = useState(false);
  const [showQuietEndPicker, setShowQuietEndPicker] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [preferencesFromServer, setPreferencesFromServer] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    []
  );

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const { preferences: remote, fromServer } = await notificationApiService.getPreferences();
      setPreferences({ ...remote, timezone });
      setPreferencesFromServer(fromServer);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      Alert.alert('Error', 'Could not load notification settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [timezone]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPreferences();
    } finally {
      setRefreshing(false);
    }
  }, [loadPreferences]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updateLocal = (patch: Partial<NotificationPreferences>) => {
    setPreferences((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch, timezone };
    });
  };

  const savePreferences = async () => {
    if (!preferences) return;
    try {
      setIsSaving(true);
      const saved = await notificationApiService.updatePreferences({ ...preferences, timezone });
      setPreferences({ ...saved, timezone });
      setPreferencesFromServer(true);
      Alert.alert('Saved', 'Notification settings updated.');
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      Alert.alert('Error', 'Could not save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const ensurePermission = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications in your phone settings to receive reminders.'
      );
    } else {
      Alert.alert('Enabled', 'Notifications are enabled.');
    }
  };

  if (isLoading || !preferences) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.headerIconBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={ensurePermission} style={styles.headerIconBtn}>
          <MaterialIcons name="notifications-active" size={22} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!preferencesFromServer ? (
          <View style={styles.serverWarnBanner} accessibilityRole="alert">
            <MaterialIcons name="cloud-off" size={20} color="#92400e" />
            <View style={styles.serverWarnTextWrap}>
              <Text style={styles.serverWarnTitle}>Could not load saved settings</Text>
              <Text style={styles.serverWarnBody}>
                Showing defaults. The server returned an error (often a missing database table or deployment
                issue). Pull down to retry after your backend is fixed, or tap Retry.
              </Text>
            </View>
            <TouchableOpacity onPress={loadPreferences} style={styles.serverWarnRetry} accessibilityRole="button">
              <Text style={styles.serverWarnRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.healthkitCard}>
          <View style={styles.healthkitHeader}>
            <MaterialIcons name="health-and-safety" size={20} color="#0f766e" />
            <Text style={styles.healthkitTitle}>Apple HealthKit</Text>
          </View>
          <Text style={styles.healthkitBody}>
            ThanaFit uses HealthKit only (not CareKit). Dashboard sync reads step count and sleep for insights
            and reminders.
          </Text>
          <Text style={styles.healthkitBody}>
            We do not write to Apple Health and do not use Health data for advertising.
          </Text>
          <Text style={styles.healthkitHint}>
            Manage access: iPhone Settings → Privacy and Security → Health → ThanaFit.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reminder Types</Text>
          <SettingRow
            label="Food Reminder"
            subtitle="Prompt when food is not logged by reminder time"
            value={preferences.foodReminderEnabled}
            onValueChange={(v) => updateLocal({ foodReminderEnabled: v })}
          />
          <SettingRow
            label="Activity Reminder"
            subtitle="Prompt when activity is not logged by reminder time"
            value={preferences.activityReminderEnabled}
            onValueChange={(v) => updateLocal({ activityReminderEnabled: v })}
          />
          <SettingRow
            label="Cycle Phase Reminder"
            subtitle="Send guidance when cycle phase changes"
            value={preferences.cyclePhaseReminderEnabled}
            onValueChange={(v) => updateLocal({ cyclePhaseReminderEnabled: v })}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <TimeRow
            label="Reminder Time"
            value={displayTime(preferences.reminderTimeLocal)}
            onPress={() => setShowReminderTimePicker(true)}
          />
          <SettingRow
            label="Quiet Hours"
            subtitle="Pause reminders during sleep hours"
            value={preferences.quietHoursEnabled}
            onValueChange={(v) => updateLocal({ quietHoursEnabled: v })}
          />
          {preferences.quietHoursEnabled && (
            <>
              <TimeRow
                label="Quiet Start"
                value={displayTime(preferences.quietHoursStart)}
                onPress={() => setShowQuietStartPicker(true)}
              />
              <TimeRow
                label="Quiet End"
                value={displayTime(preferences.quietHoursEnd)}
                onPress={() => setShowQuietEndPicker(true)}
              />
            </>
          )}
          <Text style={styles.hint}>Timezone: {preferences.timezone}</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveDisabled]}
          disabled={isSaving}
          onPress={savePreferences}
        >
          <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {showReminderTimePicker && (
        <DateTimePicker
          value={timeStringToDate(preferences.reminderTimeLocal)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS !== 'ios') setShowReminderTimePicker(false);
            if (event.type === 'set' && selectedDate) {
              updateLocal({ reminderTimeLocal: dateToTimeString(selectedDate) });
            }
          }}
        />
      )}
      {showQuietStartPicker && (
        <DateTimePicker
          value={timeStringToDate(preferences.quietHoursStart)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS !== 'ios') setShowQuietStartPicker(false);
            if (event.type === 'set' && selectedDate) {
              updateLocal({ quietHoursStart: dateToTimeString(selectedDate) });
            }
          }}
        />
      )}
      {showQuietEndPicker && (
        <DateTimePicker
          value={timeStringToDate(preferences.quietHoursEnd)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS !== 'ios') setShowQuietEndPicker(false);
            if (event.type === 'set' && selectedDate) {
              updateLocal({ quietHoursEnd: dateToTimeString(selectedDate) });
            }
          }}
        />
      )}
    </View>
  );
}

function SettingRow({
  label,
  subtitle,
  value,
  onValueChange,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function TimeRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.timePill}>
        <Text style={styles.timeText}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  serverWarnBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    padding: 12,
  },
  serverWarnTextWrap: { flex: 1, minWidth: 0 },
  serverWarnTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  serverWarnBody: { fontSize: 12, lineHeight: 17, color: '#78350f' },
  serverWarnRetry: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#fde68a',
  },
  serverWarnRetryText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  healthkitCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 14,
    gap: 6,
  },
  healthkitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  healthkitTitle: { fontSize: 16, fontWeight: '700', color: '#0f766e' },
  healthkitBody: { fontSize: 13, lineHeight: 18, color: '#0f172a' },
  healthkitHint: { fontSize: 12, lineHeight: 17, color: '#334155', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
    paddingBottom: 6,
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#1f2937', fontWeight: '600' },
  rowSub: { marginTop: 2, color: '#6b7280', fontSize: 13 },
  timePill: { backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  timeText: { color: '#1d4ed8', fontWeight: '600' },
  hint: { color: '#6b7280', fontSize: 12, marginTop: 6 },
  saveButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
