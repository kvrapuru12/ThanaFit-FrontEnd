import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { useMainTab } from '../providers/MainTabContext';
import {
  cycleApiService,
  Cycle,
  CycleSyncSuggestionsResponse,
} from '../../infrastructure/services/cycleApi';
import {
  dedupeInFlight,
  invalidateRecentCycleCache,
  invalidateSuggestionsCache,
  readRecentCycleCache,
  readSuggestionsCache,
  writeRecentCycleCache,
  writeSuggestionsCache,
} from '../../infrastructure/cache/cycleSyncCache';
import { apiClient } from '../../infrastructure/api/ApiClient';
import {
  TabScreenHeader,
  TAB_SCREEN_HORIZONTAL_PADDING,
  tabScreenScrollTopInset,
} from './TabScreenHeader';
import { formatDateLocal, parseDateLocal } from '../../core/utils/dateUtils';
import {
  calculateCurrentPhase,
  getDayInCycle,
  calculateDaysUntilNextPeriod,
  type PhaseKey,
} from '../../core/utils/cyclePhaseUtils';
import {
  phaseData,
  PHASE_ORDER,
  type PhaseContent,
  type AvoidItem,
} from '../data/cycleSyncPhaseData';
import { getUserFacingApiMessage } from '../../core/utils/apiErrorMessage';

interface CycleSyncProps {
  navigation?: { navigate: (name: string, params?: object) => void };
}

interface CycleViewModel {
  lastPeriodStart: string;
  cycleLength: number;
  periodLength: number;
  currentPhase: PhaseKey;
  dayInCycle: number;
  daysUntilNextPeriod: number;
}

const DEFAULT_CYCLE = 28;
const DEFAULT_PERIOD = 5;

/** ThanaFit shared palette (FoodTracking, Profile, CycleSyncV0, BottomNavigation) */
const APP = {
  bgScreen: '#fef7ed',
  surface: '#ffffff',
  primary: '#4ecdc4',
  primarySoft: 'rgba(78, 205, 196, 0.2)',
  primaryStrong: '#2dd4bf',
  primaryInk: '#0f766e',
  navBlue: '#2563eb',
  coral: '#ff6b6b',
  orange: '#ffa726',
  purple: '#8b5cf6',
  purpleInk: '#6d28d9',
  ink: '#1f2937',
  muted: '#6b7280',
  border: '#f1f5f9',
  borderStrong: '#e5e7eb',
  amber: '#f59e0b',
  energyBolt: '#fbbf24',
  energyDim: '#d1d5db',
  /** Matches FoodTracking / ExerciseTracking secondary headings */
  textSecondary: '#374151',
} as const;

const TIMELINE_COLORS: Record<PhaseKey, string> = {
  menstrual: APP.coral,
  follicular: APP.primary,
  ovulation: APP.orange,
  luteal: APP.purple,
};

const HERO_SCENE: Record<PhaseKey, { sky: string; hill: string; sun: string; accent: string }> = {
  menstrual: { sky: '#ffe4e6', hill: '#fecdd3', sun: APP.coral, accent: APP.coral },
  follicular: { sky: '#ccfbf1', hill: '#99f6e4', sun: '#fde68a', accent: APP.primary },
  ovulation: { sky: '#fef3c7', hill: '#fde68a', sun: APP.orange, accent: APP.orange },
  luteal: { sky: '#ede9fe', hill: '#ddd6fe', sun: '#c4b5fd', accent: APP.purple },
};

type EatColKey = 'carbs' | 'protein' | 'fats' | 'greens';

const EAT_COLUMN_META: Record<
  EatColKey,
  { icon: React.ComponentProps<typeof MaterialIcons>['name']; tint: string }
> = {
  carbs: { icon: 'lunch-dining', tint: APP.amber },
  protein: { icon: 'set-meal', tint: APP.coral },
  fats: { icon: 'opacity', tint: APP.primaryInk },
  greens: { icon: 'eco', tint: APP.primary },
};

const FEEL_ROW_ICONS: React.ComponentProps<typeof MaterialIcons>['name'][] = [
  'bolt',
  'psychology',
  'favorite',
];

function eatMacroLabel(key: EatColKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function avoidIcon(item: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  const l = item.toLowerCase();
  if (l.includes('alcohol') || l.includes('wine') || l.includes('beer')) return 'local-bar';
  if (l.includes('sugar') || l.includes('sweet')) return 'cake';
  if (l.includes('processed') || l.includes('fried') || l.includes('fries')) return 'fastfood';
  if (l.includes('caffeine')) return 'local-cafe';
  if (l.includes('carbonated') || l.includes('fizz')) return 'local-drink';
  return 'do-not-disturb-on';
}

function avoidShortLabel(item: string): string {
  const l = item.toLowerCase();
  if (l.includes('sugar')) return 'Sugar';
  if (l.includes('processed') || l.includes('fried')) return 'Processed';
  if (l.includes('alcohol')) return 'Alcohol';
  if (l.includes('caffeine')) return 'Caffeine';
  if (l.includes('salt') || l.includes('salty')) return 'Salt';
  if (l.includes('carbonated')) return 'Fizz';
  return item.length > 12 ? `${item.slice(0, 10)}…` : item;
}

function clampEnergyLevel(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function ensureStrings(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const filtered = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return filtered.length > 0 ? filtered : fallback;
}

function ensureAvoidItems(value: unknown, fallback: AvoidItem[]): AvoidItem[] {
  if (!Array.isArray(value)) return fallback;
  const filtered = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const maybeItem = (item as { item?: unknown }).item;
      const maybeReason = (item as { reason?: unknown }).reason;
      if (typeof maybeItem !== 'string' || typeof maybeReason !== 'string') return null;
      return { item: maybeItem, reason: maybeReason };
    })
    .filter((item): item is AvoidItem => !!item);
  return filtered.length > 0 ? filtered : fallback;
}

function normalizePhaseContent(
  incoming: CycleSyncSuggestionsResponse | null
): Partial<Record<PhaseKey, PhaseContent>> | null {
  if (!incoming) return null;

  const normalized: Partial<Record<PhaseKey, PhaseContent>> = {};

  PHASE_ORDER.forEach((phaseKey) => {
    const base = phaseData[phaseKey];
    const candidate = incoming[phaseKey];
    if (!candidate) return;

    normalized[phaseKey] = {
      phaseName: typeof candidate.phaseName === 'string' ? candidate.phaseName : base.phaseName,
      days: typeof candidate.days === 'string' ? candidate.days : base.days,
      subtitle: typeof candidate.subtitle === 'string' ? candidate.subtitle : base.subtitle,
      energyLevel: clampEnergyLevel(candidate.energyLevel),
      move: {
        title: typeof candidate.move?.title === 'string' ? candidate.move.title : base.move.title,
        intensity:
          typeof candidate.move?.intensity === 'string' ? candidate.move.intensity : base.move.intensity,
        sessionHint:
          typeof candidate.move?.sessionHint === 'string'
            ? candidate.move.sessionHint
            : base.move.sessionHint,
        main: typeof candidate.move?.main === 'string' ? candidate.move.main : base.move.main,
        mainDetail:
          typeof candidate.move?.mainDetail === 'string'
            ? candidate.move.mainDetail
            : base.move.mainDetail,
        extra: typeof candidate.move?.extra === 'string' ? candidate.move.extra : base.move.extra,
        extraDetail:
          typeof candidate.move?.extraDetail === 'string'
            ? candidate.move.extraDetail
            : base.move.extraDetail,
        strengthFocus:
          typeof candidate.move?.strengthFocus === 'boolean'
            ? candidate.move.strengthFocus
            : base.move.strengthFocus,
        note: typeof candidate.move?.note === 'string' ? candidate.move.note : base.move.note,
      },
      eatToday: {
        categories: {
          carbs: ensureStrings(candidate.eatToday?.categories?.carbs, base.eatToday.categories.carbs),
          protein: ensureStrings(candidate.eatToday?.categories?.protein, base.eatToday.categories.protein),
          fats: ensureStrings(candidate.eatToday?.categories?.fats, base.eatToday.categories.fats),
          greens: ensureStrings(candidate.eatToday?.categories?.greens, base.eatToday.categories.greens),
        },
        digestiveSupport: ensureStrings(
          candidate.eatToday?.digestiveSupport,
          base.eatToday.digestiveSupport
        ),
        prebioticFoods: ensureStrings(candidate.eatToday?.prebioticFoods, base.eatToday.prebioticFoods),
        probioticFoods: ensureStrings(candidate.eatToday?.probioticFoods, base.eatToday.probioticFoods),
        seedCycling: {
          main: ensureStrings(candidate.eatToday?.seedCycling?.main, base.eatToday.seedCycling.main),
          optionalAddons: ensureStrings(
            candidate.eatToday?.seedCycling?.optionalAddons,
            base.eatToday.seedCycling.optionalAddons
          ),
        },
      },
      feel: ensureStrings(candidate.feel, base.feel),
      avoidDetailed: ensureAvoidItems(candidate.avoidDetailed, base.avoidDetailed),
      tip: typeof candidate.tip === 'string' ? candidate.tip : base.tip,
      digestionNote:
        typeof candidate.digestionNote === 'string' ? candidate.digestionNote : base.digestionNote,
      theme: {
        accent:
          typeof candidate.theme?.accent === 'string' ? candidate.theme.accent : base.theme.accent,
        background:
          typeof candidate.theme?.background === 'string'
            ? candidate.theme.background
            : base.theme.background,
      },
    };
  });

  return normalized;
}

export function CycleSync({ navigation }: CycleSyncProps) {
  const insets = useSafeAreaInsets();
  const { user, refreshUserData } = useAuth();
  const mainTab = useMainTab();
  const [loading, setLoading] = useState(true);
  const [recentCycle, setRecentCycle] = useState<Cycle | null>(null);
  const [cycleVm, setCycleVm] = useState<CycleViewModel | null>(null);

  const [showPeriodLog, setShowPeriodLog] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [periodStartDate, setPeriodStartDate] = useState(new Date());
  const [originalPeriodDate, setOriginalPeriodDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cycleLengthInput, setCycleLengthInput] = useState('28');
  const [periodDurationInput, setPeriodDurationInput] = useState('5');
  const [isCycleRegular, setIsCycleRegular] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cycleVoiceText, setCycleVoiceText] = useState('');
  const [cycleVoiceSubmitting, setCycleVoiceSubmitting] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [seedOptionalOpen, setSeedOptionalOpen] = useState(false);
  const [suggestionsData, setSuggestionsData] = useState<
    Partial<Record<PhaseKey, PhaseContent>> | null
  >(null);

  const hasLoggedData =
    !!user?.lastPeriodDate || recentCycle !== null;

  const applyCycleVm = useCallback(
    (recent: Cycle | null, fallbackLastPeriodDate?: string | null) => {
      if (recent) {
        const currentPhase = calculateCurrentPhase(
          recent.periodStartDate,
          recent.cycleLength
        );
        setCycleVm({
          lastPeriodStart: recent.periodStartDate,
          cycleLength: recent.cycleLength,
          periodLength: recent.periodDuration,
          currentPhase,
          dayInCycle: getDayInCycle(recent.periodStartDate, recent.cycleLength),
          daysUntilNextPeriod: calculateDaysUntilNextPeriod(
            recent.periodStartDate,
            recent.cycleLength
          ),
        });
        return;
      }

      if (fallbackLastPeriodDate) {
        const currentPhase = calculateCurrentPhase(
          fallbackLastPeriodDate,
          DEFAULT_CYCLE
        );
        setCycleVm({
          lastPeriodStart: fallbackLastPeriodDate,
          cycleLength: DEFAULT_CYCLE,
          periodLength: DEFAULT_PERIOD,
          currentPhase,
          dayInCycle: getDayInCycle(fallbackLastPeriodDate, DEFAULT_CYCLE),
          daysUntilNextPeriod: calculateDaysUntilNextPeriod(
            fallbackLastPeriodDate,
            DEFAULT_CYCLE
          ),
        });
        return;
      }

      setCycleVm(null);
    },
    []
  );

  const loadCycle = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setRecentCycle(null);
      setCycleVm(null);
      setSuggestionsData(null);
      return;
    }
    setLoading(true);

    try {
      const [cachedRecent, cachedSuggestions] = await Promise.all([
        readRecentCycleCache(user.id),
        readSuggestionsCache(user.id),
      ]);

      const hasCachedRecent = cachedRecent.data !== null;
      const hasCachedSuggestions = !!cachedSuggestions.data;
      const hasRenderableCache = hasCachedRecent || hasCachedSuggestions;

      if (hasCachedSuggestions) {
        setSuggestionsData(normalizePhaseContent(cachedSuggestions.data));
      }
      if (hasCachedRecent) {
        setRecentCycle(cachedRecent.data);
      }
      if (hasRenderableCache) {
        applyCycleVm(cachedRecent.data, user.lastPeriodDate);
        setLoading(false);
      }

      const shouldFetchRecent = !hasCachedRecent || cachedRecent.isStale;
      const shouldFetchSuggestions = !hasCachedSuggestions || cachedSuggestions.isStale;
      if (!shouldFetchRecent && !shouldFetchSuggestions) {
        return;
      }

      const [recentResult, suggestionsResult] = await Promise.allSettled([
        shouldFetchRecent
          ? dedupeInFlight(`cycleSync:recent:${user.id}`, () =>
              cycleApiService.getMostRecentCycle(user.id)
            )
          : Promise.resolve(cachedRecent.data),
        shouldFetchSuggestions
          ? dedupeInFlight(`cycleSync:suggestions:${user.id}`, () =>
              cycleApiService.getCycleSyncSuggestions(user.id)
            )
          : Promise.resolve(cachedSuggestions.data ?? {}),
      ]);

      const nextRecent =
        recentResult.status === 'fulfilled' ? recentResult.value : cachedRecent.data;
      if (recentResult.status === 'rejected') {
        console.warn('CycleSync V1 recent cycle fetch failed, continuing with fallback:', recentResult.reason);
      } else if (shouldFetchRecent) {
        await writeRecentCycleCache(user.id, nextRecent);
      }

      if (suggestionsResult.status === 'fulfilled') {
        setSuggestionsData(normalizePhaseContent(suggestionsResult.value));
        if (shouldFetchSuggestions) {
          await writeSuggestionsCache(user.id, suggestionsResult.value);
        }
      } else {
        console.warn(
          'CycleSync V1 suggestions fetch failed, using static phase data fallback:',
          suggestionsResult.reason
        );
        if (!hasCachedSuggestions) {
          setSuggestionsData(null);
        }
      }

      setRecentCycle(nextRecent);
      applyCycleVm(nextRecent, user.lastPeriodDate);
    } catch (e) {
      console.error('CycleSync V1 loadCycle:', e);
      const fallbackLastPeriodDate = user?.lastPeriodDate;
      applyCycleVm(null, fallbackLastPeriodDate);
      setSuggestionsData((prev) => prev ?? null);
    } finally {
      setLoading(false);
    }
  }, [applyCycleVm, user?.id, user?.lastPeriodDate]);

  useEffect(() => {
    loadCycle();
  }, [loadCycle]);

  const phase = cycleVm?.currentPhase ?? 'menstrual';
  const usingBackendSuggestions = !!suggestionsData?.[phase];
  const content = suggestionsData?.[phase] ?? phaseData[phase];

  useEffect(() => {
    const source = usingBackendSuggestions ? 'BACKEND_ENDPOINT' : 'STATIC_FALLBACK';
    console.log('CycleSync suggestions source:', source, {
      phase,
      hasSuggestionsData: !!suggestionsData,
      hasPhaseFromBackend: usingBackendSuggestions,
      preview: {
        phaseName: content.phaseName,
        subtitle: content.subtitle,
      },
    });
  }, [phase, usingBackendSuggestions, suggestionsData, content.phaseName, content.subtitle]);

  useEffect(() => {
    setSeedOptionalOpen(false);
  }, [phase]);

  const openModalCreate = async () => {
    const recent = await cycleApiService.getMostRecentCycle(user?.id);
    setModalMode('create');
    setEditingCycle(null);
    if (recent) {
      setPeriodStartDate(parseDateLocal(recent.periodStartDate));
      setCycleLengthInput(String(recent.cycleLength));
      setPeriodDurationInput(String(recent.periodDuration));
      setIsCycleRegular(recent.isCycleRegular);
    } else if (user?.lastPeriodDate) {
      setPeriodStartDate(parseDateLocal(user.lastPeriodDate));
      setCycleLengthInput(String(DEFAULT_CYCLE));
      setPeriodDurationInput(String(DEFAULT_PERIOD));
      setIsCycleRegular(true);
    } else {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      setPeriodStartDate(t);
      setCycleLengthInput(String(DEFAULT_CYCLE));
      setPeriodDurationInput(String(DEFAULT_PERIOD));
      setIsCycleRegular(true);
    }
    setShowDatePicker(false);
    setCycleVoiceText('');
    setShowPeriodLog(true);
  };

  const openModalEdit = async () => {
    const recent = await cycleApiService.getMostRecentCycle(user?.id);
    if (!recent) {
      await openModalCreate();
      return;
    }
    setModalMode('edit');
    setEditingCycle(recent);
    setPeriodStartDate(parseDateLocal(recent.periodStartDate));
    setCycleLengthInput(String(recent.cycleLength));
    setPeriodDurationInput(String(recent.periodDuration));
    setIsCycleRegular(recent.isCycleRegular);
    setShowDatePicker(false);
    setCycleVoiceText('');
    setShowPeriodLog(true);
  };

  const handleCancelPeriod = () => {
    setShowPeriodLog(false);
    setShowDatePicker(false);
    setEditingCycle(null);
    setOriginalPeriodDate(null);
    setCycleVoiceText('');
  };

  const handleDateChange = (event: { type?: string }, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        const d = new Date(selectedDate);
        d.setHours(0, 0, 0, 0);
        setPeriodStartDate(d);
        setShowDatePicker(false);
      } else if (event.type === 'dismissed') {
        if (originalPeriodDate) setPeriodStartDate(new Date(originalPeriodDate));
        setShowDatePicker(false);
      }
    } else if (selectedDate) {
      const d = new Date(selectedDate);
      d.setHours(0, 0, 0, 0);
      setPeriodStartDate(d);
    }
  };

  const handleConfirmDate = () => {
    setShowDatePicker(false);
    setOriginalPeriodDate(null);
  };

  const handleCancelDate = () => {
    if (originalPeriodDate) setPeriodStartDate(new Date(originalPeriodDate));
    else if (editingCycle)
      setPeriodStartDate(parseDateLocal(editingCycle.periodStartDate));
    setShowDatePicker(false);
    setOriginalPeriodDate(null);
  };

  const handleSavePeriod = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found.');
      return;
    }
    const cycleLen = parseInt(cycleLengthInput, 10);
    const periodLen = parseInt(periodDurationInput, 10);
    if (isNaN(cycleLen) || cycleLen < 21 || cycleLen > 40) {
      Alert.alert('Invalid', 'Cycle length must be 21–40 days.');
      return;
    }
    if (isNaN(periodLen) || periodLen < 1 || periodLen > 10) {
      Alert.alert('Invalid', 'Period duration must be 1–10 days.');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(periodStartDate);
    sel.setHours(0, 0, 0, 0);
    if (sel > today) {
      Alert.alert('Invalid', 'Period start must be today or earlier.');
      return;
    }

    const dateStr = formatDateLocal(sel);
    setIsSubmitting(true);
    try {
      if (modalMode === 'edit' && editingCycle) {
        await cycleApiService.updateCycle(editingCycle.id, {
          periodStartDate: dateStr,
          cycleLength: cycleLen,
          periodDuration: periodLen,
          isCycleRegular,
        });
      } else {
        await cycleApiService.createCycle({
          userId: user.id,
          periodStartDate: dateStr,
          cycleLength: cycleLen,
          periodDuration: periodLen,
          isCycleRegular,
        });
      }
      try {
        await apiClient.patch(`/users/${user.id}`, { lastPeriodDate: dateStr });
        await refreshUserData();
      } catch (e) {
        console.warn('Profile lastPeriodDate sync:', e);
      }
      const shouldResetSuggestions =
        !editingCycle ||
        editingCycle.periodStartDate !== dateStr ||
        editingCycle.cycleLength !== cycleLen;
      await invalidateRecentCycleCache(user.id);
      if (shouldResetSuggestions) {
        await invalidateSuggestionsCache(user.id);
      }
      await loadCycle();
      setShowPeriodLog(false);
      setEditingCycle(null);
    } catch (err: unknown) {
      Alert.alert('Error', getUserFacingApiMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCycleVoiceFromText = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found.');
      return;
    }
    const t = cycleVoiceText.trim();
    if (t.length < 1) {
      Alert.alert('Describe your cycle', 'For example: "My period started yesterday".');
      return;
    }
    setCycleVoiceSubmitting(true);
    try {
      const res = await cycleApiService.logCycleFromVoice({
        userId: user.id,
        voiceText: t,
      });
      if (!res.periodStartDate) {
        Alert.alert(
          'Could not log cycle',
          res.message?.trim() || 'Please try again or set the date manually.'
        );
        return;
      }
      const dateStr = res.periodStartDate;
      setPeriodStartDate(parseDateLocal(dateStr));
      try {
        await apiClient.patch(`/users/${user.id}`, { lastPeriodDate: dateStr });
        await refreshUserData();
      } catch (e) {
        console.warn('Profile lastPeriodDate sync:', e);
      }
      await invalidateRecentCycleCache(user.id);
      await invalidateSuggestionsCache(user.id);
      await loadCycle();
      setCycleVoiceText('');
      setShowPeriodLog(false);
      setEditingCycle(null);
      const nextHint = res.estimatedNextPeriod
        ? `\n\nNext period (estimate): ${res.estimatedNextPeriod}`
        : '';
      Alert.alert('Cycle logged', `${res.message}${nextHint}`);
    } catch (err: unknown) {
      Alert.alert('Could not parse voice', getUserFacingApiMessage(err));
    } finally {
      setCycleVoiceSubmitting(false);
    }
  };

  const goFoodTab = () => {
    if (mainTab?.setMainTab) mainTab.setMainTab('food');
    else navigation?.navigate('AddFood');
  };

  const goExerciseTab = () => {
    if (mainTab?.setMainTab) mainTab.setMainTab('exercise');
    else navigation?.navigate('AddExercise');
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={APP.primary} />
        <Text style={styles.loadingText}>Loading cycle…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: tabScreenScrollTopInset(insets.top),
            paddingHorizontal: TAB_SCREEN_HORIZONTAL_PADDING,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TabScreenHeader
          title="CycleSync"
          subtitle="Understand your cycle. Feel your best."
          hideLogo
        />

        {!hasLoggedData || !cycleVm ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="favorite" size={48} color={APP.coral} />
            <Text style={styles.emptyTitle}>Log your period</Text>
            <Text style={styles.emptySub}>
              Add your last period start to see your phase, daily tips, and cycle snapshot.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openModalCreate}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Log period</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Hero banner — gradient scene + pill + phase copy + yellow energy bolts */}
            <View style={styles.heroOuter}>
              <View style={[styles.heroScene, { backgroundColor: HERO_SCENE[phase].sky }]}>
                <View style={[styles.heroSun, { backgroundColor: HERO_SCENE[phase].sun }]} />
                <View style={[styles.heroHill, { backgroundColor: HERO_SCENE[phase].hill }]} />
                <View style={styles.heroPlant}>
                  <View style={[styles.heroPlantStem, { backgroundColor: HERO_SCENE[phase].accent }]} />
                  <View style={[styles.heroPlantLeaf, { backgroundColor: HERO_SCENE[phase].accent }]} />
                </View>
                <View style={styles.heroSceneContent}>
                  <View style={styles.todayPill}>
                    <Text style={styles.todayPillText}>
                      TODAY • DAY {cycleVm.dayInCycle}
                    </Text>
                  </View>
                  <View style={styles.heroTitleRow}>
                    <MaterialIcons
                      name={
                        phase === 'follicular'
                          ? 'trending-up'
                          : phase === 'luteal'
                            ? 'trending-down'
                            : phase === 'ovulation'
                              ? 'star'
                              : 'favorite'
                      }
                      size={28}
                      color={APP.primaryInk}
                    />
                    <Text style={styles.heroPhaseName}>{content.phaseName}</Text>
                  </View>
                  <Text style={styles.heroSubtitle}>{content.subtitle}</Text>
                  <View style={styles.energyBlock}>
                    <Text style={styles.energyLabel}>Energy</Text>
                    <View style={styles.energyRow}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <MaterialIcons
                          key={i}
                          name="bolt"
                          size={24}
                          color={i <= content.energyLevel ? APP.energyBolt : APP.energyDim}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Timeline — connector line + colored dots, diamond on current, YOU ARE HERE under active */}
            <View style={styles.timelineWrap}>
              <View style={styles.timelineTrackOuter}>
                <View style={styles.timelineConnector} />
                <View style={styles.timelineTrack}>
                {PHASE_ORDER.map((p) => {
                  const here = p === cycleVm.currentPhase;
                  const c = TIMELINE_COLORS[p];
                  const label = p === 'menstrual' ? 'Period' : p.charAt(0).toUpperCase() + p.slice(1);
                  return (
                    <View key={p} style={styles.timelineCol}>
                      <View style={styles.timelineMarkWrap}>
                        {here ? (
                          <View style={[styles.timelineDiamond, { borderColor: c, backgroundColor: APP.surface }]} />
                        ) : (
                          <View style={[styles.timelineDotLg, { backgroundColor: c }]} />
                        )}
                      </View>
                      <Text style={[styles.timelineLabelHifi, here && { fontWeight: '800', color: c }]}>
                        {label}
                      </Text>
                      {here ? (
                        <Text style={[styles.youAreHereHifi, { color: c }]}>YOU ARE HERE</Text>
                      ) : (
                        <View style={styles.youAreHereSpacer} />
                      )}
                    </View>
                  );
                })}
                </View>
              </View>
            </View>

            {/* Eat + Move — all visible at once (no horizontal scroll) */}
            <View style={styles.dailyStack}>
              <View style={styles.dailySection}>
                <View style={styles.dailySectionHeader}>
                  <MaterialIcons name="restaurant" size={20} color={APP.primaryInk} />
                  <Text style={styles.dailySectionTitle}>Eat today</Text>
                </View>
                <View style={styles.eatGrid}>
                  <View style={styles.eatGridRow}>
                    {(['carbs', 'protein'] as const).map((key) => {
                      const meta = EAT_COLUMN_META[key];
                      const foods = content.eatToday.categories[key].slice(0, 3).join(', ');
                      return (
                        <View key={key} style={styles.eatGridCell}>
                          <View style={styles.eatCellInner}>
                            <View
                              style={[
                                styles.eatCellIcon,
                                { backgroundColor: meta.tint + '26' },
                              ]}
                            >
                              <MaterialIcons name={meta.icon} size={18} color={meta.tint} />
                            </View>
                            <View style={styles.eatCellCopy}>
                              <Text style={[styles.eatCellLabel, { color: meta.tint }]}>
                                {eatMacroLabel(key)}
                              </Text>
                              <Text style={styles.eatCellFoods}>{foods}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.eatGridRow}>
                    {(['fats', 'greens'] as const).map((key) => {
                      const meta = EAT_COLUMN_META[key];
                      const foods = content.eatToday.categories[key].slice(0, 3).join(', ');
                      return (
                        <View key={key} style={styles.eatGridCell}>
                          <View style={styles.eatCellInner}>
                            <View
                              style={[
                                styles.eatCellIcon,
                                { backgroundColor: meta.tint + '26' },
                              ]}
                            >
                              <MaterialIcons name={meta.icon} size={18} color={meta.tint} />
                            </View>
                            <View style={styles.eatCellCopy}>
                              <Text style={[styles.eatCellLabel, { color: meta.tint }]}>
                                {eatMacroLabel(key)}
                              </Text>
                              <Text style={styles.eatCellFoods}>{foods}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.eatSeedsFull}>
                  <View style={styles.eatCellIconSeeds}>
                    <MaterialIcons name="grass" size={18} color={APP.purpleInk} />
                  </View>
                  <View style={styles.eatSeedsCopy}>
                    <Text style={styles.seedFullTitle}>Seeds</Text>
                    <Text style={styles.seedFullLine}>
                      Day {cycleVm.dayInCycle} of {cycleVm.cycleLength} ·{' '}
                      {content.eatToday.seedCycling.main.join(' + ')}
                    </Text>
                    <TouchableOpacity
                      style={styles.seedOptionalToggle}
                      onPress={() => setSeedOptionalOpen((o) => !o)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: seedOptionalOpen }}
                      accessibilityLabel={
                        seedOptionalOpen
                          ? 'Hide optional seed add-ons'
                          : 'Show optional seed add-ons'
                      }
                    >
                      <Text style={styles.seedOptionalToggleText}>More</Text>
                      <MaterialIcons
                        name={seedOptionalOpen ? 'expand-less' : 'expand-more'}
                        size={16}
                        color={APP.purpleInk}
                      />
                    </TouchableOpacity>
                    {seedOptionalOpen ? (
                      <Text style={styles.seedRowOptional}>
                        {content.eatToday.seedCycling.optionalAddons.join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={[styles.dailySection, styles.dailySectionMove]}>
                <View style={styles.dailySectionHeader}>
                  <MaterialIcons name="fitness-center" size={20} color={APP.primaryInk} />
                  <Text style={styles.dailySectionTitle}>Move today</Text>
                </View>
                <View style={styles.moveVertical}>
                  <View style={styles.moveOverviewCard}>
                    <View style={styles.moveOverviewAccent} />
                    <Text style={styles.moveOverviewTitle}>{content.move.title}</Text>
                    <Text style={styles.moveOverviewHint}>{content.move.sessionHint}</Text>
                  </View>
                  <View style={styles.moveStepCard}>
                    <View style={styles.moveStepRow}>
                      <View style={styles.moveStepBadge}>
                        <Text style={styles.moveStepBadgeText}>1</Text>
                      </View>
                      <View style={styles.moveStepBody}>
                        <Text style={styles.moveStepName}>{content.move.main}</Text>
                        <Text style={styles.moveStepDetail}>{content.move.mainDetail}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.moveStepCard}>
                    <View style={styles.moveStepRow}>
                      <View style={styles.moveStepBadge}>
                        <Text style={styles.moveStepBadgeText}>2</Text>
                      </View>
                      <View style={styles.moveStepBody}>
                        <Text style={styles.moveStepName}>{content.move.extra}</Text>
                        <Text style={styles.moveStepDetail}>{content.move.extraDetail}</Text>
                      </View>
                    </View>
                    <Text style={styles.moveStepNote}>{content.move.note}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.actionRowHifi}>
              <TouchableOpacity style={styles.btnLogActivity} onPress={goExerciseTab}>
                <MaterialIcons name="directions-run" size={22} color="#fff" />
                <Text style={styles.btnLogActivityText}>Log Activity</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnLogFood} onPress={goFoodTab}>
                <MaterialIcons name="ramen-dining" size={22} color={APP.primaryInk} />
                <Text style={styles.btnLogFoodText}>Log Food</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pageSectionCard}>
              <View style={styles.pageSectionHeader}>
                <MaterialIcons name="psychology" size={22} color={APP.primaryInk} />
                <Text style={styles.pageSectionTitle}>How you may feel</Text>
              </View>
              <View style={styles.feelRow}>
                {content.feel.slice(0, 3).map((label, idx) => (
                  <View key={label} style={styles.feelItem}>
                    <View style={[styles.feelCircle, { borderColor: APP.primary + '55' }]}>
                      <MaterialIcons
                        name={FEEL_ROW_ICONS[idx] ?? 'favorite'}
                        size={22}
                        color={APP.primary}
                      />
                    </View>
                    <Text style={styles.feelItemLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.pageSectionCard}>
              <View style={styles.pageSectionHeader}>
                <MaterialIcons name="warning-amber" size={22} color={APP.amber} />
                <Text style={styles.pageSectionTitle}>Avoid today</Text>
              </View>
              <View style={styles.avoidRowHifi}>
                {content.avoidDetailed.slice(0, 3).map((a) => (
                  <View key={a.item} style={styles.avoidBox}>
                    <MaterialIcons name={avoidIcon(a.item)} size={26} color={APP.coral} />
                    <Text style={styles.avoidBoxLabel}>{avoidShortLabel(a.item)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.pageSectionCard}>
              <View style={styles.pageSectionHeader}>
                <MaterialIcons name="lightbulb" size={22} color={APP.amber} />
                <Text style={styles.pageSectionTitle}>Smart tip</Text>
              </View>
              <View style={styles.smartTipBody}>
                <Text style={styles.smartTipText}>{content.tip}</Text>
                <Text style={styles.smartTipSub}>{content.digestionNote}</Text>
              </View>
            </View>

            <View style={styles.pageSectionCard}>
              <View style={styles.snapshotHeader}>
                <Text style={styles.snapshotTitle}>Cycle snapshot</Text>
                <View style={styles.snapshotHeaderActions}>
                  {recentCycle ? (
                    <TouchableOpacity
                      style={styles.snapshotBtnOutline}
                      onPress={openModalEdit}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Edit current cycle"
                    >
                      <MaterialIcons name="edit" size={17} color={APP.primaryInk} />
                      <Text style={styles.snapshotBtnOutlineText}>Edit</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.snapshotBtnFilled}
                      onPress={openModalCreate}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Add period"
                    >
                      <MaterialIcons name="add-circle-outline" size={18} color="#fff" />
                      <Text style={styles.snapshotBtnFilledText}>Add period</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.snapshotListHifi}>
                <View style={styles.snapshotRowHifi}>
                  <MaterialIcons name="calendar-today" size={22} color={APP.primary} />
                  <View>
                    <Text style={styles.snapshotValueHifi}>{cycleVm.cycleLength}</Text>
                    <Text style={styles.snapshotCaptionHifi}>Cycle length days</Text>
                  </View>
                </View>
                <View style={styles.snapshotRowHifi}>
                  <MaterialIcons name="water-drop" size={22} color={APP.primary} />
                  <View>
                    <Text style={styles.snapshotValueHifi}>{cycleVm.periodLength}</Text>
                    <Text style={styles.snapshotCaptionHifi}>Period length days</Text>
                  </View>
                </View>
                <View style={styles.snapshotRowHifi}>
                  <MaterialIcons name="schedule" size={22} color={APP.primary} />
                  <View>
                    <Text style={styles.snapshotValueHifi}>{cycleVm.daysUntilNextPeriod}</Text>
                    <Text style={styles.snapshotCaptionHifi}>Days until next period</Text>
                  </View>
                </View>
              </View>
              {recentCycle ? (
                <TouchableOpacity
                  style={styles.snapshotNewPeriodRow}
                  onPress={openModalCreate}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Start a new period"
                >
                  <MaterialIcons name="add-circle-outline" size={20} color={APP.primary} />
                  <Text style={styles.snapshotNewPeriodText}>New period</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}

      </ScrollView>

      <Modal visible={showPeriodLog} animationType="slide" transparent onRequestClose={handleCancelPeriod}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'edit' ? 'Edit cycle' : 'Log period'}
              </Text>
              <TouchableOpacity onPress={handleCancelPeriod}>
                <MaterialIcons name="close" size={24} color={APP.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Period start date</Text>
                {!showDatePicker ? (
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setOriginalPeriodDate(new Date(periodStartDate));
                      setShowDatePicker(true);
                    }}
                  >
                    <MaterialIcons name="calendar-today" size={20} color={APP.primary} />
                    <Text style={styles.dateButtonText}>{periodStartDate.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.datePickerContainer}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={handleCancelDate}>
                        <Text style={styles.datePickerButton}>Cancel</Text>
                      </TouchableOpacity>
                      <Text style={styles.datePickerTitle}>Select date</Text>
                      <TouchableOpacity onPress={handleConfirmDate}>
                        <Text style={[styles.datePickerButton, styles.datePickerConfirm]}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={periodStartDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  </View>
                )}
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Or describe in your own words</Text>
                <Text style={styles.formHint}>
                  {`e.g. "My period started yesterday" — we'll set the date for you.`}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.cycleVoiceMultiline]}
                  value={cycleVoiceText}
                  onChangeText={setCycleVoiceText}
                  placeholder="Natural language…"
                  placeholderTextColor={APP.muted}
                  multiline
                  editable={!cycleVoiceSubmitting && !isSubmitting}
                />
                <TouchableOpacity
                  style={[styles.voiceParseBtn, (cycleVoiceSubmitting || isSubmitting) && { opacity: 0.6 }]}
                  onPress={() => void handleCycleVoiceFromText()}
                  disabled={cycleVoiceSubmitting || isSubmitting}
                >
                  {cycleVoiceSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.voiceParseBtnText}>Parse & apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Cycle length (days)</Text>
                <TextInput
                  style={styles.textInput}
                  value={cycleLengthInput}
                  onChangeText={setCycleLengthInput}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Period duration (days)</Text>
                <TextInput
                  style={styles.textInput}
                  value={periodDurationInput}
                  onChangeText={setPeriodDurationInput}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.formLabel}>Regular cycle</Text>
                <Switch value={isCycleRegular} onValueChange={setIsCycleRegular} />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelPeriod}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
                onPress={handleSavePeriod}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP.bgScreen },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP.bgScreen },
  loadingText: { marginTop: 12, fontSize: 16, color: APP.muted, fontWeight: '400' },
  emptyCard: {
    backgroundColor: APP.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP.border,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, color: APP.ink, lineHeight: 26 },
  emptySub: {
    fontSize: 14,
    color: APP.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '400',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: APP.coral,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 24,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  heroOuter: { marginBottom: 18, borderRadius: 24, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  heroScene: {
    minHeight: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroSun: {
    position: 'absolute',
    top: 18,
    right: 28,
    width: 48,
    height: 48,
    borderRadius: 24,
    opacity: 0.95,
  },
  heroHill: {
    position: 'absolute',
    bottom: -36,
    left: '-10%',
    width: '120%',
    height: 100,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    opacity: 0.88,
  },
  heroPlant: { position: 'absolute', bottom: 36, right: 36, alignItems: 'center' },
  heroPlantStem: { width: 4, height: 22, borderRadius: 2 },
  heroPlantLeaf: { width: 22, height: 22, borderRadius: 11, marginTop: -8, opacity: 0.85 },
  heroSceneContent: { padding: 20, paddingTop: 22, zIndex: 2 },
  todayPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: APP.textSecondary,
    includeFontPadding: false,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  heroPhaseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP.ink,
    flex: 1,
    lineHeight: 26,
    includeFontPadding: false,
  },
  heroSubtitle: {
    fontSize: 14,
    color: APP.muted,
    marginBottom: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  energyBlock: { marginTop: 4 },
  energyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP.textSecondary,
    marginBottom: 6,
    includeFontPadding: false,
  },
  energyRow: { flexDirection: 'row', gap: 8 },
  timelineWrap: { marginBottom: 20, paddingHorizontal: 4 },
  timelineTrackOuter: { position: 'relative' },
  /** Horizontal segment through all four phase markers (centers at ⅛, ⅜, ⅝, ⅞ of row width). */
  timelineConnector: {
    position: 'absolute',
    left: '12.5%',
    width: '75%',
    height: 3,
    top: 12.5,
    backgroundColor: APP.borderStrong,
    borderRadius: 2,
    zIndex: 0,
  },
  timelineTrack: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  timelineCol: { flex: 1, alignItems: 'center' },
  timelineMarkWrap: { height: 28, justifyContent: 'center', alignItems: 'center' },
  timelineDotLg: { width: 12, height: 12, borderRadius: 6 },
  timelineDiamond: { width: 16, height: 16, transform: [{ rotate: '45deg' }], borderWidth: 3 },
  timelineLabelHifi: {
    fontSize: 12,
    color: APP.muted,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  youAreHereHifi: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  youAreHereSpacer: { height: 18 },
  dailyStack: { marginBottom: 20, gap: 0 },
  dailySection: {
    backgroundColor: APP.surface,
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: APP.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dailySectionMove: { marginBottom: 0 },
  pageSectionCard: {
    backgroundColor: APP.surface,
    borderRadius: 24,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: APP.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  pageSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP.ink,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
    flex: 1,
    minWidth: 0,
  },
  dailySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dailySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP.ink,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  eatGrid: { gap: 8 },
  eatGridRow: { flexDirection: 'row', gap: 8 },
  eatGridCell: { flex: 1, minWidth: 0 },
  eatCellInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 12,
    flex: 1,
  },
  eatCellIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eatCellCopy: { flex: 1, minWidth: 0 },
  eatCellLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 4,
    includeFontPadding: false,
  },
  eatCellFoods: {
    fontSize: 14,
    color: APP.muted,
    lineHeight: 20,
    fontWeight: '400',
  },
  eatSeedsFull: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.15)',
    backgroundColor: 'rgba(139, 92, 246, 0.06)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  eatCellIconSeeds: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(109, 40, 217, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eatSeedsCopy: { flex: 1, minWidth: 0 },
  seedFullTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP.ink,
    marginBottom: 4,
    includeFontPadding: false,
  },
  seedFullLine: {
    fontSize: 14,
    color: APP.muted,
    fontWeight: '400',
    lineHeight: 20,
  },
  moveVertical: { gap: 10 },
  moveOverviewCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.22)',
    position: 'relative',
    overflow: 'hidden',
  },
  moveOverviewAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: APP.primary,
  },
  moveOverviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP.ink,
    lineHeight: 22,
    marginBottom: 6,
    paddingTop: 2,
    includeFontPadding: false,
  },
  moveOverviewHint: {
    fontSize: 14,
    color: APP.muted,
    lineHeight: 20,
    fontWeight: '400',
  },
  moveStepCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: APP.border,
  },
  moveStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  moveStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: APP.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  moveStepBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  moveStepBody: { flex: 1, minWidth: 0 },
  moveStepName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP.ink,
    marginBottom: 4,
    includeFontPadding: false,
  },
  moveStepDetail: {
    fontSize: 14,
    color: APP.muted,
    lineHeight: 20,
    fontWeight: '400',
  },
  moveStepNote: {
    fontSize: 14,
    color: APP.muted,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 10,
  },
  seedOptionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  seedOptionalToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: APP.purpleInk,
  },
  seedRowOptional: {
    fontSize: 14,
    color: APP.muted,
    lineHeight: 20,
    fontWeight: '400',
    marginTop: 8,
  },
  actionRowHifi: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 20 },
  btnLogActivity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: APP.navBlue,
    paddingVertical: 14,
    borderRadius: 16,
  },
  btnLogActivityText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnLogFood: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.22)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP.primary,
  },
  btnLogFoodText: { color: APP.primaryInk, fontWeight: '600', fontSize: 16 },
  feelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  feelItem: { alignItems: 'center', width: '30%' },
  feelCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: APP.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  feelItemLabel: {
    fontSize: 14,
    color: APP.muted,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  avoidRowHifi: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  avoidBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  avoidBoxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP.coral,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  smartTipBody: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  smartTipText: { fontSize: 14, color: '#92400e', lineHeight: 20, fontWeight: '500' },
  smartTipSub: { fontSize: 14, color: '#b45309', marginTop: 8, lineHeight: 20, fontWeight: '400' },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  snapshotHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  snapshotBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: APP.primary,
    backgroundColor: APP.surface,
  },
  snapshotBtnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP.primaryInk,
    includeFontPadding: false,
  },
  snapshotBtnFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: APP.primary,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
  },
  snapshotBtnFilledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    includeFontPadding: false,
  },
  snapshotNewPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(78, 205, 196, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  snapshotNewPeriodText: {
    fontSize: 14,
    fontWeight: '600',
    color: APP.primaryInk,
    includeFontPadding: false,
  },
  snapshotTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '600',
    color: APP.ink,
    lineHeight: 24,
    includeFontPadding: false,
    marginRight: 8,
  },
  snapshotListHifi: { gap: 10 },
  snapshotRowHifi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: APP.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: APP.borderStrong,
  },
  snapshotValueHifi: { fontSize: 20, fontWeight: 'bold', color: APP.ink, lineHeight: 26 },
  snapshotCaptionHifi: { fontSize: 14, color: APP.muted, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: APP.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: APP.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: APP.ink,
    lineHeight: 24,
    includeFontPadding: false,
  },
  modalBody: { padding: 20, maxHeight: 400 },
  formField: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: APP.ink },
  formHint: { fontSize: 13, color: APP.muted, marginBottom: 10, lineHeight: 18 },
  cycleVoiceMultiline: { minHeight: 88, textAlignVertical: 'top' },
  voiceParseBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: APP.primary,
    alignItems: 'center',
  },
  voiceParseBtnText: { fontWeight: '700', color: '#fff', fontSize: 16 },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: APP.bgScreen,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP.borderStrong,
  },
  dateButtonText: { fontSize: 16, color: APP.ink },
  datePickerContainer: { borderWidth: 1, borderColor: APP.borderStrong, borderRadius: 12, overflow: 'hidden' },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP.border,
  },
  datePickerTitle: { fontWeight: '700', color: APP.ink },
  datePickerButton: { color: APP.muted, padding: 8 },
  datePickerConfirm: { color: APP.primary, fontWeight: '700' },
  textInput: {
    borderWidth: 1,
    borderColor: APP.borderStrong,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: APP.bgScreen,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: APP.border },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: APP.borderStrong,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: APP.ink },
  saveBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: APP.primary,
    alignItems: 'center',
  },
  saveBtnText: { fontWeight: '700', color: '#fff' },
});
