# Camping Gear Tracker - Mobile App

React Native (Expo) mobile application for tracking camping equipment using QR codes.

## Features

- 📷 **QR Code Scanner** - Scan QR codes to view or register items
- 📝 **Item Management** - Create, view, update, and delete items
- 🖼️ **Photo Upload** - Take photos or choose from gallery
- 📋 **Item List** - Browse all items with search functionality
- 🏷️ **Categories** - Organize items by categories

## Prerequisites

- Node.js 18+
- Expo CLI
- Android Studio (for Android development)
- Physical Android device or emulator

## Installation

```bash
cd mobile
npm install
```

## Configuration

Update the API base URL in `src/config/api.js`:

- **For Android Emulator**: `http://10.0.2.2:3000/api/v1`
- **For Physical Device**: `http://YOUR_COMPUTER_IP:3000/api/v1`
- **For iOS Simulator**: `http://localhost:3000/api/v1`

## Running the App

### Development Mode

```bash
# Start Expo dev server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web
```

### Using Expo Go

1. Install Expo Go app on your Android device
2. Run `npm start`
3. Scan the QR code with Expo Go

## Project Structure

```
mobile/
├── src/
│   ├── config/          # API configuration
│   ├── navigation/      # Navigation setup
│   ├── screens/         # App screens
│   │   ├── HomeScreen.js
│   │   ├── ScannerScreen.js
│   │   ├── ItemDetailScreen.js
│   │   ├── AddItemScreen.js
│   │   └── ItemListScreen.js
│   └── services/        # API services
│       ├── api.js
│       ├── itemService.js
│       └── categoryService.js
├── App.js               # Entry point
└── app.json             # Expo configuration
```

## Screens

### Home Screen
- Main landing page
- Quick access to scanner and item list

### Scanner Screen
- QR code scanner using device camera
- Automatically fetches item details or prompts to create new item

### Item Detail Screen
- View item information
- Display images and categories
- Edit or delete item

### Add/Edit Item Screen
- Create new items or edit existing ones
- Upload photos from camera or gallery
- Add descriptions and metadata

### Item List Screen
- Browse all items
- Search functionality
- Pagination support

## Permissions

The app requires the following permissions:
- **Camera** - For QR code scanning and taking photos
- **Photo Library** - For selecting images from gallery

## API Integration

The app connects to the backend API running at `http://localhost:3000/api/v1`

Endpoints used:
- `GET /items/:qr_code_id` - Get item by QR code
- `GET /items` - List all items
- `POST /items` - Create new item
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item
- `POST /items/:id/images` - Upload images

## Troubleshooting

### Cannot connect to API
- Ensure backend server is running
- Check API base URL in `src/config/api.js`
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's IP address

### Camera not working
- Grant camera permissions in device settings
- Ensure app has camera permission in `app.json`

### Images not uploading
- Check file size (max 5MB per image)
- Verify backend is configured to accept multipart/form-data

## Building for Production

### Android APK

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **Axios** - HTTP client
- **Expo Camera** - Camera and barcode scanning
- **Expo Image Picker** - Image selection

## Next Steps

- [ ] Add offline mode with local storage
- [ ] Implement category management
- [ ] Add item statistics and reports
- [ ] Enable item sharing
- [ ] Add dark mode support
