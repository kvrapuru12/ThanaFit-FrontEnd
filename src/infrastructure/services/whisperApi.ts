import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Lazy initialization of OpenAI client - only create when needed
let openai: any = null;
let OpenAI: any = null;

async function getOpenAIClient(): Promise<any> {
  if (!openai) {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables.');
    }
    
    // Dynamic import to avoid loading at module initialization
    if (!OpenAI) {
      const openaiModule = await import('openai');
      OpenAI = openaiModule.default;
    }
    
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Required for Expo Go
    });
  }
  return openai;
}

export interface WhisperResponse {
  text: string;
  language?: string;
  duration?: number;
}

export interface AudioFile {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
  lastModified?: number;
}

/** MIME type for Whisper API by file extension (Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm) */
function mimeForExtension(fileName: string): string {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const mime: Record<string, string> = {
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    mp4: 'audio/mp4',
    mp3: 'audio/mpeg',
    mpeg: 'audio/mpeg',
    mpga: 'audio/mpeg',
    webm: 'audio/webm',
    '3gp': 'audio/3gpp',
  };
  return mime[ext] ?? 'audio/wav';
}

export class WhisperApiService {
  /**
   * Transcribe audio file using OpenAI Whisper API
   * @param audioFile - The audio file to transcribe (React Native file object with uri)
   * @returns Promise<WhisperResponse>
   */
    async transcribeAudio(audioFile: AudioFile): Promise<WhisperResponse> {
        try {
          console.log('Starting Whisper transcription...');
          const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
          if (!apiKey) {
            throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables.');
          }

          const audioUri = audioFile.uri || '';
          const fileName = audioFile.name || 'recording.wav';
          const mimeType = audioFile.type || mimeForExtension(fileName);
          const url = 'https://api.openai.com/v1/audio/transcriptions';

          // Android: fetch + FormData often fails to read file:// URIs. Use native upload.
          if (Platform.OS === 'android') {
            console.log('[Android] Using FileSystem.uploadAsync for Whisper (reliable file read)');
            const result = await FileSystem.uploadAsync(url, audioUri, {
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: 'file',
              mimeType,
              parameters: {
                model: 'whisper-1',
                language: 'en',
                response_format: 'json',
              },
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (result.status < 200 || result.status >= 300) {
              let errMsg = result.body || `HTTP ${result.status}`;
              try {
                const errJson = JSON.parse(result.body);
                errMsg = errJson.error?.message || result.body;
              } catch {
                // use result.body as-is
              }
              console.error('Whisper API error (Android upload):', result.status, errMsg);
              throw new Error(`Whisper API failed: ${result.status}. ${errMsg}`);
            }

            const responseData = JSON.parse(result.body);
            console.log('Whisper transcription completed (Android):', responseData);
            return {
              text: responseData.text,
              language: responseData.language,
              duration: responseData.duration,
            };
          }

          // iOS: fetch + FormData works correctly with file URI
          const formData = new FormData();
          formData.append('file', {
            uri: audioUri,
            name: fileName,
            type: mimeType,
          } as any);
          formData.append('model', 'whisper-1');
          formData.append('language', 'en');
          formData.append('response_format', 'json');

          console.log('FormData created with file:', { uri: audioUri, name: fileName, type: mimeType });

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
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
        } catch (error: unknown) {
          console.error('Transcription failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Whisper API failed: ${errorMessage}. Please use manual input.`);
        }
      }

  /**
   * Alternative method using OpenAI SDK (if FormData doesn't work)
   * @param audioFile - The audio file to transcribe
   * @returns Promise<WhisperResponse>
   */
  async transcribeAudioWithSDK(audioFile: AudioFile): Promise<WhisperResponse> {
    try {
      console.log('Starting Whisper transcription with SDK...');
      
      const client = await getOpenAIClient();
      const transcription = await client.audio.transcriptions.create({
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
      async audioUriToFile(audioUri: string, fileName: string = 'recording.wav'): Promise<AudioFile> {
        try {
          console.log('Converting audio URI to File:', audioUri);
          const mimeType = mimeForExtension(fileName);
          const file: AudioFile = {
            uri: audioUri,
            name: fileName,
            type: mimeType,
            size: 0,
            lastModified: Date.now()
          };
          
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
