# Quick Reference: Version Management

## TL;DR - How to Release

```bash
# Most common: Bug fix release
npm run build:prod

# New feature release
npm run build:prod:minor

# Major update
npm run build:prod:major

# Submit to Play Store after build completes
npm run submit:prod

# Or do both at once
npm run release
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

**What happens:**
- ✅ Version auto-increments in `app.json`
- ✅ EAS builds AAB (~10-15 min)
- ✅ versionCode auto-increments

### 3. Commit Version Change
```bash
git add app.json
git commit -m "chore: bump version to 1.0.X"
git push
```

### 4. Submit to Play Store
```bash
npm run submit:prod
```

**What happens:**
- ✅ Uploads to Play Store internal track
- ✅ Uses service account authentication

### 5. Verify in Play Console
- Check version shows up
- Promote to beta/production when ready

## Version Examples

Starting: `1.0.1` (versionCode: 3)

```bash
npm run build:prod        # → 1.0.2 (4) - Bug fixes
npm run build:prod        # → 1.0.3 (5) - More fixes
npm run build:prod:minor  # → 1.1.0 (6) - New feature!
npm run build:prod        # → 1.1.1 (7) - Fix in new feature
npm run build:prod:major  # → 2.0.0 (8) - Major redesign!
```

## Files Modified by System

| File | What Changes | When |
|------|--------------|------|
| `app.json` | `expo.version` | During build (by script) |
| `app.json` | `expo.android.versionCode` | Tracked by EAS (remote) |

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
