# Mobile App Development Guide

## Overview

The Camping Gear Tracker mobile app is built with React Native using Expo for rapid development and easy deployment.

## Getting Started

### 1. Navigate to Mobile Directory
```bash
cd mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure API Connection

Edit `mobile/src/config/api.js` and update the base URL:

**For Android Emulator:**
```javascript
const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';
```

**For Physical Device:**
```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api/v1';
// Example: http://192.168.1.100:3000/api/v1
```

**For iOS Simulator:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api/v1';
```

### 4. Start Development Server
```bash
npm start
```

### 5. Run on Device

**Option A: Using Expo Go (Recommended for testing)**
1. Install Expo Go app from Play Store
2. Scan QR code from terminal
3. App will load on your device

**Option B: Using Android Emulator**
```bash
npm run android
```

## App Architecture

### Navigation Flow

```
Home Screen
├── Scanner Screen → Item Detail Screen
│                 └── Add Item Screen
└── Item List Screen → Item Detail Screen
                    └── Edit Item Screen
```

### Key Features

#### 1. QR Code Scanning
- Uses device camera to scan QR codes
- Automatically checks if item exists
- Redirects to detail or add screen

#### 2. Item Management
- Create new items with photos
- View item details with images
- Edit existing items
- Delete items with confirmation

#### 3. Photo Handling
- Take photos with camera
- Select from gallery
- Multiple image upload
- Image optimization before upload

#### 4. Search & Browse
- List all items with pagination
- Real-time search
- Category filtering

## API Integration

### Services Structure

```
services/
├── api.js              # Axios instance with interceptors
├── itemService.js      # Item CRUD operations
└── categoryService.js  # Category operations
```

### Example API Call

```javascript
import itemService from '../services/itemService';

// Get item by QR code
const result = await itemService.getItemByQrCode('CG-TENT-001');

// Create new item
const newItem = await itemService.createItem({
  qr_code_id: 'CG-TENT-001',
  name: 'Camping Tent',
  description: '4-person tent'
});

// Upload images
await itemService.uploadImages(newItem.id, images);
```

## Screens Breakdown

### HomeScreen.js
- Landing page with navigation buttons
- Quick access to scanner and item list

### ScannerScreen.js
- Camera view with QR code detection
- Permission handling
- Automatic navigation based on scan result

### ItemDetailScreen.js
- Display item information
- Show images in horizontal scroll
- Edit and delete actions

### AddItemScreen.js
- Form for creating/editing items
- Image picker integration
- Validation and error handling

### ItemListScreen.js
- FlatList with pagination
- Search functionality
- Pull to refresh

## Styling Guidelines

### Color Palette
- Primary: `#2e7d32` (Green)
- Secondary: `#558b2f` (Light Green)
- Background: `#f5f5f5` (Light Gray)
- Text: `#333` (Dark Gray)
- Error: `#d32f2f` (Red)

### Common Styles
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Testing

### Test on Android Emulator
1. Start Android Studio
2. Launch emulator
3. Run `npm run android`

### Test on Physical Device
1. Enable USB debugging on device
2. Connect via USB
3. Run `npm run android`

### Test with Expo Go
1. Install Expo Go
2. Run `npm start`
3. Scan QR code

## Common Issues & Solutions

### Issue: Cannot connect to API
**Solution:**
- Check backend is running: `curl http://localhost:3000/health`
- Update API URL in `src/config/api.js`
- For Android emulator, use `10.0.2.2` instead of `localhost`

### Issue: Camera permission denied
**Solution:**
- Grant camera permission in device settings
- Restart app after granting permission

### Issue: Images not uploading
**Solution:**
- Check image size (max 5MB)
- Verify backend accepts multipart/form-data
- Check network connectivity

### Issue: App crashes on scan
**Solution:**
- Ensure camera permissions are granted
- Check API endpoint is accessible
- Review error logs: `npx expo start --dev-client`

## Building for Production

### Android APK (for testing)
```bash
eas build --platform android --profile preview
```

### Android AAB (for Play Store)
```bash
eas build --platform android --profile production
```

## Performance Optimization

1. **Image Optimization**
   - Compress images before upload
   - Use appropriate image sizes
   - Implement lazy loading

2. **List Performance**
   - Use FlatList with pagination
   - Implement pull-to-refresh
   - Cache API responses

3. **Navigation**
   - Use React Navigation best practices
   - Avoid unnecessary re-renders
   - Implement proper screen transitions

## Next Steps

- [ ] Add offline mode with AsyncStorage
- [ ] Implement push notifications
- [ ] Add biometric authentication
- [ ] Enable item sharing via QR code
- [ ] Add export functionality (PDF/CSV)
- [ ] Implement dark mode
- [ ] Add multi-language support

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)


## Trip Management Features (New)

The mobile app now includes comprehensive trip management functionality:

### Features

1. **Trip List**
   - View all trips with status badges (open/closed)
   - See trip statistics (total items, returned, pending, lost)
   - Quick navigation to trip details
   - Admin can create new trips

2. **Create Trip** (Admin Only)
   - Enter trip name, location, dates, and notes
   - Dates in YYYY-MM-DD format
   - Trip starts with "open" status

3. **Trip Details**
   - View complete trip information
   - See statistics with progress bar
   - List all items in the trip
   - Add items to trip (scan QR or enter ID)
   - Mark items as returned/lost/not_found
   - Close trip (admin only)
   - Delete trip (admin only)

4. **Add Items to Trip**
   - Scan QR code to add item
   - Or manually enter item ID
   - Add notes about item condition
   - Items start with "taken" status

### Trip Workflow

```
1. Create Trip (admin) → Status: "open"
2. Add Items → Status: "taken"
3. During/After Trip:
   - Mark items as "returned" (any user)
   - Mark items as "lost" (admin only)
   - Mark items as "not_found" (admin only)
4. Close Trip (admin) → Status: "closed"
```

### Status Colors

- **Open Trip**: Green
- **Closed Trip**: Gray
- **Taken Item**: Orange
- **Returned Item**: Green
- **Lost Item**: Red
- **Not Found Item**: Gray

### Navigation

From Home Screen:
- Tap "🏕️ Manage Trips" to view all trips
- Admins see "➕ Create New Trip" button
- Tap any trip to view details
- From trip details, tap "➕ Add Item" to add items

### Permissions

- **All Users**: View trips, add items, mark items as returned
- **Admin Only**: Create trips, close trips, delete trips, mark items as lost/not_found
