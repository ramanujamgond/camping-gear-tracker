# Documentation

This directory contains all project documentation for the Camping Gear Tracker application.

## Contents

### Design & Architecture
- **[camping_app_gear_desing.md](camping_app_gear_desing.md)** - Complete system design including database schema, API design, and architecture diagrams

### Implementation
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Implementation plan with project structure, phases, and environment setup
- **[barcode_generation_guide.md](barcode_generation_guide.md)** - QR code and barcode strategy

### API Documentation
- **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** - Quick start guide for testing API endpoints with cURL and Postman
- **[VALIDATION_GUIDE.md](VALIDATION_GUIDE.md)** - Comprehensive validation rules and edge cases for all endpoints
- **[VALIDATION_SUMMARY.md](VALIDATION_SUMMARY.md)** - Summary of validation implementation and security features

### Testing Tools
- **[Camping_Gear_Tracker.postman_collection.json](../postman/Camping_Gear_Tracker.postman_collection.json)** - Postman collection with all API endpoints ready to test

### Mobile App
- **[MOBILE_APP_GUIDE.md](MOBILE_APP_GUIDE.md)** - Complete guide for React Native mobile app development

## Quick Links

### For Developers
1. Start with [IMPLEMENTATION.md](IMPLEMENTATION.md) for setup instructions
2. Review [camping_app_gear_desing.md](camping_app_gear_desing.md) for architecture
3. Use [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) to test your changes

### For API Users
1. Import [Camping_Gear_Tracker.postman_collection.json](../postman/Camping_Gear_Tracker.postman_collection.json)
2. Check [VALIDATION_GUIDE.md](VALIDATION_GUIDE.md) for request formats
3. See [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) for examples

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/items/:qr_code_id` | Check if item exists by QR code |
| GET | `/api/v1/items` | List all items (paginated) |
| POST | `/api/v1/items` | Create new item |
| PUT | `/api/v1/items/:id` | Update item |
| DELETE | `/api/v1/items/:id` | Delete item |
| POST | `/api/v1/items/:id/images` | Upload images |
| DELETE | `/api/v1/items/images/:id` | Delete image |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |

## Tech Stack

- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL
- **Image Processing**: Sharp
- **Validation**: express-validator
- **Deployment**: Docker & Docker Compose
- **Mobile**: React Native (Expo) - Coming soon
