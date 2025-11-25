# Build Android APK - Quick Guide

## Prerequisites

1. **Create Expo Account**
   - Go to: https://expo.dev/signup
   - Sign up with email or GitHub

2. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

3. **Login to Expo**
   ```bash
   eas login
   ```

## Before Building

### 1. Update Production API URL

Edit `src/config/api.js` and change:
```javascript
const PRODUCTION_URL = 'https://your-domain.com/api/v1';
```

Replace `your-domain.com` with your actual backend server URL.

### 2. Update App Icon (Optional)

Replace these files with your custom icon:
- `assets/icon.png` (1024x1024)
- `assets/adaptive-icon.png` (1024x1024)
- `assets/splash-icon.png` (1024x1024)

## Build Commands

### Option 1: Preview APK (For Testing)

```bash
cd mobile
eas build --platform android --profile preview
```

**What this does:**
- Builds an APK for testing
- Can be installed on any Android device
- Includes all permissions
- Takes 10-20 minutes

### Option 2: Production APK

```bash
cd mobile
eas build --platform android --profile production
```

**What this does:**
- Builds production-ready APK
- Optimized and minified
- Ready for distribution

### Option 3: Local Build (If you have Android Studio)

```bash
cd mobile
eas build --platform android --profile preview --local
```

## During Build

You'll be asked:
1. **Generate a new Android Keystore?** → Yes (first time)
2. **Project slug**: camping-gear-tracker (auto-filled)

The build will:
1. Upload your code to Expo servers
2. Build the APK in the cloud
3. Show progress in terminal
4. Provide download link when complete

## After Build

### Download APK

1. **From Terminal**: Click the download link shown
2. **From Website**: Go to https://expo.dev/accounts/[your-account]/projects/camping-gear-tracker/builds
3. **Download the APK file**

### Install on Android Device

**Method 1: Direct Install**
1. Transfer APK to your Android device
2. Open the APK file
3. Tap "Install"
4. If blocked, enable "Install from Unknown Sources" in Settings

**Method 2: ADB Install**
```bash
adb install camping-gear-tracker.apk
```

## Testing Checklist

After installing APK:
- [ ] App opens without crashes
- [ ] Login with super admin PIN works
- [ ] Can scan QR codes
- [ ] Can add items with photos
- [ ] Can view item details with images
- [ ] Can create users (admin only)
- [ ] Can export PDF
- [ ] All permissions granted (camera, storage)

## Troubleshooting

### Build Failed

**Error: "Android package not configured"**
- Make sure `android.package` is set in `app.json`

**Error: "Invalid credentials"**
- Run `eas login` again
- Check your Expo account

**Error: "Build timeout"**
- Try again - sometimes Expo servers are busy
- Use `--local` flag to build on your machine

### APK Won't Install

**"App not installed"**
- Enable "Install from Unknown Sources"
- Check Android version (requires 5.0+)
- Clear space on device

**"Parse error"**
- APK file is corrupted
- Download again
- Try different transfer method

### App Crashes

**"Cannot connect to server"**
- Check API URL in `src/config/api.js`
- Ensure backend is deployed and accessible
- Test backend URL in browser

**"Permission denied"**
- Grant camera and storage permissions in Settings
- Reinstall app if permissions are stuck

## Update App Version

When releasing updates:

1. **Update version in app.json**:
   ```json
   "version": "1.1.0",
   "android": {
     "versionCode": 2
   }
   ```

2. **Rebuild**:
   ```bash
   eas build --platform android --profile production
   ```

3. **Distribute new APK**

## Distribution

### For Internal Use
- Share APK file directly
- Use Google Drive, Dropbox, etc.
- Send via email or messaging apps

### For Public Release
- Upload to Google Play Store
- Requires Google Play Developer account ($25 one-time fee)
- Follow Play Store guidelines

## Build Sizes

- **Preview APK**: ~50-70 MB
- **Production APK**: ~40-60 MB (optimized)

## Cost

- **EAS Build**: Free tier includes 30 builds/month
- **Paid plans**: $29/month for unlimited builds

## Quick Commands Reference

```bash
# Login
eas login

# Build preview APK
eas build -p android --profile preview

# Build production APK
eas build -p android --profile production

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

