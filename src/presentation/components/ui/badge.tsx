import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', style }) => {
  const badgeStyle = [
    styles.badge,
    styles[variant],
    style,
  ];

  const textStyle = [
    styles.badgeText,
    styles[`${variant}Text`],
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  default: {
    backgroundColor: '#2563eb',
    borderColor: 'transparent',
  },
  defaultText: {
    color: 'white',
  },
  secondary: {
    backgroundColor: '#f1f5f9',
    borderColor: 'transparent',
  },
  secondaryText: {
    color: '#475569',
  },
  destructive: {
    backgroundColor: '#ef4444',
    borderColor: 'transparent',
  },
  destructiveText: {
    color: 'white',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#d1d5db',
  },
  outlineText: {
    color: '#374151',
  },
});