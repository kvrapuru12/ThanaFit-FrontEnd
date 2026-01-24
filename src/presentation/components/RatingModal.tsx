import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback?: string) => void;
  isLoading?: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleStarPress = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating, feedback.trim() || undefined);
    }
  };

  const handleClose = () => {
    setSelectedRating(0);
    setHoveredRating(0);
    setFeedback('');
    onClose();
  };

  const renderStar = (starNumber: number) => {
    const isSelected = starNumber <= selectedRating;
    const isHovered = starNumber <= hoveredRating;
    const isActive = isSelected || (hoveredRating > 0 && isHovered && selectedRating === 0);

    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => handleStarPress(starNumber)}
        onPressIn={() => setHoveredRating(starNumber)}
        onPressOut={() => setHoveredRating(0)}
        activeOpacity={0.7}
        style={styles.starButton}
      >
        <MaterialIcons
          name={isActive ? 'star' : 'star-border'}
          size={40}
          color={isActive ? '#ffa726' : '#d1d5db'}
        />
      </TouchableOpacity>
    );
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
                <Text style={styles.title}>Rate ThanaFit</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.subtitle}>
                  How would you rate your experience?
                </Text>

                {/* Stars */}
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => renderStar(star))}
                </View>

                {/* Rating Label */}
                {selectedRating > 0 && (
                  <Text style={styles.ratingLabel}>
                    {ratingLabels[selectedRating]}
                  </Text>
                )}

                {/* Feedback Input */}
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackLabel}>
                    Share your feedback (optional)
                  </Text>
                  <TextInput
                    style={styles.feedbackInput}
                    placeholder="Tell us what you think..."
                    placeholderTextColor="#9ca3af"
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={styles.characterCount}>
                    {feedback.length}/500
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (selectedRating === 0 || isLoading) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={selectedRating === 0 || isLoading}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? 'Submitting...' : 'Submit Rating'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffa726',
    textAlign: 'center',
    marginBottom: 24,
  },
  feedbackContainer: {
    marginBottom: 24,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 100,
    backgroundColor: '#f9fafb',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});


