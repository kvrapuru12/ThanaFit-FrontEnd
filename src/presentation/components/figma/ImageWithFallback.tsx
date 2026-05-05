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
  style,
}) => {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  if (didError) {
    return (
      <View
        style={[styles.slot, { width, height }, style]}
        accessibilityRole="image"
        accessibilityLabel={`${alt}, no image`}
      >
        <Text style={styles.noImageLabel} numberOfLines={1}>
          No image
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: src }}
      style={[styles.image, { width, height }, style]}
      onError={handleError}
      accessibilityRole="image"
      accessibilityLabel={alt}
    />
  );
};

const styles = StyleSheet.create({
  slot: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  noImageLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  image: {
    borderRadius: 8,
  },
});
