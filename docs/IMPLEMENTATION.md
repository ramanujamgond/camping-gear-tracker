# Camping Gear Tracker - Implementation Plan

## Project Structure

```
camping-gear-tracker/
├── backend/                    # Node.js API
│   ├── src/
│   │   ├── config/            # Database & environment config
│   │   ├── models/            # Sequelize models
│   │   ├── controllers/       # Route handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, file upload
│   │   ├── utils/             # Helper functions
│   │   └── server.js          # Entry point
│   ├── uploads/               # Temporary file storage
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── mobile/                     # React Native Expo app
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API calls
│   │   ├── navigation/        # Navigation setup
│   │   └── utils/             # Helpers
│   ├── assets/
│   ├── app.json
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Implementation Phases

### Phase 1: Backend Foundation (Current)
- [x] Project structure setup
- [ ] Database connection & models
- [ ] Core API endpoints
- [ ] Image upload handling
- [ ] Docker setup

### Phase 2: Mobile App
- [ ] Expo project setup
- [ ] QR/Barcode scanner
- [ ] Item detail screen
- [ ] Add item form
- [ ] Image capture & upload

### Phase 3: Enhancement
- [ ] Categories feature
- [ ] Search & filter
- [ ] Offline mode
- [ ] Testing

## Current Task: Phase 1 - Backend Setup

### Steps:
1. Create backend project structure
2. Setup Express server
3. Configure PostgreSQL with Sequelize
4. Create database models
5. Implement API controllers
6. Setup Docker environment
7. Test endpoints

---

## Environment Variables

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=camping_gear
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgres://postgres:postgres@localhost:5432/camping_gear

# Server
PORT=3000
NODE_ENV=development

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/items/:qr_code_id` | Check if item exists |
| POST | `/api/v1/items` | Create new item |
| PUT | `/api/v1/items/:id` | Update item |
| POST | `/api/v1/items/:id/images` | Upload images |
| GET | `/api/v1/categories` | List categories |

## Database Schema

### items
- id (UUID, PK)
- qr_code_id (VARCHAR, UNIQUE, INDEXED)
- name (VARCHAR, NOT NULL)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### item_images
- id (UUID, PK)
- item_id (UUID, FK)
- image_url (VARCHAR)
- is_primary (BOOLEAN)
- created_at (TIMESTAMP)

### categories
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)

### item_categories (junction table)
- item_id (UUID, FK)
- category_id (UUID, FK)
