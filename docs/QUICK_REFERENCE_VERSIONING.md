# Quick Reference: Version Management

## TL;DR - How to Release

```bash
# Most common: Bug fix release (3.0.0 → 3.0.1, versionCode 25 → 26)
npm run build:prod

# New feature release (3.0.1 → 3.1.0, versionCode 26 → 27)
npm run build:prod:minor

# Major update (3.1.0 → 4.0.0, versionCode 27 → 28)
npm run build:prod:major

# What happens automatically:
# 1. Bumps semantic version in app.json
# 2. Auto-increments versionCode in app.json
# 3. Commits both changes to git
# 4. Pushes to GitHub
# 5. Triggers EAS build with new versions
```

## What Each Command Does

| Command | Bump Type | Example | Use Case |
|---------|-----------|---------|----------|
| `npm run build:prod` | Patch | 1.0.1 → 1.0.2 | Bug fixes, small tweaks |
| `npm run build:prod:minor` | Minor | 1.0.2 → 1.1.0 | New features |
| `npm run build:prod:major` | Major | 1.1.0 → 2.0.0 | Breaking changes, redesigns |
| `npm run submit:prod` | - | - | Upload to Play Store |
| `npm run release` | Patch | 1.0.1 → 1.0.2 | Build + submit |

## Complete Workflow

### 1. Make Your Changes
```bash
# Code your features/fixes
# Test locally
```

### 2. Build Production AAB
```bash
# Choose based on your changes:
npm run build:prod        # Bug fixes (most common)
npm run build:prod:minor  # New features
npm run build:prod:major  # Major updates
```

**What happens automatically:**
1. ✅ Bumps semantic version in `app.json` (e.g., 3.0.0 → 4.0.0)
2. ✅ Auto-increments versionCode in `app.json` (e.g., 25 → 26)
3. ✅ Commits both changes to git
4. ✅ Pushes to GitHub
5. ✅ Triggers EAS build (~10-15 min)
6. ✅ Build uses the updated versions

**Note:** Version bumping happens locally BEFORE the build starts, not during the build.

### 3. Download & Submit to Play Store

### 4. Download AAB and Upload to Play Store
**Option A: Download from EAS**
1. Go to build page on Expo dashboard
2. Download the `.aab` file
3. Upload manually to Play Console

**Option B: Automated Submit (requires setup)**
```bash
npm run submit:prod
```
Requires `google-service-account.json` in project root.

### 5. Verify in Play Console
- Check version shows up in Play Console
- Promote to beta/production when ready

## Version Examples

**Current State:** `3.0.0` (versionCode: 25)

```bash
npm run build:prod        # → 3.0.1 (26) - Bug fixes
npm run build:prod        # → 3.0.2 (27) - More fixes
npm run build:prod:minor  # → 3.1.0 (28) - New feature!
npm run build:prod        # → 3.1.1 (29) - Fix in new feature
npm run build:prod:major  # → 4.0.0 (30) - Major redesign!
```

**Both semantic version AND versionCode increment automatically with each build.**

## Files Modified by System

| File | What Changes | When |
|------|--------------|------|
| `app.json` | `expo.version` | Locally before build (by script) |
| `app.json` | `expo.android.versionCode` | Locally before build (auto-increment) |
| `android/app/build.gradle` | `versionCode`, `versionName` | EAS syncs during build |

**All version changes are committed to git automatically before the build starts.**

## Troubleshooting

**Q: Build failed with script error**
```bash
# Test script locally
node scripts/bump-version.js
```

**Q: Wrong version bump**
```bash
# Manually edit app.json to correct version
# Next build will increment from there
```

**Q: Need to skip version bump**
```bash
# Use direct EAS command without prebuild
npx eas build --platform android --no-prebuild
# Then manually specify version
```

## Advanced: Manual Version Override

If you need a specific version:

1. Edit `app.json`:
```json
{
  "expo": {
    "version": "2.0.0"  // Set your desired version
  }
}
```

2. Commit:
```bash
git add app.json
git commit -m "chore: set version to 2.0.0"
```

3. Build (will increment from this base):
```bash
npm run build:prod  # Will bump to 2.0.1
```

## Important Notes

- ✅ Always commit `app.json` after builds
- ✅ versionCode managed by EAS (don't edit manually)
- ✅ Script runs automatically during production builds
- ✅ Preview builds don't bump version (no prebuild command)
- ✅ One command does it all - no manual editing!

## Need More Details?

See: `docs/VERSION_MANAGEMENT.md` for complete documentation
