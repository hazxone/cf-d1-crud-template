# Cloudflare D1 CRUD Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/react-router-hono-fullstack-template)

<!-- dash-content-start -->

A production-ready full-stack CRUD template powered by [Cloudflare Workers](https://workers.cloudflare.com/), featuring:
- [Hono](https://hono.dev/) for backend APIs
- [React Router v7](https://reactrouter.com/) for frontend routing
- [Cloudflare D1](https://developers.cloudflare.com/d1/) for database
- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling

Built with the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) for optimized static asset delivery and seamless local development.

**A perfect starting point for building database-driven CRUD applications on the edge.**

## Features

- ⚡ Full-stack app on Cloudflare Workers
- 🗄️ Cloudflare D1 database (SQLite) integration
- 🔁 Complete CRUD API with Hono
- 🧭 React Router v7 for client-side routing
- 🎨 shadcn/ui components with Tailwind CSS
- 📊 Production-ready data table with search, filter, and pagination
- 🧱 File-based route separation
- 🚀 Zero-config Vite build for Workers
- 🛠️ Automatically deploys with Wrangler
- 📝 Sample products database with 10 entries
<!-- dash-content-end -->

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

The template includes a complete products CRUD interface with:
- ✅ Create, Read, Update, Delete operations
- 🔍 Search and filter functionality
- 📑 Category-based filtering
- 🎨 Clean, modern UI with shadcn/ui components
- 💾 Persistent data in Cloudflare D1 (SQLite)

## Tech Stack

- **Frontend**: React + React Router v7 + shadcn/ui
  - Modern React with hooks and TypeScript
  - File-based routing with React Router v7
  - Accessible, themeable UI components from shadcn/ui
  - Styled with utility-first Tailwind CSS
  - Built and optimized with Vite

- **Backend**: Hono on Cloudflare Workers
  - Lightweight, fast web framework
  - RESTful API endpoints in `/api/*`
  - Full CRUD operations with proper error handling
  - TypeScript support

- **Database**: Cloudflare D1
  - SQLite database at the edge
  - Local development database
  - Easy migration system
  - Fast global access

- **Deployment**: Cloudflare Workers via Wrangler
  - Deploy globally in seconds
  - Automatic edge caching
  - Zero-config bundling with Vite

## Project Structure

```
.
├── app/
│   ├── routes/
│   │   └── home.tsx              # Main CRUD page
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   └── products-table.tsx    # CRUD data table
│   └── routes.ts                 # Route configuration
├── workers/
│   └── app.ts                    # Hono API endpoints
├── migrations/
│   └── *.sql                     # Database migrations
└── wrangler.jsonc                # Cloudflare config
```

## Development

```bash
# Start dev server (uses local D1 database)
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## Database Management

**Query local database:**
```bash
npx wrangler d1 execute cf-react-router-hono-fullstack-template --local --command "SELECT * FROM products;"
```

**Export data:**
```bash
npx wrangler d1 export cf-react-router-hono-fullstack-template --local --output backup.sql
```

**Sync to production:**
```bash
# Export from local
npx wrangler d1 export cf-react-router-hono-fullstack-template --local --output backup.sql

# Import to remote
npx wrangler d1 execute cf-react-router-hono-fullstack-template --remote --file backup.sql
```

## API Endpoints

The template includes a complete RESTful API:

- `GET /api/products` - List all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

All endpoints return JSON in the format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## Customization

This template is designed to be easily customized for your needs:

1. **Update the database schema** - See `migrations/` folder
2. **Modify API endpoints** - Edit `workers/app.ts`
3. **Customize the UI** - Update `app/components/products-table.tsx`
4. **Add new pages** - Create files in `app/routes/` and update `app/routes.ts`

See [CLAUDE.md](./CLAUDE.md) for detailed documentation.

## Deployment

```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npm run deploy
```

Your app will be live at `https://your-project.workers.dev`

## Resources

- 🗄️ [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- 🧩 [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers)
- 📦 [Vite Plugin for Cloudflare](https://developers.cloudflare.com/workers/vite-plugin/)
- 🛠 [Wrangler CLI reference](https://developers.cloudflare.com/workers/wrangler/)
- 🎨 [shadcn/ui](https://ui.shadcn.com)
- 💨 [Tailwind CSS Documentation](https://tailwindcss.com/)
- 🔀 [React Router v7 Docs](https://reactrouter.com/)

## License

MIT
