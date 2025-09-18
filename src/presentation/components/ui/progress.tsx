import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressProps {
  value: number;
  max?: number;
  style?: any;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, style }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <View style={[styles.progressContainer, style]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(percentage)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    minWidth: 35,
    textAlign: 'right',
  },
});