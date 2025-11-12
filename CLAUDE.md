We track work in Beads instead of Markdown. Run `bd quickstart` to see how.

# Cloudflare D1 CRUD Template

A production-ready full-stack template for building CRUD applications on Cloudflare's edge platform.

## Tech Stack

- **Frontend**: React + React Router v7 + shadcn/ui + Tailwind CSS
- **Backend**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Build Tool**: Vite with React Router plugin

## Project Setup

### Cloudflare D1 Database
- **Database Name**: cf-react-router-hono-fullstack-template
- **Local Database**: Located in `.wrangler/state/v3/d1/`
- **Remote Database**: Cloudflare D1 hosted on the edge

### Development Commands
```bash
# Start development server (uses local D1)
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## Database Schema

### Products Table
The template includes a complete CRUD example using a products table:

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'general',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Categories**: electronics, accessories, furniture, general

### Users Table (Optional - for authentication)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    provider TEXT DEFAULT 'email'
);
```

## API Endpoints

### Products CRUD

**Get all products** (with optional filters)
```http
GET /api/products?category=electronics&search=keyword&is_active=true
```

**Get single product**
```http
GET /api/products/:id
```

**Create product**
```http
POST /api/products
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 29.99,
  "stock": 100,
  "category": "electronics",
  "image_url": "https://...",
  "is_active": true
}
```

**Update product**
```http
PUT /api/products/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 34.99,
  "stock": 150
}
```

**Delete product**
```http
DELETE /api/products/:id
```

All endpoints return JSON responses in the format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## Database Operations

### Local Development

**Query local database**
```bash
npx wrangler d1 execute cf-react-router-hono-fullstack-template --local --command "SELECT * FROM products;"
```

**Export local data**
```bash
npx wrangler d1 export cf-react-router-hono-fullstack-template --local --output backup.sql
```

### Production/Remote

**Sync local to remote**
```bash
# Export from local
npx wrangler d1 export cf-react-router-hono-fullstack-template --local --output backup.sql

# Import to remote
npx wrangler d1 execute cf-react-router-hono-fullstack-template --remote --file backup.sql
```

**Run migrations on remote**
```bash
npx wrangler d1 migrations apply cf-react-router-hono-fullstack-template --remote
```

**Query remote database**
```bash
npx wrangler d1 execute cf-react-router-hono-fullstack-template --remote --command "SELECT * FROM products LIMIT 10;"
```

## Project Structure

```
.
├── app/
│   ├── routes/              # Page components
│   │   └── home.tsx         # Main page with products CRUD
│   ├── components/          # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   └── products-table.tsx  # Products CRUD table
│   └── routes.ts            # Route configuration
├── workers/
│   └── app.ts               # Hono backend with API endpoints
├── migrations/              # D1 database migrations
└── wrangler.jsonc           # Cloudflare configuration
```

## Creating New Pages

### 1. Create the Page Component

Create a new file in `app/routes/`:

```typescript
// app/routes/about.tsx
import type { Route } from "./+types/about";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About" },
    { name: "description", content: "About page" },
  ];
}

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">About</h1>
    </div>
  );
}
```

### 2. Add Route Configuration

Update `app/routes.ts`:

```typescript
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
] satisfies RouteConfig;
```

### 3. Add API Endpoints (Optional)

Add endpoints in `workers/app.ts`:

```typescript
app.get("/api/about", async (c) => {
  return c.json({
    success: true,
    data: { message: "About page data" }
  });
});
```

## Customizing for Your Use Case

### 1. Update Database Schema

Create a new migration:
```bash
npx wrangler d1 migrations create your_table_name
```

Edit the migration file in `migrations/` folder:
```sql
CREATE TABLE your_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Apply migration:
```bash
npx wrangler d1 migrations apply cf-react-router-hono-fullstack-template --local
```

### 2. Create API Endpoints

Add CRUD endpoints in `workers/app.ts`:
```typescript
// GET all
app.get("/api/your-resource", async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM your_table").all();
  return c.json({ success: true, data: result.results });
});

// POST create
app.post("/api/your-resource", async (c) => {
  const { name } = await c.req.json();
  const result = await c.env.DB.prepare(
    "INSERT INTO your_table (name) VALUES (?)"
  ).bind(name).run();
  return c.json({ success: true, data: { id: result.meta.last_row_id } });
});

// PUT update
app.put("/api/your-resource/:id", async (c) => {
  const id = c.req.param("id");
  const { name } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE your_table SET name = ? WHERE id = ?"
  ).bind(name, id).run();
  return c.json({ success: true });
});

// DELETE
app.delete("/api/your-resource/:id", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM your_table WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
```

### 3. Create UI Components

Follow the pattern in `app/components/products-table.tsx` to create your own data table with CRUD operations using shadcn/ui components.

## Important Notes

- React Router projects cannot use `wrangler dev --remote` due to build system incompatibilities
- Always use `npm run dev` for local development
- Use migrations for database schema changes
- The template includes sample products data for quick testing
- All shadcn/ui components are pre-installed and configured

## Deployment

### First-time Setup

1. Login to Cloudflare:
```bash
npx wrangler login
```

2. Create D1 database:
```bash
npx wrangler d1 create cf-react-router-hono-fullstack-template
```

3. Update `wrangler.jsonc` with your database ID

4. Run migrations:
```bash
npx wrangler d1 migrations apply cf-react-router-hono-fullstack-template --remote
```

### Deploy

```bash
npm run deploy
```

Your app will be deployed to `https://your-project.workers.dev`

## Project Management

This project uses **Beads** (bd) for task tracking. Run `bd quickstart` to learn more about creating and managing issues.
