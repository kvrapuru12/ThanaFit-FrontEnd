const fs = require('fs');
const path = require('path');

// Get version bump type from environment variable
const bumpType = process.env.VERSION_BUMP || 'patch';

// Read app.json
const appJsonPath = path.join(__dirname, '../app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Get current version
const currentVersion = appJson.expo.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Get current versionCode
const currentVersionCode = appJson.expo.android?.versionCode || 1;
const newVersionCode = currentVersionCode + 1;

// Calculate new version based on bump type
let newVersion;
switch(bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    console.log(`🚀 MAJOR version bump: ${currentVersion} → ${newVersion}`);
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    console.log(`✨ MINOR version bump: ${currentVersion} → ${newVersion}`);
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    console.log(`🔧 PATCH version bump: ${currentVersion} → ${newVersion}`);
    break;
}

// Update version and versionCode in app.json
appJson.expo.version = newVersion;
if (!appJson.expo.android) {
  appJson.expo.android = {};
}
appJson.expo.android.versionCode = newVersionCode;

// Write back to app.json
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`✅ Updated app.json version to ${newVersion}`);
console.log(`✅ Updated versionCode: ${currentVersionCode} → ${newVersionCode}`);
console.log(`📦 Build will use: Version ${newVersion} (versionCode ${newVersionCode})`);
