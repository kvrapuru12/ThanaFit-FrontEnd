#!/bin/bash

# Script to automatically detect and update the API base URL IP address in .env file

echo "🔍 Detecting current IP address..."

# Try multiple methods to get the IP address
IP=""

# Method 1: Get IP from en0 interface
IP=$(ifconfig en0 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | grep -E "^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$" | head -1)

# Method 2: If that didn't work, try en1
if [ -z "$IP" ] || [ "$IP" == "192.168.4.255" ]; then
  IP=$(ifconfig en1 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | grep -E "^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$" | head -1)
fi

# Method 3: Try route command
if [ -z "$IP" ] || [ "$IP" == "192.168.4.255" ]; then
  INTERFACE=$(route get default 2>/dev/null | grep interface | awk '{print $2}')
  if [ -n "$INTERFACE" ]; then
    IP=$(ifconfig "$INTERFACE" 2>/dev/null | grep "inet " | awk '{print $2}' | head -1)
  fi
fi

# Validate IP address
if [ -z "$IP" ] || [ "$IP" == "192.168.4.255" ] || ! echo "$IP" | grep -qE "^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$"; then
  echo "❌ Could not automatically detect IP address."
  echo "Please manually check your IP address:"
  echo "  - macOS: System Preferences > Network"
  echo "  - Or run: ifconfig | grep 'inet '"
  echo ""
  read -p "Enter your current IP address: " IP
fi

if [ -z "$IP" ]; then
  echo "❌ No IP address provided. Exiting."
  exit 1
fi

echo "📍 Detected IP address: $IP"

# Update .env file
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env file not found!"
  exit 1
fi

# Check if backend is running on port 8080
echo "🔍 Checking if backend is running on port 8080..."
if ! lsof -ti:8080 > /dev/null 2>&1; then
  echo "⚠️  Warning: Backend doesn't seem to be running on port 8080"
  echo "   Make sure your backend server is started before testing the app"
fi

# Create backup
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "📦 Created backup: ${ENV_FILE}.backup"

# Update the API base URL in .env file
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|EXPO_PUBLIC_API_BASE_URL=http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:8080/api|EXPO_PUBLIC_API_BASE_URL=http://${IP}:8080/api|g" "$ENV_FILE"
else
  # Linux
  sed -i "s|EXPO_PUBLIC_API_BASE_URL=http://[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}:8080/api|EXPO_PUBLIC_API_BASE_URL=http://${IP}:8080/api|g" "$ENV_FILE"
fi

echo "✅ Updated .env file:"
grep "EXPO_PUBLIC_API_BASE_URL" "$ENV_FILE"

echo ""
echo "🔄 IMPORTANT: You need to restart your Expo server for changes to take effect!"
echo "   Run: npm start"
echo ""

