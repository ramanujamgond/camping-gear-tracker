# Camping Gear Tracking App - Design Document

## 1. Overview
This application allows users to track camping tools and materials using unique QR or Barcodes. The core functionality revolves around scanning a code to either retrieve item details or register a new item with descriptions and images.

**Tech Stack:**
- **Frontend:** React Native (Expo) - *Android Only*
- **Backend:** Node.js (Express.js)
- **Database:** PostgreSQL
- **Images:** Local storage or Cloud Object Storage (AWS S3/Google Cloud Storage)

---

## 2. System Architecture

The system follows a standard MVC (Model-View-Controller) architecture with a mobile-first frontend.

```mermaid
graph TD
    Client[Android App (React Native Expo)] -->|HTTP/REST| LB[Load Balancer / Nginx]
    LB --> API[Node.js API Server]
    API -->|Queries| DB[(PostgreSQL Database)]
    API -->|File Uploads| Storage[File Storage]
```

---

## 3. Database Design (PostgreSQL)

We will use a relational schema to ensure data integrity.

### ER Diagram

```mermaid
erDiagram
    ITEMS {
        UUID id PK
        VARCHAR qr_code_id UK "Unique string from QR/Barcode"
        VARCHAR name
        TEXT description
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    ITEM_IMAGES {
        UUID id PK
        UUID item_id FK
        VARCHAR image_url
        BOOLEAN is_primary
        TIMESTAMP created_at
    }
    CATEGORIES {
        UUID id PK
        VARCHAR name
        TEXT description
    }
    ITEM_CATEGORIES {
        UUID item_id FK
        UUID category_id FK
    }

    ITEMS ||--o{ ITEM_IMAGES : has
    ITEMS }|--|{ ITEM_CATEGORIES : belongs_to
    CATEGORIES ||--|{ ITEM_CATEGORIES : contains
```

### Table Definitions

**1. `items`**
Core table storing item details.
- `id`: UUID, Primary Key.
- `qr_code_id`: String, Unique, Indexed. The value read from the physical sticker.
- `name`: String, Not Null.
- `description`: Text.
- `created_at`: Timestamp.

**2. `item_images`**
Stores references to images.
- `id`: UUID, Primary Key.
- `item_id`: UUID, Foreign Key -> items.id.
- `image_url`: String. Path to file.
- `is_primary`: Boolean. To designate a thumbnail.

---

## 4. API Design (RESTful)

### Base URL: `/api/v1`

#### Items

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| **GET** | `/items/:qr_code_id` | Check if item exists. Returns 404 if new, 200 with data if exists. | N/A |
| **POST** | `/items` | Create a new item. | `{ qr_code_id, name, description }` |
| **PUT** | `/items/:id` | Update item details. | `{ name, description }` |
| **DELETE** | `/items/:id` | Delete an item and all its images. | N/A |
| **POST** | `/items/:id/images` | Upload images for an item. | `Multipart/form-data` (files) |

---

## 5. Core Logic & Flows

### 5.1 QR/Barcode Scanning Flow

This is the primary user interaction.

```mermaid
sequenceDiagram
    participant User
    participant App as Mobile App
    participant API as Node.js API
    participant DB as PostgreSQL

    User->>App: Scans QR Code
    App->>API: GET /api/v1/items/:qr_code_id
    API->>DB: SELECT * FROM items WHERE qr_code_id = ...
    
    alt Item Exists
        DB-->>API: Item Details
        API-->>App: 200 OK (JSON Item Data)
        App-->>User: Show Item Details Screen
    else Item is New
        DB-->>API: null
        API-->>App: 404 Not Found
        App-->>User: Show "Add New Item" Form
    end

    opt User Adds New Item
        User->>App: Enters Name, Desc, Takes Photos
        App->>API: POST /api/v1/items (Metadata)
        API->>DB: INSERT INTO items...
        DB-->>API: Success
        App->>API: POST /api/v1/items/:id/images (Uploads)
        API-->>App: Success
        App-->>User: Item Saved!
    end
```

### 5.2 Image Handling
- Use `multer` middleware for handling `multipart/form-data`.
- **Optimization**: Resize images on the server using `sharp` before saving to save space and bandwidth.
- **Storage**: Store file paths in the database, not the binary data (BLOBs).

---

## 6. Implementation Guide

### Step 1: Project Setup
```bash
mkdir camping-gear-tracker
cd camping-gear-tracker
npm init -y
npm install express pg sequelize dotenv cors multer sharp
```

### Step 2: Database Connection (`config/database.js`)
Use `sequelize` or `pg` pool.
```javascript
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
});
module.exports = sequelize;
```

### Step 3: Models
Define your Sequelize models matching the schema above.

### Step 4: Controller Logic (`controllers/itemController.js`)
```javascript
// GET /items/:qr_code_id
exports.getItemByQr = async (req, res) => {
  const { qr_code_id } = req.params;
  const item = await Item.findOne({ where: { qr_code_id }, include: ['images'] });
  
  if (!item) {
    return res.status(404).json({ message: 'Item not found, ready to create' });
  }
  return res.json(item);
};

// POST /items
exports.createItem = async (req, res) => {
  const { qr_code_id, name, description } = req.body;
  // Validation logic here
  const newItem = await Item.create({ qr_code_id, name, description });
  res.status(201).json(newItem);
};
```

---

---

## 7. Docker & Development Environment

To ensure a consistent development environment, we will use Docker and Docker Compose. This allows us to spin up the database and other services with a single command.

### `docker-compose.yml`

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: camping_gear_db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-camping_gear}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  # Node.js API (Optional for Dev, useful for Prod/Staging simulation)
  api:
    build: .
    container_name: camping_gear_api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-camping_gear}
      - PORT=3000
    depends_on:
      - db
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    command: npm run dev

volumes:
  pgdata:
```

### Development Workflow

1.  **Start Services**: Run `docker-compose up -d` to start the PostgreSQL database (and optionally the app).
2.  **Connect App**:
    *   If running Node locally: Set `DATABASE_URL=postgres://postgres:postgres@localhost:5432/camping_gear` in your `.env` file.
    *   If running Node in Docker: The app automatically connects to the `db` service host.
3.  **Database Management**: You can connect to the DB using any client (DBeaver, pgAdmin) at `localhost:5432`.

---

## 8. Scalability & Future Proofing

1.  **Indexing**: Ensure `qr_code_id` has a database index. This is critical for scan performance.
2.  **Caching**: Implement Redis to cache `GET /items/:qr_code_id` responses. QR scans for existing items are read-heavy operations.
3.  **Microservices**: Keep the "Inventory" logic separate. If you add "Trip Planning" or "Social Sharing" later, build them as separate modules or services that reference `item_id`.
4.  **Offline Mode**: For camping (often low signal), the App should cache the inventory locally (SQLite/Realm) and sync when back online. The API should support a `last_updated_at` sync mechanism.

## 8. QR Code Strategy
- **Generation**: You don't need to generate codes dynamically if you buy pre-printed unique QR sticker rolls (e.g., Asset Tags).
- **Format**: Use a URL-friendly UUID or a simple alphanumeric string.
    - Example: `CG-8X92-MN21`
- **Printing**: If printing yourself, use a library like `qrcode` in Node.js to generate a PDF sheet of unique codes to print on sticker paper.

