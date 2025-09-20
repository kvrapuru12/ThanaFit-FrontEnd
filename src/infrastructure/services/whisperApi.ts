import OpenAI from 'openai';
import axios from 'axios';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY, // You'll need to set this in your environment
  dangerouslyAllowBrowser: true, // Required for Expo Go
});

export interface WhisperResponse {
  text: string;
  language?: string;
  duration?: number;
}

export class WhisperApiService {
  /**
   * Transcribe audio file using OpenAI Whisper API
   * @param audioFile - The audio file to transcribe
   * @returns Promise<WhisperResponse>
   */
    async transcribeAudio(audioFile: File): Promise<WhisperResponse> {
        try {
          console.log('Starting Whisper transcription...');
          
          // Get the original audio URI from the file (we'll need this for React Native FormData)
          const audioUri = audioFile.uri || '';
          
          // Create FormData with React Native compatible structure
          const formData = new FormData();
          
          // Use React Native FormData format: { uri, name, type }
          formData.append('file', {
            uri: audioUri,
            name: 'workout-recording.wav',
            type: 'audio/wav'
          } as any);
          formData.append('model', 'whisper-1');
          formData.append('language', 'en');
          formData.append('response_format', 'json');

          console.log('FormData created with file:', {
            uri: audioUri,
            name: 'workout-recording.wav',
            type: 'audio/wav'
          });

          // Use fetch instead of axios for React Native compatibility
          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
              // Don't set Content-Type - let fetch handle multipart boundaries
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Whisper API error response:', errorData);
            throw new Error(`Whisper API failed: ${response.status}. ${errorData.error?.message || 'Unknown error'}`);
          }

          const responseData = await response.json();
          console.log('Whisper transcription completed:', responseData);

          return {
            text: responseData.text,
            language: responseData.language,
            duration: responseData.duration,
          };
          
        } catch (error) {
          console.error('Transcription failed:', error);
          throw new Error(`Whisper API failed: ${error.message || 'Unknown error'}. Please use manual input.`);
        }
      }

  /**
   * Alternative method using OpenAI SDK (if FormData doesn't work)
   * @param audioFile - The audio file to transcribe
   * @returns Promise<WhisperResponse>
   */
  async transcribeAudioWithSDK(audioFile: File): Promise<WhisperResponse> {
    try {
      console.log('Starting Whisper transcription with SDK...');
      
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
        response_format: 'json',
      });

      console.log('Whisper transcription completed with SDK:', transcription);

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
      };
    } catch (error) {
      console.error('Whisper transcription with SDK failed:', error);
      throw error;
    }
  }

      /**
       * Convert audio URI to File-like object for React Native FormData
       * @param audioUri - The URI of the recorded audio
       * @returns Promise<File>
       */
      async audioUriToFile(audioUri: string, fileName: string = 'recording.wav'): Promise<File> {
        try {
          console.log('Converting audio URI to File:', audioUri);
          
          // For React Native, we need to preserve the URI for FormData
          // Create a File-like object that includes the original URI
          const file = {
            uri: audioUri,
            name: fileName,
            type: 'audio/wav',
            size: 0, // We'll get this from the actual file if needed
            lastModified: Date.now()
          } as File;
          
          console.log('Audio file created successfully:', {
            uri: file.uri,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          });
          
          return file;
        } catch (error) {
          console.error('Failed to convert audio URI to File:', error);
          throw error;
        }
      }
}

// Export singleton instance
export const whisperApiService = new WhisperApiService();
