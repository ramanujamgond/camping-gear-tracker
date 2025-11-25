# Camping Gear Tracker

Track your camping equipment using QR codes and barcodes.

## Documentation

- [Design Document](docs/camping_app_gear_desing.md) - System architecture and design
- [Implementation Guide](docs/IMPLEMENTATION.md) - Development phases and setup
- [API Testing Guide](docs/API_TESTING_GUIDE.md) - How to test endpoints
- [Validation Guide](docs/VALIDATION_GUIDE.md) - API validation rules
- [Validation Summary](docs/VALIDATION_SUMMARY.md) - Validation implementation details
- [Barcode Generation Guide](docs/barcode_generation_guide.md) - QR code strategy
- [Postman Collection](postman/Camping_Gear_Tracker.postman_collection.json) - Import into Postman
- [Mobile App Guide](docs/MOBILE_APP_GUIDE.md) - React Native app setup

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Setup

1. Clone and navigate to project:
```bash
cd camping-gear-tracker
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
```

3. Start services:
```bash
docker-compose up -d
```

4. API will be available at `http://localhost:3000`

### Local Development (without Docker)

1. Install dependencies:
```bash
cd backend
npm install
```

2. Setup PostgreSQL locally and update `.env`

3. Start server:
```bash
npm run dev
```

## API Endpoints

- `GET /api/v1/items/:qr_code_id` - Check if item exists
- `POST /api/v1/items` - Create new item
- `PUT /api/v1/items/:id` - Update item
- `DELETE /api/v1/items/:id` - Delete item
- `POST /api/v1/items/:id/images` - Upload images
- `GET /api/v1/categories` - List categories

## Tech Stack

- **Backend**: Node.js, Express, Sequelize
- **Database**: PostgreSQL
- **Mobile**: React Native (Expo)
- **Image Processing**: Sharp
- **Validation**: express-validator


## Mobile App

The React Native mobile app is located in the `mobile/` directory.

### Quick Start

```bash
cd mobile
npm install
npm start
```

See [Mobile App Guide](docs/MOBILE_APP_GUIDE.md) for detailed instructions.

### Features
- 📷 QR code scanning
- 📝 Item management (CRUD)
- 🖼️ Photo upload from camera or gallery
- 📋 Browse and search items
- 🏷️ Category support

## Project Structure

```
camping-gear-tracker/
├── backend/           # Node.js API
├── mobile/            # React Native app
├── docs/              # Documentation
├── postman/           # API collection
└── docker-compose.yml # Docker setup
```
