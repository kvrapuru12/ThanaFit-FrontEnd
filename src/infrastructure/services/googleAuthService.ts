import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Complete the web browser authentication session
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthConfig {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
}

export class GoogleAuthService {
  private discovery: AuthSession.DiscoveryDocument | null = null;
  private config: GoogleAuthConfig;

  constructor(config: GoogleAuthConfig) {
    this.config = config;
  }

  /**
   * Initialize Google OAuth discovery document
   */
  private async getDiscovery(): Promise<AuthSession.DiscoveryDocument> {
    if (!this.discovery) {
      this.discovery = await AuthSession.fetchDiscoveryAsync(
        'https://accounts.google.com'
      );
    }
    return this.discovery;
  }

  /**
   * Get the appropriate client ID based on platform and environment
   * For Expo Go (exp:// URLs), use Web Client ID
   * For native builds, use platform-specific Client ID
   */
  private getClientId(redirectUri?: string): string {
    // Check if we're in Expo Go by checking if redirect URI uses exp:// scheme
    // OR check Constants.appOwnership for a more reliable detection
    const isExpoGo = redirectUri?.startsWith('exp://') || Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      if (this.config.webClientId) {
        return this.config.webClientId;
      }
      // Fall back to iOS/Android Client IDs with a warning - this won't work in Expo Go
      // but gives a better error message
      console.warn(
        '⚠️ Google Sign-In in Expo Go requires a Web Client ID.\n' +
        'Option 1: Create a Web OAuth Client ID in Google Cloud Console and set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env\n' +
        'Option 2: Use a development build instead: npx expo run:ios (or npx expo run:android)\n' +
        'Development builds use iOS/Android Client IDs and don\'t require Web Client ID.'
      );
      // Try to use iOS/Android Client ID anyway (will fail with redirect URI error from Google)
      const clientId = Platform.OS === 'ios' 
        ? this.config.iosClientId 
        : this.config.androidClientId;
      if (clientId) {
        return clientId;
      }
      throw new Error(
        'Google Sign-In requires a Web Client ID when using Expo Go.\n' +
        'Please either:\n' +
        '1. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env (create Web OAuth Client ID in Google Cloud Console)\n' +
        '2. OR use a development build: npx expo run:ios (uses iOS Client ID)\n' +
        'See GOOGLE_OAUTH_REDIRECT_URI_FIX.md for details.'
      );
    }
    
    // For native builds, use platform-specific Client ID
    const clientId = Platform.OS === 'ios' 
      ? this.config.iosClientId 
      : this.config.androidClientId;
    
    if (!clientId) {
      throw new Error(
        `Google Client ID not configured for ${Platform.OS}. ` +
        `Please set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env.`
      );
    }
    
    return clientId;
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<string> {
    // Use the same Client ID type (Web for Expo Go, iOS/Android for native)
    const redirectUriForClientId = redirectUri; // Use the same redirect URI to get correct client ID
    const clientId = this.getClientId(redirectUriForClientId);
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('code_verifier', codeVerifier);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    try {
      // Add timeout to token exchange (60 seconds should be enough even with slow connections)
      const timeoutMs = 60000; // 60 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log('[GoogleAuthService] Starting token exchange with 60s timeout...');
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('[GoogleAuthService] Token exchange request completed');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const data = await response.json();
      const idToken = data.id_token;

      if (!idToken) {
        throw new Error('No ID token in token exchange response');
      }

      return idToken;
    } catch (error: any) {
      console.error('[GoogleAuthService] Token exchange error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Token exchange timed out. Please try again.');
      }
      
      throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
  }

  /**
   * Generate a random string for PKCE code verifier
   */
  private generateRandomString(length: number = 128): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Convert base64 to base64url (PKCE requires base64url encoding)
   */
  private base64ToBase64Url(base64: string): string {
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Sign in with Google using authorization code flow with PKCE
   * @returns Google ID Token
   */
  async signIn(): Promise<string> {
    try {
      console.log('[GoogleAuthService] signIn called');
      const discovery = await this.getDiscovery();

      // Create redirect URI first to determine if we're in Expo Go
      // In Expo Go, this will be exp://...; in native builds, it will use the custom scheme
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'com.prod.thanafit',
      });
      console.log(`[GoogleAuthService] Redirect URI: ${redirectUri}`);
      
      // Get appropriate Client ID based on redirect URI (Expo Go vs native)
      const clientId = this.getClientId(redirectUri);
      const clientIdType = redirectUri.startsWith('exp://') ? 'Web (Expo Go)' : Platform.OS === 'ios' ? 'iOS' : 'Android';
      console.log(`[GoogleAuthService] Platform: ${Platform.OS}, Using Client ID type: ${clientIdType}`);

      // Use authorization code flow with PKCE
      // expo-auth-session automatically handles PKCE when using ResponseType.Code
      // Do NOT manually set codeChallenge - let AuthRequest handle it
      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code, // PKCE is automatic with ResponseType.Code
        redirectUri: redirectUri,
        extraParams: {},
      });
      
      console.log('[GoogleAuthService] Auth request created with PKCE, prompting user...');

      // Perform authentication
      // Note: This can take a while if user is completing QR code/Passkey flow on their phone
      // We let this run without timeout since it's user interaction time
      const result = await request.promptAsync(discovery, {
        showInRecents: true,
      });
      console.log(`[GoogleAuthService] Auth result type: ${result.type}`);

      if (result.type === 'success') {
        // Extract authorization code from response
        const code = result.params.code;
        
        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        console.log('[GoogleAuthService] Authorization code received, exchanging for tokens...');

        // Get code verifier from AuthRequest (it's automatically generated)
        const codeVerifier = request.codeVerifier;
        if (!codeVerifier) {
          throw new Error('Code verifier not available from AuthRequest. PKCE may not be properly configured.');
        }
        console.log('[GoogleAuthService] Retrieved code verifier from AuthRequest (first 20 chars):', codeVerifier.substring(0, 20));

        console.log('[GoogleAuthService] Exchanging authorization code for ID token...');
        const idToken = await this.exchangeCodeForTokens(code, codeVerifier, redirectUri);
        console.log('[GoogleAuthService] ID token obtained successfully');

        return idToken;
      } else if (result.type === 'error') {
        const errorCode = result.error?.code;
        const errorMessage = result.error?.message || 'Unknown error';
        
        // Handle specific Google OAuth errors
        if (errorCode === 'access_denied' || errorMessage.includes('access_denied')) {
          throw new Error('Google Sign-In was cancelled or denied. Please try again.');
        } else if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
          throw new Error('Pop-up was blocked. Please allow pop-ups for Google Sign-In and try again.');
        } else {
          throw new Error(`Google Sign-In error: ${errorMessage}`);
        }
      } else if (result.type === 'dismiss') {
        // User dismissed the authentication modal (e.g., closed the QR code/passkey screen)
        throw new Error('Google Sign-In was cancelled. If you see a QR code screen, please complete the verification or try again.');
      } else {
        // This includes 'cancel' type
        throw new Error('Google Sign-In was cancelled. If you see a QR code or Passkey screen, please complete the verification to continue.');
      }
    } catch (error: any) {
      console.error('[GoogleAuthService] Google Sign-In error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }

  /**
   * Check if Google Sign-In is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const clientId = this.getClientId();
      return !!clientId;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let googleAuthServiceInstance: GoogleAuthService | null = null;

/**
 * Get or create Google Auth Service instance
 */
export function getGoogleAuthService(): GoogleAuthService {
  if (!googleAuthServiceInstance) {
    googleAuthServiceInstance = new GoogleAuthService({
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }
  return googleAuthServiceInstance;
}

