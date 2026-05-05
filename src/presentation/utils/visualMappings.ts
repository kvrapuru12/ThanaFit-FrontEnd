export type FoodVisualCategory =
  | 'protein'
  | 'grains'
  | 'vegetables'
  | 'dairy'
  | 'fruits'
  | 'nuts'
  | 'default';

export type FoodVisualInput = {
  name?: string;
  category?: string;
};

export type ActivityVisualInput = {
  name?: string;
  category?: string;
};

const normalize = (value?: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value?: string): string[] => normalize(value).split(' ').filter(Boolean);

const hasToken = (tokens: string[], keyword: string): boolean => tokens.includes(keyword);

const hasKeyword = (normalizedText: string, tokens: string[], keyword: string): boolean =>
  keyword.includes(' ') ? normalizedText.includes(keyword) : hasToken(tokens, keyword);

const FOOD_NAME_KEYWORDS: Array<{ category: FoodVisualCategory; keywords: string[] }> = [
  {
    category: 'nuts',
    keywords: [
      'cashew',
      'cashewnut',
      'almond',
      'walnut',
      'pistachio',
      'peanut',
      'hazelnut',
      'macadamia',
      'pecan',
      'mixed nuts',
      'nut',
      'seed',
      'chia',
      'flax',
      'sesame',
      'sunflower seed',
      'pumpkin seed',
    ],
  },
  {
    category: 'protein',
    keywords: [
      'chicken',
      'beef',
      'mutton',
      'lamb',
      'turkey',
      'duck',
      'fish',
      'salmon',
      'tuna',
      'prawn',
      'shrimp',
      'crab',
      'egg',
      'tofu',
      'tempeh',
      'paneer',
      'soy chunk',
      'lentil',
      'dal',
      'bean',
      'chickpea',
      'hummus',
      'protein',
    ],
  },
  {
    category: 'grains',
    keywords: [
      'oat',
      'oatmeal',
      'porridge',
      'rice',
      'brown rice',
      'red rice',
      'quinoa',
      'millet',
      'ragi',
      'barley',
      'bread',
      'roti',
      'chapati',
      'naan',
      'paratha',
      'wrap',
      'pasta',
      'noodle',
      'spaghetti',
      'macaroni',
      'cereal',
      'granola',
      'muesli',
      'idli',
      'dosa',
      'poha',
      'upma',
    ],
  },
  {
    category: 'vegetables',
    keywords: [
      'salad',
      'spinach',
      'broccoli',
      'carrot',
      'cucumber',
      'tomato',
      'lettuce',
      'kale',
      'capsicum',
      'pepper',
      'cauliflower',
      'cabbage',
      'zucchini',
      'okra',
      'beetroot',
      'radish',
      'mushroom',
      'vegetable',
      'veg',
      'greens',
      'soup',
    ],
  },
  {
    category: 'dairy',
    keywords: [
      'milk',
      'curd',
      'yogurt',
      'yoghurt',
      'cheese',
      'mozzarella',
      'cottage cheese',
      'buttermilk',
      'lassi',
      'kefir',
      'ghee',
      'butter',
      'cream',
      'whey',
    ],
  },
  {
    category: 'fruits',
    keywords: [
      'apple',
      'banana',
      'orange',
      'berry',
      'strawberry',
      'blueberry',
      'mango',
      'pineapple',
      'papaya',
      'watermelon',
      'melon',
      'grape',
      'kiwi',
      'pear',
      'peach',
      'plum',
      'fruit',
      'juice',
      'smoothie',
    ],
  },
];

const FOOD_CATEGORY_TO_VISUAL: Record<string, FoodVisualCategory> = {
  protein: 'protein',
  proteins: 'protein',
  meat: 'protein',
  seafood: 'protein',
  fish: 'protein',
  poultry: 'protein',
  legume: 'protein',
  legumes: 'protein',
  grains: 'grains',
  grain: 'grains',
  carbs: 'grains',
  carb: 'grains',
  cereal: 'grains',
  cereals: 'grains',
  bakery: 'grains',
  bread: 'grains',
  vegetables: 'vegetables',
  vegetable: 'vegetables',
  veggie: 'vegetables',
  veggies: 'vegetables',
  greens: 'vegetables',
  dairy: 'dairy',
  milk: 'dairy',
  fruits: 'fruits',
  fruit: 'fruits',
  nuts: 'nuts',
  nut: 'nuts',
  seeds: 'nuts',
  seed: 'nuts',
  snack: 'default',
  snacks: 'default',
};

const FOOD_IMAGES: Partial<Record<FoodVisualCategory, string>> = {
  protein:
    '1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300',
  grains:
    '1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300',
  vegetables:
    '1606858274001-dd10efc5ce7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG1lYWwlMjBwcmVwfGVufDF8fHx8MTc1NzQzNTEwN3ww&ixlib=rb-4.1.0&q=80&w=300',
  dairy:
    '1592503469196-3a7880cc2d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYnJlYWtmYXN0JTIwYm93bHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300',
  fruits:
    '1592503469196-3a7880cc2d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYnJlYWtmYXN0JTIwYm93bHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300',
  nuts:
    '1490474418585-ba9bad8fd0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300',
};

const FOOD_IMAGE_BY_KEYWORD: Array<{ keyword: string; imagePath: string }> = [
  { keyword: 'dosa', imagePath: '1630383249896-424e482df921?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'idli', imagePath: '1589301760014-d929f3979dbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'sambar', imagePath: '1589301760014-d929f3979dbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'chutney', imagePath: '1617093727343-374698b1b08d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'upma', imagePath: '1589301760014-d929f3979dbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'poha', imagePath: '1589301760014-d929f3979dbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'peanut', imagePath: '1490474418585-ba9bad8fd0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'smoothie', imagePath: '1505252585461-04db1eb84625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'shake', imagePath: '1505252585461-04db1eb84625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'juice', imagePath: '1621506289937-a8e4df240d0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'fruit bowl', imagePath: '1490474418585-ba9bad8fd0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'chia', imagePath: '1490474418585-ba9bad8fd0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'egg', imagePath: '1518569656558-1f25e69d93d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'chicken', imagePath: '1604503468506-a8da13d82791?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'fish', imagePath: '1467003909585-2f8a72700288?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'salmon', imagePath: '1467003909585-2f8a72700288?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'rice', imagePath: '1586201375761-83865001e31c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'oat', imagePath: '1574323347407-f5e1ad6d020b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'bread', imagePath: '1509440159596-0249088772ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'pasta', imagePath: '1621996346565-e3dbc353d2e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'salad', imagePath: '1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'milk', imagePath: '1550583724-b2692b85b150?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'yogurt', imagePath: '1571212515410-3b4a54d21592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'curd', imagePath: '1571212515410-3b4a54d21592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'cheese', imagePath: '1486297678162-eb2a19b0a32d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'banana', imagePath: '1571771894821-ce9b6c11b08e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'apple', imagePath: '1560806887-1e4cd0b6cbd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'avocado', imagePath: '1523049673857-eb18f1d7b578?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'nut', imagePath: '1490474418585-ba9bad8fd0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'cashew', imagePath: '1490474418585-ba9bad8fd0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'almond', imagePath: '1490474418585-ba9bad8fd0ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
  { keyword: 'pizza', imagePath: '1565299624946-b28f40a0ca4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300' },
];

export const inferFoodVisualCategory = (input?: FoodVisualInput): FoodVisualCategory => {
  const normalizedName = normalize(input?.name);
  const normalizedCategory = normalize(input?.category);
  const tokens = tokenize(input?.name);

  const scores: Record<FoodVisualCategory, number> = {
    protein: 0,
    grains: 0,
    vegetables: 0,
    dairy: 0,
    fruits: 0,
    nuts: 0,
    default: 0,
  };

  FOOD_NAME_KEYWORDS.forEach((entry) => {
    entry.keywords.forEach((keyword) => {
      if (hasKeyword(normalizedName, tokens, keyword)) {
        scores[entry.category] += keyword.includes(' ') ? 2 : 1;
      }
    });
  });

  const bestMatch = (Object.entries(scores) as Array<[FoodVisualCategory, number]>)
    .filter(([category, score]) => category !== 'default' && score > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  if (bestMatch) return bestMatch;

  if (normalizedCategory.includes('nut')) return 'nuts';
  return FOOD_CATEGORY_TO_VISUAL[normalizedCategory] || 'default';
};

export const getFoodEmoji = (input?: FoodVisualInput): string => {
  const normalizedName = normalize(input?.name);

  // Specific food overrides before bucket fallback.
  if (normalizedName.includes('egg')) return '🥚';
  if (normalizedName.includes('fish') || normalizedName.includes('salmon') || normalizedName.includes('tuna')) return '🐟';
  if (normalizedName.includes('shrimp') || normalizedName.includes('prawn')) return '🦐';
  if (normalizedName.includes('chicken')) return '🍗';
  if (normalizedName.includes('beef') || normalizedName.includes('mutton') || normalizedName.includes('lamb')) return '🥩';
  if (normalizedName.includes('rice')) return '🍚';
  if (normalizedName.includes('bread') || normalizedName.includes('roti') || normalizedName.includes('chapati')) return '🍞';
  if (normalizedName.includes('pasta') || normalizedName.includes('noodle')) return '🍝';
  if (normalizedName.includes('salad')) return '🥗';
  if (normalizedName.includes('broccoli')) return '🥦';
  if (normalizedName.includes('carrot')) return '🥕';
  if (normalizedName.includes('tomato')) return '🍅';
  if (normalizedName.includes('avocado')) return '🥑';
  if (normalizedName.includes('banana')) return '🍌';
  if (normalizedName.includes('apple')) return '🍎';
  if (normalizedName.includes('orange')) return '🍊';
  if (normalizedName.includes('grape')) return '🍇';
  if (normalizedName.includes('watermelon') || normalizedName.includes('melon')) return '🍉';
  if (normalizedName.includes('strawberry')) return '🍓';
  if (normalizedName.includes('pineapple')) return '🍍';
  if (normalizedName.includes('mango')) return '🥭';
  if (normalizedName.includes('milk')) return '🥛';
  if (normalizedName.includes('cheese')) return '🧀';
  if (normalizedName.includes('yogurt') || normalizedName.includes('yoghurt') || normalizedName.includes('curd')) return '🥣';
  if (normalizedName.includes('nut') || normalizedName.includes('almond') || normalizedName.includes('cashew')) return '🥜';

  const category = inferFoodVisualCategory(input);
  if (category === 'protein') return '🥩';
  if (category === 'grains') return '🌾';
  if (category === 'vegetables') return '🥬';
  if (category === 'dairy') return '🥛';
  if (category === 'fruits') return '🍎';
  if (category === 'nuts') return '🥜';
  return '🍽️';
};

export const getFoodImageUrl = (input?: FoodVisualInput): string | undefined => {
  const baseUrl = 'https://images.unsplash.com/photo-';
  const normalizedName = normalize(input?.name);
  const tokens = tokenize(input?.name);
  const nameMatch = FOOD_IMAGE_BY_KEYWORD.find((entry) =>
    hasKeyword(normalizedName, tokens, entry.keyword)
  );
  if (nameMatch) {
    return baseUrl + nameMatch.imagePath;
  }

  const category = inferFoodVisualCategory(input);
  const categoryImage = FOOD_IMAGES[category];
  if (!categoryImage) return undefined;
  return baseUrl + categoryImage;
};

export const DEFAULT_FOOD_IMAGE_URL =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZHxlbnwxfHx8fDE3NTc1MzAyNjl8MA&ixlib=rb-4.1.0&q=80&w=300';

export const resolveFoodImageUrl = (input?: FoodVisualInput): string =>
  getFoodImageUrl(input) ?? DEFAULT_FOOD_IMAGE_URL;

const ACTIVITY_ICON_KEYWORDS: Record<string, string> = {
  swimming: 'pool',
  swim: 'pool',
  freestyle: 'pool',
  breaststroke: 'pool',
  run: 'directions-run',
  running: 'directions-run',
  jog: 'directions-run',
  sprint: 'directions-run',
  marathon: 'directions-run',
  walk: 'directions-walk',
  walking: 'directions-walk',
  trekking: 'hiking',
  cycling: 'directions-bike',
  cycle: 'directions-bike',
  bike: 'directions-bike',
  spinning: 'directions-bike',
  spin: 'directions-bike',
  'mountain biking': 'directions-bike',
  weight: 'fitness-center',
  weightlifting: 'fitness-center',
  strength: 'fitness-center',
  gym: 'fitness-center',
  resistance: 'fitness-center',
  functional: 'fitness-center',
  hiit: 'fitness-center',
  crossfit: 'fitness-center',
  tabata: 'fitness-center',
  circuit: 'fitness-center',
  aerobics: 'fitness-center',
  aerobic: 'fitness-center',
  calisthenics: 'fitness-center',
  bodyweight: 'fitness-center',
  'rowing machine': 'rowing',
  elliptical: 'fitness-center',
  stairmaster: 'stairs',
  treadmill: 'directions-run',
  skipping: 'sports-gymnastics',
  'jump rope': 'sports-gymnastics',
  yoga: 'self-improvement',
  pilates: 'self-improvement',
  stretch: 'self-improvement',
  meditation: 'self-improvement',
  breathing: 'self-improvement',
  pranayama: 'self-improvement',
  barre: 'self-improvement',
  dance: 'music-note',
  zumba: 'music-note',
  'hip hop': 'music-note',
  tennis: 'sports-tennis',
  badminton: 'sports-badminton',
  'table tennis': 'sports-tennis',
  'ping pong': 'sports-tennis',
  squash: 'sports-tennis',
  racquetball: 'sports-tennis',
  basketball: 'sports-basketball',
  football: 'sports-football',
  soccer: 'sports-soccer',
  volleyball: 'sports-volleyball',
  handball: 'sports-handball',
  hiking: 'hiking',
  climb: 'hiking',
  climbing: 'hiking',
  mountaineering: 'hiking',
  trail: 'hiking',
  boxing: 'sports-mma',
  kickboxing: 'sports-mma',
  karate: 'sports-mma',
  martial: 'sports-mma',
  taekwondo: 'sports-mma',
  judo: 'sports-mma',
  wrestling: 'sports-mma',
  rowing: 'rowing',
  row: 'rowing',
  kayak: 'kayaking',
  kayaking: 'kayaking',
  canoe: 'kayaking',
  paddle: 'kayaking',
  surfing: 'surfing',
  ski: 'downhill-skiing',
  skiing: 'downhill-skiing',
  snowboard: 'snowboarding',
  skating: 'ice-skating',
  'ice skating': 'ice-skating',
  'roller skating': 'roller-skating',
  skateboard: 'skateboarding',
  golf: 'golf-course',
  baseball: 'sports-baseball',
  softball: 'sports-baseball',
  cricket: 'sports-cricket',
  rugby: 'sports-rugby',
  frisbee: 'sports',
  pickleball: 'sports-tennis',
  stair: 'stairs',
  stairs: 'stairs',
  stepper: 'stairs',
  cardio: 'favorite',
  'dance cardio': 'favorite',
};

const ACTIVITY_CATEGORY_ICON: Record<string, string> = {
  cardio: 'favorite',
  strength: 'fitness-center',
  flexibility: 'self-improvement',
  balance: 'self-improvement',
  sports: 'sports',
  athletics: 'directions-run',
  outdoor: 'hiking',
  mindbody: 'self-improvement',
  wellness: 'self-improvement',
};

const SUPPORTED_ACTIVITY_ICONS = new Set<string>([
  'pool',
  'directions-run',
  'directions-walk',
  'directions-bike',
  'fitness-center',
  'self-improvement',
  'music-note',
  'sports-tennis',
  'sports-basketball',
  'sports-football',
  'sports-soccer',
  'sports-volleyball',
  'hiking',
  'sports-mma',
  'rowing',
  'surfing',
  'downhill-skiing',
  'snowboarding',
  'ice-skating',
  'skateboarding',
  'golf-course',
  'sports-baseball',
  'sports-cricket',
  'sports-badminton',
  'stairs',
  'favorite',
  'sports',
  'kayaking',
]);

export const getActivityIconName = (input?: ActivityVisualInput): string | undefined => {
  const normalizedName = normalize(input?.name);
  const normalizedCategory = normalize(input?.category);
  const nameTokens = tokenize(input?.name);
  const categoryTokens = tokenize(input?.category);
  const allTokens = [...nameTokens, ...categoryTokens];
  const combined = `${normalizedName} ${normalizedCategory}`.trim();
  if (!combined) return undefined;

  const exactMatch = ACTIVITY_ICON_KEYWORDS[combined];
  if (exactMatch && SUPPORTED_ACTIVITY_ICONS.has(exactMatch)) return exactMatch;

  const iconScores = new Map<string, number>();
  for (const [key, icon] of Object.entries(ACTIVITY_ICON_KEYWORDS)) {
    if (hasKeyword(combined, allTokens, key) && SUPPORTED_ACTIVITY_ICONS.has(icon)) {
      const weight = key.includes(' ') ? 2 : 1;
      iconScores.set(icon, (iconScores.get(icon) || 0) + weight);
    }
  }

  const bestIcon = [...iconScores.entries()].sort((a, b) => b[1] - a[1])[0];
  if (bestIcon && bestIcon[1] >= 1) {
    return bestIcon[0];
  }

  if (normalizedCategory && ACTIVITY_CATEGORY_ICON[normalizedCategory]) {
    const categoryIcon = ACTIVITY_CATEGORY_ICON[normalizedCategory];
    if (SUPPORTED_ACTIVITY_ICONS.has(categoryIcon)) {
      return categoryIcon;
    }
  }

  return undefined;
};

export const getActivityEmoji = (input?: ActivityVisualInput): string | undefined => {
  const icon = getActivityIconName(input);
  if (!icon) return undefined;
  if (icon === 'pool') return '🏊';
  if (icon === 'directions-run') return '🏃';
  if (icon === 'directions-walk') return '🚶';
  if (icon === 'directions-bike') return '🚴';
  if (icon === 'self-improvement') return '🧘';
  if (icon === 'sports-tennis') return '🎾';
  if (icon === 'sports-basketball') return '🏀';
  if (icon === 'sports-football' || icon === 'sports-soccer') return '⚽';
  if (icon === 'hiking') return '🥾';
  if (icon === 'sports-mma') return '🥊';
  if (icon === 'rowing' || icon === 'kayaking') return '🚣';
  if (icon === 'golf-course') return '⛳';
  if (icon === 'sports-baseball') return '⚾';
  if (icon === 'sports-cricket') return '🏏';
  if (icon === 'music-note') return '💃';
  if (icon === 'stairs') return '🪜';
  return undefined;
};

/** Stock thumbnails keyed like Material icon names from {@link getActivityIconName}. */
const ACTIVITY_ICON_TO_IMAGE_URL: Record<string, string> = {
  pool: 'https://images.unsplash.com/photo-1562883679-16e9bb318cac?auto=format&fit=crop&w=300&q=80',
  'directions-run':
    'https://images.unsplash.com/photo-1545186079-85b6e2424f28?auto=format&fit=crop&w=300&q=80',
  'directions-walk':
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80',
  'directions-bike':
    'https://images.unsplash.com/photo-1541625602330-2277a4c46195?auto=format&fit=crop&w=300&q=80',
  'fitness-center':
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=300&q=80',
  'self-improvement':
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=300&q=80',
  'music-note': 'https://images.unsplash.com/photo-1524594152303-925992356ffc?auto=format&fit=crop&w=300&q=80',
  'sports-tennis':
    'https://images.unsplash.com/photo-1622279457498-725dc1123e54?auto=format&fit=crop&w=300&q=80',
  'sports-basketball':
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80',
  'sports-football':
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=300&q=80',
  'sports-soccer':
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=300&q=80',
  'sports-volleyball':
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=300&q=80',
  hiking: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=300&q=80',
  'sports-mma':
    'https://images.unsplash.com/photo-1549719386-74dfcbf7a31e?auto=format&fit=crop&w=300&q=80',
  rowing: 'https://images.unsplash.com/photo-1540497075689-aa23b88227cc?auto=format&fit=crop&w=300&q=80',
  kayaking: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=300&q=80',
  surfing: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=300&q=80',
  'downhill-skiing':
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=300&q=80',
  snowboarding:
    'https://images.unsplash.com/photo-1551524164-687a55dd1326?auto=format&fit=crop&w=300&q=80',
  'ice-skating':
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=300&q=80',
  skateboarding:
    'https://images.unsplash.com/photo-1564982752979-32402cce2f48?auto=format&fit=crop&w=300&q=80',
  'golf-course':
    'https://images.unsplash.com/photo-1535131749006-fa095fd934c7?auto=format&fit=crop&w=300&q=80',
  'sports-baseball':
    'https://images.unsplash.com/photo-1566577739112-5180d843eae8?auto=format&fit=crop&w=300&q=80',
  'sports-cricket':
    'https://images.unsplash.com/photo-1531417538963-de349480d874?auto=format&fit=crop&w=300&q=80',
  'sports-badminton':
    'https://images.unsplash.com/photo-1626224582827-2972aec82738?auto=format&fit=crop&w=300&q=80',
  stairs: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=300&q=80',
  favorite: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80',
};

const DEFAULT_ACTIVITY_IMAGE_URL =
  ACTIVITY_ICON_TO_IMAGE_URL['fitness-center'];

export const getActivityImageUrl = (input?: ActivityVisualInput): string => {
  const icon = getActivityIconName(input);
  if (icon && ACTIVITY_ICON_TO_IMAGE_URL[icon]) {
    return ACTIVITY_ICON_TO_IMAGE_URL[icon];
  }
  return DEFAULT_ACTIVITY_IMAGE_URL;
};
