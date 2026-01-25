#!/bin/bash

echo "🔍 Android SHA-1 Verification Script"
echo "======================================"
echo ""

# 1. Local development keystore (used by npx expo run:android)
echo "1️⃣ Local Debug Keystore (android/app/debug.keystore):"
if [ -f android/app/debug.keystore ]; then
    keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep SHA1 | head -1
else
    echo "   ❌ Not found"
fi
echo ""

# 2. Default Android debug keystore
echo "2️⃣ Default Debug Keystore (~/.android/debug.keystore):"
if [ -f ~/.android/debug.keystore ]; then
    keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep SHA1 | head -1
else
    echo "   ❌ Not found"
fi
echo ""

# 3. Client ID in .env
echo "3️⃣ Client ID in .env:"
if [ -f .env ]; then
    grep "ANDROID_CLIENT_ID" .env | sed 's/^/   /'
else
    echo "   ❌ .env file not found"
fi
echo ""

# 4. Client ID in eas.json
echo "4️⃣ Client ID in eas.json:"
if [ -f eas.json ]; then
    grep "ANDROID_CLIENT_ID" eas.json | sed 's/^/   /'
else
    echo "   ❌ eas.json file not found"
fi
echo ""

echo "======================================"
echo "✅ Verification complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Compare SHA-1 values above with Google Cloud Console"
echo "   2. Go to: https://console.cloud.google.com/apis/credentials"
echo "   3. Find Android Client ID: 383964637006-pp6ooio84sr55aro70j1srpjt5909ibh"
echo "   4. Verify SHA-1 matches your keystore"
