# Authentication System Guide

## Overview

The Camping Gear Tracker now includes a complete PIN-based authentication system with user management and PDF export capabilities.

## Features

### 🔐 Authentication
- **4-digit PIN** authentication for all users
- **Super Admin PIN**: 2200 (configurable in `.env`)
- **JWT token-based** authentication
- **Encrypted PIN storage** using bcryptjs
- **Auto-login** with AsyncStorage

### 👥 User Management (Admin Only)
- Create new users with custom PINs
- Activate/deactivate users
- Delete users
- View all users with status

### 📄 PDF Export
- Export complete inventory to PDF
- Includes all items with details, categories, and images
- Share PDF via device sharing options
- Available to all authenticated users

## User Roles

### Super Admin
- **PIN**: 2200 (set in `backend/.env`)
- **Capabilities**:
  - Full access to all features
  - Create/manage users
  - Export PDF
  - All CRUD operations on items

### Regular User
- **PIN**: 4-digit custom PIN (set by admin)
- **Capabilities**:
  - Scan QR codes
  - View items
  - Add/edit/delete items
  - Export PDF
  - Cannot manage users

## Login Flow

### First Time Setup
1. App opens to Login screen
2. Enter Super Admin PIN: **2200**
3. Login as Super Admin
4. Navigate to "Manage Users"
5. Create regular users with custom PINs

### Regular Login
1. App opens to Login screen
2. Tap "Select User" to choose from user list
3. Enter 4-digit PIN
4. Access granted

### Super Admin Login
1. App opens to Login screen
2. Leave "Super Admin" selected (default)
3. Enter PIN: **2200**
4. Full admin access granted

## API Endpoints

### Authentication
```
POST /api/v1/auth/login
Body: { "pin": "2200" } // Super admin
Body: { "pin": "1234", "userId": "user-uuid" } // Regular user
```

### User Management (Admin Only)
```
GET    /api/v1/auth/users           // List all users
POST   /api/v1/auth/users           // Create user
PUT    /api/v1/auth/users/:id       // Update user
DELETE /api/v1/auth/users/:id       // Delete user
```

### Export
```
GET /api/v1/export/pdf               // Export inventory to PDF
```

## Environment Variables

Add to `backend/.env`:
```env
# Authentication Configuration
SUPER_ADMIN_PIN=2200
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Security Features

1. **PIN Hashing**: All PINs are hashed with bcryptjs (10 rounds)
2. **JWT Tokens**: Secure token-based authentication
3. **Token Expiry**: Tokens expire after 7 days (configurable)
4. **Role-Based Access**: Admin-only routes protected
5. **Active Status**: Users can be deactivated without deletion

## Mobile App Screens

### LoginScreen
- PIN number pad interface
- User selection dropdown
- Super admin / regular user toggle
- Clean, intuitive design

### HomeScreen (Authenticated)
- Welcome message with user name
- Scan QR Code button
- View All Items button
- Manage Users button (admin only)
- Export to PDF button
- Logout button

### UserManagementScreen (Admin Only)
- List all users
- Create new users
- Activate/deactivate users
- Delete users
- User status indicators

## Testing

### Test Super Admin Login
1. Start the app
2. Enter PIN: **2200**
3. Tap "Login"
4. Should see admin features

### Test User Creation
1. Login as super admin
2. Tap "Manage Users"
3. Tap "+ Add User"
4. Enter name and 4-digit PIN
5. Tap "Create User"

### Test PDF Export
1. Login (any user)
2. Tap "Export to PDF"
3. PDF should download and share dialog appears

## Troubleshooting

### Cannot Login
- Verify backend is running: `curl http://localhost:3000/health`
- Check `.env` has `SUPER_ADMIN_PIN=2200`
- Restart backend after `.env` changes

### Users Not Loading
- Users list is empty until first user is created
- Only super admin can create users
- Check JWT token is valid

### PDF Export Fails
- Ensure user is authenticated
- Check backend logs for errors
- Verify items exist in database

## Production Deployment

### Backend
1. Change `JWT_SECRET` to a strong random string
2. Change `SUPER_ADMIN_PIN` to a secure PIN
3. Set `NODE_ENV=production`
4. Use HTTPS for API

### Mobile
1. Update API base URL in `mobile/src/config/api.js`
2. Build production APK/AAB
3. Test authentication flow
4. Verify PDF export works

## Future Enhancements

- [ ] Biometric authentication (fingerprint/face)
- [ ] Password recovery mechanism
- [ ] User activity logs
- [ ] Session timeout
- [ ] Multi-factor authentication
- [ ] User permissions granularity
- [ ] Bulk user import
- [ ] Email notifications

## Support

For issues or questions:
1. Check backend logs: `docker logs camping_gear_api`
2. Check mobile console for errors
3. Verify database migrations ran successfully
4. Test API endpoints with Postman

