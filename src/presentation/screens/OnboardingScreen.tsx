import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppVersionDisplay } from '../../core/utils/appVersionDisplay';

export const ONBOARDING_COMPLETED_STORAGE_KEY = '@thanafit_onboarding_completed';

type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
};

type OnboardingScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

type SlideSpec =
  | {
      kind: 'full';
      image: ImageSourcePropType;
      title: string;
      badge: string;
    }
  | {
      kind: 'phone';
      screenImage: ImageSourcePropType;
      backgroundImage: ImageSourcePropType;
      title: string;
      badge: string;
    };

const SLIDES: SlideSpec[] = [
  {
    kind: 'full',
    image: require('../../../assets/onboarding/onboarding-hero.png'),
    title: 'Voice-based fitness and food tracking in one simple app.',
    badge: 'All In One',
  },
  {
    kind: 'full',
    image: {
      uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1080&q=80',
    },
    title:
      'For women, get CycleSync-aware food suggestions and easy voice-based meal tracking.',
    badge: 'Food Suggestions',
  },
  {
    kind: 'phone',
    screenImage: {
      uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80',
    },
    backgroundImage: {
      uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&q=80',
    },
    title:
      'For women, get CycleSync-aware exercise suggestions and voice-based activity tracking.',
    badge: 'CycleSync',
  },
];

async function persistOnboardingComplete() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, '1');
}

function WeeklyBars() {
  const heights = [12, 20, 16, 24, 16, 20, 12];
  return (
    <View style={styles.barRow}>
      {heights.map((h, i) => (
        <View key={i} style={[styles.bar, { height: h }]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen({
  navigation,
}: {
  navigation: OnboardingScreenNavigationProp;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const [currentSlide, setCurrentSlide] = useState(0);
  const { appVersionLabel, buildLabel } = getAppVersionDisplay();

  const cardWidth = Math.min(420, windowWidth - 32);
  const carouselHeight = Math.min(Math.round(cardWidth * 1.35), Math.round(windowHeight * 0.56));
  const phoneFrameW = Math.min(260, windowWidth - 80);
  const phoneScreenH = Math.round(phoneFrameW * (400 / 260));

  const goToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, SLIDES.length - 1));
      scrollRef.current?.scrollTo({ x: clamped * windowWidth, animated: true });
      setCurrentSlide(clamped);
    },
    [windowWidth],
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / windowWidth);
      setCurrentSlide(Math.max(0, Math.min(idx, SLIDES.length - 1)));
    },
    [windowWidth],
  );

  const finishAndGo = async (route: 'Login' | 'Signup') => {
    try {
      await persistOnboardingComplete();
    } catch {
      /* Avoid blocking auth if storage fails */
    }
    navigation.replace(route);
  };

  const renderSlide = (slide: SlideSpec, index: number) => {
    if (slide.kind === 'phone') {
      return (
        <View key={index} style={[styles.slidePage, { width: windowWidth }]}>
          <View style={[styles.slideCard, { width: cardWidth, height: carouselHeight }]}>
            <Image
              source={slide.backgroundImage}
              style={styles.phoneSlideBg}
              resizeMode="cover"
            />
            <View style={styles.phoneSlideForeground}>
              <View style={[styles.phoneOuter, { width: phoneFrameW + 16 }]}>
                <View style={[styles.phoneInner, { width: phoneFrameW, height: phoneScreenH }]}>
                  <Image
                    source={slide.screenImage}
                    style={styles.phoneShot}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
            <View style={styles.slideTitleOnImageWrap}>
              <Text style={styles.slideTitleOnImage}>{slide.title}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View key={index} style={[styles.slidePage, { width: windowWidth }]}>
        <View style={[styles.slideCard, { width: cardWidth, height: carouselHeight }]}>
          <Image
            source={slide.image}
            style={styles.fullImage}
            resizeMode="cover"
          />
          <View style={styles.badgeWrap}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{slide.badge}</Text>
              <WeeklyBars />
              <Text style={styles.badgeDays}>M  T  W  T  F  S  S</Text>
            </View>
          </View>
          <View style={styles.slideTitleOnImageWrap}>
            <Text style={styles.slideTitleOnImage}>{slide.title}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.welcomeLabel}>Welcome to</Text>
        <Text style={styles.brand}>ThanaFit</Text>
      </View>

      <View style={styles.carouselSection}>
        <ScrollView
          ref={scrollRef}
          style={[styles.carouselScroll, { height: carouselHeight + 14 }]}
          contentContainerStyle={styles.carouselScrollContent}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          scrollEventThrottle={16}
        >
          {SLIDES.map((s, i) => renderSlide(s, i))}
        </ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => goToSlide(index)}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${index + 1}`}
              style={[styles.dot, index === currentSlide ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={() => finishAndGo('Signup')}
        >
          <Text style={styles.primaryBtnText}>Sign Up For Free</Text>
        </Pressable>

        <Pressable onPress={() => finishAndGo('Login')} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Log In</Text>
        </Pressable>

        <Text style={styles.versionText}>
          Version {appVersionLabel}.{buildLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2A3548',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  welcomeLabel: {
    fontSize: 14,
    color: '#D2DBE8',
    marginBottom: 4,
  },
  brand: {
    fontSize: 30,
    fontWeight: '700',
    color: '#8EB8FF',
  },
  carouselSection: {
    flex: 1,
    justifyContent: 'center',
  },
  slidePage: {
    alignItems: 'center',
    paddingTop: 2,
  },
  carouselScroll: {
    flexGrow: 0,
  },
  carouselScrollContent: {
    alignItems: 'center',
  },
  slideCard: {
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#33445E',
  },
  fullImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  badgeWrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
  },
  badge: {
    backgroundColor: 'rgba(51,68,94,0.45)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 100,
  },
  badgeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    fontSize: 10,
    marginBottom: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
  },
  bar: {
    width: 6,
    marginRight: 3,
    borderRadius: 2,
    backgroundColor: '#fbbf24',
  },
  badgeDays: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    marginTop: 4,
  },
  phoneSlideBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  phoneSlideForeground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
    zIndex: 10,
  },
  phoneOuter: {
    backgroundColor: '#000',
    borderRadius: 42,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  phoneInner: {
    backgroundColor: '#fff',
    borderRadius: 34,
    overflow: 'hidden',
  },
  phoneShot: {
    width: '100%',
    height: '100%',
  },
  slideTitleOnImageWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    zIndex: 25,
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  slideTitleOnImage: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 25,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#8EB8FF',
  },
  dotInactive: {
    backgroundColor: '#94A3B8',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  primaryBtn: {
    backgroundColor: '#7FAEFF',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryBtnPressed: {
    backgroundColor: '#6D9EF4',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D2DBE8',
  },
});
