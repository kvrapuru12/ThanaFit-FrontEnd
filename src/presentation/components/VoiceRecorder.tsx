import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import { dashboardApiService } from '../../infrastructure/services/dashboardApi';
import { whisperApiService } from '../../infrastructure/services/whisperApi';

const { width } = Dimensions.get('window');

interface VoiceRecorderProps {
  onVoiceLog?: (transcript: string) => void;
  onVoiceLogSuccess?: (activityLog: any) => void;
  onClose?: () => void;
  visible?: boolean;
  userId?: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onVoiceLog,
  onVoiceLogSuccess,
  onClose,
  visible = false,
  userId,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setShowTranscriptInput(false);
      setTranscript('');
      setIsRecording(false);
      setIsProcessing(false);
      setRecordingDuration(0);
      setIsTranscribing(false);
    }
  }, [visible]);

  // Set up audio mode for recording
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to set up audio mode:', error);
      }
    };

    setupAudio();
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Start duration timer
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
        pulseAnim.stopAnimation();
        waveAnim.stopAnimation();
      };
    } else {
      pulseAnim.stopAnimation();
      waveAnim.stopAnimation();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      console.log('Starting audio recording...');
      
      // Request permissions
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission...');
        const permission = await requestPermission();
        if (permission.status !== 'granted') {
          Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
          return;
        }
      }

      // Ensure audio mode is set for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Start recording with WAV format for better Whisper compatibility
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      console.log('Recording started');
      
          // Speak instructions with sweet women voice
          Speech.speak('Please describe your workout', {
            language: 'en',
            pitch: 1.2, // Higher pitch for women voice
            rate: 0.7, // Slower rate for sweet voice
          });
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      setIsTranscribing(true);

      // Stop the recording
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      console.log('Recording stopped and stored at:', uri);
      
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }
      
      // Now transcribe with Whisper
      await transcribeWithWhisper(uri);
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
      setIsTranscribing(false);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const transcribeWithWhisper = async (audioUri: string) => {
    try {
      console.log('Starting Whisper transcription...');
      
      // Check if OpenAI API key is available
      if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables.');
      }

      // Convert audio URI to File object - use WAV extension
      const fileExtension = audioUri.split('.').pop() || 'wav';
      const audioFile = await whisperApiService.audioUriToFile(audioUri, `workout-recording.${fileExtension}`);
      
      // Log file details before uploading
      console.log('File details before upload:', {
        uri: audioUri,
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });
      
      // Transcribe with Whisper
      const result = await whisperApiService.transcribeAudio(audioFile);
      
      console.log('Whisper transcription result:', result);
      
          // Filter out instruction text and update state with transcript
          const filteredText = result.text
            .replace(/^start speaking about your workout[.,]?\s*/i, '')
            .replace(/^please describe your workout[.,]?\s*/i, '')
            .trim();
          
          setTranscript(filteredText);
          setIsTranscribing(false);
          setShowTranscriptInput(true);
      
        } catch (error) {
          console.error('Whisper transcription failed:', error);
          setIsTranscribing(false);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          Alert.alert(
            'Voice Transcription Failed',
            `The AI couldn't process your audio recording. This might be due to:\n\n• Audio quality issues\n• Network connectivity problems\n• API limitations\n\nWould you like to type your workout manually instead?`,
            [
              {
                text: 'Try Recording Again',
                onPress: () => {
                  setRecordingDuration(0);
                  setIsTranscribing(false);
                },
                style: 'cancel',
              },
              {
                text: 'Type Manually',
                onPress: () => {
                  setIsTranscribing(false);
                  setShowTranscriptInput(true);
                  setTranscript(''); // Clear any existing transcript
                },
              },
            ]
          );
        }
  };

  const handleSubmitTranscript = async () => {
    if (!transcript.trim()) {
      Alert.alert('Error', 'Please enter what you said about your workout.');
      return;
    }

    setIsProcessing(true);
    setShowTranscriptInput(false);
    
    try {
      await handleVoiceLog(transcript.trim());
    } catch (error) {
      console.error('Error processing transcript:', error);
      setIsProcessing(false);
      setShowTranscriptInput(true);
    }
  };

  const handleCancelTranscript = () => {
    setShowTranscriptInput(false);
    setTranscript('');
    setRecordingDuration(0);
  };


  const handleVoiceLog = async (transcript: string) => {
    console.log('=== VOICE NOTE RECEIVED ===');
    console.log('Voice note:', transcript);
    
    if (!userId) {
      Alert.alert('Error', 'User ID not available. Please try again.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Call the backend API to process the voice log
      const result = await dashboardApiService.processVoiceLog({
        userId,
        voiceText: transcript,
      });

      console.log('Voice log processed successfully:', result);
      
      setIsProcessing(false);
      
      Alert.alert(
        'Activity Logged Successfully! 🎉',
        `Original: "${transcript}"\n\nInterpreted as: ${result.activityLog.activity}\nDuration: ${result.activityLog.durationMinutes} minutes\nCalories burned: ${result.activityLog.caloriesBurned}\nNote: ${result.activityLog.note}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Call the success callback with the activity log data
              onVoiceLogSuccess?.(result.activityLog);
              onClose?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to process voice log:', error);
      setIsProcessing(false);
      
      Alert.alert(
        'Voice Log Captured! 🎤',
        `"${transcript}"\n\nNote: Could not automatically process this voice log. You can still use it manually.`,
        [
          {
            text: 'Use Manually',
            onPress: () => {
              onVoiceLog?.(transcript);
              onClose?.();
            },
          },
          {
            text: 'Record Again',
            onPress: () => {
              setRecordingDuration(0);
              setIsProcessing(false);
            },
            style: 'cancel',
          },
        ]
      );
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Voice Log</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          
          {/* Transcript Input Modal */}
          {showTranscriptInput ? (
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptTitle}>AI Transcribed Your Workout</Text>
              <Text style={styles.transcriptSubtitle}>
                Here's what the AI heard. You can edit it if needed before submitting.
              </Text>
              
              <TextInput
                style={styles.transcriptInput}
                placeholder="Your workout description will appear here..."
                value={transcript}
                onChangeText={setTranscript}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              
              <View style={styles.transcriptButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelTranscript}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitTranscript}
                  disabled={!transcript.trim()}
                >
                  <Text style={[
                    styles.submitButtonText,
                    !transcript.trim() && styles.submitButtonTextDisabled
                  ]}>
                    Process with AI
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Recording Visual */}
              <View style={styles.recordingContainer}>
                <Animated.View
                  style={[
                    styles.recordingCircle,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <MaterialIcons
                    name={isRecording ? 'mic' : 'mic-none'}
                    size={48}
                    color="white"
                  />
                </Animated.View>

                {/* Wave Animation */}
                {isRecording && (
                  <View style={styles.waveContainer}>
                    {[...Array(5)].map((_, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.waveBar,
                          {
                            opacity: waveOpacity,
                            transform: [
                              {
                                scaleY: waveAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.5, 1.5],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* Status Text */}
                <Text style={styles.statusText}>
                  {isProcessing
                    ? 'Processing your voice...'
                    : isTranscribing
                    ? 'Transcribing with AI...'
                    : isRecording
                    ? `Recording... ${formatDuration(recordingDuration)}`
                    : 'Tap to start recording'}
                </Text>
                
                {/* Manual input option */}
                {!isRecording && !isTranscribing && !isProcessing && (
                  <TouchableOpacity
                    style={styles.manualButton}
                    onPress={() => {
                      setShowTranscriptInput(true);
                      setTranscript('');
                    }}
                  >
                    <Text style={styles.manualButtonText}>Or type manually</Text>
                  </TouchableOpacity>
                )}

                {/* Duration Display */}
                {isRecording && (
                  <Text style={styles.durationText}>
                    {formatDuration(recordingDuration)}
                  </Text>
                )}
              </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>How to use Voice Log:</Text>
            <Text style={styles.instructionText}>
              • Tap the microphone to start recording
            </Text>
            <Text style={styles.instructionText}>
              • Speak naturally about your workout
            </Text>
            <Text style={styles.instructionText}>
              • Include details like duration, intensity, and how you felt
            </Text>
            <Text style={styles.instructionText}>
              • Tap stop when you're done - AI will transcribe automatically
            </Text>
          </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive,
                  isProcessing && styles.recordButtonDisabled,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                <MaterialIcons
                  name={isRecording ? 'stop' : 'mic'}
                  size={24}
                  color={isProcessing ? '#9ca3af' : 'white'}
                />
                <Text style={styles.recordButtonText}>
                  {isProcessing
                    ? 'Processing...'
                    : isTranscribing
                    ? 'Transcribing...'
                    : isRecording
                    ? 'Stop Recording'
                    : 'Start Recording'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef7ed',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  recordingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
  },
  waveBar: {
    width: 4,
    height: 20,
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  manualButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    alignSelf: 'center',
  },
  manualButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  recordButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#ef4444',
  },
  recordButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  transcriptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  transcriptSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  transcriptInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  transcriptButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    color: '#9ca3af',
  },
});
