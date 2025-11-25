# API Validation Guide

## Overview
All API endpoints now have comprehensive validation to handle edge cases and provide clear error messages.

## Validation Rules

### Items API

#### POST /api/v1/items (Create Item)
**Required Fields:**
- `qr_code_id`: 3-100 characters, alphanumeric with hyphens/underscores only
- `name`: 2-255 characters

**Optional Fields:**
- `description`: Max 5000 characters
- `category_ids`: Array of valid UUIDs

**Edge Cases Handled:**
- ✅ Duplicate QR code (409 Conflict)
- ✅ Invalid category IDs (400 Bad Request)
- ✅ Missing required fields (400 Bad Request)
- ✅ Invalid QR code format (400 Bad Request)
- ✅ Name too short/long (400 Bad Request)

**Example Valid Request:**
```json
{
  "qr_code_id": "CG-TENT-001",
  "name": "4-Person Tent",
  "description": "Waterproof camping tent",
  "category_ids": ["uuid-here"]
}
```

**Example Error Response:**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "qr_code_id",
      "message": "QR code ID must be between 3 and 100 characters",
      "value": "CG"
    }
  ]
}
```

---

#### GET /api/v1/items/:qr_code_id (Get Item by QR)
**Validation:**
- `qr_code_id`: 3-100 characters, not empty

**Edge Cases:**
- ✅ Item not found (404 with helpful message)
- ✅ Invalid QR code format (400)

---

#### PUT /api/v1/items/:id (Update Item)
**Validation:**
- `id`: Must be valid UUID
- `name`: 2-255 characters (if provided)
- `description`: Max 5000 characters (if provided)
- `category_ids`: Array of valid UUIDs (if provided)

**Edge Cases:**
- ✅ Item not found (404)
- ✅ Invalid UUID format (400)
- ✅ No fields provided (400)
- ✅ Invalid category IDs (400)
- ✅ Category count mismatch (400)

---

#### GET /api/v1/items (List Items)
**Query Parameters:**
- `page`: Positive integer (default: 1)
- `limit`: 1-100 (default: 20)
- `search`: Max 255 characters

**Edge Cases:**
- ✅ Invalid page number (400)
- ✅ Limit out of range (400)
- ✅ Search query too long (400)

---

### Categories API

#### POST /api/v1/categories (Create Category)
**Required Fields:**
- `name`: 2-100 characters, alphanumeric with spaces/hyphens/underscores

**Optional Fields:**
- `description`: Max 500 characters

**Edge Cases:**
- ✅ Duplicate category name (409)
- ✅ Invalid characters in name (400)
- ✅ Name too short/long (400)

**Example:**
```json
{
  "name": "Cooking Gear",
  "description": "Stoves, utensils, and cookware"
}
```

---

#### GET /api/v1/categories (List Categories)
**No validation required** - Returns all categories

---

### Images API

#### POST /api/v1/items/:id/images (Upload Images)
**Validation:**
- `id`: Must be valid UUID
- `is_primary`: "true" or "false" (optional)
- Files: Max 10 images per upload
- File types: Images only (jpg, png, gif, etc.)
- File size: Max 5MB per file

**Edge Cases:**
- ✅ Item not found (404)
- ✅ No files uploaded (400)
- ✅ Too many files (400)
- ✅ Invalid file type (400)
- ✅ File too large (413 - handled by multer)
- ✅ Partial success (some files fail, others succeed)

**Example Response (Partial Success):**
```json
{
  "message": "2 image(s) uploaded successfully",
  "images": [...],
  "errors": [
    {
      "file": "document.pdf",
      "error": "Not an image file"
    }
  ]
}
```

---

#### DELETE /api/v1/items/images/:id (Delete Image)
**Validation:**
- `id`: Must be valid UUID

**Edge Cases:**
- ✅ Image not found (404)
- ✅ File missing on disk (continues with DB deletion)
- ✅ Invalid UUID (400)

---

## Common Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name must be between 2 and 255 characters",
      "value": "A"
    }
  ]
}
```

### 404 Not Found
```json
{
  "message": "Item not found"
}
```

### 409 Conflict
```json
{
  "message": "Item with this QR code already exists",
  "item": { ... }
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error",
  "error": "Detailed error (development only)"
}
```

---

## Testing Edge Cases

### Test Invalid QR Code Format
```bash
POST /api/v1/items
{
  "qr_code_id": "CG@#$%",  # Invalid characters
  "name": "Test"
}
# Expected: 400 with validation error
```

### Test Duplicate Item
```bash
POST /api/v1/items
{
  "qr_code_id": "CG-TEST-001",  # Already exists
  "name": "Duplicate"
}
# Expected: 409 Conflict
```

### Test Invalid Category IDs
```bash
POST /api/v1/items
{
  "qr_code_id": "CG-NEW-001",
  "name": "Test",
  "category_ids": ["not-a-uuid", "also-invalid"]
}
# Expected: 400 with UUID validation error
```

### Test Empty Update
```bash
PUT /api/v1/items/{id}
{}
# Expected: 400 - At least one field required
```

### Test Pagination Limits
```bash
GET /api/v1/items?limit=200
# Expected: 400 - Limit must be between 1 and 100
```

### Test File Upload Limits
```bash
POST /api/v1/items/{id}/images
# Upload 11 files
# Expected: 400 - Too many files
```

---

## Security Features

1. **Input Sanitization**: All text inputs are trimmed
2. **SQL Injection Protection**: Sequelize ORM with parameterized queries
3. **File Type Validation**: Only image files accepted
4. **File Size Limits**: 5MB per file
5. **UUID Validation**: Prevents invalid ID formats
6. **Length Limits**: Prevents buffer overflow attacks
7. **Character Whitelisting**: QR codes and category names use strict patterns
8. **Error Message Safety**: Detailed errors only in development mode


---

#### DELETE /api/v1/items/:id (Delete Item)
**Validation:**
- `id`: Must be valid UUID

**Edge Cases:**
- ✅ Item not found (404)
- ✅ Invalid UUID (400)
- ✅ Cascading delete (removes images and category associations)
- ✅ File cleanup (deletes image files from disk)

**Example:**
```bash
DELETE /api/v1/items/uuid-here
```

**Success Response (200):**
```json
{
  "message": "Item deleted successfully",
  "deleted_item_id": "uuid-here",
  "deleted_images_count": 3
}
```

**Features:**
- Deletes item from database
- Removes all associated images from database
- Deletes image files from disk
- Removes category associations
- Returns count of deleted images
