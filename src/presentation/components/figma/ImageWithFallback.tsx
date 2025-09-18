import React, { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

interface ImageWithFallbackProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  style?: any;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt = 'Image', 
  width = 100, 
  height = 100, 
  style 
}) => {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  return didError ? (
    <View style={[styles.errorContainer, { width, height }, style]}>
      <View style={styles.errorContent}>
        <Text style={styles.errorText}>📷</Text>
        <Text style={styles.errorLabel}>Image failed to load</Text>
      </View>
    </View>
  ) : (
    <Image
      source={{ uri: src }}
      style={[styles.image, { width, height }, style]}
      onError={handleError}
    />
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 24,
    marginBottom: 4,
  },
  errorLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  image: {
    borderRadius: 8,
  },
});