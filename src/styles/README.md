# Global Styles for ThanaFit Frontend

This directory contains global styles and theme constants for the ThanaFit application.

## Files

- `global.css` - Global CSS styles with CSS variables and utility classes
- `index.ts` - Theme constants and common styles for React Native
- `README.md` - This documentation file

## Usage

### For Web Builds

The `global.css` file is automatically imported in `App.tsx` and will be available for web builds. It includes:

- CSS variables for consistent theming
- Utility classes for common styling patterns
- Responsive design helpers
- Animation classes
- Form styling
- Navigation styling

### For React Native

Use the theme constants and common styles from `index.ts`:

```typescript
import { theme, commonStyles } from '../styles';

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    padding: theme.spacing.lg,
  },
  title: {
    ...commonStyles.title,
    color: theme.colors.primary.blue,
  },
});
```

## CSS Variables

The global CSS file defines CSS variables that can be used in web builds:

```css
:root {
  --primary-blue: #2563eb;
  --secondary-green: #10b981;
  --gray-50: #f8fafc;
  /* ... more variables */
}
```

## Theme Constants

The theme object provides consistent values for:

- **Colors**: Primary, secondary, status, background, text, border colors
- **Spacing**: Consistent spacing values (xs, sm, md, lg, xl, xxl)
- **Border Radius**: Consistent border radius values
- **Font Sizes**: Typography scale
- **Font Weights**: Font weight constants
- **Shadows**: Pre-defined shadow styles for React Native

## Common Styles

Pre-defined style patterns for common UI elements:

- `container` - Main container styles
- `card` - Card component styles
- `button` - Button styles with variants
- `input` - Form input styles
- `title` - Title typography
- `subtitle` - Subtitle typography

## Utility Classes

The global CSS includes utility classes for:

- Text alignment (`text-center`, `text-left`, `text-right`)
- Font weights (`font-light`, `font-medium`, `font-bold`)
- Colors (`text-primary`, `text-secondary`, `bg-primary`)
- Spacing (`p-1`, `p-2`, `m-1`, `m-2`, etc.)
- Display (`flex`, `block`, `hidden`)
- Borders (`border`, `border-t`, `border-b`)
- Border radius (`rounded`, `rounded-lg`, `rounded-full`)
- Shadows (`shadow-sm`, `shadow-md`, `shadow-lg`)

## Responsive Design

Responsive utilities are included:

- `.hidden-mobile` - Hide on mobile devices
- `.hidden-desktop` - Hide on desktop devices

## Animations

Pre-defined animation classes:

- `.fade-in` - Fade in animation
- `.slide-up` - Slide up animation
- `.slide-down` - Slide down animation

## Best Practices

1. **Use theme constants** for consistent styling across the app
2. **Leverage common styles** for repeated patterns
3. **Use CSS variables** in web builds for dynamic theming
4. **Follow the spacing scale** for consistent layouts
5. **Use semantic color names** instead of hardcoded values

## Example Usage

### React Native Component

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, commonStyles } from '../styles';

const MyComponent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>Card content</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
    padding: theme.spacing.lg,
  },
  title: {
    ...commonStyles.title,
    color: theme.colors.primary.blue,
  },
  card: {
    ...commonStyles.card,
    marginTop: theme.spacing.md,
  },
  cardText: commonStyles.cardText,
});

export default MyComponent;
```

### Web Component (if using React for web)

```jsx
import React from 'react';
import './styles/global.css';

const MyComponent = () => {
  return (
    <div className="container p-4">
      <h1 className="title text-primary">Hello World</h1>
      <div className="card mt-3">
        <p className="card-text">Card content</p>
      </div>
    </div>
  );
};

export default MyComponent;
```
