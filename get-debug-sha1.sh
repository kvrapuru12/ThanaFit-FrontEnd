#!/bin/bash

# Script to get DEBUG SHA-1 fingerprint for Android Studio Emulator

echo "🔍 Getting DEBUG SHA-1 Fingerprint for Android Emulator..."
echo ""

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "❌ Error: keytool not found!"
    echo "   Make sure Java JDK is installed and in your PATH"
    exit 1
fi

# Default debug keystore location
DEBUG_KEYSTORE="$HOME/.android/debug.keystore"

if [ ! -f "$DEBUG_KEYSTORE" ]; then
    echo "❌ Error: Debug keystore not found at $DEBUG_KEYSTORE"
    echo ""
    echo "The debug keystore will be created automatically when you:"
    echo "  1. Run the app in Android Studio emulator for the first time"
    echo "  2. OR run: keytool -genkey -v -keystore $DEBUG_KEYSTORE -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000"
    exit 1
fi

echo "📋 Debug Keystore Location: $DEBUG_KEYSTORE"
echo ""

# Get SHA-1
echo "SHA-1 Fingerprint:"
echo "-------------------"
keytool -list -v -keystore "$DEBUG_KEYSTORE" -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep -A 1 "SHA1:" | head -2

echo ""
echo "✅ Copy the SHA-1 value above (format: XX:XX:XX:XX:...)"

echo ""
echo "📝 Next Steps:"
echo "1. Copy the SHA-1 fingerprint above"
echo "2. Go to: https://console.cloud.google.com/apis/credentials"
echo "3. Find your Android OAuth Client ID: 383964637006-pp6ooio84sr55aro70j1srpjt5909ibh"
echo "4. Click Edit"
echo "5. Update SHA-1 certificate fingerprint with the DEBUG SHA-1 above"
echo "6. Ensure Package name is: com.prod.thanafit"
echo "7. Save"


