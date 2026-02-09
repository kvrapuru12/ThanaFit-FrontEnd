# Version Management - ThanaFit

## Overview

ThanaFit uses automatic version management for production releases. Version numbers follow semantic versioning (SemVer) and are automatically incremented during EAS builds.

## Version Components

### 1. Semantic Version (User-Facing)
**Format:** `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

- **MAJOR** (1.x.x): Breaking changes, major redesigns
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes, small improvements

**Location:** `app.json` → `expo.version`

### 2. Version Code (Android Build Number)
**Format:** Integer (e.g., `3`, `4`, `5`)

- Must increase with each Play Store release
- Managed automatically by EAS (stored remotely)
- Used by Play Store to determine which version is newer

**Location:** `app.json` → `expo.android.versionCode` (tracked by EAS remotely)

## How It Works

### Automatic Version Bumping

When you run a production build:

```bash
npm run build:prod
```

**What happens:**
1. `scripts/bump-version.js` runs (pre-build)
2. Reads current version from `app.json`
3. Increments version based on bump type
4. Updates `app.json` with new version
5. EAS reads updated version
6. EAS auto-increments versionCode
7. Builds AAB with new version

### Version Bump Types

#### Patch (Default)
```bash
npm run build:prod
# or
npx eas build --platform android --profile production
```
**Use for:** Bug fixes, minor tweaks, small improvements
**Example:** `1.0.1` → `1.0.2`

#### Minor
```bash
npm run build:prod:minor
# or
VERSION_BUMP=minor npx eas build --platform android --profile production
```
**Use for:** New features, significant updates
**Example:** `1.0.2` → `1.1.0`

#### Major
```bash
npm run build:prod:major
# or
VERSION_BUMP=major npx eas build --platform android --profile production
```
**Use for:** Breaking changes, complete redesigns, major milestones
**Example:** `1.1.0` → `2.0.0`

## File Structure

```
ThanaFit-FrontEnd/
├── app.json                    # Contains expo.version (auto-updated)
├── package.json                # Contains npm version (manual)
├── eas.json                    # Build configuration with prebuildCommand
├── scripts/
│   └── bump-version.js         # Version bumping script
└── docs/
    └── VERSION_MANAGEMENT.md   # This file
```

## Configuration Files

### app.json
```json
{
  "expo": {
    "version": "1.0.1",          // ← Auto-updated by script
    "android": {
      "versionCode": 3            // ← Auto-updated by EAS
    }
  }
}
```

### eas.json
```json
{
  "build": {
    "production": {
      "prebuildCommand": "node scripts/bump-version.js",  // ← Runs before build
      "android": {
        "autoIncrement": "versionCode",                   // ← EAS manages versionCode
        "buildType": "app-bundle"                         // ← Builds AAB
      }
    }
  }
}
```

## Git Workflow

### After Building

The `app.json` file will be modified locally with the new version:

```bash
# Check what changed
git diff app.json

# Commit the version bump
git add app.json
git commit -m "chore: bump version to 1.0.2"
git push
```

### Recommended Workflow

```bash
# 1. Build production AAB (version auto-bumps)
npm run build:prod

# 2. Wait for build to complete (~10-15 min)

# 3. Commit version change
git add app.json
git commit -m "chore: bump version to 1.0.2"

# 4. Submit to Play Store
npm run submit:prod

# 5. Push to git
git push
```

## Version History

To see version history in your codebase:

```bash
# See all version changes
git log --oneline --all --grep="bump version"

# See specific version
git show HEAD:app.json | grep version
```

## Best Practices

### 1. Choose the Right Bump Type
- **Patch**: Daily/weekly releases with bug fixes
- **Minor**: Monthly/quarterly releases with new features
- **Major**: Yearly releases or major redesigns

### 2. Consistent Release Cadence
```
Sprint 1: Bug fixes      → npm run build:prod (1.0.2)
Sprint 2: Bug fixes      → npm run build:prod (1.0.3)
Sprint 3: New feature    → npm run build:prod:minor (1.1.0)
Sprint 4: Bug fixes      → npm run build:prod (1.1.1)
Quarter 2: Major update  → npm run build:prod:major (2.0.0)
```

### 3. Always Commit Version Changes
After each build, commit the updated `app.json`:
```bash
git add app.json
git commit -m "chore: bump version to X.X.X"
```

### 4. Tag Releases (Optional)
```bash
git tag v1.0.2
git push --tags
```

## Troubleshooting

### Version Not Incrementing
**Problem:** Version stays the same after build

**Solution:**
- Check `eas.json` has `prebuildCommand`
- Verify `scripts/bump-version.js` exists
- Check EAS build logs for script errors

### Version Mismatch
**Problem:** `app.json` shows different version than Play Store

**Solution:**
- The script updates `app.json` locally
- Make sure to commit the changes
- EAS manages `versionCode` remotely

### Build Fails with Script Error
**Problem:** Build fails during prebuild command

**Solution:**
```bash
# Test script locally
node scripts/bump-version.js

# Check for syntax errors
cat scripts/bump-version.js
```

### Wrong Version Bump
**Problem:** Accidentally used wrong bump type

**Solution:**
- Manually edit `app.json` to correct version before next build
- Or: Run another build with correct bump type

## Manual Override

If you need to manually set a specific version:

1. Edit `app.json`:
```json
{
  "expo": {
    "version": "1.5.0"  // Set desired version
  }
}
```

2. Commit the change:
```bash
git add app.json
git commit -m "chore: set version to 1.5.0"
```

3. Build (script will increment from this new base):
```bash
npm run build:prod  # Will bump to 1.5.1
```

## Future: iOS Support

When iOS is added, update `scripts/bump-version.js` to also manage:
- `CFBundleShortVersionString` in `Info.plist`
- `CFBundleVersion` (iOS build number)

Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "ios": {
        "autoIncrement": "buildNumber"
      }
    }
  }
}
```

## Summary

✅ **Automatic**: Version bumps happen during build, no manual editing  
✅ **Semantic**: Supports patch/minor/major for clear communication  
✅ **Git-Tracked**: Version changes committed to repository  
✅ **Play Store**: versionCode always increments correctly  
✅ **Flexible**: Can override or adjust as needed  

**For most releases, just run:** `npm run build:prod` 🚀
