# API Testing Guide

## Quick Test with cURL

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Create a Category
```bash
curl -X POST http://localhost:3000/api/v1/categories ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Shelter\",\"description\":\"Tents and sleeping gear\"}"
```

### 3. Create an Item
```bash
curl -X POST http://localhost:3000/api/v1/items ^
  -H "Content-Type: application/json" ^
  -d "{\"qr_code_id\":\"CG-TEST-001\",\"name\":\"Camping Tent\",\"description\":\"4-person waterproof tent\"}"
```

### 4. Get Item by QR Code
```bash
curl http://localhost:3000/api/v1/items/CG-TEST-001
```

### 5. List All Items
```bash
curl http://localhost:3000/api/v1/items?page=1&limit=20
```

### 6. Upload Image (replace ITEM_ID with actual UUID)
```bash
curl -X POST http://localhost:3000/api/v1/items/ITEM_ID/images ^
  -F "images=@path/to/your/image.jpg" ^
  -F "is_primary=true"
```

### 7. Delete Item (replace ITEM_ID with actual UUID)
```bash
curl -X DELETE http://localhost:3000/api/v1/items/ITEM_ID
```

---

## Using Postman

### Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Camping_Gear_Tracker.postman_collection.json`
4. Collection will appear in your sidebar

### Set Variables
The collection uses these variables:
- `base_url`: http://localhost:3000 (already set)
- `item_id`: Copy UUID from create/get responses
- `image_id`: Copy UUID from image upload response

### Test Flow
1. **Health Check** - Verify API is running
2. **Create Category** - Create "Shelter" category
3. **Create Item** - Create a test item with QR code "CG-TEST-001"
4. **Get Item by QR Code** - Verify item exists
5. **Upload Images** - Add photos (select files in Body > form-data)
6. **List All Items** - See all items with pagination

---

## Expected Responses

### Item Not Found (404)
```json
{
  "message": "Item not found, ready to create",
  "qr_code_id": "CG-TEST-001"
}
```

### Item Created (201)
```json
{
  "id": "uuid-here",
  "qr_code_id": "CG-TEST-001",
  "name": "Camping Tent",
  "description": "4-person waterproof tent",
  "created_at": "2025-11-25T10:00:00.000Z",
  "updated_at": "2025-11-25T10:00:00.000Z",
  "images": [],
  "categories": []
}
```

### Item Exists (200)
```json
{
  "id": "uuid-here",
  "qr_code_id": "CG-TEST-001",
  "name": "Camping Tent",
  "description": "4-person waterproof tent",
  "images": [
    {
      "id": "image-uuid",
      "image_url": "/uploads/filename.jpg",
      "is_primary": true
    }
  ],
  "categories": []
}
```

---

## Troubleshooting

### Connection Refused
- Check if Docker containers are running: `docker-compose ps`
- Check API logs: `docker-compose logs api`

### Database Errors
- Check DB is healthy: `docker-compose logs db`
- Restart services: `docker-compose restart`

### Image Upload Fails
- Ensure uploads directory exists
- Check file size (max 5MB by default)
- Verify file is an image format
