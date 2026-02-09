You are a senior engineer helping build and release an Android App Bundle (AAB) to Google Play Store via **Expo EAS**.

## Goal
Build an AAB for production and submit to Google Play Store with automatic version bumping.

## Automatic Versioning
- **Version (semantic)**: Auto-increments via `scripts/bump-version.js` *locally before build*
- **versionCode**: Auto-increments by EAS on each build
- **How it works**: 
  1. Script bumps version in `app.json` locally
  2. Commits and pushes the version change
  3. Triggers EAS build with the new version
- **Note**: EAS skips `prebuildCommand` when native code exists, so version bumping happens locally

## Build Commands

### Option 1: Using NPM Scripts (Recommended)

**Patch Release (Bug Fixes) - Default:**
```bash
npm run build:prod
```
- Bumps version: 1.0.1 → 1.0.2
- Builds AAB for Play Store

**Minor Release (New Features):**
```bash
npm run build:prod:minor
```
- Bumps version: 1.0.2 → 1.1.0
- Builds AAB for Play Store

**Major Release (Breaking Changes):**
```bash
npm run build:prod:major
```
- Bumps version: 1.1.0 → 2.0.0
- Builds AAB for Play Store

**Submit to Play Store:**
```bash
npm run submit:prod
```
- Uploads AAB to Play Store (internal track)

**Full Release (Build + Submit):**
```bash
npm run release
```
- Auto-bumps patch version
- Builds AAB
- Submits to Play Store

### Option 2: Direct EAS Commands

**Patch Release (Default):**
```bash
npx eas build --platform android --profile production
```

**Minor Release:**
```bash
VERSION_BUMP=minor npx eas build --platform android --profile production
```

**Major Release:**
```bash
VERSION_BUMP=major npx eas build --platform android --profile production
```

**Submit:**
```bash
npx eas submit --platform android --profile production
```

## Workflow

1. **Build AAB**: Choose patch/minor/major based on changes
2. **Wait**: Build takes ~10-15 minutes (EAS cloud build)
3. **Submit**: Run submit command to upload to Play Store
4. **Verify**: Check Play Console for new version

## What Happens Automatically

1. **Pre-Build**: `scripts/bump-version.js` runs and updates `app.json` version
2. **Version Increment**: EAS auto-increments `versionCode` (stored remotely)
3. **Build AAB**: EAS builds app-bundle for Play Store
4. **Submit**: Uses `google-service-account.json` to authenticate and upload to internal track

## Version Examples

Starting version: `1.0.1` (versionCode: 3)

```bash
npm run build:prod        # → 1.0.2 (4)
npm run build:prod        # → 1.0.3 (5)
npm run build:prod:minor  # → 1.1.0 (6)
npm run build:prod        # → 1.1.1 (7)
npm run build:prod:major  # → 2.0.0 (8)
```

## Notes
- **AAB vs APK**: Production builds AAB (smaller, optimized). Preview builds APK (testing).
- **Track**: Submits to "internal" track by default (configured in `eas.json`)
- **Service Account**: Requires `google-service-account.json` in project root
- **Local Changes**: `app.json` version updates locally after build (commit this!)

## Troubleshooting

**Script not found error:**
- Ensure `scripts/bump-version.js` exists
- Run `npm install` to ensure Node.js is working

**Version not incrementing:**
- Check `eas.json` has `"prebuildCommand": "node scripts/bump-version.js"`
- Verify `app.json` has valid semantic version format (e.g., "1.0.1")

**Submit fails:**
- Verify `google-service-account.json` exists and has correct permissions
- Check Play Console for version conflicts
