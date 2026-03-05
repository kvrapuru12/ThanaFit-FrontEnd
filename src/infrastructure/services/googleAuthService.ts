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
   * Get the appropriate client ID based on platform.
   * Web: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (register redirect URI in Google Cloud Console).
   * Native: iOS/Android client IDs with custom scheme.
   */
  private getClientId(redirectUri?: string): string {
    if (Platform.OS === 'web') {
      const clientId = this.config.webClientId;
      if (!clientId) {
        throw new Error(
          'Google Web Client ID not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env and add your site redirect URI in Google Cloud Console.'
        );
      }
      console.log('[GoogleAuthService] Using Web Client ID');
      return clientId;
    }
    const clientId = Platform.OS === 'ios'
      ? this.config.iosClientId
      : this.config.androidClientId;
    if (!clientId) {
      throw new Error(
        `Google Client ID not configured for ${Platform.OS}. ` +
        `Please set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env.`
      );
    }
    console.log(`[GoogleAuthService] Using ${Platform.OS} Client ID for native build`);
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
    // Use platform-specific Client ID (iOS/Android for native builds)
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

      const isExpoGo = Constants.appOwnership === 'expo';
      // Google OAuth does NOT work in Expo Go on native (web is fine with Web Client ID)
      if (Platform.OS !== 'web' && isExpoGo) {
        throw new Error(
          'Google Sign-In is not supported in Expo Go.\n\n' +
          'Google Cloud Console only accepts HTTP/HTTPS redirect URIs for Web OAuth Client IDs,\n' +
          'but Expo Go uses exp:// scheme which cannot be registered.\n\n' +
          '✅ Solution: Use a development build instead:\n' +
          '   • Android: npx expo run:android\n' +
          '   • iOS: npx expo run:ios\n\n' +
          'Development builds use native Client IDs (iOS/Android) which support custom URL schemes\n' +
          'and work perfectly with Google Sign-In.'
        );
      }

      // Web: current origin (e.g. https://thanafit.com). Native: custom scheme.
      const redirectUri = Platform.OS === 'web'
        ? AuthSession.makeRedirectUri()
        : AuthSession.makeRedirectUri({ scheme: 'com.prod.thanafit' });
      console.log(`[GoogleAuthService] Platform: ${Platform.OS}, redirect URI: ${redirectUri}`);

      const clientId = this.getClientId(redirectUri);
      const clientIdType = Platform.OS === 'web' ? 'Web' : Platform.OS === 'ios' ? 'iOS' : 'Android';
      console.log(`[GoogleAuthService] Using Client ID type: ${clientIdType}`);
      console.log(`[GoogleAuthService] Client ID (first 30 chars): ${clientId.substring(0, 30)}...`);
      
      // Android-specific diagnostic information
      if (Platform.OS === 'android') {
        console.log(`[GoogleAuthService] ⚠️ ANDROID DIAGNOSTICS:`);
        console.log(`[GoogleAuthService]   1. Verify Android Client ID in Google Cloud Console:`);
        console.log(`[GoogleAuthService]      - Package name: com.prod.thanafit (must match exactly)`);
        console.log(`[GoogleAuthService]      - SHA-1 fingerprint: Must match your debug/release keystore`);
        console.log(`[GoogleAuthService]   2. Redirect URI: ${redirectUri}`);
        console.log(`[GoogleAuthService]      - Android Client IDs auto-validate redirect URIs with matching scheme`);
        console.log(`[GoogleAuthService]      - No need to register redirect URI in Google Cloud Console`);
        console.log(`[GoogleAuthService]   3. Get debug SHA-1: keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA1`);
      }

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
      console.log(`[GoogleAuthService] Expected redirect URI: ${redirectUri}`);
      console.log(`[GoogleAuthService] Client ID: ${clientId.substring(0, 20)}...`);

      // Perform authentication
      // Note: This can take a while if user is completing QR code/Passkey flow on their phone
      // We let this run without timeout since it's user interaction time
      console.log('[GoogleAuthService] Calling promptAsync...');
      const result = await request.promptAsync(discovery, {
        showInRecents: true,
      });
      console.log(`[GoogleAuthService] promptAsync completed`);
      console.log(`[GoogleAuthService] Auth result type: ${result.type}`);
      console.log(`[GoogleAuthService] Auth result:`, JSON.stringify(result, null, 2));

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
        
        console.log(`[GoogleAuthService] Error details - Code: ${errorCode}, Message: ${errorMessage}`);
        console.log(`[GoogleAuthService] Full error object:`, JSON.stringify(result.error, null, 2));
        
        // Handle specific Google OAuth errors
        if (errorCode === 'access_denied' || errorMessage.includes('access_denied')) {
          throw new Error('Google Sign-In was cancelled or denied. Please try again.');
        } else if (errorMessage.includes('popup') || errorMessage.includes('blocked')) {
          throw new Error('Pop-up was blocked. Please allow pop-ups for Google Sign-In and try again.');
        } else if (errorMessage.includes('redirect_uri_mismatch') || errorCode === 'redirect_uri_mismatch') {
          const platformSpecificHelp = Platform.OS === 'android' 
            ? '\n\n🔧 Android Fix:\n' +
              '1. Go to Google Cloud Console → Credentials → Android Client ID\n' +
              '2. Verify Package name: com.prod.thanafit (must match exactly)\n' +
              '3. Verify SHA-1 fingerprint matches your keystore\n' +
              '4. Android Client IDs auto-validate redirect URIs - no need to register them\n' +
              '5. Redirect URI scheme must match package name (com.prod.thanafit://)\n' +
              '6. Current redirect URI: ' + redirectUri
            : '\n\n🔧 iOS Fix:\n' +
              '1. Go to Google Cloud Console → Credentials → iOS Client ID\n' +
              '2. Verify Bundle ID: com.prod.thanafit\n' +
              '3. Add redirect URI: ' + redirectUri;
          throw new Error(`Redirect URI mismatch. The redirect URI "${redirectUri}" may not be valid.${platformSpecificHelp}`);
        } else {
          throw new Error(`Google Sign-In error: ${errorMessage} (Code: ${errorCode || 'unknown'})`);
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

