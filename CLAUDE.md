We track work in Beads instead of Markdown. Run `bd quickstart` to see how.

# Project Setup

## Cloudflare D1 Database
- **Database Name**: cf-react-router-hono-fullstack-template
- **Local Database**: Located in `.wrangler/state/v3/d1/`
- **Remote Database**: Cloudflare D1 hosted in APAC region

## Development Commands
```bash
# Start development server (uses local D1)
npm run dev

# Type checking
npm run typecheck

# Build and deploy
npm run deploy
```

## Database Operations

### Manual Database Sync
To sync changes between local and remote databases:

```bash
# Export from local
npx wrangler d1 export cf-react-router-hono-fullstack-template --local --output backup.sql

# Import to remote
npx wrangler d1 execute cf-react-router-hono-fullstack-template --remote --file backup.sql

# Or use migrations for structured changes
npx wrangler d1 migrations create migration_name
npx wrangler d1 migrations apply cf-react-router-hono-fullstack-template --remote
```

### Individual Record Management
```bash
# Insert specific record to remote
npx wrangler d1 execute cf-react-router-hono-fullstack-template --command "INSERT INTO users (email, username, ...) VALUES (...);" --remote

# Query remote database
npx wrangler d1 execute cf-react-router-hono-fullstack-template --command "SELECT * FROM users;" --remote
```

## Current Users Table Structure
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

## PKM System Database Structure

The project includes a comprehensive Personal Knowledge Management (PKM) system for capturing tasks, notes, and thoughts.

### Items Table
```sql
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    item_type TEXT CHECK(item_type IN ('task', 'note', 'thought')) DEFAULT 'task',
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', NULL)) DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    pinned BOOLEAN DEFAULT FALSE,
    archived BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Tags Table (Flexible Tagging System)
```sql
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

CREATE TABLE item_tags (
    item_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

### PKM API Endpoints

**Items:**
- `GET /api/items/:userId` - Fetch all items with tags
- `POST /api/items` - Create new item with tags
- `PUT /api/items/:id` - Update item (including tags)
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/search/:userId` - Advanced search with filters

**Tags:**
- `GET /api/tags/:userId` - Fetch all user tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

## Important Notes
- React Router projects cannot use `wrangler dev --remote` due to build system incompatibilities
- Use `npm run dev` for development - it connects to local D1 database
- For database changes, use manual SQL commands or proper migrations
- The app includes a `/api/users` endpoint for fetching user data
- The PKM system uses flexible tagging instead of fixed categories

# Page Creation Guide

## How Pages Work in This Project

This project uses **React Router v7** with a file-based routing system. Pages are React components that can include server-side data loading, metadata, and client-side functionality.

### Architecture Overview
- **Frontend**: React Router v7 handles routing and page rendering
- **Backend**: Hono framework serves API endpoints on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) for data persistence
- **Build**: Vite with React Router plugin for development and production

## Creating New Pages - Step by Step

### 1. Create the Page Component

Create a new file in `app/routes/` with your page name:

```typescript
// app/routes/about.tsx
import type { Route } from "./+types/about";
import { useEffect, useState } from "react";

// Page metadata (optional)
export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us" },
    { name: "description", content: "Learn more about our company" },
  ];
}

// Server-side data loading (optional)
export async function loader({ context }: Route.LoaderArgs) {
  // Fetch data from API, database, or external source
  const response = await fetch("http://localhost:5173/api/about");
  const data = await response.json();

  return {
    title: data.title,
    content: data.content,
    team: data.team
  };
}

// Main page component
export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const { title, content, team } = loaderData;
  const [clientData, setClientData] = useState(null);

  // Client-side data fetching (optional)
  useEffect(() => {
    fetch("/api/additional-data")
      .then(res => res.json())
      .then(data => setClientData(data));
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="prose max-w-none">
        <p>{content}</p>
        {/* Render your page content */}
      </div>
    </div>
  );
}
```

### 2. Add Route Configuration

Update `app/routes.ts` to register your new route:

```typescript
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),                    // Home page (/)
  route("about", "routes/about.tsx"),          // About page (/about)
  route("contact", "routes/contact.tsx"),      // Contact page (/contact)
  route("products/:id", "routes/product.tsx"), // Dynamic route (/products/123)

  // Nested routes with layout
  route("dashboard", [
    index("routes/dashboard/home.tsx"),              // /dashboard
    route("users", "routes/dashboard/users.tsx"),    // /dashboard/users
    route("settings", "routes/dashboard/settings.tsx") // /dashboard/settings
  ])
] satisfies RouteConfig;
```

### 3. Create Backend API Endpoints (Optional)

Add API endpoints in `workers/app.ts`:

```typescript
// workers/app.ts
import { Hono } from "hono";

const app = new Hono();

// API endpoint for your page
app.get("/api/about", async (c) => {
  try {
    const aboutData = {
      title: "About Our Company",
      content: "We build amazing web applications...",
      team: [
        { id: 1, name: "John Doe", role: "CEO" },
        { id: 2, name: "Jane Smith", role: "CTO" }
      ]
    };

    return c.json({
      success: true,
      data: aboutData
    });
  } catch (error) {
    return c.json(
      { success: false, error: "Failed to fetch about data" },
      500
    );
  }
});

export default app;
```

## Route Patterns and Conventions

### Basic Routes
```typescript
index("routes/home.tsx")                    // /
route("about", "routes/about.tsx")          // /about
route("contact", "routes/contact.tsx")      // /contact
```

### Dynamic Routes
```typescript
route("users/:userId", "routes/user-profile.tsx")     // /users/123
route("products/:category/:id", "routes/product.tsx") // /products/electronics/123
```

### Nested Routes
```typescript
route("dashboard", [
  index("routes/dashboard/home.tsx"),           // /dashboard
  route("users", "routes/dashboard/users.tsx"), // /dashboard/users
  route("analytics", "routes/dashboard/analytics.tsx") // /dashboard/analytics
])
```

### Layout Routes
```typescript
layout("routes/auth/layout.tsx", [
  route("login", "routes/auth/login.tsx"),      // /login (with auth layout)
  route("register", "routes/auth/register.tsx") // /register (with auth layout)
])
```

### Catch-all Routes
```typescript
route("files/*", "routes/files.tsx")          // /files/any/path/here
route("*", "routes/not-found.tsx")            // 404 catch-all
```

## Page Component Structure

### Required Exports
- `default` - The main React component that renders the page

### Optional Exports
- `meta` - Function that returns page metadata (title, description, etc.)
- `loader` - Function that loads data on the server before rendering
- `action` - Function that handles form submissions
- `headers` - Function that returns HTTP headers
- `links` - Function that returns link tags for the document head

### Type Safety
Always import and use the generated route types:
```typescript
import type { Route } from "./+types/your-page-name";
```

## Data Fetching Patterns

### Server-Side (Loader)
```typescript
export async function loader({ params, request, context }: Route.LoaderArgs) {
  // Runs on server before page renders
  // Access database, external APIs, etc.
  const data = await fetchData();
  return json(data);
}
```

### Client-Side (useEffect)
```typescript
useEffect(() => {
  // Runs in browser after page loads
  fetch("/api/client-data")
    .then(res => res.json())
    .then(data => setState(data));
}, []);
```

### Form Handling (Action)
```typescript
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = await processForm(formData);
  return json(result);
}
```

## Common Patterns

### Protected Routes
```typescript
export async function loader({ context }: Route.LoaderArgs) {
  if (!context.user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return json({ user: context.user });
}
```

### Error Handling
```typescript
export async function loader({}: Route.LoaderArgs) {
  try {
    const data = await fetchData();
    return json(data);
  } catch (error) {
    throw new Response("Failed to load data", { status: 500 });
  }
}
```

### Redirects
```typescript
export async function loader({}: Route.LoaderArgs) {
  if (!isAuthenticated) {
    return redirect("/login");
  }
  return json({ data: "protected data" });
}
```

## Testing Your Pages

### Development
```bash
npm run dev              # Start development server
```

### Type Checking
```bash
npm run typecheck        # Check TypeScript types
```

### Production Build
```bash
npm run build           # Build for production
npm run deploy          # Deploy to Cloudflare
```

## File Organization Best Practices

```
app/
├── routes/                    # Page components
│   ├── home.tsx              # Home page
│   ├── about.tsx             # About page
│   ├── products/
│   │   ├── index.tsx         # /products listing
│   │   └── [id].tsx          # /products/:id detail
│   └── dashboard/
│       ├── layout.tsx        # Dashboard layout wrapper
│       ├── index.tsx         # /dashboard home
│       ├── users.tsx         # /dashboard/users
│       └── settings.tsx      # /dashboard/settings
├── components/               # Reusable UI components
│   ├── ui/                   # shadcn/ui components
│   └── shared/               # Custom shared components
└── lib/                      # Utility functions
```

## Common Issues and Solutions

### 1. Route Not Found
- Ensure route is added to `app/routes.ts`
- Check file path is correct relative to `app/routes/`
- Verify development server is restarted after changes

### 2. Type Errors
- Import route types: `import type { Route } from "./+types/page-name"`
- Ensure loader data matches component props interface
- Use `satisfies RouteConfig` in routes.ts for type safety

### 3. API Endpoints Not Working
- Check endpoint is defined before the catch-all route in `workers/app.ts`
- Verify API URL matches fetch request in component
- Check Cloudflare D1 database connection if using database

### 4. Build Errors
- Run `npm run typecheck` to identify TypeScript issues
- Ensure all imports are correct and files exist
- Check for circular dependencies

## Example Pages in This Project

- **Home Page** (`/`) - User management dashboard with data table and navigation
- **Test Page** (`/test-page`) - Demonstration page showing React Router v7 patterns
- **Todo List** (`/todo`) - Original todo app with fixed categories (legacy)
- **Memory** (`/memory`) - **NEW PKM System** - Tasks, notes, and thoughts with flexible tagging

### Page Features:

**Home Page**: Server-side data loading, user management interface, navigation links

**Test Page**: Server and client data fetching examples, comprehensive UI components

**Todo List** (Legacy): Local state management, fixed 8 categories, CRUD operations

**Memory** (PKM System - **RECOMMENDED**):
- **Multi-type items**: Tasks (with completion), Notes (reference material), Thoughts (quick ideas)
- **Flexible tagging**: Create custom tags with colors instead of fixed categories
- **Smart organization**: Pin important items, archive completed ones, filter by status/type/tags
- **Advanced search**: Text search + multi-filter support
- **Keyboard shortcuts**:
  - `n` - New note (switches type and focuses input)
  - `t` - New task (switches type and focuses input)
  - `/` - Focus search
  - `Esc` - Cancel edit
- **Stats dashboard**: Track tasks, notes, thoughts, and completion progress
- **Tag management**: Create, delete, and color-code tags
- **Priority support**: Mark items as low/medium/high priority
- **Responsive design**: Optimized layouts for desktop and mobile
- **Database persistence**: Cloudflare D1 with proper indexes and relationships

All pages include responsive design, TypeScript support, and follow React Router v7 conventions.

## Using the PKM System

### Quick Start

1. **Login** to the application
2. Navigate to `/memory`
3. **Create your first item**:
   - Select type: Task, Note, or Thought
   - Enter content
   - (Optional) Add tags by clicking on them
   - Press Enter or click "Add"

4. **Create custom tags**:
   - Click "Manage Tags" button
   - Enter tag name and choose a color
   - Click "Add"

### Item Types

- **Task** 📋: Things to do with completion tracking
- **Note** 🧠: Reference material, documentation, ideas to remember
- **Thought** 💡: Quick insights, fleeting ideas, journal entries

### Features

**Pinning**: Click the pin icon to keep important items at the top

**Archiving**: Move completed or old items out of view without deleting

**Filtering**:
- Status: All / Pending / Completed
- Type: All / Tasks / Notes / Thoughts
- Tags: Click tags to filter
- Search: Text search across all content

**Editing**: Click the edit icon or press `e` to modify an item

**Bulk actions**: Select multiple items for batch operations

### Data Migration

If you have existing todos in the old system, they were automatically migrated to the Memory system as tasks with their categories converted to tags.

## Project Management

This project uses **Beads** (bd) for task tracking and dependency management. Run `bd quickstart` to see how to create and manage issues. All development work is tracked with beads for better project organization and AI-supervised workflows.
