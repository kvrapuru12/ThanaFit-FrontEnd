import type { PhaseKey } from '../../core/utils/cyclePhaseUtils';

export type { PhaseKey };

export interface PhaseTheme {
  accent: string;
  background: string;
}

export interface MoveBlock {
  title: string;
  intensity: string;
  /** Shown under the title so session length matches the two ideas (pick one vs combine, etc.). */
  sessionHint: string;
  main: string;
  mainDetail: string;
  extra: string;
  extraDetail: string;
  strengthFocus: boolean;
  note: string;
}

export interface EatTodayCategories {
  carbs: string[];
  protein: string[];
  fats: string[];
  greens: string[];
}

export interface SeedCycling {
  /** Primary pair for this phase (shown as "A + B"). */
  main: string[];
  optionalAddons: string[];
}

export interface EatToday {
  categories: EatTodayCategories;
  digestiveSupport: string[];
  prebioticFoods: string[];
  probioticFoods: string[];
  seedCycling: SeedCycling;
}

export interface AvoidItem {
  item: string;
  reason: string;
}

export interface PhaseContent {
  phaseName: string;
  days: string;
  subtitle: string;
  energyLevel: number;
  move: MoveBlock;
  eatToday: EatToday;
  feel: string[];
  avoidDetailed: AvoidItem[];
  tip: string;
  digestionNote: string;
  theme: PhaseTheme;
}

export const phaseData: Record<PhaseKey, PhaseContent> = {
  menstrual: {
    phaseName: 'Menstrual Phase',
    days: 'Day 1-5',
    subtitle: 'Low energy • Focus on recovery',
    energyLevel: 2,
    move: {
      title: 'Light movement or rest',
      intensity: 'low',
      sessionHint: '~15–25 min total. One focus or a light mix.',
      main: 'Walking',
      mainDetail: '10–15 min easy',
      extra: 'Yoga / mobility',
      extraDetail: '10–15 min gentle',
      strengthFocus: false,
      note: 'Easy breathing; rest days count.',
    },
    eatToday: {
      categories: {
        carbs: ['Oats', 'Sweet potato', 'Rice'],
        protein: ['Eggs', 'Lentils', 'Chicken'],
        fats: ['Avocado', 'Walnuts', 'Pumpkin seeds'],
        greens: ['Spinach', 'Beetroot', 'Berries'],
      },
      digestiveSupport: ['Ginger tea', 'Peppermint tea', 'Warm meals'],
      prebioticFoods: ['Banana', 'Oats', 'Garlic'],
      probioticFoods: ['Yogurt', 'Kefir'],
      seedCycling: {
        main: ['Flax', 'Pumpkin'],
        optionalAddons: ['Fennel seeds', 'Fenugreek seeds'],
      },
    },
    feel: ['Low energy', 'Need rest', 'More inward'],
    avoidDetailed: [
      { item: 'Excess caffeine', reason: 'May worsen cramps or jitters' },
      { item: 'Salty foods', reason: 'May increase water retention' },
      { item: 'Alcohol', reason: 'May worsen fatigue and dehydration' },
    ],
    tip: 'Choose warm, iron-rich foods and lighter movement today.',
    digestionNote: 'Warm, gentle foods may feel easier on the stomach during this phase.',
    theme: { accent: '#E97A7A', background: '#FFF4F4' },
  },
  follicular: {
    phaseName: 'Follicular Phase',
    days: 'Day 6-13',
    subtitle: 'High energy • Focus on growth',
    energyLevel: 4,
    move: {
      title: 'Strength + cardio',
      intensity: 'high',
      sessionHint: 'Strength first, cardio after — ~35–45 min.',
      main: 'Strength',
      mainDetail: '3 × 8–12 reps',
      extra: 'Cardio',
      extraDetail: '10–15 min moderate (optional)',
      strengthFocus: true,
      note: 'Skip finisher if form slips.',
    },
    eatToday: {
      categories: {
        carbs: ['Oats', 'Rice', 'Quinoa'],
        protein: ['Eggs', 'Chicken', 'Tofu'],
        fats: ['Avocado', 'Almonds', 'Flaxseed'],
        greens: ['Spinach', 'Broccoli', 'Berries'],
      },
      digestiveSupport: ['Yogurt', 'Kiwi', 'Ginger'],
      prebioticFoods: ['Banana', 'Onion', 'Leeks'],
      probioticFoods: ['Yogurt', 'Kefir', 'Kimchi'],
      seedCycling: {
        main: ['Flax', 'Pumpkin'],
        optionalAddons: ['Chia seeds', 'Hemp seeds'],
      },
    },
    feel: ['High energy', 'Better focus', 'More social'],
    avoidDetailed: [
      { item: 'Sugary drinks', reason: 'Can lead to energy dips' },
      { item: 'Ultra-processed snacks', reason: 'Can crowd out nutrient-dense foods' },
      { item: 'Heavy fried foods', reason: 'May feel sluggish' },
    ],
    tip: 'Your body handles training and carbs well in this phase.',
    digestionNote: 'This phase usually feels lighter, so fresh foods and fiber may work well.',
    theme: { accent: '#40BFA4', background: '#F1FBF8' },
  },
  ovulation: {
    phaseName: 'Ovulation Phase',
    days: 'Day 14-16',
    subtitle: 'Peak energy • Perform at your best',
    energyLevel: 5,
    move: {
      title: 'HIIT + power training',
      intensity: 'high',
      sessionHint: 'Intervals first; lifts only if fresh.',
      main: 'HIIT / intervals',
      mainDetail: '12–18 min w/ warm-up',
      extra: 'Strength',
      extraDetail: '2–3 heavy sets (optional)',
      strengthFocus: true,
      note: 'Recovery between bursts matters.',
    },
    eatToday: {
      categories: {
        carbs: ['Rice', 'Fruit', 'Quinoa'],
        protein: ['Fish', 'Eggs', 'Chicken'],
        fats: ['Avocado', 'Olive oil', 'Pumpkin seeds'],
        greens: ['Cucumber', 'Leafy greens', 'Berries'],
      },
      digestiveSupport: ['Cucumber', 'Mint tea', 'Yogurt'],
      prebioticFoods: ['Banana', 'Asparagus', 'Garlic'],
      probioticFoods: ['Yogurt', 'Kefir', 'Sauerkraut'],
      seedCycling: {
        main: ['Sesame', 'Sunflower'],
        optionalAddons: ['Basil seeds', 'Fennel seeds'],
      },
    },
    feel: ['Peak energy', 'More confident', 'More social'],
    avoidDetailed: [
      { item: 'Skipped meals', reason: 'Can affect energy and recovery' },
      { item: 'Too much alcohol', reason: 'Can worsen dehydration' },
      { item: 'Heavy greasy meals', reason: 'May feel harder to digest' },
    ],
    tip: 'Keep meals lighter and hydrating while making the most of your energy.',
    digestionNote: 'Fresh and hydrating foods may feel best in this phase.',
    theme: { accent: '#F1B53B', background: '#FFF9EE' },
  },
  luteal: {
    phaseName: 'Luteal Phase',
    days: 'Day 17-28',
    subtitle: 'Energy may dip • Focus on balance',
    energyLevel: 3,
    move: {
      title: 'Moderate strength + walking',
      intensity: 'medium',
      sessionHint: 'Moderate lifts + easy walk — ~25–35 min.',
      main: 'Strength',
      mainDetail: '2–3 sets, moderate',
      extra: 'Walk / yoga',
      extraDetail: '12–18 min easy',
      strengthFocus: true,
      note: 'Back off when energy dips.',
    },
    eatToday: {
      categories: {
        carbs: ['Sweet potato', 'Oats', 'Brown rice'],
        protein: ['Eggs', 'Turkey', 'Lentils'],
        fats: ['Nuts', 'Avocado', 'Sunflower seeds'],
        greens: ['Spinach', 'Broccoli', 'Banana'],
      },
      digestiveSupport: ['Ginger tea', 'Banana', 'Peppermint tea'],
      prebioticFoods: ['Banana', 'Oats', 'Onion'],
      probioticFoods: ['Yogurt', 'Kefir', 'Miso'],
      seedCycling: {
        main: ['Sesame', 'Sunflower'],
        optionalAddons: ['Fenugreek seeds', 'Nigella seeds'],
      },
    },
    feel: ['Need calm', 'More cravings', 'Lower energy'],
    avoidDetailed: [
      { item: 'Excess sugar', reason: 'Can worsen energy swings' },
      { item: 'Carbonated drinks', reason: 'May worsen bloating' },
      { item: 'Salty processed foods', reason: 'May increase water retention' },
    ],
    tip: 'Choose steady meals with complex carbs and magnesium-rich foods.',
    digestionNote: 'If bloating shows up here, lower-salt and gentler foods may feel better.',
    theme: { accent: '#9A7AE3', background: '#F7F3FF' },
  },
};

export const PHASE_ORDER: PhaseKey[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];
